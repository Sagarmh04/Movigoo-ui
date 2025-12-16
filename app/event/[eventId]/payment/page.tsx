// app/event/[eventId]/payment/page.tsx - STEP 4: Payment Screen
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/booking/StepIndicator";
import PaymentSimulator from "@/components/booking/PaymentSimulator";
import { getBookingState, type BookingState, clearBookingState } from "@/lib/bookingState";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function PaymentPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [booking, setBooking] = useState<BookingState | null>(null);

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
    if (!booking || !db) return;

    try {
      // Generate QR token
      const qrToken = `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Create booking document in Firestore
      const bookingData = {
        eventId: booking.eventId,
        eventName: booking.eventName,
        userId: user.id,
        tickets: booking.tickets,
        bookingFee: booking.bookingFee,
        totalPaid: booking.totalAmount,
        qrToken,
        status: "confirmed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to /users/{uid}/bookings/{bookingId}
      const bookingsRef = collection(db, "users", user.id, "bookings");
      const docRef = await addDoc(bookingsRef, bookingData);

      // Clear booking state
      clearBookingState();

      // Navigate to confirmation page with booking ID
      router.push(`/event/${params.eventId}/confirmation?bookingId=${docRef.id}&qrToken=${qrToken}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      // Still navigate to confirmation (for demo purposes)
      const qrToken = `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      clearBookingState();
      router.push(`/event/${params.eventId}/confirmation?bookingId=demo-${Date.now()}&qrToken=${qrToken}`);
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
          <PaymentSimulator totalAmount={booking.totalAmount} onPaymentSuccess={handlePaymentSuccess} />
        </div>
      </div>
    </div>
  );
}

