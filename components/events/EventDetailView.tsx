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
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[40px] border border-white/10 bg-white/5 shadow-card-glass"
      >
        <div className="relative h-[440px]">
          <Image src={event.coverWide} alt={event.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-center gap-4 p-10 text-white">
            {isHosted && <HostedBadge />}
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300">{event.city}</p>
            <h1 className="text-4xl font-semibold">{event.title}</h1>
            <p className="max-w-2xl text-lg text-slate-200">{event.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Calendar size={16} />
                {formatDateRange(event.dateStart, event.dateEnd)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <MapPin size={16} />
                {event.venue}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organizer</p>
                <p className="text-xl font-semibold text-white">{organizer.name}</p>
                <p className="text-sm text-slate-400">{organizer.email}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300">
                <ShieldCheck size={16} className="text-emerald-400" />
                Verified host
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold text-white">Gallery</p>
            <div className="grid gap-4 sm:grid-cols-2">
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
              className="rounded-3xl border border-white/5"
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
        <BookingSidebar event={event} ticketTypes={ticketTypes} />
      </div>
    </div>
  );
};

export default EventDetailView;

