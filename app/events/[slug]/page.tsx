import EventDetailView from "@/components/events/EventDetailView";
import seedData from "@/scripts/seed-data.json";
import type { Event, TicketType } from "@/types/event";
import type { User } from "@/types/user";
import { notFound } from "next/navigation";

type EventPayload = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

async function fetchEvent(slug: string): Promise<EventPayload | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/api/events/${slug}`, { cache: "no-store" });
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.warn("Event API fallback", error);
    }
  }

  const fallback = (seedData.events as any[]).find((event) => event.slug === slug);
  if (!fallback) return null;
  const { ticketTypes, ...rest } = fallback;
  const event = rest as Event;
  return {
    event,
    ticketTypes: ticketTypes as TicketType[],
    organizer: {
      id: event.organizerId,
      name: event.organizerId === "organizer-abc" ? "Aarav Kapoor" : "Movigoo Collective",
      email: event.organizerId === "organizer-abc" ? "aarav@movigoo.com" : "host@movigoo.com",
      role: event.organizerId === "organizer-abc" ? "organizer" : "user"
    }
  };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const payload = await fetchEvent(params.slug);
  if (!payload) notFound();
  return (
    <EventDetailView
      event={payload.event}
      ticketTypes={payload.ticketTypes}
      organizer={payload.organizer}
    />
  );
}

