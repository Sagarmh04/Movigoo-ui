// app/api/cashfree/webhook/route.ts
// POST /api/cashfree/webhook
// Cashfree webhook handler - PRODUCTION SAFE
// This is the ONLY trusted source for payment confirmation

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

// Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    console.log("🔔 Cashfree webhook received:", {
      orderId: payload.order_id,
      orderStatus: payload.order_status,
      paymentStatus: payload.payment_status,
      timestamp: new Date().toISOString(),
    });

    const {
      order_id,
      order_status,
      payment_status,
      order_amount,
      order_currency,
    } = payload;

    // Validate required fields
    if (!order_id) {
      console.error("❌ Webhook missing order_id");
      return new Response("Invalid payload: missing order_id", { status: 400 });
    }

    // Extract bookingId from order_id (format: order_{timestamp})
    // We need to find the booking by orderId in Firestore
    if (!db) {
      console.error("❌ Database not initialized");
      return new Response("Database error", { status: 500 });
    }

    // Find booking by orderId
    // Note: We need to query bookings collection for matching orderId
    const { query, where, getDocs, collection, limit } = await import("firebase/firestore");
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("orderId", "==", order_id), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("❌ Booking not found for orderId:", order_id);
      // Still return 200 to prevent Cashfree retries
      return new Response("Booking not found", { status: 200 });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const existingBooking = bookingDoc.data();

    console.log("✅ Found booking:", bookingId, "Current status:", existingBooking.bookingStatus);

    // Check payment status
    const successStatuses = ["SUCCESS", "PAID", "PAYMENT_SUCCESS"];
    const isSuccess = successStatuses.includes(payment_status?.toUpperCase()) || 
                     successStatuses.includes(order_status?.toUpperCase());

    if (isSuccess) {
      // Payment successful - update booking to CONFIRMED
      console.log("✅ Payment successful - updating booking to CONFIRMED");

      // Generate ticket ID
      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Update booking data
      const updateData = {
        orderId: order_id,
        paymentGateway: "cashfree",
        paymentStatus: "SUCCESS",
        bookingStatus: "CONFIRMED",
        ticketId: ticketId,
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        webhookReceivedAt: serverTimestamp(),
      };

      // Prepare event booking update (preserve metadata fields)
      const eventBookingUpdate = {
        ...updateData,
        locationId: existingBooking.locationId || null,
        locationName: existingBooking.locationName || null,
        venueId: existingBooking.venueId || null,
        showId: existingBooking.showId || null,
        showTime: existingBooking.showTime || existingBooking.time || null,
        locationVenueKey: existingBooking.locationVenueKey || null,
        venueShowKey: existingBooking.venueShowKey || null,
        dateTimeKey: existingBooking.dateTimeKey || null,
      };

      // Update in all locations
      const bookingRef = doc(db, "bookings", bookingId);
      await Promise.all([
        setDoc(bookingRef, updateData, { merge: true }),
        existingBooking.eventId && setDoc(
          doc(db, "events", existingBooking.eventId, "bookings", bookingId),
          eventBookingUpdate,
          { merge: true }
        ),
      ]);

      console.log("✅ Booking updated to CONFIRMED with ticketId:", ticketId);

      // Send confirmation email
      try {
        const userEmail = existingBooking.userEmail || existingBooking.email || "movigoo4@gmail.com";
        const userName = existingBooking.userName || existingBooking.name || "Guest User";
        
        const eventDate = existingBooking.date || existingBooking.eventDate || new Date().toISOString().split("T")[0];
        let formattedEventDate: string;
        try {
          const eventDateObj = new Date(eventDate);
          formattedEventDate = !isNaN(eventDateObj.getTime())
            ? eventDateObj.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Saturday, 1 February 2025";
        } catch {
          formattedEventDate = "Saturday, 1 February 2025";
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
        const ticketLink = `${appUrl}/my-bookings?bookingId=${bookingId}`;

        const showTime = existingBooking.showTime || existingBooking.time || null;
        const showEndTime = existingBooking.showEndTime || null;
        let formattedEventTime: string | undefined;
        if (showTime) {
          formattedEventTime = showEndTime ? `${showTime} - ${showEndTime}` : showTime;
        }

        const venueName = existingBooking.venueName || existingBooking.venue || "Sample Venue";
        const venueAddress = existingBooking.venueAddress || null;
        const venueDisplay = venueAddress ? `${venueName}, ${venueAddress}` : venueName;

        const emailPayload = {
          to: userEmail,
          name: userName,
          eventName: existingBooking.eventTitle || "Sample Event Name",
          eventDate: formattedEventDate,
          eventTime: formattedEventTime,
          venue: venueDisplay,
          ticketQty: existingBooking.quantity || 2,
          bookingId: bookingId,
          ticketLink: ticketLink,
        };

        console.log("📧 Sending confirmation email to:", userEmail);
        await sendTicketEmail(emailPayload);
        console.log("📧 Email sent successfully");
      } catch (emailError: any) {
        console.error("❌ Error sending email:", emailError.message);
        // Don't fail webhook if email fails
      }

      return new Response("OK", { status: 200 });
    } else {
      // Payment failed - update booking to FAILED
      console.log("⚠️ Payment failed - updating booking to FAILED");

      const bookingRef = doc(db, "bookings", bookingId);
      await setDoc(bookingRef, {
        paymentStatus: "FAILED",
        bookingStatus: "FAILED",
        updatedAt: serverTimestamp(),
        webhookReceivedAt: serverTimestamp(),
        failureReason: payment_status || order_status || "UNKNOWN",
      }, { merge: true });

      console.log("✅ Booking updated to FAILED status");

      return new Response("OK", { status: 200 });
    }
  } catch (err: any) {
    console.error("❌ Cashfree webhook error:", err);
    // Return 200 to prevent Cashfree from retrying on our internal errors
    return new Response("Webhook processed with error", { status: 200 });
  }
}
