// app/api/bookings/[bookingId]/confirm-manual/route.ts
// Manual booking confirmation fallback (when webhook fails)
// Checks Cashfree order status and confirms booking if payment succeeded

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { verifyAuthToken } from "@/lib/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { maybeSendBookingConfirmationEmail } from "@/lib/bookingConfirmationEmail";
import { updateAnalyticsOnBookingConfirmation } from "@/lib/analyticsUpdate";

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
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const user = await verifyAuthToken(token);
    if (!user?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      return NextResponse.json({ error: "Cashfree not configured" }, { status: 500 });
    }

    const bookingId = params.bookingId;
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingSnap.data() as any;

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
    const orderStatusUrl = `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`;
    const response = await fetch(orderStatusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) {
      console.error("Cashfree API error:", response.status, await response.text());
      return NextResponse.json({ 
        error: "Failed to check payment status with Cashfree" 
      }, { status: 500 });
    }

    const orderData = await response.json();
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
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      manualConfirmationAt: serverTimestamp(),
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

    await Promise.all([
      setDoc(bookingRef, updateData, { merge: true }),
      booking.eventId
        ? setDoc(doc(db, "events", booking.eventId, "bookings", bookingId), eventBookingUpdate, { merge: true })
        : Promise.resolve(),
    ]);

    // Update analytics (non-blocking - failures are logged but don't affect booking confirmation)
    if (booking.eventId && booking.quantity && booking.totalAmount) {
      // Extract date from booking (could be in 'date' field or parsed from dateTimeKey)
      let bookingDate: string | null = booking.date || null;
      if (!bookingDate && booking.dateTimeKey) {
        // dateTimeKey format: "yyyy-mm-dd_HH:mm"
        const datePart = booking.dateTimeKey.split("_")[0];
        if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          bookingDate = datePart;
        }
      }

      updateAnalyticsOnBookingConfirmation(db, {
        eventId: booking.eventId,
        quantity: typeof booking.quantity === "number" ? booking.quantity : 0,
        totalAmount: typeof booking.totalAmount === "number" ? booking.totalAmount : 0,
        locationId: booking.locationId || null,
        venueId: booking.venueId || null,
        date: bookingDate,
        showId: booking.showId || null,
      }).catch((error) => {
        // Analytics failure must NEVER block booking confirmation
        // Error is already logged in updateAnalyticsOnBookingConfirmation
        console.error("[Manual Confirmation] Analytics update failed (non-fatal):", error);
      });
    }

    // Send confirmation email
    await maybeSendBookingConfirmationEmail({
      firestore: db,
      bookingId,
      eventId: booking.eventId || null,
    });

    return NextResponse.json({ 
      ok: true, 
      message: "Booking confirmed successfully",
      bookingStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
    });
  } catch (error: any) {
    console.error("Manual confirmation error:", error);
    return NextResponse.json({ 
      error: error?.message || "Internal server error" 
    }, { status: 500 });
  }
}

