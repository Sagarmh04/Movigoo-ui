// app/event/[eventId]/review/page.tsx - STEP 3: Review Before Payment
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/booking/StepIndicator";
import ReviewSummary from "@/components/booking/ReviewSummary";
import LoginModal from "@/components/booking/LoginModal";
import { Button } from "@/components/ui/button";
import { getBookingState, type BookingState } from "@/lib/bookingState";

export default function ReviewPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const state = getBookingState();
    if (!state || !state.eventId || state.eventId !== params.eventId || !state.tickets || state.tickets.length === 0) {
      // Redirect to event details if no booking state
      router.push(`/event/${params.eventId}`);
      return;
    }
    setBooking(state as BookingState);
  }, [params.eventId, router]);

  const handleLoginSuccess = (method: string) => {
    setShowLoginModal(false);
    // Navigate to payment page
    router.push(`/event/${params.eventId}/payment`);
  };

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={3} />
        </div>

        {/* Review Summary */}
        <div className="flex-1 space-y-6 overflow-y-auto pb-4">
          <h2 className="text-2xl font-semibold text-white">Review Your Booking</h2>
          <ReviewSummary booking={booking} />
        </div>

        {/* Sticky Bottom Bar - Mobile */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl sm:relative sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
          <div className="mx-auto w-full max-w-3xl">
            <Button
              onClick={() => setShowLoginModal(true)}
              className="w-full rounded-full bg-[#0B62FF] py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] sm:rounded-2xl sm:py-4 sm:text-lg"
            >
              Login to Proceed
            </Button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

