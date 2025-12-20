"use client";

// app/payment/page.tsx
// Payment page - Initiates Cashfree redirect checkout

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiatePayment = async () => {
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

        // Redirect to Cashfree checkout
        // Cashfree Redirect Checkout requires a form submission with payment_session_id
        const checkoutUrl = data.checkoutUrl;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = checkoutUrl;

        const sessionIdInput = document.createElement("input");
        sessionIdInput.type = "hidden";
        sessionIdInput.name = "payment_session_id";
        sessionIdInput.value = data.paymentSessionId;
        form.appendChild(sessionIdInput);

        document.body.appendChild(form);
        form.submit();
      } catch (err: any) {
        console.error("Payment initiation error:", err);
        setError(err.message || "Failed to initiate payment");
        setLoading(false);
      }
    };

    initiatePayment();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#0B62FF] mb-4" />
          <p className="text-white text-lg font-medium">Redirecting to payment...</p>
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

  return null;
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

