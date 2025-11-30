"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Booking } from "@/types/booking";
import { useToast } from "@/components/Toast";

type CreateBookingPayload = {
  eventId: string;
  items: { ticketTypeId: string; quantity: number; price: number }[];
  userId?: string;
  paymentMethod?: string;
  promoCode?: string;
};

type CreateBookingResponse = {
  bookingId: string;
  status: "pending" | "confirmed" | "requires_payment";
  paymentUrl?: string;
  booking: Booking;
};

export function useCreateBooking() {
  const { pushToast } = useToast();

  return useMutation<CreateBookingResponse, Error, CreateBookingPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<CreateBookingResponse>("/api/bookings", payload);
      return data;
    },
    onError: (error) => {
      pushToast({
        title: "Booking failed",
        description: error.message,
        variant: "error"
      });
    }
  });
}

