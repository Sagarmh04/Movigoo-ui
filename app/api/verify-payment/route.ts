// app/api/verify-payment/route.ts
// POST /api/verify-payment
// Verifies Cashfree payment and creates/updates booking

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

// Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let orderId: string | undefined;
  let bookingId: string | undefined;
  
  try {
    const body = await req.json();
    orderId = body.orderId;
    bookingId = body.bookingId;

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

    console.log("🔍 Cashfree order status response:", {
      status: response.status,
      orderStatus: orderData.order_status,
      paymentStatus: orderData.payment_status,
      fullResponse: JSON.stringify(orderData, null, 2),
    });

    // Get payment status - check multiple possible fields
    const paymentStatus = orderData.payment_status || orderData.order_status || orderData.status || "UNKNOWN";
    
    // Check all possible success statuses from Cashfree
    const successStatuses = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
    const isPaymentSuccess = successStatuses.includes(paymentStatus.toUpperCase());

    console.log("🔍 Payment status check:", {
      paymentStatus,
      isPaymentSuccess,
      checkedStatuses: successStatuses,
    });

    if (!response.ok) {
      console.error("❌ Cashfree API error:", orderData);
      
      // Send email even on API error (for debugging)
      await sendDebugEmail("API_ERROR", orderId, bookingId, {
        error: orderData.message || "Failed to verify payment",
        paymentStatus: "UNKNOWN",
      });
      
      return NextResponse.json(
        { error: orderData.message || "Failed to verify payment" },
        { status: 400 }
      );
    }

    if (!isPaymentSuccess) {
      console.log("⚠️ Payment not successful. Status:", paymentStatus);
      
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

      // Send email even on payment failure (for debugging)
      await sendDebugEmail("PAYMENT_FAILED", orderId, bookingId, {
        paymentStatus,
        reason: "Payment status did not match success criteria",
      });

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

    // Prepare event booking update (preserve metadata fields)
    const eventBookingUpdate = {
      ...updateData,
      // Preserve metadata fields if they exist
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
    // NOTE: We do NOT update /users/{userId}/bookings because that's reserved for host users only
    await Promise.all([
      setDoc(bookingRef, updateData, { merge: true }),
      existingBooking.eventId && setDoc(
        doc(db, "events", existingBooking.eventId, "bookings", bookingId),
        eventBookingUpdate,
        { merge: true }
      ),
    ]);

    console.log("✅ Updated booking:", bookingId, "to CONFIRMED with ticketId:", ticketId);

    // Send confirmation email (ALWAYS send for debugging)
    console.log("📧 INITIATING EMAIL SEND - Booking confirmed");
    try {
      // Get user email and name from booking (stored during create-pending)
      const userEmail = existingBooking.userEmail || existingBooking.email || "movigoo4@gmail.com";
      const userName = existingBooking.userName || existingBooking.name || "Guest User";
      
      console.log("📧 Email recipient:", userEmail);
      console.log("📧 User name:", userName);

      // Format event date with fallbacks
      const eventDate = existingBooking.date || existingBooking.eventDate || new Date().toISOString().split("T")[0];
      let formattedEventDate: string;
      try {
        const eventDateObj = new Date(eventDate);
        if (!isNaN(eventDateObj.getTime())) {
          formattedEventDate = eventDateObj.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else {
          formattedEventDate = "Saturday, 1 February 2025"; // Dummy fallback
        }
      } catch {
        formattedEventDate = "Saturday, 1 February 2025"; // Dummy fallback
      }

      // Build ticket link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
      const ticketLink = `${appUrl}/my-bookings?bookingId=${bookingId}`;

      // Prepare email payload with all fallbacks
      const emailPayload = {
        to: userEmail,
        name: userName,
        eventName: existingBooking.eventTitle || "Sample Event Name",
        eventDate: formattedEventDate,
        venue: existingBooking.venueName || existingBooking.venue || "Sample Venue",
        ticketQty: existingBooking.quantity || 2,
        bookingId: bookingId || "BOOKING-12345",
        ticketLink: ticketLink,
      };

      console.log("📧 EMAIL PAYLOAD PREPARED:", JSON.stringify(emailPayload, null, 2));

      // Send email (await for debugging to see if it succeeds)
      await sendTicketEmail(emailPayload);
      
      console.log("📧 EMAIL SENT SUCCESSFULLY to:", userEmail);
    } catch (emailError: any) {
      console.error("❌ Error sending email:", emailError);
      console.error("❌ Email error details:", emailError.message);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      bookingId: bookingId,
      ticketId: ticketId,
      message: "Booking confirmed successfully",
    });
  } catch (err: any) {
    console.error("❌ Payment verification error:", err);
    
    // Send email even on error (for debugging)
    await sendDebugEmail("VERIFICATION_ERROR", orderId || "UNKNOWN", bookingId || "UNKNOWN", {
      error: err.message || "Internal server error",
    });
    
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to send debug emails in all scenarios
async function sendDebugEmail(
  scenario: string,
  orderId: string,
  bookingId: string | undefined,
  extraData: any = {}
) {
  console.log(`📧 DEBUG EMAIL INITIATED - Scenario: ${scenario}`);
  
  try {
    const userEmail = "movigoo4@gmail.com"; // Always send to this for debugging
    
    // Determine message based on scenario
    let eventName = "Sample Event";
    let eventDate = "Saturday, 1 February 2025";
    
    if (scenario === "PAYMENT_FAILED") {
      eventName = `[DEBUG] Payment Failed - ${extraData.paymentStatus || "UNKNOWN"}`;
    } else if (scenario === "API_ERROR") {
      eventName = `[DEBUG] API Error - ${extraData.error || "Unknown error"}`;
    } else if (scenario === "VERIFICATION_ERROR") {
      eventName = `[DEBUG] Verification Error - ${extraData.error || "Unknown error"}`;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const ticketLink = bookingId 
      ? `${appUrl}/my-bookings?bookingId=${bookingId}`
      : `${appUrl}/my-bookings`;

    const emailPayload = {
      to: userEmail,
      name: "Debug User",
      eventName: eventName,
      eventDate: eventDate,
      venue: "Debug Venue",
      ticketQty: 1,
      bookingId: bookingId || orderId || "DEBUG-12345",
      ticketLink: ticketLink,
    };

    console.log(`📧 DEBUG EMAIL PAYLOAD (${scenario}):`, JSON.stringify(emailPayload, null, 2));
    
    await sendTicketEmail(emailPayload);
    
    console.log(`📧 DEBUG EMAIL SENT SUCCESSFULLY - Scenario: ${scenario}`);
  } catch (error: any) {
    console.error(`❌ DEBUG EMAIL FAILED (${scenario}):`, error.message);
  }
}

