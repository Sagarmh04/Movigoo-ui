// lib/priceCalculator.ts
// Server-side price calculation - NEVER trust client values

import { db } from "@/lib/firebaseServer";
import { doc, getDoc } from "firebase/firestore";

const BOOKING_FEE_PER_TICKET = 7; // ₹7 per ticket

export type TicketPriceInfo = {
  ticketTypeId: string;
  ticketName: string;
  price: number;
  quantity: number;
};

export type PriceCalculation = {
  tickets: TicketPriceInfo[];
  subtotal: number;
  bookingFee: number;
  total: number;
};

export async function calculateBookingPrice(
  eventId: string,
  ticketSelections: { ticketTypeId: string; quantity: number }[]
): Promise<PriceCalculation> {
  if (!db) {
    throw new Error("Firebase not configured");
  }

  // Fetch event from Firestore
  const eventRef = doc(db, "events", eventId);
  const eventDoc = await getDoc(eventRef);

  if (!eventDoc.exists()) {
    throw new Error("Event not found");
  }

  const eventData = eventDoc.data();
  const tickets = eventData.tickets || {};
  const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

  // Extract all ticket types from all venue configs
  const allTicketTypes: any[] = [];
  venueConfigs.forEach((vc: any) => {
    if (Array.isArray(vc.ticketTypes)) {
      allTicketTypes.push(...vc.ticketTypes);
    }
  });

  // Validate and calculate prices
  const ticketPriceInfos: TicketPriceInfo[] = [];
  let subtotal = 0;

  for (const selection of ticketSelections) {
    const ticketType = allTicketTypes.find((t: any) => t.id === selection.ticketTypeId);

    if (!ticketType) {
      throw new Error(`Ticket type ${selection.ticketTypeId} not found`);
    }

    if (typeof ticketType.price !== "number" || ticketType.price < 0) {
      throw new Error(`Invalid price for ticket type ${selection.ticketTypeId}`);
    }

    if (typeof selection.quantity !== "number" || selection.quantity < 1) {
      throw new Error(`Invalid quantity for ticket type ${selection.ticketTypeId}`);
    }

    // Check availability
    const available = ticketType.totalQuantity || 0;
    if (selection.quantity > available) {
      throw new Error(`Insufficient tickets available for ${ticketType.typeName || ticketType.name}`);
    }

    const ticketPrice = ticketType.price;
    const quantity = selection.quantity;
    const lineTotal = ticketPrice * quantity;

    ticketPriceInfos.push({
      ticketTypeId: selection.ticketTypeId,
      ticketName: ticketType.typeName || ticketType.name || "Ticket",
      price: ticketPrice,
      quantity,
    });

    subtotal += lineTotal;
  }

  // Calculate booking fee (₹7 per ticket)
  const totalTickets = ticketPriceInfos.reduce((sum, t) => sum + t.quantity, 0);
  const bookingFee = totalTickets * BOOKING_FEE_PER_TICKET;

  // Calculate total
  const total = subtotal + bookingFee;

  return {
    tickets: ticketPriceInfos,
    subtotal,
    bookingFee,
    total,
  };
}

