"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import TicketCard from "@/components/TicketCard";
import type { Booking } from "@/types/booking";

const confetti = Array.from({ length: 14 });

const PaymentSuccessAnimation = ({
  booking,
  onDone
}: {
  booking: Booking;
  onDone?: () => void;
}) => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
      <div className="absolute inset-0 -z-10 opacity-30">
        {confetti.map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-2 w-6 rounded-full bg-white/80"
            initial={{
              x: Math.random() * 300 - 150,
              y: -20,
              rotate: Math.random() * 180
            }}
            animate={{ y: 220 }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: index * 0.1 }}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <CheckCircle2 size={48} className="text-emerald-300" />
        <div>
          <p className="text-xl font-semibold text-white">Payment confirmed</p>
          <p className="text-sm text-emerald-100">Booking ID #{booking.bookingId}</p>
        </div>
      </div>
    </div>
    <TicketCard booking={booking} />
    {onDone && (
      <button
        onClick={onDone}
        className="w-full rounded-2xl border border-white/20 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Close
      </button>
    )}
  </div>
);

export default PaymentSuccessAnimation;

