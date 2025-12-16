"use client";

import { useEvent } from "@/hooks/useEvent";
import EventDetailView from "@/components/events/EventDetailView";
import { notFound } from "next/navigation";

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const { data, isLoading, isError } = useEvent(params.slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent-amber border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-0 pb-0 sm:px-6 lg:px-10">
      {/* Add top padding to account for fixed navbar (pt-16 = 4rem = 64px) */}
      <div className="pt-16 sm:pt-20">
        <EventDetailView
          event={data.event}
          ticketTypes={data.ticketTypes}
          organizer={data.organizer}
        />
      </div>
    </div>
  );
}

