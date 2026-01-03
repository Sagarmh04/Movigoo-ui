// app/event/[eventId]/tickets/page.tsx - Ticket Selection with Location/Venue/Timing Selection
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import ShowSelector, { type ShowSelection } from "@/components/booking/ShowSelector";
import TicketSelectionCard, { type TicketType as TicketTypeCard } from "@/components/booking/TicketSelectionCard";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/lib/utils";
import { calculateBookingTotals, type TicketSelection } from "@/lib/bookingService";
import { MapPin, Building2, Edit2, Plus, Minus, Loader2 } from "lucide-react";

type SelectionStage = "location-venue" | "timing" | "tickets";

export default function TicketSelectionPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data, isLoading, isError } = useEventById(params.eventId);
  const { user, loading: authLoading } = useAuth(); // Use useAuth hook instead of direct Firebase auth
  const [eventData, setEventData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string; address: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ id: string; date: string } | null>(null);
  const [selectedShow, setSelectedShow] = useState<ShowSelection | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<SelectionStage>("location-venue");
  const [isPaying, setIsPaying] = useState(false);
  const isProcessingRef = useRef(false); // Synchronous check to prevent double clicks

  // Fetch full event data with real-time listener to update ticketsSold counter immediately
  useEffect(() => {
    if (!params.eventId || !db) return;

    const eventRef = doc(db, "events", params.eventId);
    
    // Use real-time listener to update ticketsSold counter immediately when it changes
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEventData(snapshot.data());
        }
      },
      (error) => {
        console.error("Error fetching event data:", error);
      }
    );

    return () => unsubscribe();
  }, [params.eventId]);

  // Get locations from event data
  const locations = useMemo(() => {
    if (!eventData?.schedule?.locations) return [];
    return eventData.schedule.locations;
  }, [eventData]);

  // Get venues for selected location
  const availableVenues = useMemo(() => {
    if (!selectedLocation || !eventData?.schedule?.locations) return [];
    const location = eventData.schedule.locations.find((l: any) => l.id === selectedLocation.id);
    return location?.venues || [];
  }, [selectedLocation, eventData]);

  // Get dates for selected venue
  const availableDates = useMemo(() => {
    if (!selectedVenue || !availableVenues.length) return [];
    const venue = availableVenues.find((v: any) => v.id === selectedVenue.id);
    return venue?.dates || [];
  }, [selectedVenue, availableVenues]);

  // Get shows for selected date
  const availableShows = useMemo(() => {
    if (!selectedDate || !availableDates.length) return [];
    const date = availableDates.find((d: any) => d.id === selectedDate.id);
    return date?.shows || [];
  }, [selectedDate, availableDates]);

  // Handle location selection
  const handleLocationSelect = (locationId: string) => {
    const location = locations.find((l: any) => l.id === locationId);
    if (location) {
      setSelectedLocation({ id: location.id, name: location.name });
      setSelectedVenue(null);
      setSelectedDate(null);
      setSelectedShow(null);
    }
  };

  // Handle venue selection
  const handleVenueSelect = (venueId: string) => {
    const venue = availableVenues.find((v: any) => v.id === venueId);
    if (venue) {
      setSelectedVenue({ id: venue.id, name: venue.name, address: venue.address || "" });
      setSelectedDate(null);
      setSelectedShow(null);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateId: string) => {
    const date = availableDates.find((d: any) => d.id === dateId);
    if (date) {
      setSelectedDate({ id: date.id, date: date.date });
      setSelectedShow(null);
      setStage("timing");
    }
  };

  // Handle show/timing selection
  const handleShowSelect = (show: ShowSelection) => {
    setSelectedShow(show);
    setStage("tickets");
  };

  // Handle edit location/venue
  const handleEditLocationVenue = () => {
    setStage("location-venue");
    setSelectedDate(null);
    setSelectedShow(null);
  };

  // PERMANENT FIX: Read ticketsSold counter from event document (single source of truth)
  // This counter is atomically updated in transactions, preventing all race conditions
  // No need to count bookings - the counter is the authoritative source
  const ticketsSold = typeof eventData?.ticketsSold === "number" ? eventData.ticketsSold : 0;
  const maxTickets = typeof eventData?.maxTickets === "number" ? eventData.maxTickets : null;
  
  // Check if event is sold out using counter (ticketsSold >= maxTickets)
  // CRITICAL: Show sold out if ticketsSold >= maxTickets (including when equal)
  const isSoldOut = maxTickets !== null && maxTickets > 0 && ticketsSold >= maxTickets;
  
  // Debug logging (remove in production)
  if (maxTickets !== null && maxTickets > 0) {
    console.log("[TicketSelectionPage] Inventory state:", { ticketsSold, maxTickets, isSoldOut, available: maxTickets - ticketsSold });
  }
  
  // Calculate available tickets from counter
  const availableTickets = maxTickets !== null && maxTickets > 0 ? maxTickets - ticketsSold : null;
  
  // Note: For per-ticket-type availability, we still need to track bookings per type
  // But the total overselling is prevented by the counter
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    if (!selectedShow || !params.eventId || !db) return;

    if (!db || !selectedShow) return;
    
    setIsLoadingBookings(true);
    
    try {
      const bookingsRef = collection(db, "events", params.eventId, "bookings");
      // Use real-time listener for per-ticket-type availability (not for total sold-out check)
      const q = query(
        bookingsRef,
        where("showId", "==", selectedShow.showId)
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setBookings(snapshot.docs.map(doc => doc.data()));
          setIsLoadingBookings(false);
        },
        (error) => {
          console.error("Error fetching bookings:", error);
          setBookings([]);
          setIsLoadingBookings(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up bookings listener:", error);
      setBookings([]);
      setIsLoadingBookings(false);
    }
  }, [selectedShow, params.eventId]);

  // Filter confirmed bookings for per-ticket-type availability calculation
  const confirmedBookings = useMemo(() => {
    return bookings.filter((booking: any) => {
      const paymentStatus = (booking.paymentStatus || "").toUpperCase();
      const bookingStatus = (booking.bookingStatus || "").toUpperCase();
      return paymentStatus === "SUCCESS" && bookingStatus === "CONFIRMED";
    });
  }, [bookings]);

  // Calculate booked quantities per ticket type (only from confirmed bookings)
  const bookedQuantities = useMemo(() => {
    const booked: Record<string, number> = {};
    
    confirmedBookings.forEach((booking: any) => {
      if (booking.items && Array.isArray(booking.items)) {
        booking.items.forEach((item: any) => {
          if (item.ticketTypeId && item.quantity) {
            booked[item.ticketTypeId] = (booked[item.ticketTypeId] || 0) + item.quantity;
          }
        });
      }
    });
    
    return booked;
  }, [confirmedBookings]);

  // Filter tickets by selected venue and calculate availability
  const tickets = useMemo((): TicketTypeCard[] => {
    if (!eventData?.tickets?.venueConfigs || !selectedShow) return [];

    const venueConfig = eventData.tickets.venueConfigs.find(
      (vc: any) => vc.venueId === selectedShow.venueId
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
  }, [eventData, selectedShow, bookedQuantities]);

  const selectedTicketsArray = useMemo(() => {
    return tickets
      .filter((t: TicketTypeCard) => selectedTickets[t.id] > 0)
      .map((t: TicketTypeCard) => ({
        ticketId: t.id,
        typeName: t.typeName,
        quantity: selectedTickets[t.id],
        price: t.price,
      }));
  }, [tickets, selectedTickets]);

  const { subtotal, bookingFee, total } = useMemo(() => {
    const ticketSelections: TicketSelection[] = selectedTicketsArray.map((t) => ({
      ticketTypeId: t.ticketId,
      ticketName: t.typeName,
      quantity: t.quantity,
      price: t.price,
    }));
    return calculateBookingTotals(ticketSelections);
  }, [selectedTicketsArray]);

  const handleQuantityChange = (ticketId: string, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: Math.max(0, quantity),
    }));
  };

  const handleProceed = async () => {
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

    if (selectedTicketsArray.length === 0 || !selectedShow) {
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    }

    // Check if user actually exists
    if (!user || !user.uid) {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const currentUrl = pathname + search;
      isProcessingRef.current = false;
      setIsPaying(false);
      router.push(`/my-bookings?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!data) {
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    }

    try {
      // Create pending booking and redirect directly to Cashfree
      const showSelection = {
        locationId: selectedShow.locationId,
        locationName: selectedShow.locationName,
        venueId: selectedShow.venueId,
        venueName: selectedShow.venueName,
        venueAddress: selectedShow.venueAddress,
        dateId: selectedShow.dateId,
        date: selectedShow.date,
        showId: selectedShow.showId,
        showName: selectedShow.showName,
        startTime: selectedShow.startTime,
        endTime: selectedShow.endTime,
      };

      // Get Firebase ID token for authentication (optimize by getting token early)
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

      const userDisplayName = (user as any).displayName || (user as any).email?.split("@")[0] || "Guest";
      const bookingPayload = {
        userName: userDisplayName,
        eventId: data.event.id,
        eventTitle: data.event.title,
        coverUrl: data.event.coverWide || "",
        venueName: selectedShow.venueName,
        date: selectedShow.date,
        time: selectedShow.startTime,
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
        locationId: showSelection.locationId,
        locationName: showSelection.locationName,
        venueId: showSelection.venueId,
        dateId: showSelection.dateId,
        showId: showSelection.showId,
        showTime: showSelection.startTime,
        showEndTime: showSelection.endTime,
        venueAddress: showSelection.venueAddress,
      };

      console.log("Creating pending booking...");
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

        // Redirect IMMEDIATELY to Cashfree payment page - don't wait for anything
        // Do NOT reset isPaying or ref - Cashfree page will take over
        const paymentParams = new URLSearchParams({
          bookingId: bookingResult.bookingId,
          amount: total.toString(),
          email: (user as any).email || "",
          name: userDisplayName,
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
      } else {
        const errorMessage = bookingResult.error || "Failed to create booking. Please try again.";
        alert(errorMessage);
      }
      
      isProcessingRef.current = false;
      setIsPaying(false);
      return;
    } catch (error: any) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
      isProcessingRef.current = false;
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Location/Venue Selection Stage */}
        {stage === "location-venue" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Select Location & Venue</h2>
            
            {/* Location Selection */}
            {locations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-300">Location</h3>
                <div className="grid gap-3">
                  {locations.map((location: any) => (
                    <button
                      key={location.id}
                      onClick={() => handleLocationSelect(location.id)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${
                        selectedLocation?.id === location.id
                          ? "border-[#0B62FF] bg-[#0B62FF]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-[#0B62FF]" />
                        <span className="font-semibold text-white">{location.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Venue Selection */}
            {selectedLocation && availableVenues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-300">Venue</h3>
                <div className="grid gap-3">
                  {availableVenues.map((venue: any) => (
                    <button
                      key={venue.id}
                      onClick={() => handleVenueSelect(venue.id)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${
                        selectedVenue?.id === venue.id
                          ? "border-[#0B62FF] bg-[#0B62FF]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 size={20} className="text-[#0B62FF]" />
                        <div className="flex-1">
                          <p className="font-semibold text-white">{venue.name}</p>
                          {venue.address && (
                            <p className="text-sm text-slate-400 mt-1">{venue.address}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Selection */}
            {selectedVenue && availableDates.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-300">Date</h3>
                <div className="grid gap-3">
                  {availableDates.map((date: any) => (
                    <button
                      key={date.id}
                      onClick={() => handleDateSelect(date.id)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${
                        selectedDate?.id === date.id
                          ? "border-[#0B62FF] bg-[#0B62FF]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <p className="font-semibold text-white">
                        {new Date(date.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timing Selection Stage */}
        {stage === "timing" && selectedLocation && selectedVenue && selectedDate && (
          <div className="space-y-6">
            {/* Header with Location/Venue and Edit Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedLocation.name}</h2>
                <p className="text-sm text-slate-400">{selectedVenue.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditLocationVenue}
                className="flex items-center gap-2 border-white/10"
              >
                <Edit2 size={16} />
                Edit
              </Button>
            </div>

            {/* Horizontal Scrolling Timing Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-slate-300">Select Timing</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {availableShows.map((show: any) => {
                  const showSelection: ShowSelection = {
                    locationId: selectedLocation.id,
                    locationName: selectedLocation.name,
                    venueId: selectedVenue.id,
                    venueName: selectedVenue.name,
                    venueAddress: selectedVenue.address,
                    dateId: selectedDate.id,
                    date: selectedDate.date,
                    showId: show.id,
                    showName: show.name || "Show",
                    startTime: show.startTime,
                    endTime: show.endTime,
                  };
                  const isSelected = selectedShow?.showId === show.id;

                  return (
                    <button
                      key={show.id}
                      onClick={() => handleShowSelect(showSelection)}
                      className={`flex-shrink-0 rounded-2xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#0B62FF] bg-[#0B62FF]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <p className="font-semibold text-white">{show.startTime}</p>
                      {show.endTime && (
                        <p className="text-xs text-slate-400 mt-1">- {show.endTime}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Ticket Selection Stage */}
        {stage === "tickets" && selectedShow && (
          <div className="space-y-6">
            {/* Header with Location/Venue and Edit Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedLocation?.name}</h2>
                <p className="text-sm text-slate-400">{selectedVenue?.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditLocationVenue}
                className="flex items-center gap-2 border-white/10"
              >
                <Edit2 size={16} />
                Edit
              </Button>
            </div>

            {/* Selected Timing Display */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Selected Timing</p>
              <p className="text-lg font-semibold text-white">
                {new Date(selectedShow.date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                {selectedShow.startTime} - {selectedShow.endTime}
              </p>
            </div>

            {/* Ticket Selection */}
            <div className={`space-y-4 ${isSoldOut ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Select Tickets</h3>
                {isSoldOut && (
                  <span className="text-lg font-semibold text-red-400">SOLD OUT</span>
                )}
              </div>
              {isSoldOut && (
                <p className="text-sm text-red-400 font-medium">All tickets have been booked</p>
              )}
              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-slate-400">No tickets available for this venue.</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <TicketSelectionCard
                    key={ticket.id}
                    ticket={ticket}
                    quantity={selectedTickets[ticket.id] || 0}
                    onQuantityChange={handleQuantityChange}
                    disabled={isSoldOut || (ticket.available ?? 0) === 0}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Sticky Bottom Bar */}
        {stage === "tickets" && selectedShow && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-4 backdrop-blur-xl sm:relative sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-300">Total</span>
                  <span className="text-xl font-bold text-[#0B62FF]">
                    {currencyFormatter.format(total)}
                  </span>
                </div>
                <Button
                  onClick={handleProceed}
                  disabled={selectedTicketsArray.length === 0 || isPaying || isSoldOut}
                  className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-[#0B62FF] sm:rounded-2xl"
                >
                  {isSoldOut ? "Sold Out" : isPaying ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : "Proceed to Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
