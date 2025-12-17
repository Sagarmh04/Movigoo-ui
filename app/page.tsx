"use client";

import LayoutWrapper from "@/components/LayoutWrapper";
import HomeLanding from "@/components/home/HomeLanding";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import { useSearchContext } from "@/context/SearchContext";
import { useSearchEvents } from "@/hooks/useSearchEvents";

export default function HomePage() {
  // Fetch real published events from Firebase - no static/mock data
  // Only events with status === "published" are shown
  const { events, loading, error } = usePublishedEvents();
  const { searchQuery } = useSearchContext();
  
  // Use search hook when there's a search query
  const { results: searchResults, loading: searchLoading } = useSearchEvents({
    searchQuery,
    localEvents: events,
  });

  // Determine which events to show
  const displayEvents = searchQuery.trim().length > 0 ? searchResults : events;
  const isLoading = searchQuery.trim().length > 0 ? searchLoading : loading;

  if (error) {
    return (
      <LayoutWrapper>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <p className="text-lg font-semibold text-rose-200 mb-2">Failed to load events</p>
          <p className="text-sm text-rose-300/80">{error}</p>
        </div>
      </LayoutWrapper>
    );
  }

  // Pass events to HomeLanding (will show search results if searching, otherwise all events)
  return (
    <LayoutWrapper>
      <HomeLanding 
        featuredEvents={isLoading ? [] : displayEvents}
        searchQuery={searchQuery}
        isSearching={searchQuery.trim().length > 0}
      />
    </LayoutWrapper>
  );
}

