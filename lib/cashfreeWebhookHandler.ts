import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/firebaseServer";
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

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
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as CashfreeWebhookPayload;

    const orderId = payload.order_id;
    if (!orderId) {
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
      return new Response("OK", { status: 200 });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingId = bookingDoc.id;
    const existing = bookingDoc.data() as any;

    const expectedAmount = typeof existing.totalAmount === "number" ? existing.totalAmount : Number(existing.totalAmount);
    const receivedAmount = typeof payload.order_amount === "number" ? payload.order_amount : Number(payload.order_amount);

    if (Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) && expectedAmount !== receivedAmount) {
      return new Response("Amount mismatch", { status: 400 });
    }

    const alreadyConfirmed = safeUpper(existing.bookingStatus) === "CONFIRMED" && safeUpper(existing.paymentStatus) === "SUCCESS";
    const success = isPaymentSuccess(payload);

    if (success) {
      if (alreadyConfirmed) {
        return new Response("OK", { status: 200 });
      }

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

      try {
        const userEmail = existing.userEmail || existing.email || null;
        if (userEmail) {
          const userName = existing.userName || existing.name || "Guest User";
          const eventDate = existing.date || existing.eventDate || new Date().toISOString().split("T")[0];

          let formattedEventDate: string;
          try {
            const eventDateObj = new Date(eventDate);
            formattedEventDate = !isNaN(eventDateObj.getTime())
              ? eventDateObj.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : eventDate;
          } catch {
            formattedEventDate = eventDate;
          }

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
          const ticketLink = `${appUrl}/my-bookings?bookingId=${bookingId}`;

          const showTime = existing.showTime || existing.time || null;
          const showEndTime = existing.showEndTime || null;
          const eventTime = showTime ? (showEndTime ? `${showTime} - ${showEndTime}` : showTime) : undefined;

          const venueName = existing.venueName || existing.venue || "TBA";
          const venueAddress = existing.venueAddress || null;
          const venueDisplay = venueAddress ? `${venueName}, ${venueAddress}` : venueName;

          await sendTicketEmail({
            to: userEmail,
            name: userName,
            eventName: existing.eventTitle || "Event",
            eventDate: formattedEventDate,
            eventTime,
            venue: venueDisplay,
            ticketQty: existing.quantity || 1,
            bookingId,
            ticketLink,
          });
        }
      } catch {
        // ignore email errors
      }

      return new Response("OK", { status: 200 });
    }

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
    await Promise.all([
      setDoc(bookingRef, updateData, { merge: true }),
      existing.eventId
        ? setDoc(doc(firestore, "events", existing.eventId, "bookings", bookingId), updateData, { merge: true })
        : Promise.resolve(),
    ]);

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("OK", { status: 200 });
  }
}
