// lib/cashfreeWebhookHandler.ts
// Cashfree webhook handler - EXACT implementation per official Cashfree docs
// Uses ONLY CASHFREE_SECRET_KEY (cfsk_) - NO separate webhook secret exists

import crypto from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Cashfree Webhook Payload (2025-01-01 schema)
type CashfreeWebhookPayload = {
  order_id?: string;
  order_status?: string;
  payment_status?: string;
  order_amount?: number | string;
  order_currency?: string;
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
 * Verify Cashfree webhook signature - EXACT per Cashfree docs
 * 
 * Algorithm:
 * 1. timestamp := header["x-webhook-timestamp"]
 * 2. signature := header["x-webhook-signature"]
 * 3. signedPayload := timestamp + "." + rawBody
 * 4. expectedSignature := Base64Encode(HMAC_SHA256(signedPayload, CASHFREE_SECRET_KEY))
 * 5. Compare expectedSignature === signature
 */
function verifyCashfreeWebhookSignature(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const { rawBody, timestamp, signature, secret } = args;
  
  // EXACT: signedPayload = timestamp + "." + rawBody
  const signedPayload = timestamp + "." + rawBody;
  
  // EXACT: HMAC_SHA256 + Base64 encoding
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signedPayload, "utf8");
  const expected = hmac.digest("base64");
  
  console.log("[Webhook] Signature verification:", {
    timestamp,
    signedPayloadLength: signedPayload.length,
    rawBodyLength: rawBody.length,
    signatureReceived: signature.substring(0, 20) + "...",
    signatureExpected: expected.substring(0, 20) + "...",
    match: expected === signature,
  });
  
  return constantTimeEquals(expected, signature);
}

function isPaymentSuccess(payload: CashfreeWebhookPayload) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(payload.payment_status)) || success.includes(safeUpper(payload.order_status));
}

export async function handleCashfreeWebhook(req: NextRequest) {
  try {
    // 1. Read RAW body FIRST - no parsing
    const rawBody = await req.text();

    // 2. Extract EXACT headers per Cashfree docs
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // 3. Use ONLY CASHFREE_SECRET_KEY (API secret - cfsk_)
    const secret = process.env.CASHFREE_SECRET_KEY;
    
    if (!secret) {
      console.error("[Webhook] CASHFREE_SECRET_KEY not configured");
      return new Response("OK", { status: 200 });
    }

    // 4. Verify signature using EXACT algorithm
    const signatureValid = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret,
    });

    // 5. ALWAYS return 200 OK - production safe
    if (!signatureValid) {
      console.error("[Webhook] Invalid signature - ignoring");
      return new Response("OK", { status: 200 });
    }

    // 6. Parse JSON AFTER signature verification
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
    } catch (parseError) {
      console.error("[Webhook] Failed to parse JSON:", parseError);
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] Payload received", {
      order_id: payload.order_id,
      order_status: payload.order_status,
      payment_status: payload.payment_status,
      order_amount: payload.order_amount,
    });

    // 7. Process ONLY payment.success events
    if (!isPaymentSuccess(payload)) {
      console.log("[Webhook] Not payment.success - ignoring");
      return new Response("OK", { status: 200 });
    }

    // 8. Get orderId and find booking
    const orderId = payload.order_id;
    if (!orderId || !adminDb) {
      console.error("[Webhook] Missing orderId or Admin SDK");
      return new Response("OK", { status: 200 });
    }

    const bookingsRef = adminDb.collection("bookings");
    const snapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

    if (snapshot.empty) {
      console.log("[Webhook] No booking found for orderId:", orderId);
      return new Response("OK", { status: 200 });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const existing = bookingDoc.data() as any;

    // 9. Idempotency check - skip if already confirmed
    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    
    if (alreadyConfirmed) {
      console.log("[Webhook] Already confirmed - skipping");
      return new Response("OK", { status: 200 });
    }

    // 10. Amount validation
    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof payload.order_amount === "number" ? payload.order_amount : Number(payload.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      console.error("[Webhook] Amount mismatch - ignoring");
      return new Response("OK", { status: 200 });
    }

    // 11. Confirm booking
    console.log("[Webhook] Confirming booking:", bookingId);

    const ticketId = existing.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

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

    const eventBookingUpdate = {
      ...updateData,
      locationId: existing.locationId || null,
      locationName: existing.locationName || null,
      venueId: existing.venueId || null,
      showId: existing.showId || null,
      showTime: existing.showTime || existing.time || null,
      locationVenueKey: existing.locationVenueKey || null,
      venueShowKey: existing.venueShowKey || null,
      dateTimeKey: existing.dateTimeKey || null,
    };

    // 12. Update using Admin SDK
    await Promise.all([
      adminDb.doc(`bookings/${bookingId}`).set(updateData, { merge: true }),
      existing.eventId
        ? adminDb.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(eventBookingUpdate, { merge: true })
        : Promise.resolve(),
    ]);

    console.log("[Webhook] Booking confirmed successfully:", bookingId);
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    return new Response("OK", { status: 200 });
  }
}
