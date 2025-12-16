// app/event/[eventId]/confirmation/page.tsx - STEP 5: Booking Confirmation
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingById } from "@/lib/bookingService";
import BookingConfirmationCard from "@/components/booking/BookingConfirmationCard";

export default function ConfirmationPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    const qrCode = searchParams.get("qrCode");

    if (!bookingId || !qrCode) {
      // Redirect if missing params
      router.push(`/event/${params.eventId}`);
      return;
    }

    // Fetch booking from Firestore
    async function fetchBooking() {
      try {
        if (!bookingId) return;
        const bookingData = await getBookingById(bookingId);
        if (bookingData) {
          setBooking({
            bookingId: bookingId,
            eventName: bookingData.eventTitle,
            eventImage: bookingData.coverUrl || "/placeholder-event.jpg",
            date: bookingData.date,
            time: bookingData.time,
            venue: bookingData.venueName,
            ticketType: bookingData.ticketType,
            quantity: bookingData.quantity,
            totalPaid: bookingData.totalAmount,
            qrToken: bookingData.qrCodeData,
          });
        } else {
          // Booking not found, redirect
          router.push(`/event/${params.eventId}`);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        router.push(`/event/${params.eventId}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [searchParams, params.eventId, router]);

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

