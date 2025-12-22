// app/event/[eventId]/tickets/page.tsx - Ticket Selection with Location/Venue/Timing Selection
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/lib/firebaseClient";
import ShowSelector, { type ShowSelection } from "@/components/booking/ShowSelector";
import TicketSelectionCard, { type TicketType as TicketTypeCard } from "@/components/booking/TicketSelectionCard";
import { Button } from "@/components/ui/button";
import { saveBookingState } from "@/lib/bookingState";
import { currencyFormatter } from "@/lib/utils";
import { calculateBookingTotals, type TicketSelection } from "@/lib/bookingService";
import { MapPin, Building2, Edit2, Plus, Minus } from "lucide-react";

type SelectionStage = "location-venue" | "timing" | "tickets";

export default function TicketSelectionPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data, isLoading, isError } = useEventById(params.eventId);
  const [eventData, setEventData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string; address: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ id: string; date: string } | null>(null);
  const [selectedShow, setSelectedShow] = useState<ShowSelection | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<SelectionStage>("location-venue");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check Firebase Auth (no sessions for customers)
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch full event data with schedule structure
  useEffect(() => {
    if (!params.eventId || !db) return;

    async function fetchEventData() {
      if (!db) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", params.eventId));
        if (eventDoc.exists()) {
          setEventData(eventDoc.data());
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    }

    fetchEventData();
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

  // Fetch bookings to calculate available tickets
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    if (!selectedShow || !params.eventId || !db) return;

    async function fetchBookings() {
      if (!db || !selectedShow) return;
      setIsLoadingBookings(true);
      try {
        const bookingsRef = collection(db, "events", params.eventId, "bookings");
        const q = query(
          bookingsRef,
          where("showId", "==", selectedShow.showId),
          where("paymentStatus", "==", "confirmed")
        );
        const snapshot = await getDocs(q);
        setBookings(snapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    }

    fetchBookings();
  }, [selectedShow, params.eventId]);

  // Calculate booked quantities per ticket type
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

  const handleProceed = () => {
    if (selectedTicketsArray.length === 0 || !selectedShow) {
      return;
    }

    // Check if user is logged in
    if (!user || !user.uid) {
      alert("Please login to continue");
      // Redirect to login or show login modal
      return;
    }

    if (data) {
      // Save booking state for review page
      saveBookingState({
        eventId: data.event.id,
        eventName: data.event.title,
        eventImage: data.event.coverWide || "",
        dateStart: selectedShow.date,
        dateEnd: selectedShow.date,
        venue: selectedShow.venueName,
        city: selectedShow.locationName,
        tickets: selectedTicketsArray.map((t) => ({
          ticketId: t.ticketId,
          typeName: t.typeName,
          quantity: t.quantity,
          price: t.price,
        })),
        bookingFee,
        totalAmount: total,
        showSelection: {
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
        },
      });

      router.push(`/event/${params.eventId}/review`);
    }
  };

  if (isLoading || authLoading) {
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
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Select Tickets</h3>
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
                  disabled={selectedTicketsArray.length === 0}
                  className="rounded-full bg-[#0B62FF] px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-50 disabled:cursor-not-allowed sm:rounded-2xl"
                >
                  Proceed to Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
