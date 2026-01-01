"use client";

// app/payment/page.tsx
// Payment page - Initiates Cashfree hosted checkout using JS SDK
// SIMPLIFIED VERSION: No React state, direct usage of session ID

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("amount");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  const checkBookingAndStartPayment = useCallback(async () => {
    // Wait for auth to load
    if (authLoading) {
      console.log("Waiting for auth to load...");
      return;
    }
    if (!bookingId) {
      console.error("Missing bookingId");
      alert("Invalid payment link");
      return;
    }

    try {
      // Get Firebase ID token for authentication
      if (!user || typeof user.getIdToken !== "function") {
        console.error("User not authenticated");
        alert("Please log in to continue with payment");
        window.location.href = "/my-bookings";
        return;
      }

      let token: string;
      try {
        token = await user.getIdToken();
        if (!token) {
          throw new Error("Token is null");
        }
      } catch (tokenError: any) {
        console.error("Failed to get ID token:", tokenError);
        alert("Authentication error. Please log in again.");
        window.location.href = "/my-bookings";
        return;
      }

      // Frontend guard: fetch booking status first with auth
      const bookingRes = await fetch(`/api/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!bookingRes.ok) {
        console.error("Failed to fetch booking, status:", bookingRes.status);
        if (bookingRes.status === 401) {
          alert("Authentication required. Please log in again.");
          window.location.href = "/my-bookings";
        } else {
          alert("Booking not found");
        }
        return;
      }
      const booking = await bookingRes.json();

      // If already confirmed, redirect to My Bookings immediately
      if (booking.bookingStatus === "CONFIRMED" || booking.paymentStatus === "SUCCESS") {
        console.log("Booking already confirmed, redirecting to My Bookings");
        window.location.href = "/my-bookings";
        return;
      }

      // Proceed with payment initiation
      await startPayment();
    } catch (err: any) {
      console.error("Error checking booking:", err);
      alert("Failed to verify booking status");
    }
  }, [authLoading, bookingId, user]);

  async function startPayment() {
    try {
      // STEP 3: Log domain for Vercel debugging
      if (typeof window !== "undefined") {
        console.log("Running on domain:", window.location.origin);
      }

      // STEP 5: Production debug logs
      console.log("ENV:", process.env.NODE_ENV);

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
        console.error("Backend error:", data);
        alert("Failed to create payment session: " + (data.error || "Unknown error"));
        return;
      }

      // CRITICAL: Extract paymentSessionId and use it immediately
      const paymentSessionId = data.paymentSessionId;

      if (!paymentSessionId) {
        console.error("Backend did not return paymentSessionId:", data);
        alert("Backend did not return payment session ID");
        return;
      }

      console.log("RAW paymentSessionId:", paymentSessionId);
      
      // STEP 5: Production debug logs
      console.log("Session ID length:", paymentSessionId?.length);
      console.log("Session ID type:", typeof paymentSessionId);

      // CRITICAL: Determine mode from backend base URL
      // For LIVE: backend uses https://api.cashfree.com/pg → mode: "production"
      // For SANDBOX: backend uses https://sandbox.cashfree.com/pg → mode: "sandbox"
      // Check if we're on production domain to determine mode
      const isProduction = typeof window !== "undefined" && 
                          (window.location.hostname === "www.movigoo.in" || 
                           window.location.hostname === "movigoo.in");
      const cashfreeMode = isProduction ? "production" : "sandbox";
      console.log("Cashfree SDK mode:", cashfreeMode, "(auto-detected from domain)");

      // @ts-ignore - Cashfree SDK types not available
      const cashfree = (window as any).Cashfree({
        mode: cashfreeMode,
      });

      console.log("Opening Cashfree checkout");

      // CRITICAL: Use paymentSessionId directly, no state, no mutation
      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err: any) {
      console.error("Payment error:", err);
      alert("Payment failed: " + (err.message || "Unknown error"));
    }
  }

  // Start payment when both SDK and auth are ready
  useEffect(() => {
    if (sdkLoaded && !authLoading) {
      checkBookingAndStartPayment();
    }
  }, [sdkLoaded, authLoading, checkBookingAndStartPayment]);

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Cashfree SDK loaded");
          setSdkLoaded(true);
        }}
        onError={() => {
          console.error("Cashfree SDK failed to load");
          alert("Cashfree SDK failed to load. Please refresh the page.");
        }}
      />

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#0B62FF] mb-4" />
          <p className="text-white text-lg font-medium">Redirecting to secure payment…</p>
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
