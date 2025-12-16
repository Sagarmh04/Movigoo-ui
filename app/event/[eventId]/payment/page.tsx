// app/event/[eventId]/payment/page.tsx - STEP 4: Payment Screen
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/booking/StepIndicator";
import PaymentSimulator from "@/components/booking/PaymentSimulator";
import { getBookingState, type BookingState, clearBookingState } from "@/lib/bookingState";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import api from "@/lib/api";

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

  const handlePaymentSuccess = async () => {
    if (!booking) {
      console.error("Missing booking data");
      return;
    }

    if (!user || !user.id) {
      alert("Please login to complete booking");
      router.push(`/event/${params.eventId}/review`);
      return;
    }

    try {
      setIsProcessing(true);

      // Extract date and time from event
      const eventDate = new Date(booking.dateStart).toLocaleDateString();
      const eventTime = new Date(booking.dateStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Prepare booking payload for API
      const userDisplayName = (user as any).name || (user as any).email || (user as any).displayName || null;
      const bookingPayload = {
        userId: user.id,
        userName: userDisplayName,
        eventId: booking.eventId,
        eventTitle: booking.eventName,
        coverUrl: booking.eventImage,
        venueName: booking.venue,
        date: eventDate,
        time: eventTime,
        ticketType: booking.tickets.map((t) => `${t.typeName} (${t.quantity})`).join(", "),
        quantity: booking.tickets.reduce((sum, t) => sum + t.quantity, 0),
        price: booking.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0),
        bookingFee: booking.bookingFee,
        totalAmount: booking.totalAmount,
      };

      console.log("Booking payload:", bookingPayload);
      console.log("Calling /api/bookings");

      // Call API route
      const response = await api.post("/api/bookings", bookingPayload);

      console.log("Booking API response:", response.data);

      if (!response.data.ok) {
        throw new Error(response.data.error || "Booking failed");
      }

      // Clear booking state
      clearBookingState();

      // Navigate to success page
      router.push(`/booking/success?bookingId=${response.data.bookingId}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to create booking. Please try again.";
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

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

        {/* Payment Simulator */}
        <div className="flex-1 space-y-6 overflow-y-auto pb-4">
          <h2 className="text-2xl font-semibold text-white">Complete Payment</h2>
          <PaymentSimulator 
            totalAmount={booking.totalAmount} 
            onPaymentSuccess={handlePaymentSuccess}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

