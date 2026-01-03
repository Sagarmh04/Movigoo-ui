// app/api/payments/cashfree/route.ts
// POST /api/payments/cashfree
// Creates a Cashfree payment session (server-side only)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
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

    // Validate environment variables
    if (
      !process.env.CASHFREE_APP_ID ||
      !process.env.CASHFREE_SECRET_KEY ||
      !process.env.CASHFREE_BASE_URL
    ) {
      console.error("❌ Missing Cashfree env vars on Vercel");
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

    const body = await req.json();
    const { bookingId, amount, email, phone } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Backend safety check: fetch booking status first
    if (bookingId && db) {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          const booking = bookingSnap.data();
          
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
          const requestedAmount = Number(amount);
          
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
    if (bookingId && db) {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          const booking = bookingSnap.data();
          // Reuse existing orderId if present (prevents duplicate orders)
          if (booking.orderId && typeof booking.orderId === "string") {
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
      if (bookingId && db) {
        try {
          const bookingRef = doc(db, "bookings", bookingId);
          await setDoc(bookingRef, {
            orderId: orderId,
            paymentStatus: "INITIATED",
            bookingStatus: "PENDING",
            updatedAt: serverTimestamp(),
          }, { merge: true });
          console.log("Stored new orderId in booking:", orderId);
        } catch (error) {
          console.error("Failed to store orderId in booking:", error);
          // CRITICAL: If we can't store orderId, webhook won't find booking
          // Return error instead of continuing
          return NextResponse.json(
            { error: "Failed to initialize payment order" },
            { status: 500 }
          );
        }
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
    // Confirm this line exists exactly (no trailing slash, no spaces, no quotes)
    const CASHFREE_BASE = process.env.CASHFREE_BASE_URL;
    if (!CASHFREE_BASE) {
      return NextResponse.json(
        { error: "CASHFREE_BASE_URL not configured" },
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
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: bookingId || orderId,
        customer_email: email || "test@movigoo.in",
        customer_phone: phone || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${appUrl}/api/cashfree/webhook`,
      },
    };
    const response = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree API error:", {
        status: response.status,
        statusText: response.statusText,
        error: data,
      });
      return NextResponse.json(
        { error: data.message || "Cashfree order failed" },
        { status: 400 }
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
    if (bookingId && db && cashfreeOrderId) {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await setDoc(bookingRef, {
          orderId: cashfreeOrderId, // Store the actual Cashfree order_id
          updatedAt: serverTimestamp(),
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
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
