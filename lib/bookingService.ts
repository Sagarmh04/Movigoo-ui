// lib/bookingService.ts
// Client-side booking service using Firebase Firestore directly

import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { v4 as uuidv4 } from "uuid";

export type TicketSelection = {
  ticketTypeId: string;
  ticketName: string;
  quantity: number;
  price: number;
};

export type BookingData = {
  userId: string;
  eventId: string;
  eventTitle: string;
  coverUrl: string;
  venueName: string;
  date: string;
  time: string;
  ticketType: string;
  quantity: number;
  price: number;
  bookingFee: number;
  totalAmount: number;
  createdAt: any; // Firestore timestamp
  qrCodeData: string;
};

const BOOKING_FEE_PER_TICKET = 7; // ₹7 per ticket

/**
 * Calculate booking totals
 */
export function calculateBookingTotals(tickets: TicketSelection[]): {
  subtotal: number;
  bookingFee: number;
  total: number;
} {
  const subtotal = tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const bookingFee = totalTickets * BOOKING_FEE_PER_TICKET;
  const total = subtotal + bookingFee;

  return { subtotal, bookingFee, total };
}

/**
 * Create booking in Firestore
 */
export async function createBooking(
  userId: string,
  eventId: string,
  eventData: {
    title: string;
    coverUrl: string;
    venue: string;
    date: string;
    time: string;
  },
  tickets: TicketSelection[]
): Promise<{ bookingId: string; qrCodeData: string }> {
  if (!db) {
    throw new Error("Firebase not initialized");
  }

  // Calculate totals
  const { subtotal, bookingFee, total } = calculateBookingTotals(tickets);

  // Generate unique QR code data
  const qrCodeData = `MOV-${uuidv4().toUpperCase().replace(/-/g, "")}`;

  // Prepare booking data
  const bookingData: BookingData = {
    userId,
    eventId,
    eventTitle: eventData.title,
    coverUrl: eventData.coverUrl,
    venueName: eventData.venue,
    date: eventData.date,
    time: eventData.time,
    ticketType: tickets.map((t) => `${t.ticketName} (${t.quantity})`).join(", "),
    quantity: tickets.reduce((sum, t) => sum + t.quantity, 0),
    price: subtotal,
    bookingFee,
    totalAmount: total,
    createdAt: serverTimestamp(),
    qrCodeData,
  };

  // Save to Firestore at bookings/{bookingId}
  const bookingsRef = collection(db, "bookings");
  const docRef = await addDoc(bookingsRef, bookingData);

  return {
    bookingId: docRef.id,
    qrCodeData,
  };
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingData | null> {
  if (!db) {
    throw new Error("Firebase not initialized");
  }

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingDoc = await getDoc(bookingRef);

  if (!bookingDoc.exists()) {
    return null;
  }

  return {
    ...bookingDoc.data(),
    createdAt: bookingDoc.data().createdAt,
  } as BookingData;
}

/**
 * Get user bookings
 */
export async function getUserBookings(userId: string): Promise<BookingData[]> {
  if (!db) {
    throw new Error("Firebase not initialized");
  }

  const { query, where, getDocs, orderBy } = await import("firebase/firestore");
  const bookingsRef = collection(db, "bookings");
  const q = query(
    bookingsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    createdAt: doc.data().createdAt,
  })) as BookingData[];
}

