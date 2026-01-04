// app/api/cashfree/webhook/route.ts
// POST /api/cashfree/webhook
// Cashfree webhook handler - BYTE-PERFECT implementation
// Hash RAW bytes, NOT string

import crypto from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// 🔒 MANDATORY: Force Node.js runtime
export const runtime = "nodejs";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const timestamp = req.headers.get("x-webhook-timestamp");
    const signature = req.headers.get("x-webhook-signature");

    if (!timestamp || !signature) {
      console.error("[Webhook] Missing headers");
      return new Response("OK", { status: 200 });
    }

    // 🔴 BYTE-PERFECT BODY (NO STRING CONVERSION)
    const rawBuffer = Buffer.from(await req.arrayBuffer());

    // 🔐 EXACT CASHFREE SPEC - Hash RAW bytes
    // signedPayload = timestamp + "." + rawBodyBytes
    const signedPayload = Buffer.concat([
      Buffer.from(`${timestamp}.`, "utf8"),
      rawBuffer,
    ]);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(signedPayload)
      .digest("base64");

    // 🔒 Timing-safe comparison
    const isValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

    if (!isValid) {
      console.error("[Webhook] Invalid signature - ignoring", {
        timestamp,
        rawBodyLength: rawBuffer.length,
        expectedSignature: expectedSignature.substring(0, 20) + "...",
        receivedSignature: signature.substring(0, 20) + "...",
      });
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] ✅ Signature verified successfully");

    // ✅ Parse ONLY AFTER verification (convert to string now)
    let payload;
    try {
      payload = JSON.parse(rawBuffer.toString("utf8"));
    } catch (parseError) {
      console.error("[Webhook] JSON parse error:", parseError);
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] Payload received", {
      order_id: payload.order_id,
      order_status: payload.order_status,
      payment_status: payload.payment_status,
      order_amount: payload.order_amount,
    });

    // 🎯 Process ONLY payment.success events
    if (payload?.payment_status !== "SUCCESS" && payload?.order_status !== "SUCCESS") {
      console.log("[Webhook] Not payment.success - ignoring");
      return new Response("OK", { status: 200 });
    }

    // 🔍 Find booking
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

    // 🔄 Idempotency check
    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    
    if (alreadyConfirmed) {
      console.log("[Webhook] Already confirmed - skipping");
      return new Response("OK", { status: 200 });
    }

    // 💰 Amount validation
    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof payload.order_amount === "number" ? payload.order_amount : Number(payload.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      console.error("[Webhook] Amount mismatch - ignoring");
      return new Response("OK", { status: 200 });
    }

    // ✅ Confirm booking
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

    // 📝 Update using Admin SDK
    await Promise.all([
      adminDb.doc(`bookings/${bookingId}`).set(updateData, { merge: true }),
      existing.eventId
        ? adminDb.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(eventBookingUpdate, { merge: true })
        : Promise.resolve(),
    ]);

    console.log("[Webhook] ✅ Booking confirmed successfully:", bookingId);
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Critical error:", error);
    return new Response("OK", { status: 200 });
  }
}
