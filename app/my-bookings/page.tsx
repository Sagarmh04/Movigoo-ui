// app/my-bookings/page.tsx
// My Bookings page with Upcoming/Past tabs (BookMyShow Style)

"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import BookingCard from "@/components/bookings/BookingCard";
import { useAuth } from "@/hooks/useAuth";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Ticket } from "lucide-react";

function MyBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { bookings, loading: bookingsLoading, error, refetch, reconcilePending } = useUserBookings(user?.uid || null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  const redirectUrl = searchParams.get("redirect");

  // Handle redirect after login
  useEffect(() => {
    if (user && redirectUrl) {
      router.replace(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        await reconcilePending(() => user.getIdToken());
        if (!cancelled) {
          await refetch();
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, reconcilePending, refetch]);

  // Redirect to profile if not logged in
  if (!loading && !user) {
    const profileUrl = redirectUrl
      ? `/profile?login=true&redirect=${encodeURIComponent(redirectUrl)}` 
      : `/profile?login=true`;

    router.push(profileUrl);
    return null;
  }

  if (loading || bookingsLoading) {
    return (
      <LayoutWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-400">Loading bookings...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (error) {
    // Check if it's a Firestore index error
    const isIndexError = typeof error === "string" && (
      error.includes("index") || 
      error.includes("failed-precondition") ||
      error.includes("requires an index") ||
      error.includes("Firestore index is being built")
    );
    
    return (
      <LayoutWrapper>
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-24 px-4">
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center backdrop-blur-xl">
            {isIndexError ? (
              <>
                <p className="text-lg font-semibold text-rose-200 mb-2">
                  Building required Firestore index...
                </p>
                <p className="text-sm text-rose-300/80 mb-4">
                  Please wait 1–2 minutes and refresh the page.
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  The index is being created automatically. This is a one-time setup.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
                >
                  Refresh Page
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-rose-200 mb-2">Error loading bookings</p>
                <p className="text-sm text-rose-300/80 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  // Filter bookings for current user
  const userBookings = bookings.filter((booking) => booking.userId === user.uid);

  // Transform booking data helper
  const transformBooking = (booking: any) => {
    // Parse event date for comparison
    const eventDateStr = booking.date || booking.showDate || booking.createdAt;
    let eventDate: Date;
    try {
      eventDate = new Date(eventDateStr);
      if (isNaN(eventDate.getTime())) {
        eventDate = new Date();
      }
    } catch {
      eventDate = new Date();
    }

    return {
      id: booking.bookingId || booking.id || "",
      bookingId: booking.bookingId || booking.id || "",
      eventTitle: booking.eventTitle || "Event",
      eventDetails: {
        title: booking.eventTitle || "Event",
        coverPortraitUrl: booking.coverUrl || booking.eventImage || "/placeholder-event.jpg",
        coverWideUrl: booking.coverUrl || booking.eventImage || "/placeholder-event.jpg",
        startDate: eventDate.toISOString(),
        venueName: booking.venueName || booking.venue || "TBA",
      },
      showDate: booking.date || booking.showDate || new Date().toLocaleDateString(),
      date: booking.date || booking.showDate || new Date().toLocaleDateString(),
      showTime: booking.time || booking.showTime || "00:00",
      time: booking.time || booking.showTime || "00:00",
      venueName: booking.venueName || booking.venue || "TBA",
      items: booking.items || (booking.ticketTypeId ? [{
        ticketTypeId: booking.ticketTypeId || "",
        typeName: booking.ticketType || booking.ticketTypeName || "General",
        ticketType: booking.ticketType || booking.ticketTypeName || "General",
        quantity: booking.quantity || 1,
      }] : []),
      totalAmount: booking.totalAmount || 0,
      createdAt: booking.createdAt,
      _eventDate: eventDate,
    };
  };

  // Transform all bookings
  const transformedBookings = userBookings.map(transformBooking);

  // Filter into upcoming and past
  const now = new Date();
  const upcomingBookings = transformedBookings.filter(b => b._eventDate >= now);
  const pastBookings = transformedBookings.filter(b => b._eventDate < now);

  // Get visible bookings based on active tab
  const visibleBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-24 px-4 sm:px-6">
        {/* Page Header */}
        <div className="space-y-2 pt-4">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My Bookings</h1>
          <p className="text-sm text-slate-400">Your tickets are safe with us</p>
        </div>

        {/* Tabs - BookMyShow Style */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "upcoming"
                ? "bg-[#0B62FF] text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Upcoming
            {upcomingBookings.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "upcoming" ? "bg-white/20" : "bg-white/10"
              }`}>
                {upcomingBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "past"
                ? "bg-[#0B62FF] text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Past
            {pastBookings.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "past" ? "bg-white/20" : "bg-white/10"
              }`}>
                {pastBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Bookings List */}
        {visibleBookings.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Ticket size={32} className="text-slate-500" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-slate-300">
                {activeTab === "upcoming"
                  ? "No upcoming bookings"
                  : "No past bookings"}
              </p>
              <p className="text-sm text-slate-500">
                {activeTab === "upcoming"
                  ? "Your booked tickets will appear here"
                  : "Your past events will show here"}
              </p>
            </div>
            {activeTab === "upcoming" && (
              <button
                onClick={() => router.push("/")}
                className="mt-4 rounded-xl bg-[#0B62FF] px-6 py-2.5 text-sm text-white font-medium hover:bg-[#0A5AE6] transition"
              >
                Browse Events
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.bookingId || booking.id}
                booking={booking}
                onClick={() => router.push(`/booking/success?bookingId=${booking.bookingId || booking.id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={
      <LayoutWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    }>
      <MyBookingsPageContent />
    </Suspense>
  );
}
