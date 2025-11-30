"use client";

import { QRCodeSVG } from "qrcode.react";
import { Booking } from "@/types/booking";
import { cn, currencyFormatter, formatDateRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TicketCardProps = {
  booking: Booking;
  className?: string;
};

const TicketCard = ({ booking, className }: TicketCardProps) => {
  const handleDownload = () => {
    // Suggestion: replace with dedicated PDF export endpoint.
    window.print();
  };

  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl", className)}>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent-amber">Premium Ticket</p>
            <p className="text-2xl font-semibold text-white">
              {booking.event?.title ?? "Movigoo Experience"}
            </p>
            <p className="text-sm text-slate-300">
              {formatDateRange(booking.event?.dateStart ?? booking.createdAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p>{booking.event?.venue}</p>
            <p className="text-slate-400">{booking.event?.city}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Items</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              {booking.items.map((item) => (
                <li key={item.ticketTypeId} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.price.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                  <span>{currencyFormatter.format(item.quantity * item.price)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Paid</p>
            <p className="text-xl font-semibold text-white">
              {currencyFormatter.format(booking.totalAmount)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/20 bg-slate-900/60 p-4 text-sm text-slate-200">
          <QRCodeSVG
            value={booking.bookingId}
            size={140}
            bgColor="transparent"
            fgColor="#f8fafc"
          />
          <p>Scan at entry</p>
          <Button variant="subtle" className="w-full rounded-2xl" onClick={handleDownload}>
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;

