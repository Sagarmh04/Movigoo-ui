import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { verifyAuthToken } from "@/lib/auth";
import { maybeSendBookingConfirmationEmail } from "@/lib/bookingConfirmationEmail";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export const runtime = "nodejs";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

function isSuccessStatus(status: string) {
  const success = ["SUCCESS", "PAID", "PAYMENT_SUCCESS", "COMPLETED", "SUCCESSFUL"];
  return success.includes(safeUpper(status));
}

function isFailureStatus(status: string) {
  const failed = ["FAILED", "FAILURE", "CANCELLED", "CANCELED", "PAYMENT_FAILED"];
  return failed.includes(safeUpper(status));
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const user = await verifyAuthToken(token);
    if (!user?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      return NextResponse.json({ error: "Cashfree not configured" }, { status: 500 });
    }

    const bookingsRef = collection(db, "bookings");
    let docsToProcess: Array<{ id: string; data: any }> = [];

    try {
      const q = query(
        bookingsRef,
        where("userId", "==", user.uid),
        where("paymentStatus", "==", "INITIATED"),
        limit(25)
      );

      const snapshot = await getDocs(q);
      docsToProcess = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
    } catch (indexError: any) {
      if (indexError?.code === "failed-precondition" || indexError?.message?.includes("index")) {
        const q = query(bookingsRef, where("userId", "==", user.uid), limit(50));
        const snapshot = await getDocs(q);
        docsToProcess = snapshot.docs
          .map((d) => ({ id: d.id, data: d.data() }))
          .filter((d) => d.data?.paymentStatus === "INITIATED");
      } else {
        throw indexError;
      }
    }

    if (docsToProcess.length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    let updated = 0;

    for (const bookingDoc of docsToProcess) {
      const bookingId = bookingDoc.id;
      const booking = bookingDoc.data as any;

      const existingBookingStatus = safeUpper(booking.bookingStatus);
      const existingPaymentStatus = safeUpper(booking.paymentStatus);
      if (existingBookingStatus === "CONFIRMED" && existingPaymentStatus === "SUCCESS") {
        continue;
      }

      const orderId = booking.orderId;
      if (!orderId || typeof orderId !== "string") {
        continue;
      }

      const orderStatusUrl = `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`;
      const response = await fetch(orderStatusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      });

      const orderData = await response.json();
      if (!response.ok) {
        continue;
      }

      const statusRaw = (orderData.payment_status || orderData.order_status || orderData.status || "") as string;
      const receivedAmount = Number(orderData.order_amount);
      const expectedAmount = Number(booking.totalAmount);
      if (Number.isFinite(receivedAmount) && Number.isFinite(expectedAmount) && receivedAmount !== expectedAmount) {
        continue;
      }

      if (isSuccessStatus(statusRaw)) {
        const ticketId = booking.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
        const updateData = {
          orderId,
          paymentGateway: "cashfree",
          paymentStatus: "SUCCESS",
          bookingStatus: "CONFIRMED",
          ticketId,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          reconciledAt: serverTimestamp(),
        };

        await Promise.all([
          setDoc(doc(db, "bookings", bookingId), updateData, { merge: true }),
          booking.eventId
            ? setDoc(doc(db, "events", booking.eventId, "bookings", bookingId), updateData, { merge: true })
            : Promise.resolve(),
        ]);

        await maybeSendBookingConfirmationEmail({
          firestore: db,
          bookingId,
          eventId: booking.eventId || null,
        });

        updated += 1;
        continue;
      }

      if (isFailureStatus(statusRaw)) {
        const updateData = {
          orderId,
          paymentGateway: "cashfree",
          paymentStatus: "FAILED",
          bookingStatus: "CANCELLED",
          updatedAt: serverTimestamp(),
          reconciledAt: serverTimestamp(),
          failureReason: statusRaw,
        };

        await Promise.all([
          setDoc(doc(db, "bookings", bookingId), updateData, { merge: true }),
          booking.eventId
            ? setDoc(doc(db, "events", booking.eventId, "bookings", bookingId), updateData, { merge: true })
            : Promise.resolve(),
        ]);

        updated += 1;
      }
    }

    return NextResponse.json({ ok: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
