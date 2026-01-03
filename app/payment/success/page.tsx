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
  const [isProcessing, setIsProcessing] = useState(true); // Track if we're still processing/verifying

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

    let hasTriedManualReconciliation = false;

    async function fetchBookingStatus() {
      if (!user) {
        setBookingStatus({ error: "User not authenticated" });
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
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
          const bookingStatusUpper = (booking.bookingStatus || "").toUpperCase();
          const paymentStatusUpper = (booking.paymentStatus || "").toUpperCase();
          
          // Check if confirmed
          if (bookingStatusUpper === "CONFIRMED" && paymentStatusUpper === "SUCCESS") {
            setBookingStatus({
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
            });
            setIsProcessing(false); // No longer processing
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
            return;
          }
          
          // CRITICAL: Check for failed payment statuses immediately
          // ACTIVE, FAILED, CANCELLED mean payment is not successful
          const isFailedStatus = paymentStatusUpper === "ACTIVE" ||
                                paymentStatusUpper === "FAILED" ||
                                paymentStatusUpper === "CANCELLED" ||
                                bookingStatusUpper === "CANCELLED";
          
          if (isFailedStatus) {
            // Payment is clearly failed - show failed immediately
            console.log("[Payment Success] Payment status indicates failure:", paymentStatusUpper);
            setIsProcessing(false);
            setBookingStatus({
              bookingStatus: booking.bookingStatus,
              paymentStatus: booking.paymentStatus,
            });
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
            return;
          }
          
          // If booking is PENDING/INITIATED, we're still processing - don't show failed yet
          const isPending = bookingStatusUpper === "PENDING" || 
                           bookingStatusUpper === "" || 
                           paymentStatusUpper === "INITIATED" ||
                           paymentStatusUpper === "PENDING";
          
          if (isPending) {
            // Still processing - keep showing loading/processing state
            setIsProcessing(true);
            // Don't set loading to false yet - keep showing processing message
          }
          
          // If still pending, try manual reconciliation after first check (pollCount === 0)
          // or if we've polled a few times without success
          if (!hasTriedManualReconciliation && (pollCount === 0 || pollCount >= 3)) {
            hasTriedManualReconciliation = true;
            console.log("[Payment Success] Booking still pending, trying manual reconciliation");
            try {
              if (!user) {
                throw new Error("User not authenticated");
              }
              const reconcileToken = await user.getIdToken();
              const reconcileResponse = await fetch(`/api/bookings/${bookingId}/confirm-manual`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${reconcileToken}`,
                },
              });
              
              if (reconcileResponse.ok) {
                const reconcileData = await reconcileResponse.json();
                if (reconcileData.ok && reconcileData.bookingStatus === "CONFIRMED") {
                  // Manual reconciliation succeeded!
                  console.log("[Payment Success] Manual reconciliation succeeded!");
                  setIsProcessing(false); // No longer processing
                  setBookingStatus({
                    bookingStatus: "CONFIRMED",
                    paymentStatus: "SUCCESS",
                  });
                  setLoading(false);
                  if (pollInterval) clearInterval(pollInterval);
                  return;
                } else {
                  // Manual reconciliation returned failure - payment is not successful
                  console.log("[Payment Success] Manual reconciliation returned failure:", reconcileData);
                  const reconcilePaymentStatus = (reconcileData.paymentStatus || "").toUpperCase();
                  
                  // If reconciliation says payment is not successful, show failed immediately
                  if (!reconcileData.ok || reconcilePaymentStatus !== "SUCCESS") {
                    console.log("[Payment Success] Payment not successful, showing failed immediately");
                    setIsProcessing(false);
                    setBookingStatus({
                      bookingStatus: reconcileData.bookingStatus || booking.bookingStatus,
                      paymentStatus: reconcileData.paymentStatus || booking.paymentStatus,
                    });
                    setLoading(false);
                    if (pollInterval) clearInterval(pollInterval);
                    return;
                  }
                }
              } else {
                const errorData = await reconcileResponse.json().catch(() => ({}));
                console.error("[Payment Success] Manual reconciliation failed:", reconcileResponse.status, errorData);
              }
            } catch (reconcileError) {
              console.error("[Payment Success] Manual reconciliation error:", reconcileError);
            }
          }
          
          // If still pending and we haven't reached max polls, continue polling
          if (pollCount < maxPolls) {
            pollCount++;
            return; // Continue polling
          } else {
            // Max polls reached - check final status
            console.log("[Payment Success] Max polls reached, showing final status");
            const finalStatusUpper = (booking.bookingStatus || "").toUpperCase();
            const finalPaymentUpper = (booking.paymentStatus || "").toUpperCase();
            
            // Only mark as failed if it's actually failed/cancelled, not pending
            if (finalStatusUpper === "CANCELLED" || finalPaymentUpper === "FAILED") {
              setIsProcessing(false); // Actually failed
              setBookingStatus({
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
              });
            } else {
              // Still pending after all attempts - show as failed but with different message
              setIsProcessing(false);
              setBookingStatus({
                bookingStatus: booking.bookingStatus || "PENDING",
                paymentStatus: booking.paymentStatus || "PENDING",
                error: "Payment verification timeout",
              });
            }
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

  // STRICT DECISION LOGIC: Three states
  const bookingStatusUpper = bookingStatus?.bookingStatus?.toUpperCase() || "";
  const paymentStatusUpper = bookingStatus?.paymentStatus?.toUpperCase() || "";
  
  // STATE 1: CONFIRMED - Only if backend confirms
  const isConfirmed = bookingStatusUpper === "CONFIRMED" && paymentStatusUpper === "SUCCESS";
  
  // STATE 2: PROCESSING - Still verifying payment (PENDING/INITIATED only)
  // NOT processing if payment status is ACTIVE, FAILED, or CANCELLED
  const isStillProcessing = isProcessing && (loading || 
    (bookingStatusUpper === "PENDING" || 
     bookingStatusUpper === "" ||
     paymentStatusUpper === "INITIATED" ||
     paymentStatusUpper === "PENDING") &&
    paymentStatusUpper !== "ACTIVE" &&
    paymentStatusUpper !== "FAILED" &&
    paymentStatusUpper !== "CANCELLED");
  
  // STATE 3: FAILED - Actually failed (CANCELLED, FAILED, or timeout after all attempts)
  const isFailed = !isConfirmed && !isStillProcessing;

  // Show loading/processing while fetching or still processing
  if (loading || isStillProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-[#0B62FF] mx-auto" />
            <h1 className="text-2xl font-bold text-white">Verifying Payment</h1>
            <p className="text-slate-400">
              Please wait while we confirm your payment. This may take a few seconds...
            </p>
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
