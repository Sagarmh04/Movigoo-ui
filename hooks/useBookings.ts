"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Booking } from "@/types/booking";
import seedData from "@/scripts/seed-data.json";

const fallbackBookings = (seedData.bookings ?? []) as Booking[];

export function useBookings(userId?: string) {
  return useQuery<{ bookings: Booking[] }>({
    queryKey: ["bookings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return { bookings: [] };
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        return { bookings: fallbackBookings.filter((booking) => booking.userId === userId) };
      }
      try {
        const params = new URLSearchParams({ userId });
        const { data } = await api.get<{ bookings: Booking[] }>(`/api/bookings?${params}`);
        return data;
      } catch (error) {
        return { bookings: fallbackBookings.filter((booking) => booking.userId === userId) };
      }
    }
  });
}

