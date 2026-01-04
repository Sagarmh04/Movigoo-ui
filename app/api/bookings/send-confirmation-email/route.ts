// app/api/bookings/send-confirmation-email/route.ts
// Email sending endpoint - decoupled from booking confirmation
// Can be called by:
// 1. Firestore trigger (Cloud Function)
// 2. Scheduled job/cron
// 3. Manual API call
// 4. Frontend after booking confirmation

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

export const runtime = "nodejs";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Admin DB not initialized" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // CRITICAL: Use Admin SDK to read booking
    const bookingRef = adminDb.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnap.data() as any;

    // CRITICAL: Only send email if booking is confirmed
    const bookingStatus = safeUpper(booking.bookingStatus);
    const paymentStatus = safeUpper(booking.paymentStatus);

    if (bookingStatus !== "CONFIRMED" || paymentStatus !== "SUCCESS") {
      return NextResponse.json(
        { 
          error: "Booking not confirmed",
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
        },
        { status: 400 }
      );
    }

    // Check if email already sent
    if (booking.confirmationEmailSentAt) {
      return NextResponse.json({
        success: true,
        message: "Email already sent",
        sentAt: booking.confirmationEmailSentAt,
      });
    }

    // Get user email
    const userEmail = booking.userEmail || booking.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in booking" },
        { status: 400 }
      );
    }

    // Format event date
    const eventDateRaw = booking.date || booking.eventDate || new Date().toISOString().split("T")[0];
    let formattedEventDate: string;
    try {
      const d = new Date(eventDateRaw);
      formattedEventDate = d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      formattedEventDate = eventDateRaw;
    }

    const eventTime = booking.time || booking.showTime || "TBA";
    const venueName = booking.venueName || "Venue TBA";
    const venueAddress = booking.venueAddress || "";
    const venueDisplay = venueAddress ? `${venueName}, ${venueAddress}` : venueName;
    const userName = booking.userName || booking.name || "Guest User";

    // Generate ticket link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const ticketLink = `${appUrl}/booking/${bookingId}`;

    // Send email
    try {
      await sendTicketEmail({
        to: userEmail,
        name: userName,
        eventName: booking.eventTitle || "Event",
        eventDate: formattedEventDate,
        eventTime,
        venue: venueDisplay,
        ticketQty: booking.quantity || 1,
        bookingId,
        ticketLink,
      });

      // Mark email as sent
      const { FieldValue } = await import("firebase-admin/firestore");
      await bookingRef.set({
        confirmationEmailSentAt: FieldValue.serverTimestamp(),
        confirmationEmailLastError: null,
      }, { merge: true });

      return NextResponse.json({
        success: true,
        message: "Confirmation email sent successfully",
      });
    } catch (emailError: any) {
      // Log error but don't fail the request
      console.error("[Email] Failed to send confirmation email:", emailError);
      
      await bookingRef.set({
        confirmationEmailLastError: emailError?.message || "Email send failed",
      }, { merge: true });

      return NextResponse.json(
        {
          error: "Failed to send email",
          details: emailError?.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Email] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

