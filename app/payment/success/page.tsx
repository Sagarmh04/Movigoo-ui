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
  // Polls for up to 30 seconds to wait for webhook confirmation
  useEffect(() => {
    if (!user || !bookingId) {
      setLoading(false);
      if (!user) {
        setBookingStatus({ error: "User not authenticated" });
      } else {
        setBookingStatus({ error: "Booking ID not found" });
      }
      return;
    }

    let pollCount = 0;
    const maxPolls = 15; // Poll for 30 seconds (15 * 2 seconds)
    let pollInterval: NodeJS.Timeout | null = null;

    async function fetchBookingStatus() {
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
          const bookingStatusUpper = (booking.bookingStatus || "").toUpperCase();
          const paymentStatusUpper = (booking.paymentStatus || "").toUpperCase();
          
          // Check if confirmed
          if (bookingStatusUpper === "CONFIRMED" && paymentStatusUpper === "SUCCESS") {
            setBookingStatus({
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
            });
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
            return;
          }
          
          // If still pending and we haven't reached max polls, continue polling
          if (pollCount < maxPolls) {
            pollCount++;
            return; // Continue polling
          } else {
            // Max polls reached - try manual reconciliation as fallback
            console.log("[Payment Success] Webhook didn't confirm, trying manual reconciliation");
            try {
              const reconcileResponse = await fetch(`/api/bookings/${bookingId}/confirm-manual`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });
              
              if (reconcileResponse.ok) {
                const reconcileData = await reconcileResponse.json();
                if (reconcileData.ok && reconcileData.bookingStatus === "CONFIRMED") {
                  // Manual reconciliation succeeded!
                  setBookingStatus({
                    bookingStatus: "CONFIRMED",
                    paymentStatus: "SUCCESS",
                  });
                  setLoading(false);
                  if (pollInterval) clearInterval(pollInterval);
                  return;
                }
              }
            } catch (reconcileError) {
              console.error("[Payment Success] Manual reconciliation failed:", reconcileError);
            }
            
            // Show current status (may still be pending if reconciliation failed)
            setBookingStatus({
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
            });
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          }
        } else {
          if (response.status === 404) {
            setBookingStatus({ error: "Booking not found" });
          } else if (response.status === 403) {
            setBookingStatus({ error: "Access denied" });
          } else {
            setBookingStatus({ error: "Failed to fetch booking status" });
          }
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error fetching booking status:", error);
        if (pollCount >= maxPolls) {
          setBookingStatus({ error: "Failed to fetch booking status" });
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      }
    }

    // Initial fetch
    fetchBookingStatus();

    // Poll every 2 seconds for up to 30 seconds
    pollInterval = setInterval(() => {
      if (pollCount < maxPolls) {
        fetchBookingStatus();
      } else {
        if (pollInterval) clearInterval(pollInterval);
      }
    }, 2000);

    // Cleanup
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
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
            <a href="mailto:movigootech@gmail.com" className="text-[#0B62FF] hover:underline">
              movigootech@gmail.com
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
