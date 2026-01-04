// docs/firebase-function-example.ts
// Firebase Cloud Function - Firestore Trigger Example
// Sends confirmation email when booking status changes to CONFIRMED
// 
// DEPLOYMENT:
// 1. Install Firebase CLI: npm install -g firebase-tools
// 2. Login: firebase login
// 3. Initialize: firebase init functions
// 4. Copy this file to functions/src/index.ts (or as separate export)
// 5. Deploy: firebase deploy --only functions
//
// This function runs automatically when a booking document is updated
// and bookingStatus becomes "CONFIRMED"

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onBookingConfirmed = functions.firestore
  .document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    // Only proceed if booking just became CONFIRMED
    const wasConfirmed = before?.bookingStatus === "CONFIRMED" && before?.paymentStatus === "SUCCESS";
    const isNowConfirmed = after?.bookingStatus === "CONFIRMED" && after?.paymentStatus === "SUCCESS";

    // Skip if already confirmed (prevents duplicate emails)
    if (wasConfirmed) {
      console.log(`[Trigger] Booking ${bookingId} already confirmed, skipping`);
      return null;
    }

    // Only send email if just confirmed
    if (!isNowConfirmed) {
      console.log(`[Trigger] Booking ${bookingId} not confirmed, skipping`);
      return null;
    }

    // Skip if email already sent
    if (after?.confirmationEmailSentAt) {
      console.log(`[Trigger] Email already sent for booking ${bookingId}`);
      return null;
    }

    console.log(`[Trigger] Booking ${bookingId} confirmed, sending email...`);

    try {
      // Call your email API endpoint
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
    } catch (error: any) {
      console.error(`[Trigger] Failed to send email for booking ${bookingId}:`, error);
      // Don't throw - we don't want to retry the entire webhook
      return null;
    }
  });

