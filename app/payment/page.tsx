"use client";

// app/payment/page.tsx
// Payment page - Initiates Cashfree hosted checkout using JS SDK

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Loader2, AlertCircle } from "lucide-react";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createSession = async () => {
      try {
        // Get payment parameters from URL
        const bookingId = searchParams.get("bookingId");
        const amount = searchParams.get("amount");
        const customerEmail = searchParams.get("email");
        const customerName = searchParams.get("name");
        const customerPhone = searchParams.get("phone") || "";

        // Validate required parameters
        if (!bookingId || !amount || !customerEmail || !customerName) {
          setError("Missing required payment parameters");
          setLoading(false);
          return;
        }

        console.log("Creating Cashfree payment session...");

        // Call backend API to create payment session
        const response = await fetch("/api/payments/cashfree", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            amount: parseFloat(amount),
            customerEmail,
            customerName,
            customerPhone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create payment session");
        }

        console.log("Cashfree session created:", data.paymentSessionId);
        setSessionId(data.paymentSessionId);
        setLoading(false);
      } catch (err: any) {
        console.error("Payment initiation error:", err);
        setError(err.message || "Failed to initiate payment");
        setLoading(false);
      }
    };

    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!sessionId) return;

    // Wait for Cashfree SDK to load
    const checkSDK = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Cashfree) {
        clearInterval(checkSDK);
        openCashfreeCheckout();
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkSDK);
      if (!(window as any).Cashfree) {
        setError("Cashfree SDK failed to load. Please refresh the page.");
      }
    }, 10000);

    return () => {
      clearInterval(checkSDK);
      clearTimeout(timeout);
    };
  }, [sessionId]);

  const openCashfreeCheckout = () => {
    if (!sessionId) return;

    try {
      console.log("Opening Cashfree checkout with session:", sessionId);

      const cashfree = (window as any).Cashfree({
        mode: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_self",
      });
    } catch (err: any) {
      console.error("Error opening Cashfree checkout:", err);
      setError("Failed to open payment gateway. Please try again.");
    }
  };

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
            onClick={() => router.push("/")}
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
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="beforeInteractive" />
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
