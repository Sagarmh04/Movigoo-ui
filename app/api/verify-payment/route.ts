// app/api/verify-payment/route.ts
// POST /api/verify-payment
// Verifies Cashfree payment and creates/updates booking

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

// Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, bookingId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    console.log("Verifying payment for orderId:", orderId, "bookingId:", bookingId);

    // Validate environment variables
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      console.error("❌ Missing Cashfree env vars");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Call Cashfree Order Status API
    const CASHFREE_BASE = process.env.CASHFREE_BASE_URL;
    const orderStatusUrl = `${CASHFREE_BASE}/orders/${orderId}`;

    console.log("Calling Cashfree order status API:", orderStatusUrl);

    const response = await fetch(orderStatusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
    });

    const orderData = await response.json();

    console.log("Cashfree order status response:", {
      status: response.status,
      orderStatus: orderData.order_status,
      paymentStatus: orderData.payment_status,
    });

    if (!response.ok) {
      console.error("Cashfree API error:", orderData);
      return NextResponse.json(
        { error: orderData.message || "Failed to verify payment" },
        { status: 400 }
      );
    }

    // Check payment status
    const paymentStatus = orderData.payment_status || orderData.order_status;
    const isPaymentSuccess = paymentStatus === "SUCCESS" || paymentStatus === "PAID";

    if (!isPaymentSuccess) {
      console.log("Payment not successful. Status:", paymentStatus);
      
      // If booking exists, update it to FAILED
      if (bookingId && db) {
        try {
          const bookingRef = doc(db, "bookings", bookingId);
          const bookingSnap = await getDoc(bookingRef);
          
          if (bookingSnap.exists()) {
            await setDoc(bookingRef, {
              paymentStatus: "FAILED",
              bookingStatus: "FAILED",
              updatedAt: serverTimestamp(),
            }, { merge: true });
            console.log("Updated booking to FAILED status");
          }
        } catch (error) {
          console.error("Error updating booking status:", error);
        }
      }

      return NextResponse.json(
        { 
          success: false,
          error: "Payment not successful",
          paymentStatus 
        },
        { status: 400 }
      );
    }

    // Payment is successful - update booking to CONFIRMED
    console.log("Payment verified successfully. Updating booking...");

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required to update booking" },
        { status: 400 }
      );
    }

    // Get existing booking
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      console.error("Booking not found:", bookingId);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const existingBooking = bookingSnap.data();
    console.log("Found booking:", bookingId, "Current status:", existingBooking.bookingStatus);

    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Update booking data
    const updateData = {
      orderId: orderId,
      paymentGateway: "cashfree",
      paymentStatus: "SUCCESS",
      bookingStatus: "CONFIRMED",
      ticketId: ticketId,
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Update in both locations
    await Promise.all([
      setDoc(bookingRef, updateData, { merge: true }),
      existingBooking.userId && setDoc(
        doc(db, "users", existingBooking.userId, "bookings", bookingId),
        updateData,
        { merge: true }
      ),
    ]);

    console.log("Updated booking:", bookingId, "to CONFIRMED with ticketId:", ticketId);

    return NextResponse.json({
      success: true,
      bookingId: bookingId,
      ticketId: ticketId,
      message: "Booking confirmed successfully",
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

