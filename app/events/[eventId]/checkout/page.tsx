// app/events/[eventId]/checkout/page.tsx
// Checkout page showing ticket summary before payment

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { currencyFormatter } from "@/lib/utils";
import { motion } from "framer-motion";
import { Calendar, MapPin, Ticket, ArrowRight, Clock, Users } from "lucide-react";
import { fakeGetUser } from "@/lib/fakeAuth";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const BOOKING_FEE_PER_TICKET = 7;

export default function CheckoutPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [eventId, setEventId] = useState<string>("");
  const { data, isLoading, isError } = useEventById(eventId);
  const [bookingData, setBookingData] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Handle params - could be Promise in Next.js 14
    if (params && typeof params === "object" && "eventId" in params) {
      const id = typeof params.eventId === "string" ? params.eventId : "";
      if (id) {
        console.log("[Checkout] Setting eventId from params:", id);
        setEventId(id);
      }
    } else if (typeof params === "string") {
      if (params) {
        console.log("[Checkout] Setting eventId from string params:", params);
        setEventId(params);
      }
    }
  }, [params]);

  useEffect(() => {
    if (!mounted || !eventId) return;
    const currentUser = fakeGetUser();
    setUser(currentUser);

    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
      router.push(`/auth/login?redirect=/events/${eventId}/checkout`);
      return;
    }

    // Get booking selection from sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("bookingSelection");
      if (stored) {
        try {
          setBookingData(JSON.parse(stored));
        } catch (error) {
          console.error("Error parsing booking data:", error);
          router.push(`/events/${eventId}`);
        }
      } else {
        router.push(`/events/${eventId}`);
      }
    }

    // Fetch full event details for age limit, duration, etc.
    async function fetchEventDetails() {
      if (!db || !eventId) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEventDetails(eventDoc.data());
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    }
    if (eventId) {
      fetchEventDetails();
    }
  }, [mounted, eventId, router]);

  // Show loading if not mounted, eventId not set, still loading, or booking data not ready
  if (!mounted || !eventId || isLoading || !bookingData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Only show error if we have eventId and loading is complete
  if (eventId && !isLoading && (isError || !data)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Event not found</p>
          <p className="mt-2 text-sm text-slate-400">The event you&apos;re looking for doesn&apos;t exist.</p>
          <Button
            onClick={() => router.push("/events")}
            className="mt-4 rounded-2xl bg-[#0B62FF] px-6 py-2"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  // Ensure data exists before proceeding
  if (!data || !data.event) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Event not found</p>
          <Button
            onClick={() => router.push("/events")}
            className="mt-4 rounded-2xl bg-[#0B62FF] px-6 py-2"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = bookingData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalTickets = bookingData.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const bookingFee = totalTickets * BOOKING_FEE_PER_TICKET;
  const discount = bookingData.promoCode ? subtotal * 0.05 : 0;
  const totalAmount = subtotal - discount + bookingFee;

  // Get event details
  const basic = eventDetails?.basicDetails || {};
  const schedule = eventDetails?.schedule || {};
  const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
  const firstLocation = locations[0] || {};
  const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
  const firstVenue = venues[0] || {};
  const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
  const firstDate = dates[0] || {};
  const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
  const firstShow = shows[0] || {};

  const eventDate = firstDate.date || new Date(data.event.dateStart).toISOString().split("T")[0];
  const eventTime = firstShow.startTime || new Date(data.event.dateStart).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  
  // Calculate duration
  const duration = data.event.dateEnd && data.event.dateStart
    ? Math.round((new Date(data.event.dateEnd).getTime() - new Date(data.event.dateStart).getTime()) / (1000 * 60 * 60))
    : null;

  const ageLimit = basic.ageLimit || "All Ages";

  const handleProceedToPayment = () => {
    // Save final booking data for payment page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("finalBookingData", JSON.stringify({
        ...bookingData,
        subtotal,
        bookingFee,
        discount,
        totalAmount,
        totalTickets,
        eventDate,
        eventTime,
        venueName: firstVenue.name || data.event.venue,
      }));
    }
    router.push(`/events/${eventId}/payment`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Review Your Booking</h1>
          <p className="text-sm text-slate-400">Please review your ticket selection before proceeding to payment</p>
        </div>

        <div className="space-y-6">
          {/* Event Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Event Image */}
              <div className="relative h-48 w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={data.event.coverPortrait[0] || data.event.coverWide || "/placeholder-event.jpg"}
                  alt={data.event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              </div>

              {/* Event Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">{data.event.title}</h2>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#0B62FF]" />
                      <span>{new Date(eventDate).toLocaleDateString("en-IN", { 
                        weekday: "long", 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      })} at {eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#0B62FF]" />
                      <span>{firstVenue.name || data.event.venue}</span>
                    </div>
                    {duration && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#0B62FF]" />
                        <span>Duration: {duration} hours</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#0B62FF]" />
                      <span>Age Limit: {ageLimit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Ticket Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Ticket size={20} className="text-[#0B62FF]" />
              Ticket Summary
            </h3>
            <div className="space-y-3">
              {bookingData.items.map((item: any, index: number) => {
                const ticketType = data.ticketTypes.find((t) => t.id === item.ticketTypeId);
                return (
                  <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="font-medium text-white">{ticketType?.name || item.ticketTypeId}</p>
                      <p className="text-sm text-slate-400">Quantity: {item.quantity} × {currencyFormatter.format(item.price)}</p>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {currencyFormatter.format(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Price Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Price Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Base Price</span>
                <span>{currencyFormatter.format(subtotal)}</span>
              </div>
              {bookingData.promoCode && (
                <div className="flex justify-between text-emerald-300">
                  <span>Discount ({bookingData.promoCode})</span>
                  <span>-{currencyFormatter.format(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Movigoo Booking Fee (₹{BOOKING_FEE_PER_TICKET} × {totalTickets})</span>
                <span>{currencyFormatter.format(bookingFee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">Total Amount</span>
                <span className="text-2xl font-bold text-[#0B62FF]">
                  {currencyFormatter.format(totalAmount)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Proceed Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky bottom-0 z-50 sm:relative sm:z-auto"
          >
            <div className="rounded-3xl border border-white/10 bg-black/90 p-4 backdrop-blur-xl sm:bg-white/5 sm:border sm:p-6">
              <Button
                onClick={handleProceedToPayment}
                className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold hover:bg-[#0A5AE6]"
              >
                Continue to Payment
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Your payment will be processed securely
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
