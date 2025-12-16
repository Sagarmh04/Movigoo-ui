"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import { ArrowRight, PlayCircle } from "lucide-react";

type HomeLandingProps = {
  featuredEvents: Event[]; // Real events from Firebase
};

const heroPosters = [
  "/posters/aurora.svg",
  "/posters/sonic-wave.svg",
  "/posters/chroma-night.svg"
];

const HomeLanding = ({ featuredEvents }: HomeLandingProps) => {
  // Show first 5 events for featured section
  const featured = featuredEvents.slice(0, 5);

  return (
    <div className="space-y-16">
      <section className="relative grid gap-10 rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-[40px] lg:grid-cols-2 lg:p-12">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.5em] text-accent-amber">Premium access</p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Discover cinematic events. Book like a VIP.
          </h1>
          <p className="text-lg text-slate-300">
            Movigoo blends Apple-level polish with Netflix motion to wrap every concert, gala,
            and grand premiere into a luxe digital experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-3xl px-8" asChild>
              <Link href="/events">
                Browse events
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="rounded-3xl border border-white/10" asChild>
              <Link href="/coming-soon">
                <PlayCircle className="mr-2" size={18} />
                View trailers
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div>
              <p className="text-white">Indigo Nights Festival</p>
              <p>Mumbai • 12 Aug</p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-1 text-xs text-white/80">New drop</span>
          </div>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800">
          {heroPosters.map((poster, index) => (
            <motion.div
              key={poster}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
            >
              <Image src={poster} alt="Hero poster" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Trending now</p>
            <h2 className="text-2xl font-semibold text-white">Cinematic premieres</h2>
          </div>
          <Button variant="ghost" className="rounded-full border border-white/10" asChild>
            <Link href="/events">See all</Link>
          </Button>
        </div>
        <motion.div
          className="flex gap-5 overflow-x-auto pb-4"
          whileTap={{ cursor: "grabbing" }}
        >
          {featured.length > 0 ? (
            featured.map((event) => (
              <motion.div key={event.id} className="min-w-[280px] max-w-[320px] flex-1">
                <EventCard event={event} />
              </motion.div>
            ))
          ) : (
            <div className="text-slate-400">No events available yet. Add events with status: &quot;published&quot; to see them here.</div>
          )}
        </motion.div>
      </section>

      <section className="space-y-6 rounded-[40px] border border-white/10 bg-gradient-to-br from-indigo-900/60 to-slate-900/50 p-8 backdrop-blur-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-amber-200">Movigoo exclusive</p>
            <h2 className="text-3xl font-semibold text-white">Immersive art corridors</h2>
            <p className="text-slate-300">
              Hand-picked art installations with guided storytellers and ambient scoring.
            </p>
          </div>
          <Button size="lg" className="rounded-full px-8" asChild>
            <Link href="/locations">Explore venues</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {["Zero latency entry", "Glassmorph passes", "Curated lounges"].map((perk) => (
            <motion.div
              key={perk}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200"
              whileHover={{ y: -6 }}
            >
              {perk}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeLanding;

