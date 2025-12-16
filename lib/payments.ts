// lib/payments.ts
// Payment session management

import { db } from "@/lib/firebaseServer";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import type { PriceCalculation } from "./priceCalculator";

export type PaymentSession = {
  id: string;
  userId: string;
  eventId: string;
  ticketSelections: { ticketTypeId: string; quantity: number }[];
  amount: number;
  priceCalculation: PriceCalculation;
  status: "pending" | "completed" | "failed";
  idempotencyKey: string;
  createdAt: Date;
  expiresAt: Date;
};

const SESSION_TTL = 15 * 60 * 1000; // 15 minutes

export async function createPaymentSession(
  userId: string,
  eventId: string,
  ticketSelections: { ticketTypeId: string; quantity: number }[],
  priceCalculation: PriceCalculation,
  idempotencyKey: string
): Promise<PaymentSession> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL);

  const session: PaymentSession = {
    id: sessionId,
    userId,
    eventId,
    ticketSelections,
    amount: priceCalculation.total,
    priceCalculation,
    status: "pending",
    idempotencyKey,
    createdAt: now,
    expiresAt,
  };

  // Store session in Firestore
  const sessionsRef = collection(db, "paymentSessions");
  await addDoc(sessionsRef, {
    ...session,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt.toISOString(),
  });

  return session;
}

export async function getPaymentSession(sessionId: string): Promise<PaymentSession | null> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  try {
    // Query payment sessions by ID
    const sessionsRef = collection(db, "paymentSessions");
    const { query, where, getDocs } = await import("firebase/firestore");
    const q = query(sessionsRef, where("id", "==", sessionId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if session expired
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date();
    if (new Date() > expiresAt) {
      return null;
    }

    return {
      id: data.id,
      userId: data.userId,
      eventId: data.eventId,
      ticketSelections: data.ticketSelections,
      amount: data.amount,
      priceCalculation: data.priceCalculation,
      status: data.status,
      idempotencyKey: data.idempotencyKey,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: expiresAt,
    };
  } catch (error) {
    console.error("Error fetching payment session:", error);
    return null;
  }
}

export async function markPaymentSessionCompleted(sessionId: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  try {
    const sessionsRef = collection(db, "paymentSessions");
    const { query: firestoreQuery, where, getDocs, updateDoc, serverTimestamp: serverTS } = await import("firebase/firestore");
    const q = firestoreQuery(sessionsRef, where("id", "==", sessionId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: "completed",
        updatedAt: serverTS(),
      });
    }
  } catch (error) {
    console.error("Error updating payment session:", error);
    throw new Error("Failed to update payment session");
  }
}

