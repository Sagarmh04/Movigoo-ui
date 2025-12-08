// components/HostedEventListClient.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import EventCard from "@/components/EventCard";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const isDev = process.env.NODE_ENV !== "production";

const EventSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/5 bg-white/5 p-6" />
);

export default function HostedEventListClient() {
  const { events, loading, error, debug } = useHostedEvents();
  const [showDebug, setShowDebug] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const withBookingMeta = useMemo(
    () =>
      events.map((event) => {
        const seatsTotal = (event as any)?.raw?.seatsTotal ?? (event as any)?.seatsTotal ?? null;
        const seatsBooked = (event as any)?.raw?.seatsBooked ?? (event as any)?.seatsBooked ?? 0;
        const bookingEnabled =
          (event as any)?.raw?.bookingEnabled ?? (event as any)?.bookingEnabled ?? true;
        const bookingUrl = (event as any)?.raw?.bookingUrl ?? (event as any)?.bookingUrl ?? null;
        const seatsLeft = typeof seatsTotal === "number" ? seatsTotal - (seatsBooked || 0) : null;
        return { event, seatsLeft, bookingEnabled, bookingUrl };
      }),
    [events]
  );

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <EventSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
        <p className="text-sm text-rose-200">We couldn&apos;t load hosted events. Please retry.</p>
        <p className="mt-2 text-xs text-rose-300/70">{error}</p>
        <Button
          className="mt-4 rounded-2xl"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const showEmpty = !withBookingMeta.length;

  return (
    <div className="space-y-6">
      {showEmpty ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-white/10" />
          <p className="text-lg font-semibold text-white">Coming soon</p>
          <p className="mt-2 text-sm text-slate-400">
            No hosted events found. Last check: {new Date().toLocaleString()}
          </p>
          {isDev && (
            <Button
              className="mt-4 rounded-2xl"
              variant="outline"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "Hide raw Firestore scan" : "Show raw Firestore scan"}
            </Button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {withBookingMeta.map(({ event, seatsLeft, bookingEnabled, bookingUrl }) => {
            const fullyBooked = seatsLeft !== null && seatsLeft <= 0;
            const bookingClosed = bookingEnabled === false;
            const disabled = fullyBooked || bookingClosed;
            const ctaLabel = fullyBooked ? "Fully booked" : bookingClosed ? "Booking closed" : "Book now";

            return (
              <div key={event.id} className="space-y-3">
                <EventCard event={event} />
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {seatsLeft !== null ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-200">
                      Seats left: {Math.max(seatsLeft, 0)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      Seats info not provided
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={disabled}
                      asChild={!disabled && Boolean(bookingUrl)}
                    >
                      {bookingUrl && !disabled ? (
                        <Link href={bookingUrl} target="_blank" rel="noreferrer">
                          {ctaLabel}
                        </Link>
                      ) : (
                        <span>{ctaLabel}</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {isDev && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-200">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Debug (dev only)</p>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setShowDebug((v) => !v)}
            >
              {showDebug ? "Hide" : "Show"}
            </Button>
          </div>
          {showDebug && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950/70 p-3 text-[11px] leading-relaxed">
{JSON.stringify(debug, null, 2)}
            </pre>
          )}
          {showRaw && debug.fallbackDocs?.length ? (
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-white">Raw fallback doc ids</p>
              <div className="flex flex-wrap gap-2">
                {debug.fallbackDocs.map((id) => (
                  <span key={id} className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

