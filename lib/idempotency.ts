// lib/idempotency.ts
// Server-side idempotency to prevent duplicate bookings

import { db } from "@/lib/firebaseServer";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const IDEMPOTENCY_TTL = 5 * 60 * 1000; // 5 minutes

export type IdempotencyKey = string;

export async function checkIdempotency(
  key: IdempotencyKey
): Promise<{ exists: boolean; result?: any }> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  try {
    const idempotencyRef = doc(db, "idempotency", key);
    const snapshot = await getDoc(idempotencyRef);

    if (!snapshot.exists()) {
      return { exists: false };
    }

    const data = snapshot.data();
    const createdAt = data.createdAt?.toMillis() || 0;
    const now = Date.now();

    // Check if idempotency key has expired
    if (now - createdAt > IDEMPOTENCY_TTL) {
      return { exists: false };
    }

    return { exists: true, result: data.result };
  } catch (error) {
    console.error("Idempotency check error:", error);
    throw new Error("Failed to check idempotency");
  }
}

export async function saveIdempotencyResult(
  key: IdempotencyKey,
  result: any
): Promise<void> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  try {
    const idempotencyRef = doc(db, "idempotency", key);
    await setDoc(
      idempotencyRef,
      {
        result,
        createdAt: serverTimestamp(),
      },
      { merge: false }
    );
  } catch (error) {
    console.error("Idempotency save error:", error);
    throw new Error("Failed to save idempotency result");
  }
}

export function generateIdempotencyKey(userId: string, eventId: string, ticketTypeId: string, quantity: number): IdempotencyKey {
  return `${userId}-${eventId}-${ticketTypeId}-${quantity}-${Date.now()}`;
}

