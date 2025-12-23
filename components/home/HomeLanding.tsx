"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, PlayCircle, BarChart3, Users, Calendar, Zap, Shield, TrendingUp, Clock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeLandingProps = {
  featuredEvents: Event[]; // Real events from Firebase
  searchQuery?: string;
  isSearching?: boolean;
};

const heroPosters = [
  "/posters/aurora.svg",
  "/posters/sonic-wave.svg",
  "/posters/chroma-night.svg"
];

const HomeLanding = ({ featuredEvents, searchQuery = "", isSearching = false }: HomeLandingProps) => {
  // Show first 5 events for featured section (or all search results if searching)
  const featured = isSearching ? featuredEvents : featuredEvents.slice(0, 5);
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);

  return (
    <div className="space-y-16">
      <section className="relative grid gap-10 rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-[40px] lg:grid-cols-2 lg:p-12">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.5em] text-accent-amber">Premium access</p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Discover cinematic events. Book like a VIP.
          </h1>
          <p className="text-lg text-slate-300">
            Effortless. Fast. Secure. Your events, booked in seconds
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-3xl px-8" asChild>
              <Link href="/events">
                Browse events
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="rounded-3xl border border-white/10 cursor-default pointer-events-none" disabled>
              <PlayCircle className="mr-2" size={18} />
              View trailers
            </Button>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div>
              <p className="tracking-[0.2em]">
                <span className="text-white">M</span>{" "}
                <span className="text-accent-amber">O</span>{" "}
                <span className="text-white">V</span>{" "}
                <span className="text-accent-amber">I</span>{" "}
                <span className="text-white">G</span>{" "}
                <span className="text-accent-amber">O</span>{" "}
                <span className="text-accent-amber">O</span>
              </p>
            </div>
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
            <p className="text-xs uppercase tracking-[0.5em] text-slate-500">
              {isSearching ? "Search Results" : "Trending now"}
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {isSearching ? `Results for "${searchQuery}"` : "Explore Events"}
            </h2>
          </div>
          {!isSearching && (
            <Button variant="ghost" className="rounded-full border border-white/10" asChild>
              <Link href="/events">See all</Link>
            </Button>
          )}
        </div>
        <motion.div
          className={cn(
            "flex gap-5 overflow-x-auto pb-4",
            isSearching ? "flex-wrap" : ""
          )}
          whileTap={{ cursor: "grabbing" }}
        >
          {featured.length > 0 ? (
            featured.map((event) => (
              <motion.div 
                key={event.id} 
                className={cn(
                  "min-w-[280px] max-w-[320px] flex-1",
                  isSearching ? "w-full sm:w-auto" : ""
                )}
              >
                <EventCard event={event} />
              </motion.div>
            ))
          ) : (
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-slate-400">
                {isSearching 
                  ? `No events found for "${searchQuery}". Try a different search term.`
                  : "No events available yet. Add events with status: \"published\" to see them here."}
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Compact Organizer Section */}
      <section className="relative rounded-[40px] border border-white/10 bg-gradient-to-br from-[#0B62FF]/20 via-purple-900/30 to-slate-900/50 p-6 backdrop-blur-3xl shadow-[0_40px_120px_rgba(11,98,255,0.3)] lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-xs uppercase tracking-[0.5em] text-[#0B62FF] font-semibold">For Organizers</p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Would you like to host?
            </h2>
            <p className="text-base text-slate-200">
              Create and manage events effortlessly. Host an event in just 5 minutes.
            </p>
          </div>
          <Button 
            size="lg" 
            className="rounded-full bg-[#0B62FF] px-6 py-5 text-base font-semibold hover:bg-[#0A5AE6] shadow-lg shadow-[#0B62FF]/50 whitespace-nowrap" 
            onClick={() => setIsOrganizerModalOpen(true)}
          >
            Start Hosting
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </section>

      {/* Organizer Modal */}
      <Dialog open={isOrganizerModalOpen} onOpenChange={setIsOrganizerModalOpen}>
        <DialogContent className="max-w-md w-[calc(100%-1rem)] sm:w-full mx-2">
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-white break-words">
                Ready to host your first event?
              </DialogTitle>
              <p className="text-slate-300 text-sm leading-relaxed break-words">
                Everything you need to launch and manage events effortlessly.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-3">
              {[
                { label: "Host in 5 minutes", icon: Clock },
                { label: "Real-time analytics", icon: BarChart3 },
                { label: "Multiple events support", icon: Calendar },
                { label: "Volunteer support", icon: Users },
                { label: "Live updates", icon: Zap },
                { label: "Secure payments", icon: Shield },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-3 text-slate-200">
                  <feature.icon size={18} className="text-[#0B62FF] flex-shrink-0" />
                  <span className="text-sm">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <p className="text-sm text-slate-300 text-center">
                Join thousands of organizers already using Movigoo
              </p>
              <Button 
                size="lg" 
                className="w-full rounded-full bg-white text-[#0e2144] py-6 font-semibold hover:bg-slate-100 shadow-lg" 
                onClick={() => {
                  window.location.href = "https://corporate.movigoo.in";
                }}
              >
                Get started now
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeLanding;

