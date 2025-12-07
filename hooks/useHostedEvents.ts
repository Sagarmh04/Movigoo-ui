// hooks/useHostedEvents.ts
"use client";

import { useEffect, useState, useRef } from "react";
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

export type HostedEventItem = {
  id: string;
  title: string;
  description?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  image?: string | null;
  host?: string | null;
  status?: string | null;
  isHosted?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
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
function mapFirebaseEventToEvent(firebaseEvent: HostedEventItem): Event {
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
    hosted: firebaseEvent.hosted || firebaseEvent.isHosted || false,
  };
}

/**
 * Hook to fetch only hosted events from Firestore
 * Supports two patterns:
 * 1. status == "hosted"
 * 2. isHosted == true
 * Merges and deduplicates results by document ID
 */
export function useHostedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsMapRef = useRef<Map<string, HostedEventItem>>(new Map());

  useEffect(() => {
    if (!db) {
      setError("Firebase not initialized. Please check your environment variables.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    eventsMapRef.current.clear();

    const unsubscribers: (() => void)[] = [];

    try {
      // Query 1: status == "hosted"
      // Note: We query without orderBy to avoid index requirements and missing field issues.
      // Sorting is done client-side after merging results from both queries.
      const qStatus = query(
        collection(db, "events"),
        where("status", "==", "hosted")
      );

      const unsub1 = onSnapshot(
        qStatus,
        (snap: QuerySnapshot<DocumentData>) => {
          snap.docs.forEach((doc) => {
            const d = doc.data();
            const existing = eventsMapRef.current.get(doc.id);
            const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt?.toDate?.() || null;
            const existingUpdatedAt = existing?.updatedAt || null;

            // Prefer latest data if document appears in both queries
            if (!existing || (updatedAt && existingUpdatedAt && updatedAt > existingUpdatedAt)) {
              eventsMapRef.current.set(doc.id, {
                id: doc.id,
                title: d.title || "Untitled",
                description: d.description || "",
                startAt: d.startAt instanceof Timestamp ? d.startAt.toDate() : d.startAt?.toDate?.() || null,
                endAt: d.endAt instanceof Timestamp ? d.endAt.toDate() : d.endAt?.toDate?.() || null,
                image: d.image || null,
                host: d.host || null,
                status: d.status || null,
                isHosted: d.isHosted,
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt?.toDate?.() || null,
                updatedAt,
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
              });
            }
          });

          // Remove documents that are no longer in this query
          const currentIds = new Set(snap.docs.map((doc) => doc.id));
          eventsMapRef.current.forEach((_, id) => {
            if (!currentIds.has(id) && eventsMapRef.current.get(id)?.status === "hosted") {
              eventsMapRef.current.delete(id);
            }
          });

          updateEventsList();
        },
        (err) => {
          console.error("useHostedEvents status query error", err);
          // Don't set error if it's just a missing index - try the other query
          if (!err.message?.includes("index")) {
            setError(err.message || "Failed to load hosted events");
          }
        }
      );

      unsubscribers.push(unsub1);

      // Query 2: isHosted == true
      // Note: We query without orderBy to avoid index requirements and missing field issues.
      // Sorting is done client-side after merging results from both queries.
      const qIsHosted = query(
        collection(db, "events"),
        where("isHosted", "==", true)
      );

      const unsub2 = onSnapshot(
        qIsHosted,
        (snap: QuerySnapshot<DocumentData>) => {
          snap.docs.forEach((doc) => {
            const d = doc.data();
            const existing = eventsMapRef.current.get(doc.id);
            const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt?.toDate?.() || null;
            const existingUpdatedAt = existing?.updatedAt || null;

            // Prefer latest data if document appears in both queries
            // Prefer status: "hosted" if both patterns exist (canonical field)
            if (!existing || (updatedAt && existingUpdatedAt && updatedAt > existingUpdatedAt)) {
              eventsMapRef.current.set(doc.id, {
                id: doc.id,
                title: d.title || "Untitled",
                description: d.description || "",
                startAt: d.startAt instanceof Timestamp ? d.startAt.toDate() : d.startAt?.toDate?.() || null,
                endAt: d.endAt instanceof Timestamp ? d.endAt.toDate() : d.endAt?.toDate?.() || null,
                image: d.image || null,
                host: d.host || null,
                status: d.status || null,
                isHosted: d.isHosted,
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt?.toDate?.() || null,
                updatedAt,
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
              });
            }
          });

          // Remove documents that are no longer in this query
          const currentIds = new Set(snap.docs.map((doc) => doc.id));
          eventsMapRef.current.forEach((_, id) => {
            if (!currentIds.has(id) && eventsMapRef.current.get(id)?.isHosted === true) {
              eventsMapRef.current.delete(id);
            }
          });

          updateEventsList();
        },
        (err) => {
          console.error("useHostedEvents isHosted query error", err);
          // Don't set error if it's just a missing index - the other query might work
          if (!err.message?.includes("index")) {
            setError(err.message || "Failed to load hosted events");
          }
        }
      );

      unsubscribers.push(unsub2);

      // Helper function to update the events list from the map
      function updateEventsList() {
        const eventsArray = Array.from(eventsMapRef.current.values());
        
        // Sort: events with startAt first (by startAt), then by createdAt
        eventsArray.sort((a, b) => {
          if (a.startAt && b.startAt) {
            return a.startAt.getTime() - b.startAt.getTime();
          }
          if (a.startAt) return -1;
          if (b.startAt) return 1;
          // Both missing startAt - sort by createdAt
          if (a.createdAt && b.createdAt) {
            return a.createdAt.getTime() - b.createdAt.getTime();
          }
          if (a.createdAt) return -1;
          if (b.createdAt) return 1;
          return 0;
        });

        const mappedEvents = eventsArray.map(mapFirebaseEventToEvent);
        setEvents(mappedEvents);
        setLoading(false);
      }

      // Initial load check - if both queries complete without data, we're done loading
      let statusLoaded = false;
      let isHostedLoaded = false;

      const checkBothLoaded = () => {
        if (statusLoaded && isHostedLoaded && eventsMapRef.current.size === 0) {
          setLoading(false);
        }
      };

      // Set up initial load tracking
      const statusSnap = qStatus;
      const isHostedSnap = qIsHosted;

    } catch (err: any) {
      console.error("useHostedEvents setup error", err);
      setError(err.message || "Failed to set up Firestore listeners");
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return { events, loading, error };
}

