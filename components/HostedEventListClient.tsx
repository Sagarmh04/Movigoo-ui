// components/HostedEventListClient.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import EventCard from "@/components/EventCard";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { Button } from "@/components/ui/button";

const EventSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/5 bg-white/5 p-6" />
);

export default function HostedEventListClient() {
  const { events, loading, error } = useHostedEvents();

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <EventSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
        <p className="text-sm text-rose-200">We couldn&apos;t load hosted events. Please retry.</p>
        <p className="mt-2 text-xs text-rose-300/70">{error}</p>
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

  if (!events.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-lg font-semibold text-white">No hosted events yet.</p>
        <p className="mt-2 text-sm text-slate-400">
          Hosted events will appear here in real-time when they become available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </motion.div>
    </div>
  );
}

