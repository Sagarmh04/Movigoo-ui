import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { verifyAuthToken } from "@/lib/auth";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

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
      return NextResponse.json({ 
        ok: true, 
        checked: 0,
        note: "Webhook will confirm payment if successful"
      });
    }

    const statusChecks: Array<{
      bookingId: string;
      gatewayStatus: "PAID" | "UNPAID" | "PENDING" | "UNKNOWN";
      bookingStatus: string;
    }> = [];

    for (const bookingDoc of docsToProcess) {
      const bookingId = bookingDoc.id;
      const booking = bookingDoc.data as any;

      const existingBookingStatus = safeUpper(booking.bookingStatus);
      const existingPaymentStatus = safeUpper(booking.paymentStatus);
      
      // Skip if already confirmed
      if (existingBookingStatus === "CONFIRMED" && existingPaymentStatus === "SUCCESS") {
        statusChecks.push({
          bookingId,
          gatewayStatus: "PAID",
          bookingStatus: booking.bookingStatus || "CONFIRMED",
        });
        continue;
      }

      const orderId = booking.orderId;
      if (!orderId || typeof orderId !== "string") {
        statusChecks.push({
          bookingId,
          gatewayStatus: "UNKNOWN",
          bookingStatus: booking.bookingStatus || "PENDING",
        });
        continue;
      }

      try {
        const orderStatusUrl = `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`;
        const response = await fetchWithTimeout(orderStatusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": process.env.CASHFREE_APP_ID,
            "x-client-secret": process.env.CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01",
          },
          timeoutMs: 8000,
        });

        if (!response.ok) {
          statusChecks.push({
            bookingId,
            gatewayStatus: "UNKNOWN",
            bookingStatus: booking.bookingStatus || "PENDING",
          });
          continue;
        }

        const orderData = await response.json();
        const statusRaw = (orderData.payment_status || orderData.order_status || orderData.status || "") as string;
        const receivedAmount = Number(orderData.order_amount);
        const expectedAmount = Number(booking.totalAmount);
        
        // Amount mismatch indicates potential issue
        if (Number.isFinite(receivedAmount) && Number.isFinite(expectedAmount) && receivedAmount !== expectedAmount) {
          statusChecks.push({
            bookingId,
            gatewayStatus: "UNKNOWN",
            bookingStatus: booking.bookingStatus || "PENDING",
          });
          continue;
        }

        let gatewayStatus: "PAID" | "UNPAID" | "PENDING" | "UNKNOWN" = "UNKNOWN";
        if (isSuccessStatus(statusRaw)) {
          gatewayStatus = "PAID";
        } else if (isFailureStatus(statusRaw)) {
          gatewayStatus = "UNPAID";
        } else {
          gatewayStatus = "PENDING";
        }

        statusChecks.push({
          bookingId,
          gatewayStatus,
          bookingStatus: booking.bookingStatus || "PENDING",
        });
      } catch (error) {
        // If Cashfree API call fails, return unknown status
        statusChecks.push({
          bookingId,
          gatewayStatus: "UNKNOWN",
          bookingStatus: booking.bookingStatus || "PENDING",
        });
      }
    }

    return NextResponse.json({ 
      ok: true, 
      checked: statusChecks.length,
      bookings: statusChecks,
      note: "Webhook will confirm payment if successful. This endpoint is read-only."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
