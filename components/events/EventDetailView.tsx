"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, ShieldCheck } from "lucide-react";
import BookingSidebar from "@/components/BookingSidebar";
import HostedBadge from "@/components/HostedBadge";
import { Event, TicketType } from "@/types/event";
import { User } from "@/types/user";
import { formatDateRange } from "@/lib/utils";

type EventDetailViewProps = {
  event: Event;
  ticketTypes: TicketType[];
  organizer: User;
};

const EventDetailView = ({ event, ticketTypes, organizer }: EventDetailViewProps) => {
  const isHosted = event.organizerId === organizer.id;

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 sm:max-w-none sm:space-y-6 sm:px-0 sm:pb-6 lg:space-y-10">
      {/* 1. Event Title & Cover Image */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-card-glass sm:rounded-[40px]"
      >
        <div className="relative h-[280px] sm:h-[440px]">
          <Image src={event.coverWide} alt={event.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 text-white sm:gap-4 sm:p-10">
            {isHosted && <HostedBadge />}
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300">{event.city}</p>
            <h1 className="text-2xl font-semibold sm:text-4xl">{event.title}</h1>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-lg">{event.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200 sm:gap-4 sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar size={14} className="sm:w-4 sm:h-4" />
                {formatDateRange(event.dateStart, event.dateEnd)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <MapPin size={14} className="sm:w-4 sm:h-4" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Mobile Order: Tickets → Summary/Book Now → Details */}
      <div className="block lg:hidden space-y-4">
        {/* 2. Ticket Types & Booking Section (Mobile) */}
        <BookingSidebar event={event} ticketTypes={ticketTypes} />

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
                <Image src={image} alt={`${event.title} photo ${index + 1}`} fill className="object-cover" />
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
                  <Image src={image} alt={`${event.title} photo ${index + 1}`} fill className="object-cover" />
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
        {/* Desktop: Booking sidebar on the right */}
        <div>
          <BookingSidebar event={event} ticketTypes={ticketTypes} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailView;

