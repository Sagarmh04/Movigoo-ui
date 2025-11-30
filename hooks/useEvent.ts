"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import seedData from "@/scripts/seed-data.json";

type EventResponse = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

export function useEvent(slug?: string) {
  return useQuery<EventResponse>({
    queryKey: ["event", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) throw new Error("Missing event slug");
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        const fallback = (seedData.events as any[]).find((event) => event.slug === slug);
        if (!fallback) throw new Error("Event not found");
        const { ticketTypes, ...rest } = fallback;
        const event = rest as Event;
        return {
          event,
          ticketTypes: ticketTypes as TicketType[],
          organizer: {
            id: event.organizerId,
            name: event.organizerId === "organizer-abc" ? "Aarav Kapoor" : "Movigoo Collective",
            role: event.organizerId === "organizer-abc" ? "organizer" : "user",
            email: event.organizerId === "organizer-abc" ? "aarav@movigoo.com" : "host@movigoo.com"
          }
        };
      }

      const { data } = await api.get<EventResponse>(`/api/events/${slug}`);
      return data;
    }
  });
}

