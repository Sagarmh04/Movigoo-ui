// app/events/page.tsx
// Events page with premium search bar

"use client";

import { Suspense } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import SearchBar from "@/components/SearchBar";
import { useSearchContext } from "@/context/SearchContext";
import HostedEventListClient from "@/components/HostedEventListClient";

function EventsPageContent() {
  const { searchQuery, setSearchQuery } = useSearchContext();

  return (
    <LayoutWrapper>
      <div className="space-y-8">
        {/* Premium Search Bar */}
        <div className="px-4 pt-4 md:pt-6">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search events, shows, artists..."
          />
        </div>

        {/* Page Header */}
        <div className="space-y-4 text-center px-4">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Browse</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Premiere bookings"}
          </h1>
          {!searchQuery && (
            <p className="text-slate-300">
              From live concerts to once‑in‑a‑lifetime experiences — book the moments you don't want to miss.
            </p>
          )}
        </div>

        {/* Events List - will use search context internally */}
        <HostedEventListClient />
      </div>
    </LayoutWrapper>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <LayoutWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-400">Loading events...</p>
          </div>
        </div>
      </LayoutWrapper>
    }>
      <EventsPageContent />
    </Suspense>
  );
}
