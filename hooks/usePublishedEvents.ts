// hooks/usePublishedEvents.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event } from "@/types/event";
import { mapEventDoc } from "@/lib/mapEventDoc";

/**
 * Hook to fetch only published events from Firestore
 * Uses status === "published" and maps using the backend structure
 */
export function usePublishedEvents() {
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
      // Query for published events only
      const q = query(
        collection(db, "events"),
        where("status", "==", "published")
      );

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          try {
            const mappedEvents = snap.docs.map((doc) => mapEventDoc(doc));
            
            // Sort by dateStart (ascending)
            mappedEvents.sort((a, b) => {
              const dateA = new Date(a.dateStart).getTime();
              const dateB = new Date(b.dateStart).getTime();
              return dateA - dateB;
            });

            setEvents(mappedEvents);
            setLoading(false);
          } catch (mapError: any) {
            console.error("Error mapping events:", mapError);
            setError(`Failed to map events: ${mapError.message}`);
            setLoading(false);
          }
        },
        (err) => {
          console.error("usePublishedEvents onSnapshot error", err);
          setError(err.message || "Failed to load events from Firestore");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err: any) {
      console.error("usePublishedEvents setup error", err);
      setError(err.message || "Failed to set up Firestore listener");
      setLoading(false);
    }
  }, []);

  return { events, loading, error };
}

