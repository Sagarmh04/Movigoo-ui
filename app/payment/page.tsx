"use client";

// app/payment/page.tsx
// Payment page - Initiates Cashfree hosted checkout using JS SDK
// BULLETPROOF VERSION: Waits for SDK to load before opening checkout

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Loader2, AlertCircle } from "lucide-react";

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("amount");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Create Cashfree payment session (backend)
  useEffect(() => {
    async function createSession() {
      try {
        console.log("Creating Cashfree payment session...");

        const res = await fetch("/api/payments/cashfree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingId || `booking_${Date.now()}`,
            amount: amount ? parseFloat(amount) : 0,
            email: email || "test@movigoo.in",
            phone: phone || "9999999999",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create session");
        }

        // CRITICAL: Use paymentSessionId exactly as returned, no modification
        const paymentSessionId = data.paymentSessionId;

        if (!paymentSessionId) {
          throw new Error("Backend did not return paymentSessionId");
        }

        // Safety log to verify raw session ID (EXACT format as required)
        console.log("RAW paymentSessionId from backend:", paymentSessionId);

        // CRITICAL: Set session ID directly without any concatenation or mutation
        setSessionId(paymentSessionId);
        setLoading(false);
      } catch (err: any) {
        console.error("Payment initiation error:", err);
        setError(err.message || "Payment failed. Please try again.");
        setLoading(false);
      }
    }

    if (amount) {
      createSession();
    } else {
      setError("Amount is required");
      setLoading(false);
    }
  }, [bookingId, amount, email, phone]);

  // 2️⃣ Open Cashfree checkout ONLY when SDK + session are ready
  useEffect(() => {
    if (!sdkReady || !sessionId) return;

    try {
      // CRITICAL: Verify session ID is clean before using
      console.log("Opening Cashfree checkout with session:", sessionId);
      console.log("Session ID type:", typeof sessionId);
      console.log("Session ID length:", sessionId.length);

      // @ts-ignore - Cashfree SDK types not available
      const cashfree = (window as any).Cashfree({
        mode: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      });

      console.log("Opening Cashfree checkout…");

      // CRITICAL: Pass session ID directly without any modification
      cashfree.checkout({
        paymentSessionId: sessionId, // MUST be clean, unmodified value
        redirectTarget: "_self",
      });
    } catch (err: any) {
      console.error("Error opening Cashfree checkout:", err);
      setError("Failed to open payment gateway. Please try again.");
    }
  }, [sdkReady, sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#0B62FF] mb-4" />
          <p className="text-white text-lg font-medium">Preparing secure payment...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Cashfree SDK loaded");
          setSdkReady(true);
        }}
        onError={() => {
          console.error("Cashfree SDK failed to load");
          setError("Cashfree SDK failed to load. Please refresh the page.");
        }}
      />

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#0B62FF] mb-4" />
          <p className="text-white text-lg font-medium">Redirecting to secure payment...</p>
          <p className="text-slate-400 text-sm mt-2">Cashfree checkout will open shortly</p>
        </div>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B62FF]" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
