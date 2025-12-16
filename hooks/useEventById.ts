// hooks/useEventById.ts
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import { mapEventDoc, mapTicketTypes } from "@/lib/mapEventDoc";

type EventResponse = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

export function useEventById(eventId?: string) {
  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    if (!db) {
      setError("Firebase not configured");
      setLoading(false);
      return;
    }

    async function fetchEvent() {
      if (!db) {
        setError("Firebase not configured");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (!eventId) {
          throw new Error("Event ID is required");
        }

        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        
        // Use existing mapping functions for consistency
        const event = mapEventDoc(eventDoc);
        const ticketTypes = mapTicketTypes(eventData);

        const organizer: User = {
          id: eventData.organizerId || eventData.host || "",
          name: eventData.host || "Organizer",
          role: "organizer",
          email: eventData.organizerEmail || "",
        };

        setData({ event, ticketTypes, organizer });
      } catch (err: any) {
        console.error("Error fetching event:", err);
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  return {
    data,
    isLoading: loading,
    isError: !!error,
    error: error ? new Error(error) : null,
  };
}

