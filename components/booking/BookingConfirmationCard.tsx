// components/booking/BookingConfirmationCard.tsx
"use client";

import Image from "next/image";
import { Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { currencyFormatter, formatDateRange } from "@/lib/utils";

type BookingConfirmationCardProps = {
  booking: {
    bookingId: string;
    eventName: string;
    eventImage: string;
    date: string;
    time: string;
    venue: string;
    ticketType: string;
    quantity: number;
    totalPaid: number;
    qrToken: string;
  };
};

export default function BookingConfirmationCard({ booking }: BookingConfirmationCardProps) {
  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log("Download ticket");
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `My ticket for ${booking.eventName}`,
        text: `Check out my ticket!`,
      });
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Confirmation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B62FF]/10 via-transparent to-purple-500/10" />
        
        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Success Badge */}
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Booking Confirmed!</h2>
            <p className="mt-2 text-sm text-slate-300">Your tickets are ready</p>
          </div>

          {/* Event Image */}
          <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10">
            <Image src={booking.eventImage} alt={booking.eventName} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
          </div>

          {/* Event Details */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">{booking.eventName}</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>{booking.date} at {booking.time}</p>
              <p>{booking.venue}</p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-slate-400">Ticket Type</p>
                <p className="font-medium text-white">{booking.ticketType}</p>
                <p className="text-xs text-slate-400 mt-1">Quantity: {booking.quantity}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wider text-slate-400">Entry Pass</p>
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG
                value={booking.qrToken}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#0B62FF"
              />
            </div>
            <p className="text-xs text-slate-400">Booking ID: {booking.bookingId.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Total Paid */}
          <div className="flex items-center justify-between rounded-2xl border border-[#0B62FF]/30 bg-[#0B62FF]/10 p-4">
            <span className="text-sm font-medium text-slate-300">Total Paid</span>
            <span className="text-2xl font-bold text-[#0B62FF]">
              {currencyFormatter.format(booking.totalPaid)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full rounded-2xl border-white/10 bg-white/5 py-6 text-white hover:bg-white/10"
            >
              <Download size={18} className="mr-2" />
              Download Ticket
            </Button>
            <Button
              onClick={() => window.location.href = "/my-bookings"}
              className="w-full rounded-2xl bg-[#0B62FF] py-6 text-white hover:bg-[#0A5AE6]"
            >
              View My Bookings
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

