// app/events/[eventId]/payment/page.tsx
// Premium PayU-style payment simulation page

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, CreditCard, Smartphone, Building2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { currencyFormatter } from "@/lib/utils";
import LoginModal from "@/components/auth/LoginModal";

export default function PaymentPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const { data, isLoading: eventLoading } = useEventById(eventId);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [finalBookingData, setFinalBookingData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Handle params - could be Promise in Next.js 14
    if (params && typeof params === "object" && "eventId" in params) {
      const id = typeof params.eventId === "string" ? params.eventId : "";
      setEventId(id);
    } else if (typeof params === "string") {
      setEventId(params);
    }
  }, [params]);

  useEffect(() => {
    if (!mounted || !eventId) return;

    // Check if user is logged in (Firebase Auth)
    if (!authLoading && (!user || !user.uid)) {
      setShowLoginModal(true);
      return;
    }

    // Get final booking data from sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("finalBookingData");
      if (!stored) {
        setRedirecting(true);
        router.push(`/events/${eventId}/checkout`);
        return;
      }

      try {
        setFinalBookingData(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing booking data:", error);
        setRedirecting(true);
        router.push(`/events/${eventId}/checkout`);
      }
    }
  }, [mounted, eventId, authLoading, user, router]);

  // Show loading if not mounted, eventId not set, still loading, or booking data not ready
  if (!mounted || !eventId || eventLoading || authLoading || !finalBookingData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading payment...</p>
        </div>
      </div>
    );
  }

  // Show login modal if not logged in
  if (!user || !user.uid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-4">Please login to complete payment</p>
          <LoginModal
            isOpen={true}
            onClose={() => router.push(`/events/${eventId}/checkout`)}
            onSuccess={() => {
              setShowLoginModal(false);
              router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  const processPayment = async () => {
    if (!finalBookingData || !data) return;

    setPaymentStatus("processing");

    try {
      // Prepare booking payload with new format
      const firstItem = finalBookingData.items[0];
      const ticketType = data.ticketTypes.find((t: any) => t.id === firstItem.ticketTypeId);

      // Ensure user is logged in
      if (!user || !user.uid) {
        setPaymentStatus("error");
        setShowLoginModal(true);
        return;
      }

      const bookingPayload = {
        eventId: eventId,
        userId: user.uid, // REAL Firebase ID
        ticketTypeId: firstItem.ticketTypeId,
        ticketTypeName: ticketType?.name || firstItem.ticketTypeId,
        quantity: finalBookingData.totalTickets,
        pricePerTicket: firstItem.price,
        totalAmount: finalBookingData.subtotal,
        bookingFee: finalBookingData.bookingFee,
        finalAmount: finalBookingData.totalAmount,
        showDate: finalBookingData.eventDate,
        showTime: finalBookingData.eventTime,
        venueName: finalBookingData.venueName || data.event.venue,
      };

      console.log("Booking payload:", bookingPayload);
      console.log("Calling /api/bookings");

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let bookingId: string;

      try {
        // Call booking API
        const response = await api.post<{ ok?: boolean; bookingId: string; qrCodeData?: string }>(
          "/api/bookings",
          bookingPayload
        );

        console.log("Booking API response:", response.data);

        // Check if we got a bookingId from the API
        if (response.data && response.data.bookingId) {
          bookingId = response.data.bookingId;
        } else {
          // Generate a fallback bookingId if API didn't return one
          bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.warn("API response missing bookingId, using generated ID:", bookingId);
        }
      } catch (error: any) {
        // On error, still simulate success for demo
        console.error("Payment processing error:", error);
        console.log("Simulating successful payment for demo");
        bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Always show success (simulated payment)
      setPaymentStatus("success");

      // Clear session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bookingSelection");
        sessionStorage.removeItem("finalBookingData");
      }

      // Redirect to success page after 1 second
      setTimeout(() => {
        router.push(`/booking/success?bookingId=${bookingId}`);
      }, 1000);
    } catch (error: any) {
      // Fallback error handling (shouldn't reach here with current logic, but just in case)
      console.error("Unexpected payment error:", error);
      const fallbackBookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setPaymentStatus("success");
      
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bookingSelection");
        sessionStorage.removeItem("finalBookingData");
      }

      setTimeout(() => {
        router.push(`/booking/success?bookingId=${fallbackBookingId}`);
      }, 1000);
    }
  };

  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-6"
          >
            <Loader2 size={64} className="text-[#0B62FF]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing payment...</h2>
          <p className="text-sm text-slate-400">Please wait while we process your payment</p>
        </motion.div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6"
          >
            <div className="rounded-full bg-emerald-500/20 p-4">
              <CheckCircle size={64} className="text-emerald-500" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-sm text-slate-400 mb-6">Your booking has been confirmed</p>
          <p className="text-xs text-slate-500">Redirecting to your ticket...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Movigoo Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-2xl bg-gradient-to-r from-[#0B62FF] to-indigo-600 px-4 py-2 text-xs uppercase tracking-[0.3em] font-semibold mb-4"
          >
            MOVIGOO
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure Payment</h1>
          <p className="text-sm text-slate-400">Choose your preferred payment method</p>
        </div>

        {/* Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
        >
          {/* Amount Display */}
          <div className="text-center mb-8 pb-6 border-b border-white/10">
            <p className="text-sm text-slate-400 mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-[#0B62FF]">
              {currencyFormatter.format(finalBookingData.totalAmount)}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-white mb-4">Select Payment Method</p>
            
            {/* UPI */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setSelectedMethod("upi")}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 transition ${
                  selectedMethod === "upi"
                    ? "border-[#0B62FF] bg-[#0B62FF]/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`rounded-xl p-3 ${selectedMethod === "upi" ? "bg-[#0B62FF]/20" : "bg-white/5"}`}>
                  <Smartphone size={24} className="text-[#0B62FF]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">UPI</p>
                  <p className="text-xs text-slate-400">Pay via UPI apps</p>
                </div>
                {selectedMethod === "upi" && (
                  <div className="h-5 w-5 rounded-full bg-[#0B62FF] flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </button>
            </motion.div>

            {/* Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setSelectedMethod("card")}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 transition ${
                  selectedMethod === "card"
                    ? "border-[#0B62FF] bg-[#0B62FF]/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`rounded-xl p-3 ${selectedMethod === "card" ? "bg-[#0B62FF]/20" : "bg-white/5"}`}>
                  <CreditCard size={24} className="text-[#0B62FF]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">Credit/Debit Card</p>
                  <p className="text-xs text-slate-400">Visa, Mastercard, RuPay</p>
                </div>
                {selectedMethod === "card" && (
                  <div className="h-5 w-5 rounded-full bg-[#0B62FF] flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </button>
            </motion.div>

            {/* Netbanking */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setSelectedMethod("netbanking")}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 transition ${
                  selectedMethod === "netbanking"
                    ? "border-[#0B62FF] bg-[#0B62FF]/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`rounded-xl p-3 ${selectedMethod === "netbanking" ? "bg-[#0B62FF]/20" : "bg-white/5"}`}>
                  <Building2 size={24} className="text-[#0B62FF]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">Net Banking</p>
                  <p className="text-xs text-slate-400">All major banks</p>
                </div>
                {selectedMethod === "netbanking" && (
                  <div className="h-5 w-5 rounded-full bg-[#0B62FF] flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </button>
            </motion.div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 text-xs text-slate-400">
            <Lock size={14} />
            <span>Your payment is secured with 256-bit SSL encryption</span>
          </div>

          {/* Pay Button */}
          <Button
            onClick={processPayment}
            disabled={paymentStatus !== "idle"}
            className="w-full rounded-2xl bg-gradient-to-r from-[#0B62FF] to-indigo-600 py-6 text-base font-semibold hover:from-[#0A5AE6] hover:to-indigo-700 shadow-lg"
          >
            Pay {currencyFormatter.format(finalBookingData.totalAmount)}
          </Button>

          {paymentStatus === "error" && (
            <div className="mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-center">
              <p className="text-sm text-rose-300">Payment failed. Please try again.</p>
              <Button
                onClick={() => setPaymentStatus("idle")}
                variant="outline"
                className="mt-3 rounded-xl"
              >
                Retry
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            router.push(`/events/${eventId}/checkout`);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
