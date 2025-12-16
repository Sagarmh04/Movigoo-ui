// app/event/[eventId]/page.tsx - STEP 1: Event Details
"use client";

import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import StepIndicator from "@/components/booking/StepIndicator";
import EventDetailsSection from "@/components/booking/EventDetailsSection";
import { Button } from "@/components/ui/button";
import { saveBookingState } from "@/lib/bookingState";

export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data, isLoading, isError } = useEventById(params.eventId);

  const handleBookNow = () => {
    if (data) {
      // Save initial booking state
      saveBookingState({
        eventId: data.event.id,
        eventName: data.event.title,
        eventImage: data.event.coverWide,
        dateStart: data.event.dateStart,
        dateEnd: data.event.dateEnd,
        venue: data.event.venue,
        city: data.event.city,
        tickets: [],
        bookingFee: 0,
        totalAmount: 0,
      });
      // Navigate to tickets page
      router.push(`/event/${params.eventId}/tickets`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Event not found</p>
          <p className="mt-2 text-sm text-slate-400">The event you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={1} />
        </div>

        {/* Event Details */}
        <div className="flex-1 space-y-6 overflow-y-auto pb-4">
          <EventDetailsSection event={data.event} isHosted={data.event.organizerId === data.organizer.id} />
        </div>

        {/* Sticky Bottom Bar - Mobile */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl sm:relative sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-center sm:block">
            <Button
              onClick={handleBookNow}
              className="w-full rounded-full bg-[#0B62FF] py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] sm:rounded-2xl sm:py-4 sm:text-lg"
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

