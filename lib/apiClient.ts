// lib/apiClient.ts
// Client-side API utilities for secure booking flow

import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebaseClient";

export type TicketSelection = {
  ticketTypeId: string;
  quantity: number;
};

export type PaymentInitiateResponse = {
  success: boolean;
  sessionId: string;
  amount: number;
  priceCalculation: {
    subtotal: number;
    bookingFee: number;
    total: number;
    tickets: Array<{
      ticketTypeId: string;
      ticketName: string;
      price: number;
      quantity: number;
    }>;
  };
  payuPayload: any;
};

export type PaymentVerifyResponse = {
  success: boolean;
  bookingId: string;
  qrToken: string;
  eventId: string;
};

/**
 * Get Firebase ID token for authenticated requests
 */
async function getIdToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
}

/**
 * Initiate payment session
 */
export async function initiatePayment(
  eventId: string,
  ticketSelections: TicketSelection[]
): Promise<PaymentInitiateResponse> {
  const token = await getIdToken();
  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch("/api/payments/initiate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      eventId,
      ticketSelections,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to initiate payment");
  }

  return response.json();
}

/**
 * Verify payment and create booking
 */
export async function verifyPayment(
  paymentSessionId: string,
  paymentResponse?: any
): Promise<PaymentVerifyResponse> {
  const token = await getIdToken();
  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch("/api/payments/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      paymentSessionId,
      paymentResponse,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to verify payment");
  }

  return response.json();
}

/**
 * Lookup user bookings
 */
export async function lookupBookings(limit: number = 50): Promise<any[]> {
  const token = await getIdToken();
  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch("/api/bookings/lookup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ limit }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch bookings");
  }

  const data = await response.json();
  return data.bookings || [];
}

