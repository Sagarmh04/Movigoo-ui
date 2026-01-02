"use client";

// app/payment/success/page.tsx
// Payment return page - INFORMATION ONLY (DO NOT CONFIRM)
// Only webhook can confirm bookings

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const orderId = searchParams.get("order_id");
  const orderToken = searchParams.get("order_token");
  const bookingId = searchParams.get("bookingId") || searchParams.get("booking_id");
  
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<{
    bookingStatus?: string;
    paymentStatus?: string;
    error?: string;
  } | null>(null);

  // Fetch booking status ONLY (do not update/confirm)
  // Poll for status updates since webhook might not have processed yet
  useEffect(() => {
    async function fetchBookingStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      // If no bookingId, we can't fetch - show error
      if (!bookingId) {
        console.error("No bookingId in URL params");
        setBookingStatus({ error: "Booking ID not found in URL" });
        setLoading(false);
        return;
      }

      let retryCount = 0;
      const maxRetries = 15; // Poll for up to 15 seconds (webhook might take time)
      const pollInterval = 1000; // Check every 1 second

      async function pollBookingStatus() {
        if (!user) {
          setLoading(false);
          return;
        }
        
        try {
          const token = await user.getIdToken();
          console.log(`[Retry ${retryCount}] Fetching booking: ${bookingId}`);
          
          const response = await fetch(`/api/bookings/${bookingId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const booking = await response.json();
            console.log("✅ Booking status fetched:", {
              bookingId,
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
              retryCount,
            });
            
            setBookingStatus({
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
            });

            // Stop polling if we have a definitive status (CONFIRMED or FAILED/CANCELLED)
            const status = booking.bookingStatus?.toUpperCase();
            const paymentStatus = booking.paymentStatus?.toUpperCase();
            
            const isDefinitive = 
              (status === "CONFIRMED" && paymentStatus === "SUCCESS") ||
              status === "CANCELLED" ||
              paymentStatus === "FAILED";
            
            if (isDefinitive) {
              console.log("✅ Definitive status reached, stopping poll");
              setLoading(false);
              return;
            }
            
            // Continue polling if still PENDING/INITIATED
            if (retryCount >= maxRetries) {
              console.log("⏱️ Max retries reached, stopping poll");
              setLoading(false);
              return;
            }
          } else {
            console.error(`❌ Failed to fetch booking (${response.status}):`, await response.text());
            if (response.status === 404) {
              setBookingStatus({ error: "Booking not found" });
              setLoading(false);
              return;
            }
            if (response.status === 403) {
              setBookingStatus({ error: "Access denied to booking" });
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("❌ Error fetching booking status:", error);
          if (retryCount >= maxRetries) {
            setBookingStatus({ error: "Failed to fetch booking status" });
            setLoading(false);
            return;
          }
        }

        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(pollBookingStatus, pollInterval);
        } else {
          console.log("⏱️ Stopping poll after max retries");
          setLoading(false);
        }
      }

      pollBookingStatus();
    }

    fetchBookingStatus();
  }, [bookingId, user]);

  // Determine display state based on ACTUAL booking status
  // Only show success if BOTH bookingStatus is CONFIRMED AND paymentStatus is SUCCESS
  const bookingStatusUpper = bookingStatus?.bookingStatus?.toUpperCase() || "";
  const paymentStatusUpper = bookingStatus?.paymentStatus?.toUpperCase() || "";
  const isConfirmed = bookingStatusUpper === "CONFIRMED" && paymentStatusUpper === "SUCCESS";
  
  // Debug logging - always log when we have status
  useEffect(() => {
    if (bookingStatus && !loading) {
      console.log("🔍 UI Status Check:", {
        bookingStatus: bookingStatusUpper,
        paymentStatus: paymentStatusUpper,
        isConfirmed,
        raw: bookingStatus,
      });
    }
  }, [bookingStatus, loading, bookingStatusUpper, paymentStatusUpper, isConfirmed]);

  // Show loading state
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
                <h1 className="text-3xl font-bold text-white">Payment successful</h1>
                <p className="text-slate-400">
                  Your booking is confirmed
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white">Payment not completed</h1>
                <p className="text-slate-400">
                  Your payment was not completed. Please browse events and try booking again.
                </p>
              </>
            )}
          </div>

          {/* Order Details */}
          {(orderId || bookingId) && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl w-full">
              <div className="space-y-3">
                {orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Order ID</span>
                    <span className="font-mono text-sm text-white">{orderId}</span>
                  </div>
                )}
                {bookingId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Booking ID</span>
                    <span className="font-mono text-sm text-white">{bookingId}</span>
                  </div>
                )}
                {bookingStatus && !bookingStatus.error && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="text-sm font-medium text-white">
                      {bookingStatus.bookingStatus || "PENDING"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-left w-full">
              <p className="text-sm text-green-200">
                <strong>Success!</strong> Your booking is confirmed. You will receive a confirmation email shortly.
              </p>
            </div>
          )}

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
