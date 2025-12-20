"use client";

// app/payment/success/page.tsx
// Payment success page - Verifies payment and confirms booking

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const orderToken = searchParams.get("order_token");
  const bookingId = searchParams.get("bookingId") || searchParams.get("booking_id");

  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    bookingId?: string;
    ticketId?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setVerifying(false);
      setVerificationResult({ success: false, error: "Missing order ID" });
      return;
    }

    // Verify payment on page load
    const verifyPayment = async () => {
      try {
        console.log("Verifying payment for orderId:", orderId, "bookingId:", bookingId);
        
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, bookingId }),
        });

        const result = await response.json();
        console.log("Verification result:", result);

        setVerificationResult(result);
        
        if (result.success) {
          // Redirect to my-bookings after 2 seconds
          setTimeout(() => {
            router.push("/my-bookings");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setVerificationResult({
          success: false,
          error: error.message || "Failed to verify payment",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId, bookingId, router]);

  // CRITICAL: Block access if no order_id from Cashfree redirect
  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Access</h1>
            <p className="text-slate-400 mb-6">
              This page can only be accessed after completing payment through Cashfree.
            </p>
            <Link
              href="/events"
              className="inline-block rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while verifying
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-[#0B62FF] mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Confirming your booking...</h1>
              <p className="text-slate-400">
                Please wait while we verify your payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if verification failed
  if (verificationResult && !verificationResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Payment Verification Failed</h1>
              <p className="text-slate-400">
                {verificationResult.error || "We couldn't verify your payment. Please contact support."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/my-bookings"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
              >
                View My Bookings
              </Link>
              <Link
                href="/events"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10 transition"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Booking Confirmed!</h1>
            <p className="text-slate-400">
              Your payment has been verified and your booking is confirmed.
            </p>
          </div>

          {/* Order Details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl w-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-mono text-sm text-white">{orderId}</span>
              </div>
              {verificationResult?.ticketId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ticket ID</span>
                  <span className="font-mono text-sm text-white">{verificationResult.ticketId}</span>
                </div>
              )}
              {orderToken && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Order Token</span>
                  <span className="font-mono text-xs text-slate-300 truncate max-w-[200px]">
                    {orderToken}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Success Note */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-left w-full">
            <p className="text-sm text-green-200">
              <strong>Success!</strong> Your booking has been confirmed. You will receive a confirmation email shortly. Redirecting to your bookings...
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/my-bookings"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
            >
              View My Bookings
            </Link>
            <Link
              href="/events"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10 transition"
            >
              Browse More Events
            </Link>
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
