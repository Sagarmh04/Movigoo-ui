// lib/cashfreeWebhookHandler.ts
// Cashfree webhook handler - ONLY source of truth for payment confirmation
// CRITICAL: Uses Admin SDK to bypass Firestore rules
// Architecture: Webhook confirms booking → Email sent separately (decoupled)
//
// PRODUCTION SETUP:
// - Single webhook endpoint: https://www.movigoo.in/api/cashfree/webhook
// - Webhook version: 2025-01-01 (compatible with current payload structure)
// - Events: payment.success
// - Secret: CASHFREE_WEBHOOK_SECRET (from Cashfree Dashboard → Developers → Webhooks)
//
// IDEMPOTENT: Safe to retry - checks if booking already confirmed before updating
// DECOUPLED: No email/analytics in webhook - handled separately via triggers/API

import crypto from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Cashfree Webhook Payload (compatible with 2025-01-01 schema)
// Standard fields that Cashfree sends for payment.success events
type CashfreeWebhookPayload = {
  order_id?: string;
  order_status?: string;
  payment_status?: string;
  order_amount?: number | string;
  order_currency?: string;
  // Additional fields may be present but we only use the above
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
 * Verify Cashfree webhook signature (exact implementation per Cashfree docs)
 * 
 * Algorithm:
 * 1. timestamp := header "x-webhook-timestamp"
 * 2. payload := RAW REQUEST BODY (exact bytes, no parsing)
 * 3. signedPayload := timestamp + "." + payload
 * 4. expectedSignature := Base64Encode(HMAC_SHA256(signedPayload, CASHFREE_WEBHOOK_SECRET))
 * 5. Compare expectedSignature === header "x-webhook-signature"
 */
function verifyCashfreeWebhookSignature(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const { rawBody, timestamp, signature, secret } = args;
  
  // CRITICAL: Construct signedPayload exactly as Cashfree expects
  // Format: timestamp + "." + rawBody (exact string concatenation)
  const signedPayload = timestamp + "." + rawBody;
  
  // CRITICAL: Generate HMAC SHA256 and encode as BASE64 (not hex)
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signedPayload, "utf8");
  const expected = hmac.digest("base64");
  
  // Log for debugging (first 20 chars only for security)
  console.log("[Webhook] Signature verification:", {
    timestamp,
    signedPayloadLength: signedPayload.length,
    signatureReceived: signature.substring(0, 20) + "...",
    signatureExpected: expected.substring(0, 20) + "...",
    rawBodyLength: rawBody.length,
    match: expected === signature,
  });
  
  // CRITICAL: Constant-time comparison to prevent timing attacks
  return constantTimeEquals(expected, signature);
}

function isPaymentSuccess(payload: CashfreeWebhookPayload) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(payload.payment_status)) || success.includes(safeUpper(payload.order_status));
}

export async function handleCashfreeWebhook(req: NextRequest) {
  try {
    // CRITICAL: Read raw body BEFORE any parsing
    // Signature verification requires the EXACT raw body bytes
    // Any modification (JSON parsing, string manipulation) will break signature
    const rawBody = await req.text();

    // CRITICAL: Extract headers exactly as Cashfree sends them (case-sensitive)
    // Cashfree 2025-01-01 uses exact header names:
    // - x-webhook-timestamp
    // - x-webhook-signature
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // Log all headers for debugging (to verify what Cashfree actually sends)
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase().includes("webhook") || key.toLowerCase().includes("signature") || key.toLowerCase().includes("timestamp") || key.toLowerCase().includes("cf-")) {
        allHeaders[key] = value;
      }
    });
    console.log("[Webhook] All request headers:", Object.keys(req.headers).filter(k => 
      k.toLowerCase().includes("webhook") || 
      k.toLowerCase().includes("signature") || 
      k.toLowerCase().includes("timestamp") ||
      k.toLowerCase().includes("cf-")
    ));
    console.log("[Webhook] Signature-related headers:", allHeaders);

    // CRITICAL: Use webhook secret (NOT API secret)
    // Cashfree provides separate webhook secret in Dashboard → Developers → Webhooks
    // This is DIFFERENT from CASHFREE_SECRET_KEY (API secret)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("[Webhook] CASHFREE_WEBHOOK_SECRET not configured", {
        hasWebhookSecret: !!process.env.CASHFREE_WEBHOOK_SECRET,
        hasApiSecret: !!process.env.CASHFREE_SECRET_KEY,
        hint: "Get webhook secret from Cashfree Dashboard → Developers → Webhooks (different from API secret)",
      });
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // CRITICAL: Validate required headers exist
    if (!timestamp || !signature) {
      console.error("[Webhook] Missing required headers", {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        timestampValue: timestamp || "MISSING",
        signatureValue: signature ? signature.substring(0, 20) + "..." : "MISSING",
        allHeaders: Object.keys(allHeaders),
        hint: "Cashfree should send: x-webhook-timestamp and x-webhook-signature headers",
      });
      return new Response("Missing webhook signature headers", { status: 401 });
    }

    // CRITICAL: Log verification attempt (safe - no secrets exposed)
    console.log("[Webhook] Starting signature verification:", {
      timestamp,
      timestampLength: timestamp.length,
      signatureLength: signature.length,
      rawBodyLength: rawBody.length,
      secretLength: webhookSecret.length,
      secretPrefix: webhookSecret.substring(0, 5) + "...",
    });

    // CRITICAL: Verify signature using Cashfree's exact algorithm
    // Algorithm: Base64Encode(HMAC_SHA256(timestamp + "." + rawBody, CASHFREE_WEBHOOK_SECRET))
    const verified = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret: webhookSecret,
    });

    if (!verified) {
      console.error("[Webhook] Signature verification FAILED", {
        timestamp,
        signatureLength: signature.length,
        rawBodyLength: rawBody.length,
        secretKeyLength: webhookSecret.length,
        secretKeyPrefix: webhookSecret.substring(0, 5) + "...",
        hint: "Verify CASHFREE_WEBHOOK_SECRET matches Cashfree Dashboard → Developers → Webhooks → Webhook Secret",
        troubleshooting: [
          "1. Check webhook secret is copied exactly (no spaces, no quotes)",
          "2. Verify secret is from PRODUCTION dashboard (not sandbox)",
          "3. Ensure webhook URL in Cashfree Dashboard matches: https://www.movigoo.in/api/cashfree/webhook",
          "4. Check webhook version is 2025-01-01",
        ],
      });
      return new Response("Invalid webhook signature", { status: 401 });
    }

    console.log("[Webhook] ✅ Signature verification PASSED");

    // Only parse JSON AFTER signature verification
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
    } catch (parseError) {
      console.error("[Webhook] Failed to parse payload JSON:", parseError);
      return new Response("Invalid payload format", { status: 400 });
    }

    console.log("[Webhook] Payload received", {
      order_id: payload.order_id,
      order_status: payload.order_status,
      payment_status: payload.payment_status,
      order_amount: payload.order_amount,
    });

    const orderId = payload.order_id;
    if (!orderId) {
      console.error("[Webhook] Missing order_id in payload");
      return new Response("Invalid payload: missing order_id", { status: 400 });
    }

    // CRITICAL: Check Admin SDK is initialized
    if (!adminDb) {
      console.error("[Webhook] Admin SDK not initialized");
      return new Response("Database error", { status: 500 });
    }

    // CRITICAL: Use Admin SDK to query bookings (bypasses Firestore rules)
    const bookingsRef = adminDb.collection("bookings");
    const snapshot = await bookingsRef.where("orderId", "==", orderId).limit(1).get();

    if (snapshot.empty) {
      console.log("[Webhook] No booking found for orderId:", orderId);
      // Return OK to prevent Cashfree retries
      return new Response("OK", { status: 200 });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const existing = bookingDoc.data() as any;
    
    // CRITICAL: Check if booking data exists (could be corrupted)
    if (!existing) {
      console.error("[Webhook] Booking document exists but data is null/undefined");
      return new Response("Booking data corrupted", { status: 500 });
    }
    
    console.log("[Webhook] Found booking", {
      bookingId,
      currentBookingStatus: existing.bookingStatus,
      currentPaymentStatus: existing.paymentStatus,
    });

    // Amount validation
    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof payload.order_amount === "number" ? payload.order_amount : Number(payload.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      console.error("[Webhook] Amount mismatch", {
        expected: expectedAmount,
        received: receivedAmount,
      });
      return new Response("Amount mismatch", { status: 400 });
    }

    // CRITICAL: Idempotency check - skip if already confirmed
    // This makes webhook safe to retry (Cashfree may retry on timeout/error)
    // If booking already confirmed, return OK immediately (don't process again)
    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    const success = isPaymentSuccess(payload);

    console.log("[Webhook] Payment check", {
      success,
      alreadyConfirmed,
      payment_status: payload.payment_status,
      order_status: payload.order_status,
    });

    if (success) {
      // CRITICAL: Idempotent - if already confirmed, return OK immediately
      // Prevents duplicate processing if Cashfree retries webhook
      if (alreadyConfirmed) {
        console.log("[Webhook] Booking already confirmed, skipping (idempotent - safe retry)");
        return new Response("OK", { status: 200 });
      }

      console.log("[Webhook] Confirming booking:", bookingId);

      const ticketId = existing.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

      // CRITICAL: Booking confirmation data ONLY
      // No email sending here - that's decoupled
      const updateData = {
        orderId,
        paymentGateway: "cashfree",
        paymentStatus: "SUCCESS",
        bookingStatus: "CONFIRMED",
        ticketId,
        confirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        webhookReceivedAt: FieldValue.serverTimestamp(),
        // NOTE: Email will be sent separately via trigger or API call
        // This keeps booking confirmation independent of email delivery
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

      // CRITICAL: Use Admin SDK for all writes (bypasses Firestore rules)
      const bookingRef = adminDb.doc(`bookings/${bookingId}`);
      
      await Promise.all([
        bookingRef.set(updateData, { merge: true }),
        existing.eventId
          ? adminDb.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(eventBookingUpdate, { merge: true })
          : Promise.resolve(),
      ]);

      // NOTE: Analytics and email are decoupled
      // Analytics can be updated via Firestore trigger or separate API
      // Email can be sent via Firestore trigger or separate API call
      // This keeps webhook fast and focused on booking confirmation only

      console.log("[Webhook] Booking confirmed successfully:", bookingId);
      return new Response("OK", { status: 200 });
    }

    // Payment failed - update booking status
    console.log("[Webhook] Payment failed, updating booking status");

    const updateData = {
      orderId,
      paymentGateway: "cashfree",
      paymentStatus: "FAILED",
      bookingStatus: "CANCELLED",
      updatedAt: FieldValue.serverTimestamp(),
      webhookReceivedAt: FieldValue.serverTimestamp(),
      failureReason: payload.payment_status || payload.order_status || "UNKNOWN",
    };

    // CRITICAL: Ensure adminDb is available (already checked above, but TypeScript needs this)
    if (!adminDb) {
      console.error("[Webhook] Admin SDK not available for payment failure handling");
      return new Response("Database error", { status: 500 });
    }

    // Capture adminDb in const for TypeScript (non-null assertion safe here)
    const db = adminDb;
    const bookingRef = db.doc(`bookings/${bookingId}`);
    
    // CRITICAL: If payment fails, decrement ticketType-level ticketsSold to release reservation
    // This ensures tickets are available again if payment fails
    if (existing.eventId && existing.items && Array.isArray(existing.items) && existing.items.length > 0) {
      const eventRef = db.doc(`events/${existing.eventId}`);
      
      try {
        // Use transaction to atomically decrement ticketType counters and update booking
        await db.runTransaction(async (transaction) => {
          // Read event document to get ticketTypes structure
          const eventDoc = await transaction.get(eventRef);
          if (!eventDoc.exists) {
            throw new Error("Event not found");
          }

          const eventData = eventDoc.data();
          const tickets = eventData?.tickets || {};
          const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

          if (venueConfigs.length === 0) {
            // No ticket types - just update booking status
            transaction.set(bookingRef, updateData, { merge: true });
            if (existing.eventId) {
              const eventBookingRef = db.doc(`events/${existing.eventId}/bookings/${bookingId}`);
              transaction.set(eventBookingRef, updateData, { merge: true });
            }
            return;
          }

          // Build ticketType map
          const ticketTypeMap = new Map<string, { venueConfigIndex: number; ticketTypeIndex: number }>();
          for (let vcIdx = 0; vcIdx < venueConfigs.length; vcIdx++) {
            const venueConfig = venueConfigs[vcIdx];
            const ticketTypes = Array.isArray(venueConfig.ticketTypes) ? venueConfig.ticketTypes : [];
            for (let ttIdx = 0; ttIdx < ticketTypes.length; ttIdx++) {
              const ticketType = ticketTypes[ttIdx];
              if (ticketType.id) {
                ticketTypeMap.set(ticketType.id, { venueConfigIndex: vcIdx, ticketTypeIndex: ttIdx });
              }
            }
          }

          // Decrement ticketsSold for each ticketType in booking items
          const updatedVenueConfigs = [...venueConfigs];
          let decrementsApplied = 0;

          for (const item of existing.items) {
            if (!item.ticketTypeId || typeof item.quantity !== "number" || item.quantity <= 0) continue;
            
            const ticketTypeInfo = ticketTypeMap.get(item.ticketTypeId);
            if (!ticketTypeInfo) {
              console.warn("[Webhook] Ticket type not found for decrement:", item.ticketTypeId);
              continue;
            }

            const venueConfig = updatedVenueConfigs[ticketTypeInfo.venueConfigIndex];
            const ticketTypes = [...(venueConfig.ticketTypes || [])];
            const ticketType = { ...ticketTypes[ticketTypeInfo.ticketTypeIndex] };
            
            // Decrement ticketsSold (ensure it doesn't go below 0)
            const currentTicketsSold = typeof ticketType.ticketsSold === "number" ? ticketType.ticketsSold : 0;
            ticketType.ticketsSold = Math.max(0, currentTicketsSold - item.quantity);
            
            ticketTypes[ticketTypeInfo.ticketTypeIndex] = ticketType;
            venueConfig.ticketTypes = ticketTypes;
            updatedVenueConfigs[ticketTypeInfo.venueConfigIndex] = venueConfig;
            decrementsApplied++;
          }

          // Write updated tickets structure back
          if (decrementsApplied > 0) {
            transaction.update(eventRef, {
              tickets: {
                ...tickets,
                venueConfigs: updatedVenueConfigs
              }
            });
            console.log("[Webhook] Payment failed - released ticketType reservations:", decrementsApplied, "ticketType(s)");
          }
          
          // Update booking status
          transaction.set(bookingRef, updateData, { merge: true });
          
          // Update event booking subcollection if exists
          if (existing.eventId) {
            const eventBookingRef = db.doc(`events/${existing.eventId}/bookings/${bookingId}`);
            transaction.set(eventBookingRef, updateData, { merge: true });
          }
        });
      } catch (error) {
        // If transaction fails, still update booking status (non-blocking)
        console.error("[Webhook] Failed to decrement ticketType ticketsSold counters:", error);
        await Promise.all([
          bookingRef.set(updateData, { merge: true }),
          existing.eventId
            ? db.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(updateData, { merge: true })
            : Promise.resolve(),
        ]);
      }
    } else {
      // No eventId or items - just update booking status
      await Promise.all([
        bookingRef.set(updateData, { merge: true }),
        existing.eventId
          ? db.doc(`events/${existing.eventId}/bookings/${bookingId}`).set(updateData, { merge: true })
          : Promise.resolve(),
      ]);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    // Log error but still return OK to prevent Cashfree retries
    console.error("[Webhook] Critical error:", error);
    console.error("[Webhook] Error stack:", error?.stack);
    // Still return OK to prevent Cashfree retries
    return new Response("OK", { status: 200 });
  }
}
