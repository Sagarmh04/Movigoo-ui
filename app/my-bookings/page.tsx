"use client";

import LayoutWrapper from "@/components/LayoutWrapper";
import BookingsPanel from "@/components/bookings/BookingsPanel";

export default function MyBookingsPage() {
  return (
    <LayoutWrapper>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Wallet</p>
          <h1 className="text-4xl font-semibold text-white">My premium passes</h1>
          <p className="text-slate-300">Tap a ticket for QR entry, downloads, or concierge chat.</p>
        </div>
        <BookingsPanel />
      </div>
    </LayoutWrapper>
  );
}

