"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import { ArrowRight, PlayCircle, BarChart3, Users, Calendar, Zap, Shield, TrendingUp, Clock, Sparkles } from "lucide-react";
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

      {/* Host Section - Premium with Animations */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-[#0B62FF]/20 via-purple-900/30 to-slate-900/50 p-8 backdrop-blur-3xl shadow-[0_40px_120px_rgba(11,98,255,0.3)] lg:p-12">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#0B62FF]/20 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-between gap-6"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-[#0B62FF]" size={24} />
                </motion.div>
                <p className="text-xs uppercase tracking-[0.5em] text-[#0B62FF] font-semibold">For Organizers</p>
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Would you like to host?
              </h2>
              <p className="text-lg text-slate-200 max-w-2xl">
                Create and manage events effortlessly. Host an event in just 5 minutes with our powerful platform.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="rounded-full bg-[#0B62FF] px-8 py-6 text-base font-semibold hover:bg-[#0A5AE6] shadow-lg shadow-[#0B62FF]/50" asChild>
                <Link href="/profile">
                  Start Hosting
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { label: "Host in 5 mins", icon: Clock, color: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" },
              { label: "Real-time Analytics", icon: BarChart3, color: "from-blue-500/20 to-blue-600/20 border-blue-500/30" },
              { label: "Multiple Events", icon: Calendar, color: "from-purple-500/20 to-purple-600/20 border-purple-500/30" },
              { label: "Volunteer Support", icon: Users, color: "from-amber-500/20 to-amber-600/20 border-amber-500/30" },
              { label: "Live Updates", icon: Zap, color: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30" },
              { label: "Secure Platform", icon: Shield, color: "from-green-500/20 to-green-600/20 border-green-500/30" },
            ].map((tag, index) => (
              <motion.div
                key={tag.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`group relative rounded-full border bg-gradient-to-r ${tag.color} px-4 py-2 backdrop-blur-sm transition-all duration-300`}
              >
                <div className="flex items-center gap-2">
                  <tag.icon size={16} className="text-white/90" />
                  <span className="text-sm font-medium text-white">{tag.label}</span>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>


          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-[#0B62FF]/30 bg-gradient-to-r from-[#0B62FF]/10 to-purple-500/10 p-6 backdrop-blur-sm"
          >
            <div>
              <p className="text-lg font-semibold text-white mb-1">Ready to host your first event?</p>
              <p className="text-sm text-slate-300">Join thousands of organizers already using Movigoo</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="rounded-full bg-white text-[#0e2144] px-8 py-6 font-semibold hover:bg-slate-100 shadow-lg" asChild>
                <Link href="/profile">
                  Get Started Now
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomeLanding;

