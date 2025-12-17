// hooks/useSearchEvents.ts
// Hook for searching events (client-side first, then Firestore fallback)

"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event } from "@/types/event";
import { mapEventDoc } from "@/lib/mapEventDoc";

type UseSearchEventsProps = {
  searchQuery: string;
  localEvents?: Event[]; // Events already loaded on the page
};

export function useSearchEvents({ searchQuery, localEvents = [] }: UseSearchEventsProps) {
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side search function
  const searchLocal = (query: string, events: Event[]): Event[] => {
    if (!query || query.trim().length === 0) return [];
    
    const queryLower = query.toLowerCase().trim();
    
    return events.filter((event) => {
      const titleMatch = event.title?.toLowerCase().includes(queryLower);
      const cityMatch = event.city?.toLowerCase().includes(queryLower);
      const venueMatch = event.venue?.toLowerCase().includes(queryLower);
      const descriptionMatch = event.description?.toLowerCase().includes(queryLower);
      const categoryMatch = event.categories?.some((cat) =>
        cat.toLowerCase().includes(queryLower)
      );
      
      return titleMatch || cityMatch || venueMatch || descriptionMatch || categoryMatch;
    });
  };

  // Firestore search function
  const searchFirestore = async (searchTerm: string): Promise<Event[]> => {
    if (!db || !searchTerm || searchTerm.trim().length < 2) return [];

    try {
      const queryLower = searchTerm.toLowerCase().trim();
      
      // Search by title (using searchTitle field if available, otherwise basicDetails.title)
      const eventsRef = collection(db, "events");
      
      // Try multiple search strategies
      const firestoreQueries = [
        // Search in basicDetails.title
        query(
          eventsRef,
          where("status", "==", "published"),
          orderBy("basicDetails.title"),
          limit(50)
        ),
      ];

      const allResults: Event[] = [];
      const seenIds = new Set<string>();

      for (const firestoreQuery of firestoreQueries) {
        try {
          const snapshot = await getDocs(firestoreQuery);
          snapshot.docs.forEach((doc) => {
            if (seenIds.has(doc.id)) return;
            seenIds.add(doc.id);

            const eventData = doc.data();
            const basic = eventData.basicDetails || {};
            const title = basic.title || "";
            const city = eventData.schedule?.locations?.[0]?.name || "";
            const venue = eventData.schedule?.locations?.[0]?.venues?.[0]?.name || "";
            const description = basic.description || "";
            const categories = basic.genres || [];

            const searchText = `${title} ${city} ${venue} ${description} ${categories.join(" ")}`.toLowerCase();
            
            if (searchText.includes(queryLower)) {
              try {
                const mappedEvent = mapEventDoc(doc);
                allResults.push(mappedEvent);
              } catch (err) {
                console.error("Error mapping event:", err);
              }
            }
          });
        } catch (err) {
          console.error("Error in Firestore search query:", err);
        }
      }

      return allResults;
    } catch (err: any) {
      console.error("Firestore search error:", err);
      setError(err.message || "Search failed");
      return [];
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Step 1: Try local search first (fast, offline)
      const localResults = searchLocal(searchQuery, localEvents);
      
      if (localResults.length > 0) {
        setResults(localResults);
        setLoading(false);
        return;
      }

      // Step 2: If no local results and query is long enough, search Firestore
      if (searchQuery.trim().length >= 2) {
        const firestoreResults = await searchFirestore(searchQuery);
        setResults(firestoreResults);
      } else {
        setResults([]);
      }

      setLoading(false);
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, localEvents]);

  return {
    results,
    loading,
    error,
  };
}

