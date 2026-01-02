"use client";

// app/payment/failed/page.tsx
// Payment failure page - Shows error after failed Cashfree payment

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("order_id");
  const errorMessage = searchParams.get("error") || searchParams.get("message");

  useEffect(() => {
    // Simulate loading to allow redirect params to be read
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B62FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Payment not completed</h1>
            <p className="text-slate-400">
              Your payment was not completed,  booking was not confirmed. Please try booking the event again.
            </p>
          </div>

          {/* Error Details */}
          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
              <p className="text-sm text-red-200">{errorMessage}</p>
            </div>
          )}

          {/* Order ID if available */}
          {orderId && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-mono text-sm text-white">{orderId}</span>
              </div>
            </div>
          )}

          {/* Common Reasons */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-white mb-3">
              Common reasons for payment failure:
            </h3>
            <ul className="space-y-2 text-sm text-slate-400 list-disc list-inside">
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details or expiry date</li>
              <li>Network connectivity issues</li>
              <li>Bank transaction limits exceeded</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/events"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
            >
              Browse Events
            </Link>
          </div>

          {/* Help Text */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
            <p className="text-sm text-amber-200">
              <strong>Need help?</strong> If the problem persists, please contact{" "}
              <a href="mailto:support@movigoo.in" className="underline">
                support@movigoo.in
              </a>{" "}
              with your Order ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B62FF]" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

