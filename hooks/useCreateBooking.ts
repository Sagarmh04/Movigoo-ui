"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Booking } from "@/types/booking";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";

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
  paymentUrl?: string | null;
  booking: Booking;
};

export function useCreateBooking() {
  const { pushToast } = useToast();
  const { user } = useAuth();

  return useMutation<CreateBookingResponse, Error, CreateBookingPayload>({
    mutationFn: async (payload) => {
      // ALWAYS use real Firebase user.uid - reject if not logged in
      if (!user || !user.uid) {
        throw new Error("User must be logged in to create a booking");
      }

      // Ensure userId is always set to real Firebase user.uid
      const finalPayload = {
        ...payload,
        userId: user.uid, // REAL Firebase ID - override any provided userId
      };

      console.log("Booking payload:", finalPayload);
      console.log("Calling /api/bookings");
      
      try {
        const { data } = await api.post<{ ok: boolean; bookingId: string; qrCodeData: string }>("/api/bookings", finalPayload);
        console.log("Booking response:", data);
        
        if (!data.ok || !data.bookingId) {
          throw new Error("Invalid response from server");
        }

        // Transform response to match expected format
        return {
          bookingId: data.bookingId,
          status: "confirmed" as const,
          paymentUrl: null,
          booking: {
            bookingId: data.bookingId,
            userId: user.uid, // REAL Firebase ID
            eventId: finalPayload.eventId,
            items: finalPayload.items,
            status: "confirmed" as const,
            totalAmount: finalPayload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            createdAt: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        console.error("Booking API error:", error);
        const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || "Booking failed. Please try again.";
        
        // Show specific error message for 400 errors
        if (error.response?.status === 400) {
          const missingFields = error.response?.data?.missingFields;
          if (missingFields && Array.isArray(missingFields)) {
            throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onError: (error) => {
      console.error("Booking error:", error);
      pushToast({
        title: "Booking failed",
        description: error.message || "Please try again.",
        variant: "error"
      });
    }
  });
}

