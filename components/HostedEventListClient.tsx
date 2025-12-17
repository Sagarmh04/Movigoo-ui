// components/HostedEventListClient.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import EventCard from "@/components/EventCard";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { useSearchContext } from "@/context/SearchContext";
import { Button } from "@/components/ui/button";

const EventSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/5 bg-white/5 p-6" />
);

export default function HostedEventListClient() {
  // Fetch real published events from Firebase (status === "published")
  const { events, loading, error } = usePublishedEvents();
  const { searchQuery } = useSearchContext();
  
  // Use search hook when there's a search query
  const { results: searchResults, loading: searchLoading } = useSearchEvents({
    searchQuery,
    localEvents: events,
  });

  // Determine which events to display
  const displayEvents = searchQuery.trim().length > 0 ? searchResults : events;
  const isLoading = searchQuery.trim().length > 0 ? searchLoading : loading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 px-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <EventSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center mx-4">
        <p className="text-lg font-semibold text-rose-200 mb-2">Failed to load events from Firebase</p>
        <p className="text-sm text-rose-300/80 mb-6">{error}</p>
        <Button
          className="mt-4 rounded-2xl"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!displayEvents.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center mx-4">
        <p className="text-lg font-semibold text-white">
          {searchQuery ? `No events found for "${searchQuery}"` : "No events found."}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {searchQuery 
            ? "Try a different search term or browse all events."
            : 'Add events with status: "published" to your Firestore events collection to see them here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 px-4">
      <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {displayEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </motion.div>
    </div>
  );
}
