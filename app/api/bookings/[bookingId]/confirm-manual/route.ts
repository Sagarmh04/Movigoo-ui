// app/api/bookings/[bookingId]/confirm-manual/route.ts
// Manual booking confirmation fallback (when webhook fails)
// Checks Cashfree order status and confirms booking if payment succeeded
// CRITICAL: Uses Admin SDK to bypass Firestore rules

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuthToken } from "@/lib/auth";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export const runtime = "nodejs";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

function isSuccessStatus(status: string) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(status));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // CRITICAL: Check Admin SDK is initialized
    if (!adminDb) {
      return NextResponse.json(
        { error: "Admin DB not initialized" },
        { status: 500 }
      );
    }

    // Auth check
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const user = await verifyAuthToken(token);
    if (!user?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate Cashfree config
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      return NextResponse.json({ error: "Cashfree not configured" }, { status: 500 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // CRITICAL: Use Admin SDK (bypasses Firestore rules)
    const bookingRef = adminDb.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingSnap.data() as any;

    // CRITICAL: Check if booking data exists (could be corrupted)
    if (!booking) {
      console.error("Booking document exists but data is null/undefined");
      return NextResponse.json(
        { error: "Booking data corrupted" },
        { status: 500 }
      );
    }

    // Verify ownership
    if (booking.userId !== user.uid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already confirmed
    const existingStatus = safeUpper(booking.bookingStatus);
    const existingPaymentStatus = safeUpper(booking.paymentStatus);
    
    if (existingStatus === "CONFIRMED" && existingPaymentStatus === "SUCCESS") {
      return NextResponse.json({ 
        ok: true, 
        message: "Booking already confirmed",
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
      });
    }

    // Check if booking is in a state that can be confirmed
    if (existingStatus === "CANCELLED" || existingPaymentStatus === "FAILED") {
      return NextResponse.json({ 
        error: "Booking cannot be confirmed (cancelled/failed)" 
      }, { status: 400 });
    }

    const orderId = booking.orderId;
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ 
        error: "No order ID found for this booking" 
      }, { status: 400 });
    }

    // Query Cashfree API for order status
    let CASHFREE_BASE = process.env.CASHFREE_BASE_URL.trim();
    if (CASHFREE_BASE.endsWith("/")) {
      CASHFREE_BASE = CASHFREE_BASE.slice(0, -1);
    }

    const orderStatusUrl = `${CASHFREE_BASE}/orders/${orderId}`;
    const response = await fetchWithTimeout(orderStatusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID.trim(),
        "x-client-secret": process.env.CASHFREE_SECRET_KEY.trim(),
        "x-api-version": "2023-08-01",
      },
      timeoutMs: 8000,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Cashfree API error:", response.status, errorText);
      return NextResponse.json({ 
        error: "Failed to check payment status with Cashfree" 
      }, { status: 500 });
    }

    let orderData: any;
    try {
      const responseText = await response.text();
      if (!responseText) {
        return NextResponse.json({ 
          error: "Cashfree returned empty response" 
        }, { status: 500 });
      }
      orderData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Cashfree response:", parseError);
      return NextResponse.json({ 
        error: "Invalid response from Cashfree" 
      }, { status: 500 });
    }

    const statusRaw = (orderData.payment_status || orderData.order_status || orderData.status || "") as string;
    const receivedAmount = Number(orderData.order_amount);
    const expectedAmount = Number(booking.totalAmount);

    // Amount validation
    if (Number.isFinite(receivedAmount) && Number.isFinite(expectedAmount) && receivedAmount !== expectedAmount) {
      return NextResponse.json({ 
        error: "Amount mismatch" 
      }, { status: 400 });
    }

    // Check if payment was successful
    if (!isSuccessStatus(statusRaw)) {
      return NextResponse.json({ 
        ok: false, 
        message: "Payment not successful",
        paymentStatus: statusRaw,
      });
    }

    // Payment successful - confirm booking
    const ticketId = booking.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

    const updateData = {
      orderId,
      paymentGateway: "cashfree",
      paymentStatus: "SUCCESS",
      bookingStatus: "CONFIRMED",
      ticketId,
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      manualConfirmationAt: FieldValue.serverTimestamp(),
      reconciliationSource: "manual",
    };

    const eventBookingUpdate = {
      ...updateData,
      locationId: booking.locationId || null,
      locationName: booking.locationName || null,
      venueId: booking.venueId || null,
      showId: booking.showId || null,
      showTime: booking.showTime || booking.time || null,
      locationVenueKey: booking.locationVenueKey || null,
      venueShowKey: booking.venueShowKey || null,
      dateTimeKey: booking.dateTimeKey || null,
    };

    // CRITICAL: Use Admin SDK for all writes (bypasses Firestore rules)
    await Promise.all([
      bookingRef.set(updateData, { merge: true }),
      booking.eventId
        ? adminDb.doc(`events/${booking.eventId}/bookings/${bookingId}`).set(eventBookingUpdate, { merge: true })
        : Promise.resolve(),
    ]);

    // NOTE: Analytics and email functions require client SDK Firestore type
    // These are non-blocking and will be handled separately if needed
    // For now, manual confirmation focuses on core booking state update

    return NextResponse.json({ 
      ok: true, 
      message: "Booking confirmed successfully",
      bookingStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
    });
  } catch (error: any) {
    console.error("[CONFIRM-MANUAL] FAILED", error);
    return NextResponse.json({ 
      error: error?.message || "Internal server error" 
    }, { status: 500 });
  }
}
