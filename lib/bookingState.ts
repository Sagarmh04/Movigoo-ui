// lib/bookingState.ts
// Simple state management using localStorage

export type ShowSelection = {
  locationId: string;
  locationName: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  dateId: string;
  date: string;
  showId: string;
  showName: string;
  startTime: string;
  endTime: string;
};

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
  paymentSessionId?: string; // Server-generated payment session ID
  showSelection?: ShowSelection; // Show selection metadata
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
  try {
    const stored = localStorage.getItem(BOOKING_STATE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error parsing booking state:", error);
    // Clear corrupted state
    try {
      localStorage.removeItem(BOOKING_STATE_KEY);
    } catch {
      // Ignore
    }
    return null;
  }
}

export function clearBookingState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BOOKING_STATE_KEY);
}

const PLATFORM_FEE = 7; // ₹7 flat per booking (NOT per ticket)

export function calculateTotals(tickets: BookingState["tickets"]): {
  subtotal: number;
  bookingFee: number;
  total: number;
} {
  const subtotal = tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  const bookingFee = PLATFORM_FEE; // ₹7 flat per booking
  const total = subtotal + bookingFee;
  return { subtotal, bookingFee, total };
}

