"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import EventCard from "@/components/EventCard";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";

type EventListProps = {
  pages?: { events: Event[] }[];
  isLoading: boolean;
  isError: boolean;
  fetchNext?: () => void;
  hasNext?: boolean;
  isFetchingNext?: boolean;
  onRetry?: () => void;
};

const EventSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/5 bg-white/5 p-6" />
);

const EventList = ({
  pages,
  isLoading,
  isError,
  fetchNext,
  hasNext,
  isFetchingNext,
  onRetry
}: EventListProps) => {
  const { ref, inView } = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView && hasNext && !isFetchingNext) {
      fetchNext?.();
    }
  }, [inView, fetchNext, hasNext, isFetchingNext]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <EventSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <p className="text-lg font-semibold text-rose-200 mb-2">Failed to load events from Firebase</p>
        <p className="text-sm text-rose-300/80 mb-6">
          Make sure your Firebase is configured and events collection has documents with status: &quot;published&quot;
        </p>
        {onRetry && (
          <Button className="mt-4 rounded-2xl" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  const events = pages?.flatMap((page) => page.events) ?? [];

  return (
    <div className="space-y-12">
      <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </motion.div>

      {hasNext && (
        <div ref={ref} className="flex justify-center">
          <Button
            onClick={() => fetchNext?.()}
            disabled={isFetchingNext}
            variant="ghost"
            className="rounded-full"
          >
            {isFetchingNext ? "Loading more..." : "Load more events"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventList;

