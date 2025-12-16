"use client";

import LayoutWrapper from "@/components/LayoutWrapper";
import HomeLanding from "@/components/home/HomeLanding";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";

export default function HomePage() {
  // Fetch real published events from Firebase - no static/mock data
  // Only events with status === "published" are shown
  const { events, loading, error } = usePublishedEvents();

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

  // Pass real events to HomeLanding (it will show first 5 as featured)
  return (
    <LayoutWrapper>
      <HomeLanding featuredEvents={loading ? [] : events} />
    </LayoutWrapper>
  );
}

