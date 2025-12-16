// components/booking/EventDetailsSection.tsx
"use client";

import Image from "next/image";
import { Calendar, Clock, Users, MapPin, Tag } from "lucide-react";
import { Event } from "@/types/event";
import { formatDateRange } from "@/lib/utils";
import HostedBadge from "@/components/HostedBadge";

type EventDetailsSectionProps = {
  event: Event;
  isHosted?: boolean;
};

export default function EventDetailsSection({ event, isHosted = false }: EventDetailsSectionProps) {
  // Calculate duration if both dates exist
  const getDuration = () => {
    if (!event.dateStart) return null;
    if (event.dateEnd) {
      const start = new Date(event.dateStart);
      const end = new Date(event.dateEnd);
      const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      return `${hours} hours`;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:h-80">
        <Image 
          src={event.coverWide || event.coverPortrait?.[0] || "/placeholder-event.jpg"} 
          alt={event.title || "Event"} 
          fill 
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        {isHosted && (
          <div className="absolute top-4 left-4 z-10">
            <HostedBadge />
          </div>
        )}
      </div>

      {/* Event Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">{event.title}</h1>
        <p className="text-sm text-slate-300 sm:text-base">{event.description}</p>
      </div>

      {/* Event Details Grid */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
        {/* Date & Time */}
        {event.dateStart && (
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 text-[#0B62FF]" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Date & Time</p>
              <p className="text-sm font-medium text-white sm:text-base">
                {formatDateRange(event.dateStart, event.dateEnd)}
              </p>
            </div>
          </div>
        )}

        {/* Duration */}
        {getDuration() && (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 text-[#0B62FF]" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Duration</p>
              <p className="text-sm font-medium text-white sm:text-base">{getDuration()}</p>
            </div>
          </div>
        )}

        {/* Venue */}
        {event.venue && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 text-[#0B62FF]" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Venue</p>
              <p className="text-sm font-medium text-white sm:text-base">{event.venue}</p>
              {event.city && (
                <p className="text-xs text-slate-400">{event.city}</p>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="flex items-start gap-3">
            <Tag className="mt-0.5 text-[#0B62FF]" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Genre</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {event.categories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-[#0B62FF]/20 px-2 py-1 text-xs text-[#0B62FF]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

