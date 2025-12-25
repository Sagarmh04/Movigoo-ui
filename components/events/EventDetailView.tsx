"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, ShieldCheck, Users, Plus, Minus, Share2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const isHosted = event.organizerId === organizer.id;

  // Fetch full event data to calculate lowest price
  useEffect(() => {
    if (!event.id || !db) return;

    async function fetchEventData() {
      if (!db) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", event.id));
        if (eventDoc.exists()) {
          setEventData(eventDoc.data());
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setIsLoadingPrice(false);
      }
    }

    fetchEventData();
  }, [event.id]);

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
  const [bookings, setBookings] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();

  // Fetch bookings for availability calculation (if single location)
  useEffect(() => {
    if (!hasSingleShow || !event.id || !db) return;

    async function fetchBookings() {
      if (!db || !eventData?.schedule?.locations) return;
      try {
        const location = eventData.schedule.locations[0];
        const venue = location.venues[0];
        const date = venue.dates[0];
        const show = date.shows[0];

        const bookingsRef = collection(db, "events", event.id, "bookings");
        const q = query(
          bookingsRef,
          where("showId", "==", show.id),
          where("paymentStatus", "==", "confirmed")
        );
        const snapshot = await getDocs(q);
        setBookings(snapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }
    }

    fetchBookings();
  }, [hasSingleShow, event.id, eventData]);

  // Calculate booked quantities
  const bookedQuantities = useMemo(() => {
    const booked: Record<string, number> = {};
    bookings.forEach((booking: any) => {
      if (booking.items && Array.isArray(booking.items)) {
        booking.items.forEach((item: any) => {
          if (item.ticketTypeId && item.quantity) {
            booked[item.ticketTypeId] = (booked[item.ticketTypeId] || 0) + item.quantity;
          }
        });
      }
    });
    return booked;
  }, [bookings]);

  // Get tickets for single location
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
      const booked = bookedQuantities[t.id] || 0;
      const available = Math.max(0, totalQuantity - booked);
      const maxPerOrder = Math.min(available, 10);

      return {
        id: t.id,
        typeName: t.typeName || t.name || "Ticket",
        price: typeof t.price === "number" ? t.price : 0,
        totalQuantity,
        available,
        maxPerOrder,
      };
    });
  }, [hasSingleShow, eventData, bookedQuantities]);

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
    if (selectedTicketsArray.length === 0) {
      alert("Please select at least one ticket");
      return;
    }

    // 1. If we are still checking the auth status, don't do anything
    if (authLoading) {
      console.log("Auth is still initializing...");
      return;
    }

    // 2. Now check if user actually exists
    if (!user || !user.uid) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!hasSingleShow || !eventData?.schedule?.locations) return;

    const location = eventData.schedule.locations[0];
    const venue = location.venues[0];
    const date = venue.dates[0];
    const show = date.shows[0];

    try {
      // Create pending booking
      const bookingPayload = {
        userId: user.uid,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const bookingResult = await bookingResponse.json();

      if (!bookingResponse.ok || !bookingResult.bookingId) {
        alert("Failed to create booking. Please try again.");
        return;
      }

      // Redirect to Cashfree payment
      const paymentParams = new URLSearchParams({
        bookingId: bookingResult.bookingId,
        amount: total.toString(),
        email: (user as any).email || "",
        name: (user as any).displayName || (user as any).email?.split("@")[0] || "",
        phone: (user as any).phoneNumber || "",
      });

      router.push(`/payment?${paymentParams.toString()}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 sm:max-w-none sm:space-y-6 sm:px-0 sm:pb-6 lg:space-y-10">
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
            {isHosted && <HostedBadge />}
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
              <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">Select Tickets</h3>
                <div className="space-y-3">
                  {availableTickets.map((ticket) => (
                    <TicketSelectionCard
                      key={ticket.id}
                      ticket={ticket}
                      quantity={selectedTickets[ticket.id] || 0}
                      onQuantityChange={(id, qty) => {
                        setSelectedTickets((prev) => ({ ...prev, [id]: qty }));
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <Button
            onClick={async () => {
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
            className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold hover:bg-[#0A5AE6]"
          >
            Book Now
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
                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-20">
                  <h3 className="text-lg font-semibold text-white">Select Tickets</h3>
                  <div className="space-y-3">
                    {availableTickets.map((ticket) => (
                      <TicketSelectionCard
                        key={ticket.id}
                        ticket={ticket}
                        quantity={selectedTickets[ticket.id] || 0}
                        onQuantityChange={(id, qty) => {
                          setSelectedTickets((prev) => ({ ...prev, [id]: qty }));
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <Button
              onClick={async () => {
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
              className="w-full rounded-2xl bg-[#0B62FF] py-6 text-lg font-semibold hover:bg-[#0A5AE6] sticky top-20"
            >
              Book Now
            </Button>
          )}
        </div>
      </div>

      {/* Sticky Bottom Component for Single Location Events */}
      {hasSingleShow && availableTickets.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-4 backdrop-blur-xl sm:relative sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
          <div className="mx-auto w-full max-w-3xl">
            {hasSingleTicketType ? (
              // Single ticket type: quantity selector on left, checkout button on right
              <div className="flex items-center justify-between gap-4">
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
                <Button
                  onClick={handleProceedToPayment}
                  className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] sm:rounded-2xl"
                >
                  Checkout {currencyFormatter.format(total)}
                </Button>
              </div>
            ) : (
              // Multiple ticket types: total on left, checkout button on right (disabled if no selection)
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">Total</span>
                  <span className="text-xl font-bold text-[#0B62FF]">
                    {currencyFormatter.format(total)}
                  </span>
                </div>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={selectedTicketsArray.length === 0}
                  className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-50 disabled:cursor-not-allowed sm:rounded-2xl"
                >
                  Checkout {currencyFormatter.format(total)}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailView;

