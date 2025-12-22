"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import HostedBadge from "@/components/HostedBadge";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import { formatDateRange, currencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EventDetailViewProps = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

const EventDetailView = ({ event, ticketTypes, organizer }: EventDetailViewProps) => {
  const router = useRouter();
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

  // Get age limit from event data
  const ageLimit = eventData?.basicDetails?.ageLimit || "All Ages";

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
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 text-white sm:gap-4 sm:p-10">
            {isHosted && <HostedBadge />}
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300">{event.city}</p>
            <h1 className="text-2xl font-semibold sm:text-4xl">{event.title}</h1>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-lg">{event.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200 sm:gap-4 sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Users size={14} className="sm:w-4 sm:h-4" />
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

      {/* Mobile Order: Book Now Button → Details */}
      <div className="block lg:hidden space-y-4">
        {/* 2. Book Now Button (Mobile) */}
        <Button
          onClick={() => router.push(`/event/${event.id}/tickets`)}
          className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold hover:bg-[#0A5AE6]"
        >
          Book Now
        </Button>

        {/* 3. Organizer Section (Mobile) */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organizer</p>
              <p className="text-base font-semibold text-white">{organizer.name}</p>
              <p className="text-xs text-slate-400">{organizer.email}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck size={14} className="inline text-emerald-400" />
              <span className="ml-1.5">Verified host</span>
            </div>
          </div>
        </section>

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
                <p className="text-sm text-slate-400">{organizer.email}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300">
                <ShieldCheck size={16} className="inline text-emerald-400" />
                <span className="ml-2">Verified host</span>
              </div>
            </div>
          </section>

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
        {/* Desktop: Book Now Button */}
        <div>
          <Button
            onClick={() => router.push(`/event/${event.id}/tickets`)}
            className="w-full rounded-2xl bg-[#0B62FF] py-6 text-lg font-semibold hover:bg-[#0A5AE6] sticky top-20"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailView;

