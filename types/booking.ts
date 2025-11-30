export type BookingItem = {
  ticketTypeId: string;
  quantity: number;
  price: number;
};

export type Booking = {
  bookingId: string;
  userId: string;
  eventId: string;
  items: BookingItem[];
  status: "pending" | "confirmed" | "requires_payment" | "failed";
  totalAmount: number;
  createdAt: string;
  event?: {
    title: string;
    venue: string;
    city: string;
    dateStart: string;
  };
};

