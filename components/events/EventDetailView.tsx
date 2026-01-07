"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, ShieldCheck, Users, Plus, Minus, Share2, ChevronDown, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import HostedBadge from "@/components/HostedBadge";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import { formatDateRange, currencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TicketSelectionCard, { type TicketType as TicketTypeCard } from "@/components/booking/TicketSelectionCard";
import { useAuth } from "@/hooks/useAuth";
import { calculateBookingTotals, type TicketSelection } from "@/lib/bookingService";

type EventDetailViewProps = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

const EventDetailView = ({ event, ticketTypes, organizer }: EventDetailViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [eventData, setEventData] = useState<any>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [showPriceBreakup, setShowPriceBreakup] = useState(false);
  const priceBreakupRef = useRef<HTMLDivElement>(null);
  const [isPaying, setIsPaying] = useState(false);
  const isProcessingRef = useRef(false); // Synchronous check to prevent double clicks
  const isHosted = event.organizerId === organizer.id;

  // Fetch full event data with real-time listener to update ticketType-level inventory immediately
  useEffect(() => {
    if (!event.id || !db) return;

    const eventRef = doc(db, "events", event.id);
    
    // Use real-time listener to update ticketType-level ticketsSold counters immediately when they change
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEventData(snapshot.data());
        }
        setIsLoadingPrice(false);
      },
      (error) => {
        console.error("Error fetching event data:", error);
        setIsLoadingPrice(false);
      }
    );

    return () => unsubscribe();
  }, [event.id]);

  // Handle click outside to close price breakup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priceBreakupRef.current && !priceBreakupRef.current.contains(event.target as Node)) {
        setShowPriceBreakup(false);
      }
    }
    if (showPriceBreakup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPriceBreakup]);

  // Calculate lowest price from all ticket types
  const lowestPrice = useMemo(() => {
    if (!eventData?.tickets?.venueConfigs) return null;
    
    const venueConfigs = Array.isArray(eventData.tickets.venueConfigs) ? eventData.tickets.venueConfigs : [];
    const allTicketTypes = venueConfigs.flatMap((vc: any) =>
      Array.isArray(vc.ticketTypes) ? vc.ticketTypes : []
    );

    if (allTicketTypes.length === 0) return null;

    const prices = allTicketTypes
      .map((t: any) => typeof t.price === "number" ? t.price : null)
      .filter((p: any) => p !== null && p > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
  }, [eventData]);

  // Get age limit from event data and format it
  const ageLimitRaw = eventData?.basicDetails?.ageLimit || "All Ages";
  const ageLimit = ageLimitRaw === "All Ages" ? "All Ages" : `${ageLimitRaw}+`;

  // Get locations and format location display
  const locations = useMemo(() => {
    if (!eventData?.schedule?.locations) return [];
    return eventData.schedule.locations;
  }, [eventData]);

  const locationDisplay = useMemo(() => {
    if (locations.length === 0) return event.city || "TBA";
    if (locations.length === 1) return locations[0].name;
    return `${locations[0].name} + ${locations.length - 1} more`;
  }, [locations, event.city]);

  // Get all venues across all locations
  const allVenues = useMemo(() => {
    const venues: Array<{ locationName: string; venue: any }> = [];
    locations.forEach((location: any) => {
      if (Array.isArray(location.venues)) {
        location.venues.forEach((venue: any) => {
          venues.push({
            locationName: location.name,
            venue,
          });
        });
      }
    });
    return venues;
  }, [locations]);

  // Check if event has only one location, one venue, one date, and one show
  const hasSingleLocation = locations.length === 1;
  const hasSingleShow = useMemo(() => {
    if (!hasSingleLocation || !eventData?.schedule?.locations) return false;
    const location = eventData.schedule.locations[0];
    const venues = location?.venues || [];
    if (venues.length !== 1) return false;
    const dates = venues[0]?.dates || [];
    if (dates.length !== 1) return false;
    const shows = dates[0]?.shows || [];
    return shows.length === 1;
  }, [hasSingleLocation, eventData]);

  // Check if single ticket type
  const hasSingleTicketType = useMemo(() => {
    if (!hasSingleShow || !eventData?.tickets?.venueConfigs) return false;
    const location = eventData.schedule.locations[0];
    const venue = location.venues[0];
    const venueConfig = eventData.tickets.venueConfigs.find(
      (vc: any) => vc.venueId === venue.id
    );
    return venueConfig?.ticketTypes?.length === 1;
  }, [hasSingleShow, eventData]);

  // Get tickets for single location
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const { user, loading: authLoading } = useAuth();

  // PRODUCTION-READY: Read ticketsSold from ticketType level (not event level)
  // Each ticketType has its own ticketsSold counter, enforced atomically in transactions
  // Frontend is READ-ONLY - availability computed from ticketType.ticketsSold and ticketType.totalQuantity

  // Get tickets for single location with ticketType-level inventory
  const availableTickets = useMemo((): TicketTypeCard[] => {
    if (!hasSingleShow || !eventData?.tickets?.venueConfigs) return [];
    
    const location = eventData.schedule.locations[0];
    const venue = location.venues[0];
    const venueConfig = eventData.tickets.venueConfigs.find(
      (vc: any) => vc.venueId === venue.id
    );

    if (!venueConfig?.ticketTypes) return [];

    return venueConfig.ticketTypes.map((t: any): TicketTypeCard => {
      const totalQuantity = typeof t.totalQuantity === "number" ? t.totalQuantity : 0;
      // CRITICAL: Read ticketsSold from ticketType (initialized to 0 if missing)
      const ticketsSold = typeof t.ticketsSold === "number" ? t.ticketsSold : 0;
      
      // Calculate available tickets: totalQuantity - ticketsSold
      // If totalQuantity is 0 or missing, treat as unlimited
      const available = totalQuantity > 0 ? Math.max(0, totalQuantity - ticketsSold) : 999999;
      const maxPerOrder = Math.min(available, t.maxPerOrder || 10);
      
      // Check if this ticketType is sold out
      const isTicketTypeSoldOut = totalQuantity > 0 && ticketsSold >= totalQuantity;

      return {
        id: t.id,
        typeName: t.typeName || t.name || "Ticket",
        price: typeof t.price === "number" ? t.price : 0,
        totalQuantity,
        available,
        maxPerOrder,
        isSoldOut: isTicketTypeSoldOut, // Per-ticketType sold out flag
      };
    });
  }, [hasSingleShow, eventData]);

  // Check if ALL ticket types are sold out (derived from ticketType-level inventory only)
  const isSoldOut = useMemo(() => {
    if (availableTickets.length === 0) return false;
    // All ticket types are sold out (computed from ticketType.ticketsSold >= ticketType.totalQuantity)
    return availableTickets.every(ticket => ticket.isSoldOut === true);
  }, [availableTickets]);

  // Set default quantity to 1 for single ticket type
  useEffect(() => {
    if (hasSingleTicketType && availableTickets.length === 1 && !selectedTickets[availableTickets[0].id]) {
      setSelectedTickets({ [availableTickets[0].id]: 1 });
    }
  }, [hasSingleTicketType, availableTickets, selectedTickets]);

  // Handle quantity change for single ticket type
  const handleQuantityChangeSingle = (delta: number) => {
    if (hasSingleTicketType && availableTickets.length === 1) {
      const ticket = availableTickets[0];
      const currentQty = selectedTickets[ticket.id] || 1;
      const newQty = Math.max(1, Math.min(currentQty + delta, ticket.maxPerOrder || 10));
      setSelectedTickets({ [ticket.id]: newQty });
    }
  };

  const selectedTicketsArray = useMemo(() => {
    return availableTickets
      .filter((t: TicketTypeCard) => selectedTickets[t.id] > 0)
      .map((t: TicketTypeCard) => ({
        ticketId: t.id,
        typeName: t.typeName,
        quantity: selectedTickets[t.id],
        price: t.price,
      }));
  }, [availableTickets, selectedTickets]);

  const { subtotal, bookingFee, total } = useMemo(() => {
    const ticketSelections: TicketSelection[] = selectedTicketsArray.map((t) => ({
      ticketTypeId: t.ticketId,
      ticketName: t.typeName,
      quantity: t.quantity,
      price: t.price,
    }));
    return calculateBookingTotals(ticketSelections);
  }, [selectedTicketsArray]);

  const handleProceedToPayment = async () => {
    // Prevent duplicate clicks - Use ref for SYNCHRONOUS check (React state is async)
    if (isProcessingRef.current || isPaying) return;
    
    // Set ref IMMEDIATELY (synchronous) to prevent double clicks
    isProcessingRef.current = true;
    setIsPaying(true);

    // Prevent checkout if event is sold out
    if (isSoldOut) {
      alert("This event is sold out.");
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    }

    if (selectedTicketsArray.length === 0) {
      alert("Please select at least one ticket");
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    }

    // 1. If we are still checking the auth status, don't do anything
    if (authLoading) {
      console.log("Auth is still initializing...");
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    }

    // 2. Now check if user actually exists
    if (!user || !user.uid) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      isProcessingRef.current = false;
      setIsPaying(false);
      router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!hasSingleShow || !eventData?.schedule?.locations) return;

    const location = eventData.schedule.locations[0];
    const venue = location.venues[0];
    const date = venue.dates[0];
    const show = date.shows[0];

    try {
      // Get Firebase ID token for authentication
      if (!user || typeof user.getIdToken !== "function") {
        console.error("User object is invalid or getIdToken is not available");
        alert("Authentication error. Please log in again.");
        isProcessingRef.current = false;
        setIsPaying(false);
        return;
      }

      let token: string;
      try {
        token = await user.getIdToken(true); // Force refresh for faster token
        if (!token) {
          throw new Error("Token is null");
        }
      } catch (tokenError: any) {
        console.error("Failed to get ID token:", tokenError);
        alert("Authentication error. Please log in again.");
        isProcessingRef.current = false;
        setIsPaying(false);
        return;
      }

      // Create pending booking
      const bookingPayload = {
        userName: (user as any).displayName || (user as any).email?.split("@")[0] || "Guest",
        eventId: event.id,
        eventTitle: event.title,
        coverUrl: event.coverWide || "",
        venueName: venue.name,
        date: date.date,
        time: show.startTime,
        ticketType: selectedTicketsArray.map((t) => `${t.typeName} (${t.quantity})`).join(", "),
        quantity: selectedTicketsArray.reduce((sum, t) => sum + t.quantity, 0),
        price: subtotal,
        bookingFee: bookingFee,
        totalAmount: total,
        items: selectedTicketsArray.map((t) => ({
          ticketTypeId: t.ticketId,
          quantity: t.quantity,
          price: t.price,
        })),
        userEmail: (user as any).email || null,
        locationId: location.id,
        locationName: location.name,
        venueId: venue.id,
        dateId: date.id,
        showId: show.id,
        showTime: show.startTime,
        showEndTime: show.endTime,
        venueAddress: venue.address || null,
      };

      const bookingResponse = await fetch("/api/bookings/create-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      const bookingResult = await bookingResponse.json();

      // CRITICAL: Redirect to payment ONLY if API returns HTTP 200 with bookingId
      // This is the ONLY path that leads to payment redirect
      if (bookingResponse.status === 200 && bookingResult.bookingId) {
        console.log("Pending booking created:", bookingResult.bookingId);

        // Redirect to Cashfree payment - booking ID and idempotency key are ready
        // Do NOT reset isPaying or ref - Cashfree page will take over
        const paymentParams = new URLSearchParams({
          bookingId: bookingResult.bookingId,
          amount: total.toString(),
          email: (user as any).email || "",
          name: (user as any).displayName || (user as any).email?.split("@")[0] || "",
          phone: (user as any).phoneNumber || "",
        });

        // Use window.location for immediate redirect (faster than router.push)
        window.location.href = `/payment?${paymentParams.toString()}`;
        return; // CRITICAL: Exit immediately after redirect
      }

      // ALL OTHER CASES: No redirect, show error
      console.error("Failed to create pending booking:", bookingResult);
      
      // CRITICAL: Handle sold-out error (409) with user-friendly message
      if (bookingResponse.status === 409 || bookingResult.error?.toLowerCase().includes("sold out")) {
        alert("Sorry, tickets are sold out. This event has reached its maximum capacity.");
        // Note: UI will automatically update via real-time listener on event document (ticketType-level ticketsSold)
      } else {
        const errorMessage = bookingResult.error || "Failed to create booking. Please try again.";
        alert(errorMessage);
      }
      
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const errorMessage = error.message || "Failed to create booking. Please try again.";
      alert(errorMessage);
      isProcessingRef.current = false;
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 sm:max-w-none sm:space-y-6 sm:px-0 sm:pb-24 lg:space-y-10">
      {/* 1. Event Title & Cover Image */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-card-glass sm:rounded-[40px]"
      >
        <div className="relative h-[280px] sm:h-[440px]">
          <Image src={event.coverWide} alt={event.title} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" />
          {/* Share Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const shareData = {
                  title: event.title,
                  text: `Check out ${event.title} on Movigoo!`,
                  url: typeof window !== "undefined" ? window.location.href : "",
                };
                try {
                  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                  } else {
                    // Fallback: Copy to clipboard
                    if (typeof window !== "undefined") {
                      await navigator.clipboard.writeText(window.location.href);
                      alert("Event link copied to clipboard!");
                    }
                  }
                } catch (err) {
                  if (err instanceof Error && err.name !== "AbortError") {
                    // Fallback: Copy to clipboard
                    if (typeof window !== "undefined") {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        alert("Event link copied to clipboard!");
                      } catch (clipboardErr) {
                        console.error("Failed to copy to clipboard:", clipboardErr);
                      }
                    }
                  }
                }
              }}
              className="rounded-full border-white/20 bg-black/40 backdrop-blur-sm hover:bg-black/60"
            >
              <Share2 size={18} className="text-white" />
            </Button>
          </div>
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 text-white sm:gap-4 sm:p-10">
            <div className="flex items-center gap-2 flex-wrap">
              {isHosted && <HostedBadge />}
              {isSoldOut && (
                <span className="inline-flex items-center rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-semibold text-red-400 border border-red-500/40">
                  SOLD OUT
                </span>
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300">{locationDisplay}</p>
            <h1 className="text-2xl font-semibold sm:text-4xl">{event.title}</h1>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-lg">{event.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200 sm:gap-4 sm:text-sm">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                Age: {ageLimit}
              </span>
            </div>
            {/* Price Display */}
            <div className="mt-4">
              {isLoadingPrice ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-white/20" />
                  <span className="text-xs text-slate-400">Loading...</span>
                </div>
              ) : lowestPrice !== null ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0B62FF]/20 px-4 py-2 border border-[#0B62FF]/40">
                  <span className="text-lg font-bold text-white">
                    {currencyFormatter.format(lowestPrice)}
                  </span>
                  <span className="text-xs text-slate-300">Onwards</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <span className="text-sm text-slate-400">Price TBA</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

        {/* Mobile Order: Ticket Selection (if single location) or Book Now Button → Details */}
      <div className="block lg:hidden space-y-4">
        {/* 2. Ticket Selection (if single location) or Book Now Button (Mobile) */}
        {hasSingleShow && availableTickets.length > 0 ? (
          <>
            {availableTickets.length > 1 && (
              <section className={`space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 ${isSoldOut ? "opacity-60 pointer-events-none" : ""}`}>
                <h3 className="text-lg font-semibold text-white">Select Tickets</h3>
                {isSoldOut && (
                  <p className="text-sm text-red-400 font-medium">All tickets have been booked</p>
                )}
                <div className="space-y-3">
                  {availableTickets.map((ticket) => (
                    <TicketSelectionCard
                      key={ticket.id}
                      ticket={ticket}
                      quantity={selectedTickets[ticket.id] || 0}
                      onQuantityChange={(id, qty) => {
                        setSelectedTickets((prev) => ({ ...prev, [id]: qty }));
                      }}
                      disabled={isSoldOut}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <Button
            onClick={async () => {
              if (isSoldOut) return;
              // Wait for auth to fully load - no race conditions
              if (authLoading) {
                console.log("Auth is still initializing...");
                return;
              }

              // Check if user is logged in
              if (!user || !user.uid) {
                const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
                router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
                return;
              }

              // User is logged in, proceed to tickets page
              router.push(`/event/${event.id}/tickets`);
            }}
            disabled={isSoldOut}
            className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold hover:bg-[#0A5AE6] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSoldOut ? "Sold Out" : "Book Now"}
          </Button>
        )}

        {/* 3. Organizer Section (Mobile) */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organizer</p>
              <p className="text-base font-semibold text-white">{organizer.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck size={14} className="inline text-emerald-400" />
              <span className="ml-1.5">Verified host</span>
            </div>
          </div>
        </section>

        {/* Venues Section (Mobile) */}
        {allVenues.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Venues</p>
            <div className="space-y-2">
              {allVenues.map((item, index) => (
                <div key={index} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <MapPin size={16} className="text-[#0B62FF]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.venue.name}</p>
                    {item.venue.address && (
                      <p className="text-xs text-slate-400">{item.venue.address}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-[#0B62FF]/20 px-2 py-1 text-xs text-[#0B62FF]">
                    {item.locationName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Gallery Section (Mobile) */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Gallery</p>
          <div className="grid gap-3 grid-cols-2">
            {event.coverPortrait.map((image, index) => (
              <motion.div key={image + index} whileHover={{ y: -6 }} className="relative h-40 overflow-hidden rounded-2xl border border-white/5">
                <Image src={image} alt={`${event.title} photo ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Venue Section (Mobile) */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Venue</p>
          <Image
            src="/placeholder-map.svg"
            alt="Map placeholder"
            width={800}
            height={400}
            className="w-full rounded-2xl border border-white/5"
          />
        </section>

        {/* 6. FAQ Section (Mobile) */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">FAQs</p>
          <div className="space-y-2 text-xs text-slate-300">
            <p>• Gates open 60 minutes before showtime.</p>
            <p>• Contactless check-in via Movigoo QR bracelet.</p>
            <p>• Premium lounges available for VIP & Infinity tiers.</p>
          </div>
        </section>
      </div>

      {/* Desktop Order: Details on left, Booking on right */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-8">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organizer</p>
                <p className="text-xl font-semibold text-white">{organizer.name}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300">
                <ShieldCheck size={16} className="inline text-emerald-400" />
                <span className="ml-2">Verified host</span>
              </div>
            </div>
          </section>

          {/* Venues Section (Desktop) */}
          {allVenues.length > 0 && (
            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-lg font-semibold text-white">Venues</p>
              <div className="space-y-3">
                {allVenues.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <MapPin size={18} className="text-[#0B62FF]" />
                    <div className="flex-1">
                      <p className="text-base font-medium text-white">{item.venue.name}</p>
                      {item.venue.address && (
                        <p className="text-sm text-slate-400">{item.venue.address}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-[#0B62FF]/20 px-3 py-1.5 text-sm text-[#0B62FF]">
                      {item.locationName}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold text-white">Gallery</p>
            <div className="grid gap-4 grid-cols-2">
              {event.coverPortrait.map((image, index) => (
                <motion.div key={image + index} whileHover={{ y: -6 }} className="relative h-60 overflow-hidden rounded-3xl border border-white/5">
                  <Image src={image} alt={`${event.title} photo ${index + 1}`} fill sizes="(max-width: 1024px) 50vw, 400px" className="object-cover" />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold text-white">Venue</p>
            <Image
              src="/placeholder-map.svg"
              alt="Map placeholder"
              width={800}
              height={400}
              className="w-full rounded-3xl border border-white/5"
            />
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold text-white">FAQs</p>
            <div className="space-y-3 text-sm text-slate-300">
              <p>• Gates open 60 minutes before showtime.</p>
              <p>• Contactless check-in via Movigoo QR bracelet.</p>
              <p>• Premium lounges available for VIP & Infinity tiers.</p>
            </div>
          </section>
        </div>
        {/* Desktop: Ticket Selection (if single location) or Book Now Button */}
        <div>
          {hasSingleShow && availableTickets.length > 0 ? (
            <>
              {availableTickets.length > 1 && (
                <section className={`space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-20 ${isSoldOut ? "opacity-60 pointer-events-none" : ""}`}>
                  <h3 className="text-lg font-semibold text-white">Select Tickets</h3>
                  {isSoldOut && (
                    <p className="text-sm text-red-400 font-medium">All tickets have been booked</p>
                  )}
                  <div className="space-y-3">
                    {availableTickets.map((ticket) => (
                      <TicketSelectionCard
                        key={ticket.id}
                        ticket={ticket}
                        quantity={selectedTickets[ticket.id] || 0}
                        onQuantityChange={(id, qty) => {
                          setSelectedTickets((prev) => ({ ...prev, [id]: qty }));
                        }}
                        disabled={isSoldOut || (ticket.available ?? 0) === 0}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <Button
              onClick={async () => {
                if (isSoldOut) return;
                // Wait for auth to fully load - no race conditions
                if (authLoading) {
                  console.log("Auth is still initializing...");
                  return;
                }

                // Check if user is logged in
                if (!user || !user.uid) {
                  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
                  router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
                  return;
                }

                // User is logged in, proceed to tickets page
                router.push(`/event/${event.id}/tickets`);
              }}
              disabled={isSoldOut}
              className="w-full rounded-2xl bg-[#0B62FF] py-6 text-lg font-semibold hover:bg-[#0A5AE6] sticky top-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSoldOut ? "Sold Out" : "Book Now"}
            </Button>
          )}
        </div>
      </div>

      {/* Sticky Bottom Component for Single Location Events */}
      {hasSingleShow && availableTickets.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-4 backdrop-blur-xl sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
          <div className="mx-auto w-full max-w-3xl">
            {hasSingleTicketType ? (
              // Single ticket type: quantity selector on left, checkout button on right
              <div className="flex items-center justify-between gap-4">
                {isSoldOut ? (
                  <div className="flex-1 text-center">
                    <span className="text-lg font-semibold text-red-400">SOLD OUT</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">Quantity</span>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                      <button
                        onClick={() => handleQuantityChangeSingle(-1)}
                        disabled={(selectedTickets[availableTickets[0]?.id] || 1) <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[2rem] text-center text-base font-semibold text-white">
                        {selectedTickets[availableTickets[0]?.id] || 1}
                      </span>
                      <button
                        onClick={() => handleQuantityChangeSingle(1)}
                        disabled={(selectedTickets[availableTickets[0]?.id] || 1) >= (availableTickets[0]?.maxPerOrder || 10)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isSoldOut || isPaying}
                  className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-[#0B62FF] sm:rounded-2xl"
                >
                  {isSoldOut ? "Sold Out" : isPaying ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Checkout ${currencyFormatter.format(total)}`
                  )}
                </Button>
              </div>
            ) : (
              // Multiple ticket types: total on left, checkout button on right (disabled if no selection)
              <div className="flex items-center justify-between gap-4">
                {/* Only show total and dropdown when tickets are selected */}
                {selectedTicketsArray.length > 0 ? (
                  <div className="relative" ref={priceBreakupRef}>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setShowPriceBreakup(!showPriceBreakup)}
                    >
                      <span className="text-sm text-slate-300">Total</span>
                      <span className="text-xl font-bold text-[#0B62FF]">
                        {currencyFormatter.format(total)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${showPriceBreakup ? "rotate-180" : ""}`}
                      />
                    </div>
                    {/* Price breakup dropdown - opens upward (drop-up) */}
                    {showPriceBreakup && (
                      <div className="absolute bottom-full left-0 mb-2 z-50 rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-xl backdrop-blur-xl min-w-[220px]">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-slate-300">
                            <span>Base Ticket Price</span>
                            <span>{currencyFormatter.format(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Platform Fee</span>
                            <span>{currencyFormatter.format(bookingFee)}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-semibold text-white">
                            <span>Total</span>
                            <span>{currencyFormatter.format(total)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">Total</span>
                    <span className="text-xl font-bold text-slate-500">₹0</span>
                  </div>
                )}
                {isSoldOut ? (
                  <div className="flex-1 text-center">
                    <span className="text-lg font-semibold text-red-400">SOLD OUT</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={selectedTicketsArray.length === 0 || isSoldOut || isPaying}
                    className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-[#0B62FF] sm:rounded-2xl"
                  >
                    {isSoldOut ? "Sold Out" : isPaying ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Checkout ${selectedTicketsArray.length > 0 ? currencyFormatter.format(total) : ""}`
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailView;

