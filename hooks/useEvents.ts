"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Event } from "@/types/event";
import seedData from "@/scripts/seed-data.json";

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

export function useEvents(filters: EventFilters = {}) {
  return useInfiniteQuery<EventsResponse, Error, { pages: EventsResponse[]; pageParams: number[] }, readonly unknown[], number>({
    queryKey: ["events", filters],
    queryFn: async ({ pageParam }) => {
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        const pageSize = 6;
        const start = (pageParam - 1) * pageSize;
        const events = seedEvents.slice(start, start + pageSize);
        return {
          events,
          total: seedEvents.length,
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
        const start = (pageParam - 1) * pageSize;
        const events = seedEvents.slice(start, start + pageSize);
        return {
          events,
          total: seedEvents.length,
          page: pageParam,
          pageSize
        };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined;
      return next;
    }
  });
}

