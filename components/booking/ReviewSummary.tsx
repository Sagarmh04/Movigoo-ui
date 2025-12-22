// components/booking/ReviewSummary.tsx
"use client";

import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import { currencyFormatter, formatDateRange } from "@/lib/utils";
import type { BookingState } from "@/lib/bookingState";
import { calculateTotals } from "@/lib/bookingState";

type ReviewSummaryProps = {
  booking: BookingState;
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function ReviewSummary({ booking }: ReviewSummaryProps) {
  const { subtotal, bookingFee, total } = calculateTotals(booking.tickets);
  const showSelection = booking.showSelection;

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="relative h-40 overflow-hidden rounded-xl border border-white/10 sm:h-48">
          <Image src={booking.eventImage} alt={booking.eventName} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">{booking.eventName}</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {showSelection ? (
              <>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#0B62FF]" />
                  <span>
                    {new Date(showSelection.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#0B62FF]" />
                  <span>
                    {formatTime(showSelection.startTime)} - {formatTime(showSelection.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#0B62FF]" />
                  <div>
                    <span>{showSelection.venueName}</span>
                    {showSelection.venueAddress && (
                      <span className="text-slate-400">, {showSelection.venueAddress}</span>
                    )}
                    {showSelection.locationName && (
                      <span className="text-slate-400">, {showSelection.locationName}</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#0B62FF]" />
                  {formatDateRange(booking.dateStart, booking.dateEnd)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#0B62FF]" />
                  {booking.venue}
                  {booking.city && <span className="text-slate-400">, {booking.city}</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Summary */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Ticket Summary</h3>
        <div className="space-y-3">
          {booking.tickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <p className="font-medium text-white">{ticket.typeName}</p>
                <p className="text-xs text-slate-400">Qty: {ticket.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">
                  {currencyFormatter.format(ticket.price)} × {ticket.quantity}
                </p>
                <p className="text-sm text-[#0B62FF]">
                  {currencyFormatter.format(ticket.price * ticket.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Booking Fee ({booking.tickets.reduce((sum, t) => sum + t.quantity, 0)} tickets × ₹7)</span>
            <span>{currencyFormatter.format(bookingFee)}</span>
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total Amount</span>
              <span className="text-[#0B62FF]">{currencyFormatter.format(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

