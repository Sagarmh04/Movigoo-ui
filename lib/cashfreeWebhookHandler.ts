// lib/cashfreeWebhookHandler.ts
// Cashfree webhook handler - signature verified + transaction-safe booking confirmation
// Security goals:
// - Reject forged webhooks (HMAC with CASHFREE_WEBHOOK_SECRET)
// - Prevent race conditions (runTransaction + idempotency check inside transaction)
// - Prevent price tampering (strict amount match against booking.totalAmount)

import crypto from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateAmount, validateCashfreeWebhookSecret } from "@/lib/utils/cashfree";

// Cashfree Webhook Payload (2023-08-01 / 2025-01-01 schema)
// Real-world structure for payment.success events
type CashfreeWebhookPayload = {
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_currency?: string;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string; // SUCCESS / FAILED / etc.
      payment_amount?: number;
      payment_currency?: string;
      payment_message?: string;
    };
    customer_details?: {
      customer_name?: string;
      customer_id?: string;
      customer_email?: string;
      customer_phone?: string;
    };
  };
  event_time?: string;
  type?: string;
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
 * 
 * This ensures we don't fail due to Cashfree implementation vs documentation mismatch.
 */
function verifyCashfreeWebhookSignature(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const { rawBody, timestamp, signature, secret } = args;

  // Helper to calculate HMAC
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
  // This saves us if the documentation is inconsistent
  const signatureNoDot = computeHMAC(timestamp + rawBody);
  if (constantTimeEquals(signatureNoDot, signature)) {
    console.warn("[Webhook] ⚠️ Signature matched using NO-DOT format (Fallback) - Consider updating docs");
    return true;
  }

  // 3. Failed both formats
  console.error("[Webhook] ❌ Signature verification FAILED for both formats", {
    timestamp,
    timestampLength: timestamp.length,
    rawBodyLength: rawBody.length,
    signatureReceived: signature.substring(0, 20) + "...",
    signatureWithDot: signatureWithDot.substring(0, 20) + "...",
    signatureNoDot: signatureNoDot.substring(0, 20) + "...",
  });
  return false;
}

function isPaymentSuccess(payload: CashfreeWebhookPayload) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(payload?.data?.payment?.payment_status));
}

export async function handleCashfreeWebhook(req: NextRequest) {
  let signatureVerified = false;
  try {
    // 1. Read RAW body FIRST - no parsing
    const rawBody = await req.text();

    // 2. Extract EXACT headers per Cashfree docs
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // 3. Use webhook secret (CASHFREE_WEBHOOK_SECRET) - not API secret
    let secret: string;
    try {
      secret = validateCashfreeWebhookSecret();
    } catch (e) {
      console.error("[Webhook] CASHFREE_WEBHOOK_SECRET not configured");
      return new Response("Webhook not configured", { status: 500 });
    }

    if (!timestamp || !signature) {
      console.error("[Webhook] Missing signature headers", {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        rawBodyLength: rawBody.length,
      });
      return new Response("Missing webhook signature headers", { status: 401 });
    }

    // 4. Verify signature using EXACT algorithm
    const signatureValid = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret,
    });

    if (!signatureValid) {
      console.error("[Webhook] Invalid signature - ignoring");
      return new Response("Invalid webhook signature", { status: 401 });
    }
    signatureVerified = true;

    // 6. Parse JSON AFTER signature verification
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
    } catch (parseError) {
      console.error("[Webhook] Failed to parse JSON:", parseError);
      return new Response("Invalid JSON", { status: 400 });
    }

    // Extract nested fields (Cashfree 2023-08-01)
    const orderId = payload?.data?.order?.order_id;
    const paymentStatus = safeUpper(payload?.data?.payment?.payment_status);
    const receivedAmountRaw = payload?.data?.payment?.payment_amount;

    console.log("[Webhook] Payload received", {
      order_id: orderId,
      payment_status: paymentStatus,
      payment_amount: receivedAmountRaw,
      type: payload?.type,
    });

    // 7. Process ONLY payment.success events
    if (paymentStatus !== "SUCCESS") {
      console.log("[Webhook] Payment not successful - ignoring");
      return new Response("OK", { status: 200 });
    }

    // 8. Get orderId and find booking
    if (!orderId || !adminDb) {
      console.error("[Webhook] Missing orderId or Admin SDK");
      return new Response("OK", { status: 200 });
    }

    const db = adminDb;
    const bookingsRef = db.collection("bookings");
    const snapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

    if (snapshot.empty) {
      console.log("[Webhook] No booking found for orderId:", orderId);
      return new Response("OK", { status: 200 });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const bookingRef = db.doc(`bookings/${bookingId}`);

    // Validate received amount
    let receivedAmount: number;
    try {
      receivedAmount = validateAmount(receivedAmountRaw);
    } catch {
      console.error("[Webhook] Invalid payment_amount in payload");
      return new Response("OK", { status: 200 });
    }

    // 9. Confirm booking inside a Firestore transaction (prevents races)
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(bookingRef);
        if (!snap.exists) return;

        const booking = snap.data() as any;
        if (!booking) return;

        // Idempotency check INSIDE transaction
        const alreadyConfirmed =
          safeUpper(booking.bookingStatus) === "CONFIRMED" &&
          safeUpper(booking.paymentStatus) === "SUCCESS";
        if (alreadyConfirmed) return;

        // Strict amount comparison INSIDE transaction
        const expectedAmount = validateAmount(booking.totalAmount);
        if (expectedAmount !== receivedAmount) {
          console.error("[Webhook] Amount mismatch", {
            bookingId,
            orderId,
            expectedAmount,
            receivedAmount,
          });
          return;
        }

        const ticketId =
          booking.ticketId ||
          `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

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

        tx.set(bookingRef, updateData, { merge: true });

        if (booking.eventId) {
          const eventBookingRef = db.doc(
            `events/${booking.eventId}/bookings/${bookingId}`
          );
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
          tx.set(eventBookingRef, eventBookingUpdate, { merge: true });
        }
      });
    } catch (txErr) {
      console.error("[Webhook] Transaction failed", txErr);
      // After signature verification: return OK to prevent retry loops
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] Booking confirmed successfully:", bookingId);
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    // After signature verification: return OK to prevent retry loops; before verification fail closed
    if (signatureVerified) return new Response("OK", { status: 200 });
    return new Response("Internal server error", { status: 500 });
  }
}
