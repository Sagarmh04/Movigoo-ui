import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const onBookingConfirmed = functions.firestore
  .document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    const wasConfirmed = before?.bookingStatus === "CONFIRMED";
    const isNowConfirmed = after?.bookingStatus === "CONFIRMED";

    if (wasConfirmed) {
      console.log(`[Trigger] Booking ${bookingId} already confirmed, skipping`);
      return null;
    }

    if (!isNowConfirmed) {
      console.log(`[Trigger] Booking ${bookingId} not confirmed, skipping`);
      return null;
    }

    if (after?.confirmationEmailSentAt) {
      console.log(`[Trigger] Email already sent for booking ${bookingId}`);
      return null;
    }

    console.log("[EMAIL] Sending confirmation email", {
      bookingId,
      email: after?.email,
    });

    try {
      const appUrl = process.env.APP_URL || "https://movigoo.in";
      const emailEndpoint = `${appUrl}/api/bookings/send-confirmation-email`;

      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email API failed: ${response.status} ${errorText}`);
      }

      console.log(`[Trigger] Email sent successfully for booking ${bookingId}`);
      return null;
    } catch (error: unknown) {
      console.error(`[Trigger] Failed to send email for booking ${bookingId}:`, error);
      return null;
    }
  });
