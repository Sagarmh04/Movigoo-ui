// app/booking/success/page.tsx
// Booking Success Page with Premium QR Code Card

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Calendar, MapPin, Ticket, X, Clock, Share2 } from "lucide-react";
import { currencyFormatter } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import html2pdf from "html2pdf.js";

function BookingSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to profile if not logged in
    if (!authLoading && !user) {
      router.push("/profile?login=true");
      return;
    }
    
    if (!user || authLoading) return;
    
    const bookingId = searchParams?.get("bookingId");
    
    // Try to get booking data from multiple sources
    async function loadBooking() {
      try {
        let bookingData: any = null;

        // 1. Try to fetch from Firestore
        if (bookingId && db) {
          try {
            let bookingDocData: any = null;
            let eventId: string | null = null;

            // Try global bookings collection first
            const globalBookingRef = doc(db, "bookings", bookingId);
            const globalBookingDoc = await getDoc(globalBookingRef);

            if (globalBookingDoc.exists()) {
              bookingDocData = globalBookingDoc.data();
              eventId = bookingDocData.eventId;
            } else if (user?.uid) {
              // Try user bookings collection
              const userBookingRef = doc(db, "users", user.uid, "bookings", bookingId);
              const userBookingDoc = await getDoc(userBookingRef);

              if (userBookingDoc.exists()) {
                bookingDocData = userBookingDoc.data();
                eventId = bookingDocData.eventId;
              }
            }

            // If we found booking data, fetch the actual event details
            if (bookingDocData && eventId) {
              const eventRef = doc(db, "events", eventId);
              const eventDoc = await getDoc(eventRef);

              if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                const basic = eventData.basicDetails || {};
                const schedule = eventData.schedule || {};
                const tickets = eventData.tickets || {};

                // Extract date/time/venue from schedule
                const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
                const firstLocation = locations[0] || {};
                const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
                const firstVenue = venues[0] || {};
                const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
                const firstDate = dates[0] || {};
                const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
                const firstShow = shows[0] || {};

                // Extract ticket type names from event data
                const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
                const allTicketTypes: any[] = [];
                venueConfigs.forEach((vc: any) => {
                  if (Array.isArray(vc.ticketTypes)) {
                    allTicketTypes.push(...vc.ticketTypes);
                  }
                });

                // Get the actual ticket type name that was booked
                let ticketTypeName = bookingDocData.ticketType || "General";
                if (bookingDocData.ticketTypeId) {
                  const bookedTicketType = allTicketTypes.find((t: any) => t.id === bookingDocData.ticketTypeId);
                  if (bookedTicketType) {
                    ticketTypeName = bookedTicketType.typeName || ticketTypeName;
                  }
                }

                bookingData = {
                  bookingId,
                  eventTitle: basic.title || bookingDocData.eventTitle || "Event",
                  coverUrl: basic.coverPortraitUrl || basic.coverWideUrl || bookingDocData.coverUrl || "/placeholder-event.jpg",
                  venueName: firstVenue.name || bookingDocData.venueName || "TBA",
                  date: firstDate.date || bookingDocData.date || new Date().toLocaleDateString(),
                  time: firstShow.startTime || bookingDocData.time || "00:00",
                  ticketType: ticketTypeName,
                  quantity: bookingDocData.quantity || 1,
                  totalAmount: bookingDocData.totalAmount || 0,
                  qrCodeData: bookingDocData.qrCodeData || bookingId,
                };
              } else {
                // Event not found, use booking data as fallback
                bookingData = {
                  bookingId,
                  eventTitle: bookingDocData.eventTitle || "Event",
                  coverUrl: bookingDocData.coverUrl || "/placeholder-event.jpg",
                  venueName: bookingDocData.venueName || "TBA",
                  date: bookingDocData.date || new Date().toLocaleDateString(),
                  time: bookingDocData.time || "00:00",
                  ticketType: bookingDocData.ticketType || "General",
                  quantity: bookingDocData.quantity || 1,
                  totalAmount: bookingDocData.totalAmount || 0,
                  qrCodeData: bookingDocData.qrCodeData || bookingId,
                };
              }
            }
          } catch (err) {
            console.error("Error fetching from Firestore:", err);
          }
        }

        // 2. If not found in Firestore, try sessionStorage and fetch event details
        if (!bookingData && typeof window !== "undefined") {
          const finalBookingData = sessionStorage.getItem("finalBookingData");
          const bookingSelection = sessionStorage.getItem("bookingSelection");
          
          if (finalBookingData) {
            try {
              const parsed = JSON.parse(finalBookingData);
              const firstItem = parsed.items?.[0] || {};
              const eventIdFromStorage = parsed.eventId || (bookingSelection ? JSON.parse(bookingSelection).eventId : null);

              // Try to fetch event details if we have eventId
              if (eventIdFromStorage && db) {
                try {
                  const eventRef = doc(db, "events", eventIdFromStorage);
                  const eventDoc = await getDoc(eventRef);

                  if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    const basic = eventData.basicDetails || {};
                    const schedule = eventData.schedule || {};
                    const tickets = eventData.tickets || {};

                    // Extract date/time/venue from schedule
                    const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
                    const firstLocation = locations[0] || {};
                    const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
                    const firstVenue = venues[0] || {};
                    const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
                    const firstDate = dates[0] || {};
                    const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
                    const firstShow = shows[0] || {};

                    // Extract ticket type names from event data
                    const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
                    const allTicketTypes: any[] = [];
                    venueConfigs.forEach((vc: any) => {
                      if (Array.isArray(vc.ticketTypes)) {
                        allTicketTypes.push(...vc.ticketTypes);
                      }
                    });

                    // Get the actual ticket type name that was booked
                    let ticketTypeName = firstItem.ticketTypeName || firstItem.ticketType || "General";
                    if (firstItem.ticketTypeId) {
                      const bookedTicketType = allTicketTypes.find((t: any) => t.id === firstItem.ticketTypeId);
                      if (bookedTicketType) {
                        ticketTypeName = bookedTicketType.typeName || ticketTypeName;
                      }
                    }

                    bookingData = {
                      bookingId: bookingId || `booking-${Date.now()}`,
                      eventTitle: basic.title || parsed.eventTitle || "Event",
                      coverUrl: basic.coverPortraitUrl || basic.coverWideUrl || parsed.eventImage || parsed.coverUrl || "/placeholder-event.jpg",
                      venueName: firstVenue.name || parsed.venueName || "TBA",
                      date: firstDate.date || parsed.eventDate || new Date().toLocaleDateString(),
                      time: firstShow.startTime || parsed.eventTime || "00:00",
                      ticketType: ticketTypeName,
                      quantity: parsed.totalTickets || firstItem.quantity || 1,
                      totalAmount: parsed.totalAmount || 0,
                      qrCodeData: bookingId || `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    };
                  }
                } catch (err) {
                  console.error("Error fetching event from sessionStorage eventId:", err);
                }
              }

              // If event fetch failed, use sessionStorage data as fallback
              if (!bookingData) {
                bookingData = {
                  bookingId: bookingId || `booking-${Date.now()}`,
                  eventTitle: parsed.eventTitle || "Event",
                  coverUrl: parsed.eventImage || parsed.coverUrl || "/placeholder-event.jpg",
                  venueName: parsed.venueName || "TBA",
                  date: parsed.eventDate || new Date().toLocaleDateString(),
                  time: parsed.eventTime || "00:00",
                  ticketType: firstItem.ticketTypeName || firstItem.ticketType || "General",
                  quantity: parsed.totalTickets || firstItem.quantity || 1,
                  totalAmount: parsed.totalAmount || 0,
                  qrCodeData: bookingId || `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                };
              }
            } catch (err) {
              console.error("Error parsing sessionStorage data:", err);
            }
          }
        }

        // 3. If still not found, create a fallback booking card
        if (!bookingData) {
          bookingData = {
            bookingId: bookingId || `booking-${Date.now()}`,
            eventTitle: "Your Event",
            coverUrl: "/placeholder-event.jpg",
            venueName: "TBA",
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            ticketType: "General",
            quantity: 1,
            totalAmount: 0,
            qrCodeData: bookingId || `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
        }

        setBooking(bookingData);
      } catch (err: any) {
        console.error("Error loading booking:", err);
        // Still create a fallback booking
        setBooking({
          bookingId: bookingId || `booking-${Date.now()}`,
          eventTitle: "Your Event",
          coverUrl: "/placeholder-event.jpg",
          venueName: "TBA",
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          ticketType: "General",
          quantity: 1,
          totalAmount: 0,
          qrCodeData: bookingId || `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [user, authLoading, searchParams, router]);

  const handleDownload = () => {
    const element = document.getElementById("ticket-pdf");
    if (!element) return;

    const opt = {
      margin: 0.3,
      filename: `Movigoo-Ticket-${booking?.bookingId || "ticket"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleShare = async () => {
    const shareData = {
      title: `My ${booking?.eventTitle || "Event"} Ticket`,
      text: `Check out my ticket for ${booking?.eventTitle || "this event"}!`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        if (typeof window !== "undefined") {
          await navigator.clipboard.writeText(window.location.href);
          alert("Booking link copied to clipboard!");
        }
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== "AbortError") {
        // Fallback: Copy to clipboard
        if (typeof window !== "undefined") {
          try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Booking link copied to clipboard!");
          } catch (clipboardErr) {
            console.error("Failed to copy to clipboard:", clipboardErr);
          }
        }
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Unable to load booking</p>
          <Button
            onClick={() => router.push("/events")}
            className="mt-4 rounded-2xl bg-[#0B62FF] px-6 py-2"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        {/* Premium Booking Card - Wrapped for PDF */}
        <motion.div
          id="ticket-pdf"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl backdrop-blur-2xl"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B62FF]/20 via-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(11,98,255,0.15),_transparent_50%)]" />
          
          {/* Header with Close and Action Buttons */}
          <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-500 p-1.5">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Confirmed</h2>
                <p className="text-xs text-emerald-300">Ticket Ready</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 backdrop-blur-sm"
                aria-label="Share"
                title="Share ticket"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={handleDownload}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 backdrop-blur-sm"
                aria-label="Download"
                title="Download ticket"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 backdrop-blur-sm"
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative z-10 p-6 space-y-5">
            {/* Event Image - Premium Design */}
            <div className="relative h-40 w-full overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={booking.coverUrl || "/placeholder-event.jpg"} 
                alt={booking.eventTitle || "Event"} 
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">{booking.eventTitle}</h3>
              </div>
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0B62FF]/30 to-transparent rounded-bl-full" />
            </div>

            {/* Event Details - Enhanced Card */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-3 text-sm">
                <div className="rounded-lg bg-[#0B62FF]/20 p-2">
                  <Calendar size={18} className="text-[#0B62FF]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                  <p className="text-white font-semibold">{booking.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="rounded-lg bg-[#0B62FF]/20 p-2">
                  <Clock size={18} className="text-[#0B62FF]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Time</p>
                  <p className="text-white font-semibold">{booking.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="rounded-lg bg-[#0B62FF]/20 p-2">
                  <MapPin size={18} className="text-[#0B62FF]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Venue</p>
                  <p className="text-white font-semibold">{booking.venueName}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#0B62FF]/20 p-2">
                      <Ticket size={18} className="text-[#0B62FF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Ticket</p>
                      <p className="text-white font-semibold">{booking.ticketType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Quantity</p>
                    <p className="text-white font-semibold text-lg">× {booking.quantity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code - Premium Design */}
            <div className="flex flex-col items-center space-y-4 rounded-2xl border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm shadow-xl">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Entry Pass</p>
                <p className="text-[10px] text-slate-500">Scan at venue</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-2xl ring-4 ring-[#0B62FF]/20">
                <QRCodeSVG
                  value={booking.qrCodeData || booking.bookingId}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#0B62FF"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-400 font-mono tracking-wider">
                  ID: {booking.bookingId?.slice(0, 12).toUpperCase() || "N/A"}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs font-semibold text-emerald-300">Show at Venue</p>
                </div>
              </div>
            </div>

            {/* Total Paid - Enhanced */}
            {booking.totalAmount > 0 && (
              <div className="flex items-center justify-between rounded-xl border-2 border-[#0B62FF]/40 bg-gradient-to-r from-[#0B62FF]/20 to-[#0B62FF]/10 p-4 backdrop-blur-sm shadow-lg">
                <span className="text-sm font-semibold text-slate-300">Total Paid</span>
                <span className="text-2xl font-bold text-[#0B62FF]">
                  {currencyFormatter.format(booking.totalAmount)}
                </span>
              </div>
            )}

            {/* Action Buttons - Enhanced */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full rounded-xl border-white/20 bg-white/10 py-3.5 text-white hover:bg-white/20 hover:border-white/30 transition-all shadow-lg"
              >
                <Download size={18} className="mr-2" />
                Download Ticket
              </Button>
              <Button
                asChild
                className="w-full rounded-xl bg-gradient-to-r from-[#0B62FF] to-[#0A5AE6] py-3.5 text-white hover:from-[#0A5AE6] hover:to-[#0947CC] transition-all shadow-lg font-semibold"
              >
                <Link href="/my-bookings">
                  View My Bookings
                </Link>
              </Button>
            </div>

            {/* Powered by Movigoo Footer */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-slate-500">
                Powered by <span className="font-bold text-[#0B62FF]">Movigoo</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading your ticket...</p>
        </div>
      </div>
    }>
      <BookingSuccessPageContent />
    </Suspense>
  );
}
