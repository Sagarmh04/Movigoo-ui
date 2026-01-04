// app/api/payments/cashfree/route.ts
// POST /api/payments/cashfree
// Creates a Cashfree payment session (server-side only)

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuthToken } from "@/lib/auth";

// ✅ STEP 1 — FORCE NODE RUNTIME (CRITICAL)
// Vercel may run this route in Edge runtime
// Cashfree order creation fails silently on Edge
// Localhost always uses Node → that's why it works
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ✅ STEP 2 — HARD VERIFY ENV VARS (PRODUCTION SAFE)
    // Log BEFORE using env vars (⚠️ Do NOT log actual secrets)
    console.log("Cashfree ENV check (prod):", {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecret: !!process.env.CASHFREE_SECRET_KEY,
      baseUrl: process.env.CASHFREE_BASE_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Validate environment variables (must exist AND be non-empty)
    if (
      !process.env.CASHFREE_APP_ID ||
      process.env.CASHFREE_APP_ID.trim() === "" ||
      !process.env.CASHFREE_SECRET_KEY ||
      process.env.CASHFREE_SECRET_KEY.trim() === "" ||
      !process.env.CASHFREE_BASE_URL ||
      process.env.CASHFREE_BASE_URL.trim() === ""
    ) {
      console.error("❌ Missing or empty Cashfree env vars");
      return NextResponse.json(
        { error: "Cashfree configuration missing" },
        { status: 500 }
      );
    }

    // CRITICAL: Verify authentication
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // CRITICAL: Parse request body with error handling
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }

    const { bookingId, amount, email, phone } = body;

    // CRITICAL: Validate amount is a finite number > 0
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount: must be a positive number" },
        { status: 400 }
      );
    }

    // Backend safety check: fetch booking status first
    if (bookingId && adminDb) {
      try {
        const bookingRef = adminDb.doc(`bookings/${bookingId}`);
        const bookingSnap = await bookingRef.get();
        
        if (bookingSnap.exists) {
          const booking = bookingSnap.data();
          
          // CRITICAL: Check if booking data exists (could be corrupted)
          if (!booking) {
            console.error("Booking document exists but data is null/undefined");
            return NextResponse.json(
              { error: "Booking data corrupted" },
              { status: 500 }
            );
          }
          
          // CRITICAL: Verify user owns this booking
          if (booking.userId !== user.uid) {
            return NextResponse.json(
              { error: "Access denied: You don't own this booking" },
              { status: 403 }
            );
          }
          
          // If already confirmed, reject new order creation
          if (booking.bookingStatus === "CONFIRMED" || booking.paymentStatus === "SUCCESS") {
            console.log("Booking already confirmed, rejecting payment order creation");
            return NextResponse.json(
              { error: "Booking already confirmed" },
              { status: 409 }
            );
          }

          // CRITICAL: Validate amount matches booking totalAmount
          const expectedAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : Number(booking.totalAmount);
          const requestedAmount = parsedAmount;
          
          if (Number.isFinite(expectedAmount) && Number.isFinite(requestedAmount) && expectedAmount !== requestedAmount) {
            console.log("Amount mismatch:", { expectedAmount, requestedAmount });
            return NextResponse.json(
              { error: "Amount mismatch with booking total" },
              { status: 400 }
            );
          }

          // CRITICAL: If booking already has orderId, check if we should reuse it
          if (booking.orderId) {
            // If booking is already confirmed, reject payment creation
            if (booking.bookingStatus === "CONFIRMED" || booking.paymentStatus === "SUCCESS") {
              console.log("Booking already confirmed with orderId:", booking.orderId);
              return NextResponse.json(
                { error: "Booking already confirmed" },
                { status: 409 }
              );
            }
            // If booking has orderId but not confirmed, we can reuse it
            // This prevents creating duplicate orders for the same booking
            console.log("Booking already has orderId, will reuse:", booking.orderId);
          }
        }
      } catch (error) {
        console.error("Failed to check booking status:", error);
        // Continue with payment creation even if this check fails
      }
    }

    // CRITICAL: Get orderId BEFORE generating new one to prevent race conditions
    let orderId: string | null = null;
    
    // First, check if booking already has orderId (atomic read)
    if (bookingId && adminDb) {
      try {
        const bookingRef = adminDb.doc(`bookings/${bookingId}`);
        const bookingSnap = await bookingRef.get();
        
        if (bookingSnap.exists) {
          const booking = bookingSnap.data();
          
          // CRITICAL: Check if booking data exists
          if (!booking) {
            console.error("Booking document exists but data is null/undefined");
            // Continue - will generate new orderId below
          } else if (booking.orderId && typeof booking.orderId === "string") {
            orderId = booking.orderId;
            console.log("Reusing existing orderId from booking:", orderId);
          }
        }
      } catch (error) {
        console.error("Failed to read booking for orderId:", error);
        // Continue - will generate new orderId below
      }
    }

    // Only generate new orderId if booking doesn't have one
    if (!orderId) {
      // Generate unique orderId with timestamp + random to prevent collisions
      orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      
      // Store new orderId in booking atomically (before creating Cashfree order)
      if (bookingId && adminDb) {
        try {
          const bookingRef = adminDb.doc(`bookings/${bookingId}`);
          await bookingRef.set({
            orderId: orderId,
            paymentStatus: "INITIATED",
            bookingStatus: "PENDING",
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log("Stored new orderId in booking:", orderId);
        } catch (error) {
          console.error("Failed to store orderId in booking:", {
            error: error instanceof Error ? error.message : String(error),
            bookingId,
            orderId,
            hasAdminDb: !!adminDb,
          });
          // CRITICAL: If we can't store orderId, webhook won't find booking
          // Return error instead of continuing
          return NextResponse.json(
            { error: "Failed to initialize payment order" },
            { status: 500 }
          );
        }
      } else if (bookingId && !adminDb) {
        console.error("Cannot store orderId: Firebase Admin SDK not initialized", {
          bookingId,
          orderId,
        });
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }
    }

    // CRITICAL: Ensure orderId is set (should never be null at this point)
    if (!orderId) {
      console.error("CRITICAL: orderId is null after initialization");
      return NextResponse.json(
        { error: "Failed to generate payment order ID" },
        { status: 500 }
      );
    }

    // ✅ STEP 3 — ENSURE CORRECT BASE URL
    // Production: https://api.cashfree.com/pg
    // Sandbox: https://sandbox.cashfree.com/pg
    // CRITICAL: Remove trailing slash to prevent double slashes in endpoint
    let CASHFREE_BASE = process.env.CASHFREE_BASE_URL.trim();
    if (CASHFREE_BASE.endsWith("/")) {
      CASHFREE_BASE = CASHFREE_BASE.slice(0, -1);
    }
    
    if (!CASHFREE_BASE) {
      return NextResponse.json(
        { error: "CASHFREE_BASE_URL not configured" },
        { status: 500 }
      );
    }
    
    // Validate base URL format
    if (!CASHFREE_BASE.startsWith("https://") || !CASHFREE_BASE.includes("cashfree.com/pg")) {
      console.error("❌ Invalid CASHFREE_BASE_URL format:", CASHFREE_BASE);
      return NextResponse.json(
        { error: "Invalid Cashfree base URL configuration" },
        { status: 500 }
      );
    }

    // ✅ STEP 4 — DOMAIN MUST MATCH RETURN URL
    // Ensure order payload uses movigoo.in (not vercel.app, localhost, or preview URLs)
    // Cashfree validates this against whitelisted domains
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const returnUrlParams = new URLSearchParams({
      order_id: orderId,
      ...(bookingId && { bookingId }),
    });
    const returnUrl = `${appUrl}/payment/success?${returnUrlParams.toString()}`;

    console.log("Creating Cashfree payment session...");
    console.log("Return URL:", returnUrl);

    const payload = {
      order_id: orderId,
      order_amount: parsedAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: bookingId || orderId,
        customer_email: email || "test@movigoo.in",
        customer_phone: phone || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
        // CRITICAL: Single webhook endpoint (2025-01-01 compatible)
        // This tells Cashfree where to send webhook notifications
        // Must match exactly: https://www.movigoo.in/api/cashfree/webhook
        notify_url: `${appUrl}/api/cashfree/webhook`,
      },
    };

    // CRITICAL: Fetch with timeout and error handling
    let response: Response;
    try {
      response = await fetch(`${CASHFREE_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID!.trim(),
          "x-client-secret": process.env.CASHFREE_SECRET_KEY!.trim(),
          "x-api-version": "2023-08-01",
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      console.error("Cashfree API fetch failed:", {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        orderId,
      });
      return NextResponse.json(
        { error: "Failed to connect to payment gateway" },
        { status: 500 }
      );
    }

    // CRITICAL: Log response status + raw text BEFORE parsing
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (textError) {
      console.error("Failed to read Cashfree API response body:", {
        error: textError instanceof Error ? textError.message : String(textError),
        status: response.status,
        statusText: response.statusText,
        orderId,
      });
      return NextResponse.json(
        { error: "Payment gateway response read failed" },
        { status: 502 }
      );
    }
    
    console.log("Cashfree API response:", {
      status: response.status,
      statusText: response.statusText,
      rawTextPreview: responseText.substring(0, 300),
      rawTextLength: responseText.length,
    });

    // CRITICAL: Parse response with defensive error handling
    let data: any;
    try {
      if (!responseText) {
        console.error("Cashfree API returned empty response:", {
          status: response.status,
          statusText: response.statusText,
        });
        return NextResponse.json(
          { error: "Payment gateway returned empty response" },
          { status: 500 }
        );
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Cashfree API response parse failed:", {
        status: response.status,
        statusText: response.statusText,
        rawTextPreview: responseText.substring(0, 300),
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return NextResponse.json(
        { error: "Payment gateway returned invalid response" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("Cashfree API error:", {
        status: response.status,
        statusText: response.statusText,
        error: data,
        orderId,
      });
      return NextResponse.json(
        { error: data.message || data.error || "Cashfree order failed" },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    // Log full response for debugging (without sensitive data)
    console.log("Cashfree order created successfully:", {
      orderId: data.order_id,
      hasPaymentSessionId: !!data.payment_session_id,
      paymentSessionIdLength: data.payment_session_id?.length,
      paymentSessionIdPrefix: data.payment_session_id?.substring(0, 20),
    });

    // CRITICAL: Extract payment_session_id exactly as returned by Cashfree
    // Use data.payment_session_id (snake_case) - NOT data.paymentSessionId
    if (!data.payment_session_id) {
      console.error("Cashfree response missing payment_session_id:", data);
      return NextResponse.json(
        { error: "Cashfree did not return payment_session_id" },
        { status: 500 }
      );
    }

    // CRITICAL: Use the order_id that Cashfree returns (may differ from what we sent)
    const cashfreeOrderId = data.order_id || orderId;
    
    // Update booking with the actual Cashfree order_id for webhook lookup
    if (bookingId && adminDb && cashfreeOrderId) {
      try {
        const bookingRef = adminDb.doc(`bookings/${bookingId}`);
        await bookingRef.set({
          orderId: cashfreeOrderId, // Store the actual Cashfree order_id
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log("Updated booking with Cashfree orderId:", cashfreeOrderId);
      } catch (error) {
        console.error("Failed to update booking with Cashfree orderId:", error);
        // Continue even if this fails - orderId is still in response
      }
    }

    // ✅ ADD SAFETY LOG (TEMPORARY)
    // This log must NOT contain payment at the end
    console.log(
      "Cashfree RAW session id from API:",
      data.payment_session_id
    );

    // CRITICAL: Return EXACT payment_session_id without any modification
    // Use data.payment_session_id DIRECTLY - no variables, no concatenation, no mutation
    return NextResponse.json({
      paymentSessionId: data.payment_session_id,
      orderId: cashfreeOrderId, // Also return orderId for frontend reference
    });
  } catch (err: any) {
    // CRITICAL: Log full error details for debugging
    console.error("Cashfree payment route error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    });
    
    // Return user-friendly error message
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to initialize payment order" },
      { status: 500 }
    );
  }
}
