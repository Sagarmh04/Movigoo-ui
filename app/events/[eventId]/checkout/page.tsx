// app/events/[eventId]/checkout/page.tsx
// Checkout page showing ticket summary before payment

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { currencyFormatter } from "@/lib/utils";
import { motion } from "framer-motion";
import { Calendar, MapPin, Ticket, ArrowRight, Clock, Users, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useRef, useEffect } from "react";

const BOOKING_FEE_PER_TICKET = 7;

export default function CheckoutPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const { data, isLoading, isError } = useEventById(eventId);
  const [bookingData, setBookingData] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showBreakup, setShowBreakup] = useState(false);
  const breakupRef = useRef<HTMLDivElement>(null);

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

    // Check if user is logged in (Firebase Auth) - wait for auth to load
    if (authLoading) {
      return; // Still loading, wait
    }

    if (!user || !user.uid) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
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
  }, [mounted, eventId, authLoading, user, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (breakupRef.current && !breakupRef.current.contains(event.target as Node)) {
        setShowBreakup(false);
      }
    }
    if (showBreakup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBreakup]);

  // Show loading if not mounted, eventId not set, still loading, or booking data not ready
  if (!mounted || !eventId || isLoading || authLoading || !bookingData) {
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
  const basePrice = subtotal;
  const platformFee = totalAmount - basePrice;

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

  const handleProceedToPayment = async () => {
    // Prevent duplicate clicks
    if (isPaying) return;

    // Wait for auth to fully load - no race conditions
    if (authLoading) {
      console.log("Auth is still initializing...");
      return;
    }

    // Check if user is logged in
    if (!user || !user.uid || !user.email) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Disable button immediately and track start time
    setIsPaying(true);
    const startTime = Date.now();

    try {
      // Extract show selection from sessionStorage if available
      const storedBookingState = sessionStorage.getItem("movigoo_booking_state");
      let showSelection: any = null;
      if (storedBookingState) {
        try {
          const parsed = JSON.parse(storedBookingState);
          showSelection = parsed.showSelection || null;
        } catch (e) {
          console.warn("Could not parse booking state:", e);
        }
      }

      // Use show selection if available, otherwise use first show
      const locationId = showSelection?.locationId || firstLocation.id || `loc_0`;
      const locationName = showSelection?.locationName || firstLocation.name || data.event.city || "TBA";
      const venueId = showSelection?.venueId || firstVenue.id || `venue_0`;
      const dateId = showSelection?.dateId || firstDate.id || `date_0`;
      const showId = showSelection?.showId || firstShow.id || `show_0`;
      const showTime = showSelection?.startTime || eventTime;
      const showEndTime = showSelection?.endTime || null;
      const venueAddress = showSelection?.venueAddress || firstVenue.address || null;
      const venueName = showSelection?.venueName || firstVenue.name || data.event.venue || "TBA";
      const selectedDate = showSelection?.date || eventDate;
      
      const bookingPayload = {
        userId: user.uid,
        eventId: eventId,
        eventTitle: data.event.title,
        coverUrl: data.event.coverPortrait[0] || data.event.coverWide || "",
        venueName: venueName,
        date: selectedDate,
        time: showTime,
        ticketType: bookingData.items.map((item: any) => {
          const ticketType = data.ticketTypes.find((t) => t.id === item.ticketTypeId);
          return `${ticketType?.name || item.ticketTypeId} (${item.quantity})`;
        }).join(", "),
        quantity: totalTickets,
        price: subtotal,
        bookingFee: bookingFee,
        totalAmount: totalAmount,
        items: bookingData.items.map((item: any) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          price: item.price,
        })),
        userEmail: user.email || null, // Include user email for confirmation email
        userName: user.displayName || user.email?.split("@")[0] || "Guest", // Include user name
        // Metadata for event bookings (for host queries)
        locationId: locationId,
        locationName: locationName,
        venueId: venueId,
        dateId: dateId,
        showId: showId,
        showTime: showTime,
        showEndTime: showEndTime,
        venueAddress: venueAddress,
      };

      console.log("Creating pending booking...");
      const bookingResponse = await fetch("/api/bookings/create-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const bookingResult = await bookingResponse.json();

      if (!bookingResponse.ok || !bookingResult.bookingId) {
        console.error("Failed to create pending booking:", bookingResult);
        alert("Failed to create booking. Please try again.");
        setIsPaying(false);
        return;
      }

      console.log("Pending booking created:", bookingResult.bookingId);

      // Minimum 2 seconds loader to prevent panic clicks
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }

      // Redirect to Cashfree payment page with booking ID
      // Do NOT reset isPaying - Cashfree will take over
      const paymentParams = new URLSearchParams({
        bookingId: bookingResult.bookingId,
        amount: totalAmount.toString(),
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        phone: user.phoneNumber || "",
      });

      router.push(`/payment?${paymentParams.toString()}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
      setIsPaying(false);
    }
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
                <div className="relative" ref={breakupRef}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setShowBreakup(!showBreakup)}
                  >
                    <span className="text-lg font-semibold text-white">Total Amount</span>
                    <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${showBreakup ? 'rotate-180' : ''}`} />
                  </div>
                  {showBreakup && (
                    <div className="absolute right-0 z-50 mt-2 rounded-lg border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-xl min-w-[200px]">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Base Ticket Price</span>
                          <span>{currencyFormatter.format(basePrice)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Platform Fee</span>
                          <span>{currencyFormatter.format(platformFee)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-medium text-white">
                          <span>Total</span>
                          <span>{currencyFormatter.format(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                disabled={isPaying}
                className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold hover:bg-[#0A5AE6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPaying ? "Processing..." : (
                  <>
                    Continue to Payment
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
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
