"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import { mapEventDoc, mapTicketTypes } from "@/lib/mapEventDoc";

type EventResponse = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

export function useEvent(slug?: string) {
  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    if (!db) {
      setError("Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file.");
      setLoading(false);
      return;
    }

    async function fetchEvent() {
      if (!db) {
        setError("Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all published events and filter by slug (since slug is generated client-side)
        const eventsQuery = query(
          collection(db, "events"),
          where("status", "==", "published"),
          limit(100) // Fetch more to find by slug (slug is generated from title)
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const eventDoc = eventsSnapshot.docs.find((doc) => {
          const mapped = mapEventDoc(doc);
          return mapped.slug === slug;
        });

        if (!eventDoc) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        const event = mapEventDoc(eventDoc);
        const ticketTypes = mapTicketTypes(eventData);

        // Get organizer info (you may need to fetch from users collection)
        const organizer: User = {
          id: eventData.hostUid || "",
          name: eventData.hostUid || "Organizer",
          role: "organizer",
          email: "",
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
  }, [slug]);

  return {
    data,
    isLoading: loading,
    isError: !!error,
    error: error ? new Error(error) : null,
  };
}

