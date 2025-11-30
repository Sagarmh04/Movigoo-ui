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
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Checkout</p>
        <h1 className="text-4xl font-semibold text-white">Secure payment</h1>
        <p className="text-slate-300">
          Protected by bank-grade encryption. Movigoo never stores your card number.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <CreditCard />
            <p className="text-lg font-semibold text-white">Payment method</p>
          </div>
          <div className="space-y-4">
            <label className="space-y-2 text-sm text-slate-200">
              Card holder
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3" placeholder="Aarav Kapoor" />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Card number
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3" placeholder="4242 4242 4242 4242" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm text-slate-200">
                Expiry
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3" placeholder="08 / 27" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                CVV
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 p-3" placeholder="123" />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <ShieldCheck className="text-emerald-300" size={16} />
            3D Secure with biometric fallback.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => startPayment()} className="flex-1 rounded-2xl">
              Pay ₹23,997
            </Button>
            <Button variant="outline" onClick={() => startPayment(true)} className="rounded-2xl">
              Simulate fail
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          {status === "processing" && <ProcessingLoader label="Authorising card" />}
          {status === "success" && <PaymentSuccessAnimation booking={{ ...mockBooking, status: "confirmed" }} />}
          {status === "failure" && <PaymentFailureAnimation onRetry={() => setStatus("idle")} />}
          {status === "idle" && <TicketCard booking={mockBooking} />}
        </div>
      </div>
    </div>
  );
}

