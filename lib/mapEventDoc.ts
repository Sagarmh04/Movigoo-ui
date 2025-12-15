// lib/mapEventDoc.ts
import { QueryDocumentSnapshot, DocumentSnapshot, DocumentData } from "firebase/firestore";
import { Event, TicketType } from "@/types/event";

/**
 * Maps a Firestore event document (backend structure) to frontend Event type
 * Backend structure:
 * - basicDetails: { title, description, coverWideUrl, coverPortraitUrl, ageLimit, ... }
 * - schedule: { locations: [{ name, venues: [{ name, dates: [{ date, shows: [{ startTime, endTime }] }] }] }] }
 * - tickets: { venueConfigs: [{ venueId, ticketTypes: [{ id, typeName, price, totalQuantity }] }] }
 */
export function mapEventDoc(
  doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): Event {
  const d = doc.data() as any;
  if (!d) {
    throw new Error("Document data is missing");
  }

  const basic = d.basicDetails ?? {};
  const schedule = d.schedule ?? {};
  const tickets = d.tickets ?? {};

  // Extract nested location/venue/date/show data
  const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
  const firstLocation = locations[0] ?? {};
  const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
  const firstVenue = venues[0] ?? {};
  const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
  const firstDate = dates[0] ?? {};
  const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
  const firstShow = shows[0] ?? {};

  // Extract ticket types and calculate min price
  const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
  const allTicketTypes = venueConfigs.flatMap((vc: any) =>
    Array.isArray(vc.ticketTypes) ? vc.ticketTypes : []
  );

  const minTicketPrice =
    allTicketTypes.length > 0
      ? Math.min(
          ...allTicketTypes
            .map((t: any) => t.price)
            .filter((x: any) => typeof x === "number")
        )
      : 0;

  // Generate slug from title if not provided
  const title = basic.title || "Untitled Event";
  const slug =
    d.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Build dateStart from date + startTime
  let dateStart = new Date().toISOString();
  if (firstDate.date && firstShow.startTime) {
    // Handle time format (could be "17:30" or "17:30:00")
    const time = firstShow.startTime.includes(":")
      ? firstShow.startTime.split(":").slice(0, 2).join(":")
      : "00:00";
    dateStart = `${firstDate.date}T${time}:00`;
  } else if (firstDate.date) {
    dateStart = `${firstDate.date}T00:00:00`;
  }

  // Build dateEnd from date + endTime
  let dateEnd: string | undefined = undefined;
  if (firstDate.date && firstShow.endTime) {
    const time = firstShow.endTime.includes(":")
      ? firstShow.endTime.split(":").slice(0, 2).join(":")
      : "00:00";
    dateEnd = `${firstDate.date}T${time}:00`;
  }

  // Map to Event type
  return {
    id: doc.id,
    slug,
    title,
    coverWide: basic.coverWideUrl || null,
    coverPortrait: basic.coverPortraitUrl ? [basic.coverPortraitUrl] : [],
    city: firstLocation.name || "TBA",
    venue: firstVenue.name || "TBA",
    dateStart,
    dateEnd,
    categories: basic.genres || [],
    rating: undefined,
    priceFrom: minTicketPrice,
    description: basic.description || "",
    organizerId: d.hostUid || "",
    hosted: false, // Will be set based on current user comparison
  };
}

/**
 * Maps ticket types from Firestore structure
 */
export function mapTicketTypes(doc: DocumentData): TicketType[] {
  const tickets = doc.tickets ?? {};
  const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
  
  const allTicketTypes = venueConfigs.flatMap((vc: any) =>
    Array.isArray(vc.ticketTypes) ? vc.ticketTypes : []
  );

  return allTicketTypes.map((t: any) => ({
    id: t.id || `ticket-${Math.random().toString(36).substr(2, 9)}`,
    name: t.typeName || "Ticket",
    price: typeof t.price === "number" ? t.price : 0,
    available: typeof t.totalQuantity === "number" ? t.totalQuantity : 0,
    maxPerOrder: 10, // Default, can be adjusted based on your business logic
    perks: "",
    description: t.description || "",
  }));
}

