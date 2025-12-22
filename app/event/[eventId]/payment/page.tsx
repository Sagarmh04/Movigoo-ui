// app/event/[eventId]/payment/page.tsx - STEP 4: Payment Screen (Cashfree)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import StepIndicator from "@/components/booking/StepIndicator";
import { getBookingState, type BookingState } from "@/lib/bookingState";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function PaymentPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const state = getBookingState();
    if (!state || !state.eventId || state.eventId !== params.eventId || !state.tickets || state.tickets.length === 0) {
      // Redirect to event details if no booking state
      router.push(`/event/${params.eventId}`);
      return;
    }
    setBooking(state as BookingState);
  }, [params.eventId, router]);

  useEffect(() => {
    if (!booking || !user || !user.id || isProcessing) return;

    // Redirect to Cashfree payment
    const initiatePayment = async () => {
      try {
        setIsProcessing(true);

        // Extract date and time from show selection or fallback to event
        const showSelection = booking.showSelection;
        const eventDate = showSelection
          ? showSelection.date
          : new Date(booking.dateStart).toISOString().split("T")[0];
        const eventTime = showSelection
          ? showSelection.startTime
          : new Date(booking.dateStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Create pending booking first
        const userDisplayName = (user as any).name || (user as any).email || (user as any).displayName || null;
        const bookingPayload = {
          userId: user.id,
          userName: userDisplayName,
          eventId: booking.eventId,
          eventTitle: booking.eventName,
          coverUrl: booking.eventImage,
          venueName: showSelection?.venueName || booking.venue,
          date: eventDate,
          time: eventTime,
          ticketType: booking.tickets.map((t) => `${t.typeName} (${t.quantity})`).join(", "),
          quantity: booking.tickets.reduce((sum, t) => sum + t.quantity, 0),
          price: booking.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0),
          bookingFee: booking.bookingFee,
          totalAmount: booking.totalAmount,
          items: booking.tickets.map((t) => ({
            ticketTypeId: t.ticketId,
            quantity: t.quantity,
            price: t.price,
          })),
          userEmail: (user as any).email || null,
          // Show selection metadata
          locationId: showSelection?.locationId || null,
          locationName: showSelection?.locationName || booking.city || null,
          venueId: showSelection?.venueId || null,
          dateId: showSelection?.dateId || null,
          showId: showSelection?.showId || null,
          showTime: showSelection?.startTime || eventTime,
          showEndTime: showSelection?.endTime || null,
          venueAddress: showSelection?.venueAddress || null,
        };

        console.log("Creating pending booking...");
        const bookingResponse = await fetch("/api/bookings/create-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload),
        });

        const bookingResult = await bookingResponse.json();

        if (!bookingResponse.ok || !bookingResult.bookingId) {
          console.error("Failed to create pending booking:", bookingResult);
          alert("Failed to create booking. Please try again.");
          setIsProcessing(false);
          return;
        }

        console.log("Pending booking created:", bookingResult.bookingId);

        // Redirect to Cashfree payment page
        const paymentParams = new URLSearchParams({
          bookingId: bookingResult.bookingId,
          amount: booking.totalAmount.toString(),
          email: (user as any).email || "",
          name: userDisplayName || "",
          phone: (user as any).phoneNumber || "",
        });

        router.push(`/payment?${paymentParams.toString()}`);
      } catch (error: any) {
        console.error("Error initiating payment:", error);
        alert("Failed to initiate payment. Please try again.");
        setIsProcessing(false);
      }
    };

    initiatePayment();
  }, [booking, user, router, isProcessing]);

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-6 pt-20 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={3} />
        </div>

        {/* Payment Loading */}
        <div className="flex-1 space-y-6 overflow-y-auto pb-4">
          <h2 className="text-2xl font-semibold text-white">Redirecting to Payment</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-300">Preparing your payment...</p>
            <p className="text-sm text-slate-400 mt-2">You will be redirected to Cashfree checkout shortly</p>
          </div>
        </div>
      </div>
    </div>
  );
}

