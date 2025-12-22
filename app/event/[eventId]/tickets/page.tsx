// app/event/[eventId]/tickets/page.tsx - STEP 2: Ticket Selection
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/useEventById";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import StepIndicator from "@/components/booking/StepIndicator";
import ShowSelector, { type ShowSelection } from "@/components/booking/ShowSelector";
import TicketSelectionCard, { type TicketType as TicketTypeCard } from "@/components/booking/TicketSelectionCard";
import { Button } from "@/components/ui/button";
import { saveBookingState } from "@/lib/bookingState";
import { currencyFormatter } from "@/lib/utils";
import { calculateBookingTotals, type TicketSelection } from "@/lib/bookingService";

export default function TicketSelectionPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data, isLoading, isError } = useEventById(params.eventId);
  const [eventData, setEventData] = useState<any>(null);
  const [selectedShow, setSelectedShow] = useState<ShowSelection | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch full event data with schedule structure
  useEffect(() => {
    if (!params.eventId || !db) return;

    async function fetchEventData() {
      if (!db) return; // Additional check inside async function
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

  const handleQuantityChange = (ticketId: string, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: Math.max(0, quantity),
    }));
  };

  // Get locations from event data
  const locations = useMemo(() => {
    if (!eventData?.schedule?.locations) return [];
    return eventData.schedule.locations;
  }, [eventData]);

  // Filter tickets by selected venue
  const tickets = useMemo(() => {
    if (!eventData?.tickets?.venueConfigs) return [];
    
    // If no show is selected, return empty array
    if (!selectedShow) return [];

    // Find ticket config for selected venue
    const venueConfig = eventData.tickets.venueConfigs.find(
      (vc: any) => vc.venueId === selectedShow.venueId
    );

    if (!venueConfig?.ticketTypes) return [];

    return venueConfig.ticketTypes.map((t: any) => ({
      id: t.id,
      typeName: t.typeName || t.name || "Ticket",
      price: typeof t.price === "number" ? t.price : 0,
      totalQuantity: typeof t.totalQuantity === "number" ? t.totalQuantity : 0,
      available: typeof t.totalQuantity === "number" ? t.totalQuantity : 0,
      maxPerOrder: 10, // Default
    }));
  }, [eventData, selectedShow]);

  const selectedTicketsArray = useMemo(() => {
    return tickets
      .filter((t) => selectedTickets[t.id] > 0)
      .map((t) => ({
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

  const handleProceed = () => {
    if (selectedTicketsArray.length === 0 || !selectedShow) {
      return;
    }

    if (data) {
      // Save booking state for review page with show selection metadata
      saveBookingState({
        eventId: data.event.id,
        eventName: data.event.title,
        eventImage: data.event.coverWide || "",
        dateStart: selectedShow.date,
        dateEnd: selectedShow.date, // Same date for now
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
        // Show selection metadata
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading tickets...</p>
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
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={2} />
        </div>

        {/* Show Selection (if multiple shows) */}
        {locations.length > 0 && (
          <div className="mb-6">
            <ShowSelector
              locations={locations}
              onSelect={setSelectedShow}
              selectedShow={selectedShow}
            />
          </div>
        )}

        {/* Ticket Selection */}
        {selectedShow && (
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Select Tickets</h2>
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

        {!selectedShow && locations.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-slate-400">Please select a show to continue</p>
          </div>
        )}

        {/* Sticky Bottom Bar - Mobile */}
        {selectedTicketsArray.length > 0 && selectedShow && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl sm:relative sm:mt-6 sm:rounded-2xl sm:border sm:bg-white/5 sm:px-0 sm:py-0">
            <div className="mx-auto w-full max-w-3xl">
              <div className="mb-3 flex items-center justify-between text-sm sm:hidden">
                <span className="text-slate-300">Total</span>
                <span className="text-lg font-semibold text-[#0B62FF]">
                  {currencyFormatter.format(total)}
                </span>
              </div>
              <Button
                onClick={handleProceed}
                className="w-full rounded-full bg-[#0B62FF] py-3 text-base font-semibold shadow-lg transition hover:bg-[#0A5AE6] sm:rounded-2xl sm:py-4 sm:text-lg"
              >
                Proceed to Review
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

