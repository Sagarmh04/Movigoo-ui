"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Event } from "@/types/event";
import seedData from "@/scripts/seed-data.json";
import { useFirebaseEvents } from "./useFirebaseEvents";

export type EventFilters = {
  page?: number;
  city?: string;
  category?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
};

type EventsResponse = {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
};

const seedEvents = (seedData.events ?? []) as Event[];

/**
 * Check if Firebase is configured
 */
function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

/**
 * Filter events based on filters
 */
function filterEvents(events: Event[], filters: EventFilters): Event[] {
  let filtered = [...events];

  if (filters.city) {
    filtered = filtered.filter((e) => e.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }

  if (filters.category) {
    filtered = filtered.filter((e) =>
      e.categories.some((cat) => cat.toLowerCase() === filters.category!.toLowerCase())
    );
  }

  if (filters.q) {
    const query = filters.q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        e.city.toLowerCase().includes(query)
    );
  }

  if (filters.date_from) {
    const fromDate = new Date(filters.date_from);
    filtered = filtered.filter((e) => new Date(e.dateStart) >= fromDate);
  }

  if (filters.date_to) {
    const toDate = new Date(filters.date_to);
    filtered = filtered.filter((e) => new Date(e.dateStart) <= toDate);
  }

  return filtered;
}

export function useEvents(filters: EventFilters = {}) {
  const isFirebase = isFirebaseConfigured();
  // Always call hooks, but Firebase hook will handle the case when not configured
  const firebaseEvents = useFirebaseEvents();
  const apiQuery = useInfiniteQuery<EventsResponse, Error, { pages: EventsResponse[]; pageParams: number[] }, readonly unknown[], number>({
    queryKey: ["events", filters],
    queryFn: async ({ pageParam }) => {
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        const pageSize = 6;
        const allEvents = filterEvents(seedEvents, filters);
        const start = (pageParam - 1) * pageSize;
        const events = allEvents.slice(start, start + pageSize);
        return {
          events,
          total: allEvents.length,
          page: pageParam,
          pageSize
        };
      }
      const params = new URLSearchParams({
        ...filters,
        page: String(pageParam)
      } as Record<string, string>);
      try {
        const { data } = await api.get<EventsResponse>(`/api/events?${params.toString()}`);
        return data;
      } catch (error) {
        const pageSize = 6;
        const allEvents = filterEvents(seedEvents, filters);
        const start = (pageParam - 1) * pageSize;
        const events = allEvents.slice(start, start + pageSize);
        return {
          events,
          total: allEvents.length,
          page: pageParam,
          pageSize
        };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined;
      return next;
    },
    enabled: !isFirebase, // Only run API query if Firebase is not configured
  });

  // If Firebase is configured, use Firebase events
  if (isFirebase) {
    const filteredEvents = useMemo(() => {
      if (firebaseEvents.loading || firebaseEvents.error) {
        return [];
      }
      return filterEvents(firebaseEvents.events, filters);
    }, [firebaseEvents.events, firebaseEvents.loading, firebaseEvents.error, filters]);

    // Simulate pagination for Firebase events to maintain compatibility
    const pageSize = 6;
    const pages = useMemo(() => {
      const result: EventsResponse[] = [];
      for (let i = 0; i < filteredEvents.length; i += pageSize) {
        result.push({
          events: filteredEvents.slice(i, i + pageSize),
          total: filteredEvents.length,
          page: Math.floor(i / pageSize) + 1,
          pageSize,
        });
      }
      if (result.length === 0) {
        result.push({
          events: [],
          total: 0,
          page: 1,
          pageSize,
        });
      }
      return result;
    }, [filteredEvents]);

    // Return a React Query-like interface for compatibility
    return {
      data: {
        pages,
        pageParams: pages.map((_, i) => i + 1),
      },
      isLoading: firebaseEvents.loading,
      isError: !!firebaseEvents.error,
      error: firebaseEvents.error ? new Error(firebaseEvents.error) : null,
      fetchNextPage: () => {
        // Firebase already loads all events, so this is a no-op
        // But we maintain the interface for compatibility
      },
      hasNextPage: false, // Firebase loads all at once
      isFetchingNextPage: false,
      refetch: () => {
        // Firebase updates in real-time, so this is a no-op
      },
    };
  }

  // Fallback to API/seed data if Firebase is not configured
  return apiQuery;
}

