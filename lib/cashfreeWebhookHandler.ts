import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/firebaseServer";
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where, runTransaction, increment } from "firebase/firestore";
import { maybeSendBookingConfirmationEmail } from "@/lib/bookingConfirmationEmail";
import { updateAnalyticsOnBookingConfirmation } from "@/lib/analyticsUpdate";

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

function verifyCashfreeWebhookSignature(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const { rawBody, timestamp, signature, secret } = args;
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64");
  return constantTimeEquals(expected, signature);
}

function isPaymentSuccess(payload: CashfreeWebhookPayload) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(payload.payment_status)) || success.includes(safeUpper(payload.order_status));
}

export async function handleCashfreeWebhook(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    if (!process.env.CASHFREE_SECRET_KEY) {
      return new Response("Webhook not configured", { status: 500 });
    }

    if (!timestamp || !signature) {
      return new Response("Missing webhook signature headers", { status: 401 });
    }

    const verified = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret: process.env.CASHFREE_SECRET_KEY,
    });

    if (!verified) {
      console.error("[Webhook] Signature verification failed");
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
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

    if (!db) {
      return new Response("Database error", { status: 500 });
    }

    const firestore = db;

    const bookingsRef = collection(firestore, "bookings");
    const q = query(bookingsRef, where("orderId", "==", orderId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("[Webhook] No booking found for orderId:", orderId);
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

    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof payload.order_amount === "number" ? payload.order_amount : Number(payload.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      return new Response("Amount mismatch", { status: 400 });
    }

    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    const success = isPaymentSuccess(payload);

    console.log("[Webhook] Payment check", {
      success,
      alreadyConfirmed,
      payment_status: payload.payment_status,
      order_status: payload.order_status,
    });

    if (success) {
      if (alreadyConfirmed) {
        console.log("[Webhook] Booking already confirmed, skipping");
        return new Response("OK", { status: 200 });
      }

      console.log("[Webhook] Confirming booking:", bookingId);

      const ticketId = existing.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

      const updateData = {
        orderId,
        paymentGateway: "cashfree",
        paymentStatus: "SUCCESS",
        bookingStatus: "CONFIRMED",
        ticketId,
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        webhookReceivedAt: serverTimestamp(),
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

      const bookingRef = doc(firestore, "bookings", bookingId);

      await Promise.all([
        setDoc(bookingRef, updateData, { merge: true }),
        existing.eventId
          ? setDoc(doc(firestore, "events", existing.eventId, "bookings", bookingId), eventBookingUpdate, { merge: true })
          : Promise.resolve(),
      ]);

      // Update analytics (non-blocking - failures are logged but don't affect booking confirmation)
      if (existing.eventId && existing.quantity && existing.totalAmount) {
        // Extract date from booking (could be in 'date' field or parsed from dateTimeKey)
        let bookingDate: string | null = existing.date || null;
        if (!bookingDate && existing.dateTimeKey) {
          // dateTimeKey format: "yyyy-mm-dd_HH:mm"
          const datePart = existing.dateTimeKey.split("_")[0];
          if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            bookingDate = datePart;
          }
        }

        updateAnalyticsOnBookingConfirmation(firestore, {
          eventId: existing.eventId,
          quantity: typeof existing.quantity === "number" ? existing.quantity : 0,
          totalAmount: typeof existing.totalAmount === "number" ? existing.totalAmount : 0,
          locationId: existing.locationId || null,
          venueId: existing.venueId || null,
          date: bookingDate,
          showId: existing.showId || null,
        }).catch((error) => {
          // Analytics failure must NEVER block booking confirmation
          // Error is already logged in updateAnalyticsOnBookingConfirmation
          console.error("[Webhook] Analytics update failed (non-fatal):", error);
        });
      }

      await maybeSendBookingConfirmationEmail({
        firestore,
        bookingId,
        eventId: existing.eventId || null,
      });

      console.log("[Webhook] Booking confirmed successfully:", bookingId);
      return new Response("OK", { status: 200 });
    }

    console.log("[Webhook] Payment failed, updating booking status");

    const updateData = {
      orderId,
      paymentGateway: "cashfree",
      paymentStatus: "FAILED",
      bookingStatus: "CANCELLED",
      updatedAt: serverTimestamp(),
      webhookReceivedAt: serverTimestamp(),
      failureReason: payload.payment_status || payload.order_status || "UNKNOWN",
    };

    const bookingRef = doc(firestore, "bookings", bookingId);
    
    // CRITICAL: If payment fails, decrement ticketType-level ticketsSold to release reservation
    // This ensures tickets are available again if payment fails
    // PRODUCTION-READY: Decrement at ticketType level (not event level)
    if (existing.eventId && existing.items && Array.isArray(existing.items) && existing.items.length > 0) {
      const eventRef = doc(firestore, "events", existing.eventId);
      
      // Use transaction to atomically decrement ticketType counters and update booking
      try {
        await runTransaction(firestore, async (transaction) => {
          // Read event document to get ticketTypes structure
          const eventDoc = await transaction.get(eventRef);
          if (!eventDoc.exists()) {
            throw new Error("Event not found");
          }

          const eventData = eventDoc.data();
          const tickets = eventData.tickets || {};
          const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

          if (venueConfigs.length === 0) {
            // No ticket types - just update booking status
            transaction.set(bookingRef, updateData, { merge: true });
            if (existing.eventId) {
              const eventBookingRef = doc(firestore, "events", existing.eventId, "bookings", bookingId);
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
            const eventBookingRef = doc(firestore, "events", existing.eventId, "bookings", bookingId);
            transaction.set(eventBookingRef, updateData, { merge: true });
          }
        });
      } catch (error) {
        // If transaction fails, still update booking status (non-blocking)
        console.error("[Webhook] Failed to decrement ticketType ticketsSold counters:", error);
        await Promise.all([
          setDoc(bookingRef, updateData, { merge: true }),
          existing.eventId
            ? setDoc(doc(firestore, "events", existing.eventId, "bookings", bookingId), updateData, { merge: true })
            : Promise.resolve(),
        ]);
      }
    } else {
      // No eventId or items - just update booking status
      await Promise.all([
        setDoc(bookingRef, updateData, { merge: true }),
        existing.eventId
          ? setDoc(doc(firestore, "events", existing.eventId, "bookings", bookingId), updateData, { merge: true })
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
