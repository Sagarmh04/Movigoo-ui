// app/api/cashfree/webhook/route.ts
// POST /api/cashfree/webhook
// Cashfree webhook handler - API verification (bulletproof)

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// 🔒 MANDATORY: Force Node.js runtime
export const runtime = "nodejs";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

async function verifyOrderWithCashfree(orderId: string) {
  if (!adminDb) {
    console.error("[Webhook] Admin SDK not initialized");
    return;
  }

  const res = await fetch(
    `${process.env.CASHFREE_BASE_URL}/pg/orders/${orderId}`,
    {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
    }
  );

  const data = await res.json();

  if (data.order_status === "PAID") {
    // ✅ Confirm booking (idempotent)
    const bookingsRef = adminDb.collection("bookings");
    const snapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

    if (snapshot.empty) {
      console.log("[Webhook] No booking found for orderId:", orderId);
      return;
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const existing = bookingDoc.data() as any;

    // Idempotency check
    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    
    if (alreadyConfirmed) {
      console.log("[Webhook] Already confirmed - skipping");
      return;
    }

    // Amount validation
    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof data.order_amount === "number" ? data.order_amount : Number(data.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      console.error("[Webhook] Amount mismatch - ignoring");
      return;
    }

    // Confirm booking
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

    // Update using Admin SDK
    await Promise.all([
      adminDb.doc(`bookings/${bookingId}`).set(updateData, { merge: true }),
      existing.eventId
        ? adminDb.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(eventBookingUpdate, { merge: true })
        : Promise.resolve(),
    ]);

    console.log("[Webhook] ✅ Booking confirmed successfully:", bookingId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const orderId =
      payload?.data?.order?.order_id ||
      payload?.order_id;

    if (!orderId) {
      console.log("[Webhook] No orderId in payload");
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] Processing webhook for orderId:", orderId);

    // 🔒 VERIFY WITH CASHFREE SERVERS (SOURCE OF TRUTH)
    await verifyOrderWithCashfree(orderId);

    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("[Webhook] Error", e);
    return new Response("OK", { status: 200 });
  }
}
