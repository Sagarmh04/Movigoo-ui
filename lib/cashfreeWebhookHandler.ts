// lib/cashfreeWebhookHandler.ts
// Cashfree webhook handler - Production-ready with email integration
// Security: Signature verification + Transaction-based confirmation
// Email: Decoupled, sent AFTER successful payment confirmation

import crypto from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateAmount, validateCashfreeWebhookSecret } from "@/lib/utils/cashfree";
import { sendBookingConfirmationEmail } from "@/lib/email-helper";
import { waitUntil } from "@vercel/functions";

// Cashfree 2023-08-01 payload structure (nested data)
type CashfreeWebhookPayload = {
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_message: string;
    };
    customer_details: {
      customer_name: string;
      customer_id: string;
      customer_email: string;
      customer_phone: string;
    };
  };
  event_time: string;
  type: string;
};

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Verify Cashfree webhook signature - BULLETPROOF with fallback
 * 
 * Tries both signature formats to handle documentation inconsistencies:
 * 1. WITH DOT: timestamp + "." + rawBody (per official pseudocode)
 * 2. WITHOUT DOT: timestamp + rawBody (per some Node.js SDK examples)
 */
function verifyCashfreeWebhookSignature(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const { rawBody, timestamp, signature, secret } = args;

  const computeHMAC = (payload: string) => {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload, "utf8");
    return hmac.digest("base64");
  };

  // 1. Try WITH DOT (per Pseudocode)
  const signatureWithDot = computeHMAC(timestamp + "." + rawBody);
  if (constantTimeEquals(signatureWithDot, signature)) {
    console.log("[Webhook] ✅ Signature verified (WITH-DOT format)");
    return true;
  }

  // 2. Fallback: Try WITHOUT DOT (per Node.js Example)
  const signatureNoDot = computeHMAC(timestamp + rawBody);
  if (constantTimeEquals(signatureNoDot, signature)) {
    console.warn("[Webhook] ⚠️ Signature matched using NO-DOT format (Fallback)");
    return true;
  }

  // 3. Failed both formats
  console.error("[Webhook] ❌ Signature verification FAILED", {
    timestamp,
    rawBodyLength: rawBody.length,
    // Removed partial signature logs to prevent leakage of signature structure
    error: "Signatures did not match expected values"
  });
  return false;
}

function isPaymentSuccess(payload: CashfreeWebhookPayload) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(payload?.data?.payment?.payment_status));
}

export async function handleCashfreeWebhook(req: NextRequest) {
  try {
    // 1. Read RAW body FIRST (required for signature verification)
    const rawBody = await req.text();

    // 2. Extract signature headers
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // 3. Validate webhook secret
    let webhookSecret: string;
    try {
      webhookSecret = validateCashfreeWebhookSecret();
    } catch (e) {
      console.error("[Webhook] CRITICAL: CASHFREE_WEBHOOK_SECRET not configured in environment");
      return new Response("Unauthorized", { status: 401 });
    }

    if (!timestamp || !signature) {
      console.error("[Webhook] Missing signature headers");
      return new Response("Missing headers", { status: 401 });
    }

    // 4. Verify signature (bulletproof with fallback)
    const verified = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret: webhookSecret,
    });

    if (!verified) {
      console.error("[Webhook] ❌ Signature verification FAILED");
      return new Response("Invalid signature", { status: 401 });
    }

    // 5. Parse payload AFTER signature verification
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("[Webhook] Invalid JSON payload");
      return new Response("OK", { status: 200 }); // Return OK to prevent retries
    }

    // 6. Extract data from nested payload structure (2023-08-01)
    const orderId = payload?.data?.order?.order_id;
    const paymentStatus = payload?.data?.payment?.payment_status;
    const receivedAmount = payload?.data?.payment?.payment_amount;

    console.log("[Webhook] Payload received:", {
      orderId,
      paymentStatus,
      receivedAmount,
    });

    if (!orderId) {
      console.error("[Webhook] Missing order_id in payload");
      return new Response("OK", { status: 200 });
    }

    // 7. Check payment status
    if (safeUpper(paymentStatus) !== "SUCCESS") {
      console.log(`[Webhook] Payment not successful (status: ${paymentStatus}), ignoring`);
      return new Response("OK", { status: 200 });
    }

    // 8. Admin SDK null safety
    if (!adminDb) {
      console.error("[Webhook] Admin SDK not initialized");
      return new Response("OK", { status: 200 });
    }

    const db = adminDb;

    // 9. Run transaction for atomic booking confirmation
    await db.runTransaction(async (transaction) => {
      // Find booking by orderId
      const bookingsRef = db.collection("bookings");
      const snapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

      if (snapshot.empty) {
        console.log("[Webhook] No booking found for orderId:", orderId);
        return;
      }

      const bookingDoc = snapshot.docs[0];
      const bookingId = bookingDoc.id;
      const booking = bookingDoc.data();

      // Idempotency check INSIDE transaction
      const alreadyConfirmed =
        safeUpper(booking.bookingStatus) === "CONFIRMED" &&
        safeUpper(booking.paymentStatus) === "SUCCESS";

      if (alreadyConfirmed) {
        console.log("[Webhook] Booking already confirmed (idempotent):", bookingId);
        return;
      }

      // Strict amount validation INSIDE transaction
      const expectedAmount = validateAmount(booking.totalAmount);
      const payloadAmount = validateAmount(receivedAmount);

      if (expectedAmount !== payloadAmount) {
        console.error("[Webhook] Amount mismatch", {
          bookingId,
          orderId,
          expectedAmount,
          receivedAmount: payloadAmount,
        });
        throw new Error(`Amount mismatch: expected ${expectedAmount}, got ${payloadAmount}`);
      }

      // Generate ticket ID if not exists
      const ticketId =
        booking.ticketId ||
        `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

      // Confirm booking
      const updateData = {
        orderId,
        paymentGateway: "cashfree",
        paymentStatus: "SUCCESS",
        bookingStatus: "CONFIRMED",
        ticketId,
        confirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        webhookReceivedAt: FieldValue.serverTimestamp(),
      };

      // Update main booking
      transaction.set(bookingDoc.ref, updateData, { merge: true });

      // Update event booking if exists
      if (booking.eventId) {
        const eventBookingRef = db.doc(`events/${booking.eventId}/bookings/${bookingId}`);
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
        transaction.set(eventBookingRef, eventBookingUpdate, { merge: true });
      }

      console.log(`[Webhook] ✅ Booking confirmed successfully: ${bookingId}`);
    });

    // 10. Send confirmation email in background (non-blocking)
    waitUntil(
      (async () => {
        try {
          const bookingsRef = db.collection("bookings");
          const finalSnapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

          if (!finalSnapshot.empty) {
            const finalBookingData = finalSnapshot.docs[0].data();
            const finalBookingId = finalSnapshot.docs[0].id;

            console.log(`[Webhook] 📧 Attempting to send confirmation email for: ${finalBookingId}`);
            await sendBookingConfirmationEmail(finalBookingData);
            console.log(`[Webhook] ✅ Email sent successfully for booking: ${finalBookingId}`);
          }
        } catch (emailError: any) {
          console.error("[Webhook] ⚠️ Email failed (background):", emailError.message);
        }
      })()
    );

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    console.error("[Webhook] Error stack:", error?.stack);
    // Return OK to prevent Cashfree retry loops on internal errors
    return new Response("OK", { status: 200 });
  }
}
