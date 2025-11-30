"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventList from "@/components/EventList";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/event";

const cities = ["All cities", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Rishikesh"];
const categories = ["All", "Music", "Festival", "Cinema", "Fashion", "Wellness", "Esports"];

const EventsExplorer = () => {
  const [city, setCity] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ({
      city: city && city !== "All cities" ? city : undefined,
      category: category && category !== "All" ? category : undefined,
      q: query || undefined
    }),
    [city, category, query]
  );

  const events = useEvents(filters);

  return (
    <div className="space-y-10">
      <motion.div
        layout
        className="sticky top-20 z-10 space-y-4 rounded-[32px] border border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-10"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-accent-amber" />
          <p className="text-sm font-semibold text-white">Ultra filters</p>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
            {(events.data?.pages?.[0] as any)?.total ?? "—"} events
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {cities.map((item) => (
            <Button
              key={item}
              variant={city === item ? "amber" : "outline"}
              size="pill"
              className="rounded-full"
              onClick={() => setCity((prev) => (prev === item ? undefined : item))}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <Button
              key={item}
              variant={category === item ? "default" : "ghost"}
              size="pill"
              className="rounded-full"
              onClick={() => setCategory((prev) => (prev === item ? undefined : item))}
            >
              {item}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search for artist, venue, vibe..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-[24px] border border-white/10 bg-white/5"
        />
      </motion.div>

      <EventList
        pages={events.data?.pages as { events: Event[] }[] | undefined}
        isLoading={events.isLoading}
        isError={events.isError}
        fetchNext={events.fetchNextPage}
        hasNext={events.hasNextPage}
        isFetchingNext={events.isFetchingNextPage}
        onRetry={() => events.refetch()}
      />
    </div>
  );
};

export default EventsExplorer;

