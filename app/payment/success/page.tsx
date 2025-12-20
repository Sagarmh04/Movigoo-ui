"use client";

// app/payment/success/page.tsx
// Payment success page - Shows confirmation after successful Cashfree payment

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("order_id");
  const orderToken = searchParams.get("order_token");

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
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
            <p className="text-slate-400">
              Your payment has been processed successfully.
            </p>
          </div>

          {/* Order Details */}
          {orderId && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Order ID</span>
                  <span className="font-mono text-sm text-white">{orderId}</span>
                </div>
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
          )}

          {/* Important Note */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
            <p className="text-sm text-amber-200">
              <strong>Note:</strong> Payment status is being verified. You will receive a confirmation email once the booking is confirmed.
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

