"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import PaymentSuccessAnimation from "@/components/PaymentSuccessAnimation";
import PaymentFailureAnimation from "@/components/PaymentFailureAnimation";
import ProcessingLoader from "@/components/ProcessingLoader";
import { Button } from "@/components/ui/button";
import TicketCard from "@/components/TicketCard";
import { Booking } from "@/types/booking";

const mockBooking: Booking = {
  bookingId: "demo-123",
  userId: "organizer-abc",
  eventId: "event-aurora",
  items: [
    { ticketTypeId: "aurora-vip", quantity: 2, price: 8999 },
    { ticketTypeId: "aurora-gold", quantity: 1, price: 5999 }
  ],
  status: "pending",
  totalAmount: 23997,
  createdAt: new Date().toISOString(),
  event: {
    title: "Aurora Chroma Live Experience",
    venue: "NMACC Grand Theatre",
    city: "Mumbai",
    dateStart: "2025-08-12T19:00:00+05:30"
  }
};

export default function CheckoutPage() {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failure">("idle");

  const startPayment = (shouldFail = false) => {
    setStatus("processing");
    setTimeout(() => setStatus(shouldFail ? "failure" : "success"), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 sm:space-y-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Checkout</p>
        <h1 className="text-2xl font-semibold text-white sm:text-4xl">Secure payment</h1>
        <p className="text-sm text-slate-300 sm:text-base">
          Protected by bank-grade encryption. Movigoo never stores your card number.
        </p>
      </div>
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:space-y-6 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="sm:w-6 sm:h-6" />
            <p className="text-base font-semibold text-white sm:text-lg">Payment method</p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <label className="space-y-2 text-xs text-slate-200 sm:text-sm">
              Card holder
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Aarav Kapoor" />
            </label>
            <label className="space-y-2 text-xs text-slate-200 sm:text-sm">
              Card number
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="4242 4242 4242 4242" />
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <label className="space-y-2 text-xs text-slate-200 sm:text-sm">
                Expiry
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="08 / 27" />
              </label>
              <label className="space-y-2 text-xs text-slate-200 sm:text-sm">
                CVV
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="123" />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <ShieldCheck className="text-emerald-300" size={14} />
            <span className="sm:text-sm">3D Secure with biometric fallback.</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button onClick={() => startPayment()} className="flex-1 rounded-2xl text-sm sm:text-base">
              Pay ₹23,997
            </Button>
            <Button variant="outline" onClick={() => startPayment(true)} className="rounded-2xl text-sm sm:text-base">
              Simulate fail
            </Button>
          </div>
        </div>
        <div className="space-y-4 sm:space-y-6">
          {status === "processing" && <ProcessingLoader label="Authorising card" />}
          {status === "success" && <PaymentSuccessAnimation booking={{ ...mockBooking, status: "confirmed" }} />}
          {status === "failure" && <PaymentFailureAnimation onRetry={() => setStatus("idle")} />}
          {status === "idle" && <TicketCard booking={mockBooking} />}
        </div>
      </div>
    </div>
  );
}

