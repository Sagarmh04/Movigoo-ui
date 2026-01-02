"use client";

// app/payment/success/page.tsx
// Payment return page - TWO STATES ONLY: CONFIRMED or FAILED
// Backend booking status is the ONLY source of truth

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const bookingId = searchParams.get("bookingId") || searchParams.get("booking_id");
  
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<{
    bookingStatus?: string;
    paymentStatus?: string;
    error?: string;
  } | null>(null);

  // Fetch booking status from backend (ONLY source of truth)
  useEffect(() => {
    async function fetchBookingStatus() {
      if (!user) {
        setLoading(false);
        setBookingStatus({ error: "User not authenticated" });
        return;
      }

      // If no bookingId, we can't fetch - show failed
      if (!bookingId) {
        console.error("No bookingId in URL params");
        setBookingStatus({ error: "Booking ID not found" });
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const booking = await response.json();
          setBookingStatus({
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
          });
        } else {
          if (response.status === 404) {
            setBookingStatus({ error: "Booking not found" });
          } else if (response.status === 403) {
            setBookingStatus({ error: "Access denied" });
          } else {
            setBookingStatus({ error: "Failed to fetch booking status" });
          }
        }
      } catch (error) {
        console.error("Error fetching booking status:", error);
        setBookingStatus({ error: "Failed to fetch booking status" });
      } finally {
        setLoading(false);
      }
    }

    fetchBookingStatus();
  }, [bookingId, user]);

  // STRICT DECISION LOGIC: Only two states
  const bookingStatusUpper = bookingStatus?.bookingStatus?.toUpperCase() || "";
  const paymentStatusUpper = bookingStatus?.paymentStatus?.toUpperCase() || "";
  
  // STATE 1: CONFIRMED - Only if backend confirms
  const isConfirmed = bookingStatusUpper === "CONFIRMED" && paymentStatusUpper === "SUCCESS";
  
  // STATE 2: FAILED - Everything else (pending, failed, cancelled, error, etc.)
  const isFailed = !isConfirmed;

  // Show loading only while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-[#0B62FF] mx-auto" />
            <p className="text-slate-400">Checking payment status…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          {isConfirmed ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          )}

          {/* Status Message */}
          <div className="space-y-2">
            {isConfirmed ? (
              <>
                {/* STATE 1: CONFIRMED UI */}
                <h1 className="text-3xl font-bold text-white">Payment Successful</h1>
                <p className="text-slate-400">
                  Your booking is confirmed.
                </p>
              </>
            ) : (
              <>
                {/* STATE 2: FAILED UI */}
                <h1 className="text-3xl font-bold text-white">BOOKING FAILED</h1>
                <p className="text-slate-400">
                  BOOKING FAILED, RETRY BOOKING THE EVENT ONCE AGAIN
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {isConfirmed ? (
              <Link
                href="/my-bookings"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
              >
                My Bookings
              </Link>
            ) : (
              <Link
                href="/events"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
              >
                Browse Events
              </Link>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-slate-500 pt-4">
            If you have any questions, please contact{" "}
            <a href="mailto:support@movigoo.in" className="text-[#0B62FF] hover:underline">
              support@movigoo.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B62FF]" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
