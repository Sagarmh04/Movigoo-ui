// components/booking/ShowSelector.tsx
// Component for selecting a show from event schedule (grouped by Location → Venue → Date → Show)

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ShowSelection = {
  locationId: string;
  locationName: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  dateId: string;
  date: string;
  showId: string;
  showName: string;
  startTime: string;
  endTime: string;
};

type ShowSelectorProps = {
  locations: Array<{
    id: string;
    name: string;
    venues: Array<{
      id: string;
      name: string;
      address: string;
      dates: Array<{
        id: string;
        date: string;
        shows: Array<{
          id: string;
          name?: string;
          startTime: string;
          endTime: string;
        }>;
      }>;
    }>;
  }>;
  onSelect: (selection: ShowSelection) => void;
  selectedShow?: ShowSelection | null;
};

export default function ShowSelector({ locations, onSelect, selectedShow }: ShowSelectorProps) {
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // If only one show exists, auto-select it
  const allShows: ShowSelection[] = [];
  locations.forEach((location) => {
    location.venues.forEach((venue) => {
      venue.dates.forEach((date) => {
        date.shows.forEach((show) => {
          allShows.push({
            locationId: location.id,
            locationName: location.name,
            venueId: venue.id,
            venueName: venue.name,
            venueAddress: venue.address,
            dateId: date.id,
            date: date.date,
            showId: show.id,
            showName: show.name || `Show ${date.shows.indexOf(show) + 1}`,
            startTime: show.startTime,
            endTime: show.endTime,
          });
        });
      });
    });
  });

  // Auto-select if only one show
  if (allShows.length === 1 && !selectedShow) {
    onSelect(allShows[0]);
  }

  // If only one show, don't show selector
  if (allShows.length === 1) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Calendar size={20} className="text-[#0B62FF]" />
          <div>
            <p className="font-medium text-white">
              {new Date(allShows[0].date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm">
              {allShows[0].startTime} - {allShows[0].endTime}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-slate-300">
          <MapPin size={20} className="text-[#0B62FF]" />
          <div>
            <p className="font-medium text-white">{allShows[0].venueName}</p>
            <p className="text-sm">{allShows[0].venueAddress}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    // Convert HH:mm to 12-hour format
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Select Show</h3>
      <p className="text-sm text-slate-400">Choose the date, time, and venue for your booking</p>

      <div className="space-y-3">
        {locations.map((location) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
          >
            {/* Location Header */}
            <button
              onClick={() =>
                setExpandedLocation(expandedLocation === location.id ? null : location.id)
              }
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-[#0B62FF]" />
                <span className="font-semibold text-white">{location.name}</span>
              </div>
              {expandedLocation === location.id ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {/* Venues */}
            {expandedLocation === location.id && (
              <div className="border-t border-white/10">
                {location.venues.map((venue) => (
                  <div key={venue.id} className="border-t border-white/5 first:border-t-0">
                    {/* Venue Header */}
                    <button
                      onClick={() =>
                        setExpandedVenue(
                          expandedVenue === `${location.id}_${venue.id}`
                            ? null
                            : `${location.id}_${venue.id}`
                        )
                      }
                      className="w-full flex items-center justify-between p-4 pl-8 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 size={18} className="text-[#0B62FF]" />
                        <div className="text-left">
                          <span className="font-medium text-white">{venue.name}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{venue.address}</p>
                        </div>
                      </div>
                      {expandedVenue === `${location.id}_${venue.id}` ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </button>

                    {/* Dates */}
                    {expandedVenue === `${location.id}_${venue.id}` && (
                      <div className="border-t border-white/5">
                        {venue.dates.map((date) => (
                          <div key={date.id} className="border-t border-white/5 first:border-t-0">
                            {/* Date Header */}
                            <button
                              onClick={() =>
                                setExpandedDate(
                                  expandedDate === `${location.id}_${venue.id}_${date.id}`
                                    ? null
                                    : `${location.id}_${venue.id}_${date.id}`
                                )
                              }
                              className="w-full flex items-center justify-between p-4 pl-12 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-[#0B62FF]" />
                                <span className="font-medium text-white">{formatDate(date.date)}</span>
                              </div>
                              {expandedDate === `${location.id}_${venue.id}_${date.id}` ? (
                                <ChevronUp size={16} className="text-slate-400" />
                              ) : (
                                <ChevronDown size={16} className="text-slate-400" />
                              )}
                            </button>

                            {/* Shows */}
                            {expandedDate === `${location.id}_${venue.id}_${date.id}` && (
                              <div className="border-t border-white/5 pl-16 pr-4 pb-4 space-y-2">
                                {date.shows.map((show) => {
                                  const showSelection: ShowSelection = {
                                    locationId: location.id,
                                    locationName: location.name,
                                    venueId: venue.id,
                                    venueName: venue.name,
                                    venueAddress: venue.address,
                                    dateId: date.id,
                                    date: date.date,
                                    showId: show.id,
                                    showName: show.name || `Show ${date.shows.indexOf(show) + 1}`,
                                    startTime: show.startTime,
                                    endTime: show.endTime,
                                  };

                                  const isSelected =
                                    selectedShow?.showId === show.id &&
                                    selectedShow?.dateId === date.id &&
                                    selectedShow?.venueId === venue.id;

                                  return (
                                    <Button
                                      key={show.id}
                                      onClick={() => onSelect(showSelection)}
                                      variant="outline"
                                      className={`w-full justify-start border-2 transition-all ${
                                        isSelected
                                          ? "border-[#0B62FF] bg-[#0B62FF]/10"
                                          : "border-white/10 hover:border-white/20"
                                      }`}
                                    >
                                      <Clock size={16} className="text-[#0B62FF] mr-2" />
                                      <div className="flex-1 text-left">
                                        <p className="font-medium text-white">
                                          {show.name || `Show ${date.shows.indexOf(show) + 1}`}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {formatTime(show.startTime)} - {formatTime(show.endTime)}
                                        </p>
                                      </div>
                                      {isSelected && (
                                        <div className="ml-2 h-2 w-2 rounded-full bg-[#0B62FF]" />
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {selectedShow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-[#0B62FF] bg-[#0B62FF]/10 p-4"
        >
          <p className="text-sm font-medium text-[#0B62FF] mb-2">Selected Show</p>
          <div className="space-y-2 text-sm text-white">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#0B62FF]" />
              <span>
                {formatDate(selectedShow.date)} at {formatTime(selectedShow.startTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#0B62FF]" />
              <span>{selectedShow.venueName}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

