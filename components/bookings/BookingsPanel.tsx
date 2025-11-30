"use client";

import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TicketCard from "@/components/TicketCard";
import { Button } from "@/components/ui/button";

const BookingsPanel = () => {
  const { user } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useBookings(user.id);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" />;
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
        <p className="text-sm text-rose-100">Couldn’t load bookings.</p>
        <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const bookings = data?.bookings ?? [];

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <motion.div
          key={booking.bookingId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">Booking #{booking.bookingId}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="rounded-full border border-white/10">
                <Download size={16} />
                Download
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full border border-white/10">
                <Share2 size={16} />
                Share
              </Button>
            </div>
          </div>
          <TicketCard booking={booking} />
        </motion.div>
      ))}
      {bookings.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No bookings yet. Discover an experience on the home page.
        </div>
      )}
    </div>
  );
};

export default BookingsPanel;

