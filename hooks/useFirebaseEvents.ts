// hooks/useFirebaseEvents.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event } from "@/types/event";

export type FirebaseEventItem = {
  id: string;
  title: string;
  description?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  image?: string | null;
  host?: string | null;
  status?: string | null;
  createdAt?: Date | null;
  // Additional fields that might exist in Firestore
  city?: string;
  venue?: string;
  categories?: string[];
  priceFrom?: number;
  organizerId?: string;
  slug?: string;
  coverWide?: string;
  coverPortrait?: string[];
  rating?: number;
  hosted?: boolean;
  raw?: DocumentData;
};

/**
 * Converts a Firestore event document to the Event type used in the app
 */
function mapFirebaseEventToEvent(firebaseEvent: FirebaseEventItem): Event {
  // Generate slug from title if not provided
  const slug =
    firebaseEvent.slug ||
    firebaseEvent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Convert Firestore timestamps to ISO strings
  const dateStart = firebaseEvent.startAt
    ? firebaseEvent.startAt.toISOString()
    : new Date().toISOString();
  const dateEnd = firebaseEvent.endAt ? firebaseEvent.endAt.toISOString() : undefined;

  return {
    id: firebaseEvent.id,
    slug,
    title: firebaseEvent.title || "Untitled Event",
    coverWide: firebaseEvent.coverWide || firebaseEvent.image || "/placeholder-event.jpg",
    coverPortrait: firebaseEvent.coverPortrait || [firebaseEvent.image || "/placeholder-event.jpg"],
    city: firebaseEvent.city || "TBA",
    venue: firebaseEvent.venue || "TBA",
    dateStart,
    dateEnd,
    categories: firebaseEvent.categories || [],
    rating: firebaseEvent.rating,
    priceFrom: firebaseEvent.priceFrom || 0,
    description: firebaseEvent.description || "",
    organizerId: firebaseEvent.organizerId || firebaseEvent.host || "",
    hosted: firebaseEvent.hosted || false,
  };
}

export function useFirebaseEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Firebase not initialized. Please check your environment variables.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "published"),
        orderBy("startAt", "asc")
      );

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          const items: Event[] = snap.docs.map((doc) => {
            const d = doc.data();
            const firebaseEvent: FirebaseEventItem = {
              id: doc.id,
              title: d.title || "Untitled",
              description: d.description || "",
              startAt: d.startAt instanceof Timestamp ? d.startAt.toDate() : d.startAt?.toDate?.() || null,
              endAt: d.endAt instanceof Timestamp ? d.endAt.toDate() : d.endAt?.toDate?.() || null,
              image: d.image || null,
              host: d.host || null,
              status: d.status || null,
              createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt?.toDate?.() || null,
              city: d.city,
              venue: d.venue,
              categories: d.categories,
              priceFrom: d.priceFrom,
              organizerId: d.organizerId,
              slug: d.slug,
              coverWide: d.coverWide,
              coverPortrait: d.coverPortrait,
              rating: d.rating,
              hosted: d.hosted,
              raw: d,
            };
            return mapFirebaseEventToEvent(firebaseEvent);
          });
          setEvents(items);
          setLoading(false);
        },
        (err) => {
          console.error("useFirebaseEvents onSnapshot error", err);
          setError(err.message || "Failed to load events from Firestore");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err: any) {
      console.error("useFirebaseEvents setup error", err);
      setError(err.message || "Failed to set up Firestore listener");
      setLoading(false);
    }
  }, []);

  return { events, loading, error };
}

