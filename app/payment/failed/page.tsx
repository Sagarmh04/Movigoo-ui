"use client";

// app/payment/failed/page.tsx
// Payment failure page - Shows FAILED state

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

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

          {/* Error Message - EXACT COPY */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">BOOKING FAILED</h1>
            <p className="text-slate-400">
              BOOKING FAILED, RETRY BOOKING THE EVENT ONCE AGAIN
            </p>
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
