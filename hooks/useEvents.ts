"use client";

import { useMemo } from "react";
import { Event } from "@/types/event";
import { usePublishedEvents } from "./usePublishedEvents";

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
  // Always use Firebase - fetch only published events, no fallback to seed data
  const publishedEvents = usePublishedEvents();

  const filteredEvents = useMemo(() => {
    if (publishedEvents.loading || publishedEvents.error) {
      return [];
    }
    return filterEvents(publishedEvents.events, filters);
  }, [publishedEvents.events, publishedEvents.loading, publishedEvents.error, filters]);

  // Simulate pagination for Firebase events to maintain compatibility with existing components
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
    isLoading: publishedEvents.loading,
    isError: !!publishedEvents.error,
    error: publishedEvents.error ? new Error(publishedEvents.error) : null,
    fetchNextPage: () => {
      // Firebase already loads all events, so this is a no-op
    },
    hasNextPage: false, // Firebase loads all at once
    isFetchingNextPage: false,
    refetch: () => {
      // Firebase updates in real-time, so this is a no-op
    },
  };
}

