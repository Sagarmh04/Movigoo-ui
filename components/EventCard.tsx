"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Star } from "lucide-react";
import { Event } from "@/types/event";
import HostedBadge from "@/components/HostedBadge";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter, formatDateRange, truncate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type EventCardProps = {
  event: Event;
};

const EventCard = ({ event }: EventCardProps) => {
  const { user } = useCurrentUser();
  const isHosted = event.organizerId === user.id;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-card-glass backdrop-blur-2xl",
        isHosted ? "border-amber-400/40 shadow-[0_25px_65px_rgba(251,176,69,0.25)]" : ""
      )}
    >
      <Link href={`/events/${event.slug}`} className="relative block h-56 overflow-hidden">
        <Image
          src={event.coverWide}
          alt={event.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
        <div className="absolute left-4 bottom-4 space-y-2">
          {isHosted && <HostedBadge />}
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{event.city}</p>
          <p className="text-2xl font-semibold text-white">{truncate(event.title, 50)}</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5 text-sm text-slate-300">
        <div className="flex items-center gap-2 text-slate-200">
          <Calendar size={16} className="text-accent-amber" />
          {formatDateRange(event.dateStart, event.dateEnd)}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-400" />
          {event.venue}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">From</p>
            <p className="text-lg font-semibold text-white">
              {currencyFormatter.format(event.priceFrom)}
            </p>
          </div>
          {event.rating && (
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-amber-200">
              <Star size={12} fill="#FCD34D" className="text-amber-300" />
              {event.rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 p-4">
        {isHosted && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-2xl border-amber-200/50 text-amber-100"
            asChild
          >
            <Link href={`/events/${event.slug}/manage`}>Manage Event</Link>
          </Button>
        )}
        <Button variant="default" size="sm" className="flex-1 rounded-2xl" asChild>
          <Link href={`/events/${event.slug}`}>Book Now</Link>
        </Button>
      </div>
    </motion.article>
  );
};

export default EventCard;

