"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { useSearchContext } from "@/context/SearchContext";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import EventCard from "@/components/EventCard";
import { motion } from "framer-motion";

export default function SearchPage() {
  const { searchQuery, setSearchQuery } = useSearchContext();
  const { events } = usePublishedEvents();
  const { results: searchResults, loading: searchLoading } = useSearchEvents({
    searchQuery,
    localEvents: events,
  });

  const displayEvents = searchQuery.trim().length > 0 ? searchResults : [];
  const hasResults = displayEvents.length > 0;
  const isLoading = searchLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Search className="text-[#0B62FF]" size={24} />
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Discover</p>
          <h1 className="text-4xl font-semibold text-white">Search events</h1>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Artist, city, immersive tech..."
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {["Film premieres", "Sound baths", "Esports", "Gala", "Music", "Theater"].map((chip) => (
            <Button 
              key={chip} 
              variant="outline" 
              size="sm"
              onClick={() => setSearchQuery(chip)}
              className="rounded-full border-white/10 hover:border-[#0B62FF]/50 hover:text-[#0B62FF]"
            >
              {chip}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim().length > 0 && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-400">
              {isLoading ? "Searching..." : hasResults ? `${displayEvents.length} results found` : "No results found"}
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent" />
            </div>
          ) : hasResults ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-lg text-slate-300 mb-2">No events found</p>
              <p className="text-sm text-slate-400">Try a different search term or browse all events</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Search Query */}
      {searchQuery.trim().length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-lg text-slate-300 mb-2">Start searching</p>
          <p className="text-sm text-slate-400">Enter a search term above or click on a category tag</p>
        </div>
      )}
    </div>
  );
}

