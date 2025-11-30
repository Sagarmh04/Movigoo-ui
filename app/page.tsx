import HomeLanding from "@/components/home/HomeLanding";
import type { Event } from "@/types/event";
import seedData from "@/scripts/seed-data.json";

const fallbackEvents = (seedData.events ?? []) as Event[];

async function getFeaturedEvents(): Promise<Event[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return fallbackEvents;

  try {
    const response = await fetch(`${baseUrl}/api/events?page=1`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) throw new Error("Failed to fetch events");
    const data = await response.json();
    return data.events;
  } catch (error) {
    console.warn("Falling back to seed data:", error);
    return fallbackEvents;
  }
}

export default async function HomePage() {
  const featuredEvents = await getFeaturedEvents();
  return <HomeLanding featuredEvents={featuredEvents} />;
}

