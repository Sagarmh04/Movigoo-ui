"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Star, Share2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event } from "@/types/event";
import HostedBadge from "@/components/HostedBadge";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter, truncate } from "@/lib/utils";
import { useFakeUser } from "@/hooks/useFakeUser";

type EventCardProps = {
  event: Event;
};

const EventCard = ({ event }: EventCardProps) => {
  const { user } = useFakeUser();
  const isHosted = event.organizerId === user.id;
  const [ageLimit, setAgeLimit] = useState<string>("All Ages");

  // Fetch age limit from event data
  useEffect(() => {
    if (!event.id || !db) return;

    async function fetchAgeLimit() {
      if (!db) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", event.id));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const ageLimitValue = eventData.basicDetails?.ageLimit || "All Ages";
          // Format age limit: add "+" if it's a number
          const formattedAge = ageLimitValue === "All Ages" ? "All Ages" : `${ageLimitValue}+`;
          setAgeLimit(formattedAge);
        }
      } catch (error) {
        console.error("Error fetching age limit:", error);
      }
    }

    fetchAgeLimit();
  }, [event.id]);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-card-glass backdrop-blur-2xl",
        isHosted ? "border-amber-400/40 shadow-[0_25px_65px_rgba(251,176,69,0.25)]" : ""
      )}
    >
      <Link href={`/events/${event.id}`} className="relative block h-56 overflow-hidden">
        <Image
          src={event.coverWide}
          alt={event.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
        {/* Share Button - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const shareData = {
                title: event.title,
                text: `Check out ${event.title} on Movigoo!`,
                url: typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : "",
              };
              (async () => {
                try {
                  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                  } else {
                    // Fallback: Copy to clipboard
                    if (typeof window !== "undefined") {
                      await navigator.clipboard.writeText(shareData.url);
                      alert("Event link copied to clipboard!");
                    }
                  }
                } catch (err) {
                  if (err instanceof Error && err.name !== "AbortError") {
                    // Fallback: Copy to clipboard
                    if (typeof window !== "undefined") {
                      try {
                        await navigator.clipboard.writeText(shareData.url);
                        alert("Event link copied to clipboard!");
                      } catch (clipboardErr) {
                        console.error("Failed to copy to clipboard:", clipboardErr);
                      }
                    }
                  }
                }
              })();
            }}
            className="rounded-full border-white/20 bg-black/40 backdrop-blur-sm hover:bg-black/60 h-8 w-8 p-0"
          >
            <Share2 size={16} className="text-white" />
          </Button>
        </div>
        <div className="absolute left-4 bottom-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isHosted && <HostedBadge />}
            {(event as any).isSoldOut && (
              <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/40">
                SOLD OUT
              </span>
            )}
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{event.city}</p>
          <p className="text-2xl font-semibold text-white">{truncate(event.title, 50)}</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">From</p>
            <p className="text-lg font-semibold text-white">
              {currencyFormatter.format(event.priceFrom)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
              Age: {ageLimit}
            </span>
            {event.rating && (
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-amber-200">
                <Star size={12} fill="#FCD34D" className="text-amber-300" />
                {event.rating.toFixed(1)}
              </div>
            )}
          </div>
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
            <Link href={`/events/${event.id}/manage`}>Manage Event</Link>
          </Button>
        )}
        {(event as any).isSoldOut ? (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 rounded-2xl opacity-50 cursor-not-allowed" 
            disabled
          >
            Sold Out
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 rounded-2xl" 
            asChild
          >
            <Link href={`/events/${event.id}`}>Book Now</Link>
          </Button>
        )}
      </div>
    </motion.article>
  );
};

export default EventCard;

