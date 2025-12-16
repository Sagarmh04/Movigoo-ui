// lib/bookingState.ts
// Simple state management using localStorage

export type BookingState = {
  eventId: string;
  eventName: string;
  eventImage: string;
  dateStart: string;
  dateEnd?: string;
  venue: string;
  city?: string;
  tickets: {
    ticketId: string;
    typeName: string;
    quantity: number;
    price: number;
  }[];
  bookingFee: number;
  totalAmount: number;
};

const BOOKING_STATE_KEY = "movigoo_booking_state";

export function saveBookingState(state: Partial<BookingState>): void {
  if (typeof window === "undefined") return;
  const existing = getBookingState();
  const updated = { ...existing, ...state };
  localStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(updated));
}

export function getBookingState(): Partial<BookingState> | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(BOOKING_STATE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearBookingState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BOOKING_STATE_KEY);
}

export function calculateTotals(tickets: BookingState["tickets"]): {
  subtotal: number;
  bookingFee: number;
  total: number;
} {
  const subtotal = tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  const bookingFee = tickets.reduce((sum, ticket) => sum + 7 * ticket.quantity, 0); // ₹7 per ticket
  const total = subtotal + bookingFee;
  return { subtotal, bookingFee, total };
}

