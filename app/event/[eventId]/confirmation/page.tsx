// app/event/[eventId]/confirmation/page.tsx - STEP 5: Booking Confirmation
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import BookingConfirmationCard from "@/components/booking/BookingConfirmationCard";
import { getBookingState } from "@/lib/bookingState";

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: eventData, isLoading } = useEventById(params.eventId);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    const qrToken = searchParams.get("qrToken");

    if (!bookingId || !qrToken) {
      // Redirect if missing params
      router.push(`/event/${params.eventId}`);
      return;
    }

    // Get booking state (or fetch from Firestore in production)
    const state = getBookingState();
    if (state && eventData && state.tickets && state.tickets.length > 0) {
      setBooking({
        bookingId,
        eventName: state.eventName,
        eventImage: state.eventImage,
        dateStart: state.dateStart,
        dateEnd: state.dateEnd,
        venue: state.venue,
        ticketType: state.tickets[0]?.typeName || "Ticket",
        quantity: state.tickets.reduce((sum, t) => sum + t.quantity, 0),
        totalPaid: state.totalAmount,
        qrToken,
      });
    } else if (eventData) {
      // Fallback if state is cleared
      setBooking({
        bookingId,
        eventName: eventData.event.title,
        eventImage: eventData.event.coverWide,
        dateStart: eventData.event.dateStart,
        dateEnd: eventData.event.dateEnd,
        venue: eventData.event.venue,
        ticketType: "Ticket",
        quantity: 1,
        totalPaid: 0,
        qrToken,
      });
    }
  }, [searchParams, params.eventId, router, eventData]);

  if (isLoading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-6 pt-20 sm:px-6 lg:px-8">
        <BookingConfirmationCard booking={booking} />
      </div>
    </div>
  );
}

