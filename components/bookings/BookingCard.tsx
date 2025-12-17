// components/bookings/BookingCard.tsx
// Compact & Clean Booking Card Component (BookMyShow Style)

"use client";

import Image from "next/image";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { motion } from "framer-motion";

type BookingCardProps = {
  booking: {
    id?: string;
    bookingId?: string;
    eventTitle?: string;
    eventDetails?: {
      title?: string;
      coverPortraitUrl?: string;
      coverWideUrl?: string;
    };
    showDate?: string;
    date?: string;
    showTime?: string;
    time?: string;
    venueName?: string;
    items?: Array<{
      ticketTypeId?: string;
      typeName?: string;
      ticketType?: string;
      quantity?: number;
    }>;
    totalAmount?: number;
  };
  onClick?: () => void;
};

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  const event = booking?.eventDetails;
  const ticket = booking?.items?.[0];
  
  // Get event title
  const eventTitle = event?.title || booking?.eventTitle || "Event";
  
  // Get event image
  const eventImage = event?.coverPortraitUrl || event?.coverWideUrl || "/placeholder-event.jpg";
  
  // Get date and time
  const date = booking?.showDate || booking?.date || "TBA";
  const time = booking?.showTime || booking?.time || "TBA";
  
  // Get venue
  const venue = booking?.venueName || "TBA";
  
  // Get ticket type
  const ticketType = ticket?.typeName || ticket?.ticketType || "General";
  const quantity = ticket?.quantity || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="
        flex gap-4 
        bg-white/5 dark:bg-neutral-900/50 
        rounded-2xl 
        p-4 
        shadow-lg shadow-black/20 
        border border-white/10 
        hover:border-[#0B62FF]/50 
        hover:shadow-xl hover:shadow-[#0B62FF]/10
        transition-all 
        cursor-pointer
        backdrop-blur-xl
      "
    >
      {/* Event Poster */}
      <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/10">
        <Image
          src={eventImage}
          alt={eventTitle}
          fill
          sizes="(max-width: 768px) 80px, 96px"
          className="object-cover"
        />
      </div>

      {/* Right Section */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="font-semibold text-base sm:text-lg text-white line-clamp-1 mb-2">
            {eventTitle}
          </h3>

          <div className="flex items-center text-sm text-slate-400 gap-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-[#0B62FF] flex-shrink-0" />
            <span className="line-clamp-1">{date} · {time}</span>
          </div>

          <div className="flex items-center text-sm text-slate-400 gap-1.5 mb-2">
            <MapPin className="w-4 h-4 text-[#0B62FF] flex-shrink-0" />
            <span className="line-clamp-1">{venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <Ticket className="w-4 h-4 text-[#0B62FF] flex-shrink-0" />
            <span className="line-clamp-1">{ticketType}</span>
            {quantity > 1 && (
              <span className="text-slate-500">× {quantity}</span>
            )}
          </div>

          <button 
            className="text-[#0B62FF] text-sm font-semibold hover:text-[#0A5AE6] transition-colors flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Ticket
            <span className="text-xs">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

