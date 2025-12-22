// lib/createBooking.ts
// Secure server-side booking creation

import { db } from "@/lib/firebaseServer";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import type { PriceCalculation } from "./priceCalculator";

export type BookingData = {
  eventId: string;
  eventName: string;
  userId: string;
  ticketType: string;
  quantity: number;
  ticketPrice: number;
  bookingFee: number;
  totalAmount: number;
  eventDate: string;
  eventTime: string;
  venue: string;
  qrToken: string;
  paymentStatus: "pending" | "confirmed" | "failed";
  paymentSessionId?: string;
};

export async function createBooking(
  userId: string,
  eventId: string,
  priceCalculation: PriceCalculation,
  paymentSessionId: string
): Promise<{ bookingId: string; qrToken: string }> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  // Fetch event details for booking
  const { doc: firestoreDoc, getDoc } = await import("firebase/firestore");
  const eventRef = firestoreDoc(db, "events", eventId);
  const eventDoc = await getDoc(eventRef);

  if (!eventDoc.exists()) {
    throw new Error("Event not found");
  }

  const eventData = eventDoc.data();
  const basic = eventData.basicDetails || {};
  const schedule = eventData.schedule || {};

  // Extract date/time from schedule
  const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
  const firstLocation = locations[0] || {};
  const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
  const firstVenue = venues[0] || {};
  const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
  const firstDate = dates[0] || {};
  const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
  const firstShow = shows[0] || {};

  // Format date and time
  const eventDate = firstDate.date || new Date().toISOString().split("T")[0];
  const eventTime = firstShow.startTime || "00:00";

  // Generate secure QR token
  const qrToken = `MOV-${uuidv4().toUpperCase().replace(/-/g, "")}`;

  // Prepare booking data
  const bookingData: BookingData = {
    eventId,
    eventName: basic.title || "Untitled Event",
    userId,
    ticketType: priceCalculation.tickets.map((t) => `${t.ticketName} (${t.quantity})`).join(", "),
    quantity: priceCalculation.tickets.reduce((sum, t) => sum + t.quantity, 0),
    ticketPrice: priceCalculation.subtotal,
    bookingFee: priceCalculation.bookingFee,
    totalAmount: priceCalculation.total,
    eventDate,
    eventTime,
    venue: firstVenue.name || "TBA",
    qrToken,
    paymentStatus: "confirmed",
    paymentSessionId,
  };

  // Save to Firestore at /bookings/{bookingId} (users subcollections are for host users only)
  const bookingsRef = collection(db, "bookings");
  const docRef = await addDoc(bookingsRef, {
    ...bookingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    bookingId: docRef.id,
    qrToken,
  };
}

