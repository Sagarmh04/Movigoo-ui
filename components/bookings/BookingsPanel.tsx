"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Share2, Chrome, Mail, Phone } from "lucide-react";
import { useUserBookings } from "@/hooks/useUserBookings";
import { fakeGetUser, loginWithGoogle } from "@/lib/fakeAuth";
import TicketCard from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";

const BookingsPanel = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { bookings, loading, error } = useUserBookings(user?.id || null);

  useEffect(() => {
    setMounted(true);
    setUser(fakeGetUser());
  }, []);

  const handleLogin = () => {
    // Use explicit login function - no auto-login
    loginWithGoogle();
    setUser(fakeGetUser());
  };

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" />;
  }

  // Show login prompt if no user
  if (!user || !user.id) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Login to see your bookings</h2>
        <p className="text-sm text-slate-400 mb-6">Please login to view your premium passes</p>
        <div className="space-y-3 max-w-md mx-auto">
          <Button
            onClick={handleLogin}
            className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
          >
            <Chrome size={20} className="text-[#0B62FF]" />
            Continue with Google
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
          >
            <Mail size={20} className="text-[#0B62FF]" />
            Continue with Email
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
          >
            <Phone size={20} className="text-[#0B62FF]" />
            Continue with Mobile
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
        <p className="text-sm text-rose-100">Couldn&apos;t load bookings.</p>
        <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Filter bookings to only show current user's bookings
  const userBookings = bookings.filter((booking) => booking.userId === user.id);

  return (
    <div className="space-y-6">
      {userBookings.map((booking: any) => {
        // Transform booking data to match TicketCard's expected Booking type
        const transformedBooking: Booking = {
          bookingId: booking.bookingId || booking.id || "",
          userId: booking.userId || user.id || "",
          eventId: booking.eventId || "",
          status: (booking.status || "confirmed") as "pending" | "confirmed" | "requires_payment" | "failed",
          totalAmount: booking.totalAmount || 0,
          createdAt: booking.createdAt || new Date().toISOString(),
          event: {
            title: booking.eventTitle || "Event",
            dateStart: booking.date || booking.createdAt || new Date().toISOString(),
            venue: booking.venueName || "TBA",
            city: booking.city || "",
          },
          items: booking.items || (booking.ticketTypeId ? [{
            ticketTypeId: booking.ticketTypeId || "",
            quantity: booking.quantity || 1,
            price: booking.pricePerTicket || (booking.totalAmount || 0) / (booking.quantity || 1),
          }] : []),
        };

        return (
          <motion.div
            key={booking.bookingId || booking.id || Math.random()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-300">Booking #{(booking.bookingId || booking.id || "N/A")?.slice(0, 8).toUpperCase()}</p>
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
            <TicketCard booking={transformedBooking} />
          </motion.div>
        );
      })}
      {userBookings.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No bookings yet. Discover an experience on the home page.
        </div>
      )}
    </div>
  );
};

export default BookingsPanel;
