// lib/email-helper.ts
// Helper to send booking confirmation emails from webhook
// Admin SDK compatible - uses booking data directly
// Uses central dispatcher to ensure correct provider (MSG91)

import { sendBookingConfirmation } from "@/lib/emailDispatcher";

export async function sendBookingConfirmationEmail(bookingData: any): Promise<void> {
  try {
    // Extract user email
    const userEmail = bookingData.userEmail || bookingData.email;
    if (!userEmail) {
      console.error("[Email Helper] Missing user email in booking data");
      return;
    }

    // Check if email already sent (idempotency)
    if (bookingData.confirmationEmailSentAt) {
      console.log("[Email Helper] Email already sent, skipping");
      return;
    }

    // Extract user name
    const userName = bookingData.userName || bookingData.name || "Guest User";

    // Format event date
    const eventDateRaw = bookingData.date || bookingData.eventDate || new Date().toISOString().split("T")[0];
    let formattedEventDate: string;
    try {
      const d = new Date(eventDateRaw);
      formattedEventDate = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      formattedEventDate = eventDateRaw;
    }

    // Extract event time
    const eventTime = bookingData.time || bookingData.showTime || "N/A";

    // Extract venue details
    const venueName = bookingData.venueName || "N/A";
    const venueAddress = bookingData.venueAddress || null;
    const venueDisplay = venueAddress ? `${venueName}, ${venueAddress}` : venueName;

    // Extract event details
    const eventId = bookingData.eventId || null;
    const bookingId = bookingData.bookingId;

    // Generate ticket link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const ticketLink = `${appUrl}/event/${eventId}/confirmation?bookingId=${bookingId}`;

    // Send email via dispatcher (ensures MSG91 is used)
    await sendBookingConfirmation({
      to: userEmail,
      name: userName,
      eventName: bookingData.eventTitle || "Event",
      eventDate: formattedEventDate,
      eventTime,
      venue: venueDisplay,
      ticketQty: bookingData.quantity || 1,
      bookingId,
      ticketLink,
    });

    console.log(`[Email Helper] ✅ Confirmation email sent for booking ${bookingId} to ${userEmail}`);
  } catch (error: any) {
    console.error("[Email Helper] Failed to send confirmation email:", error);
    throw error;
  }
}

