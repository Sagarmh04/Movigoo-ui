// app/my-bookings/page.tsx
// My Bookings page with improved BookingCard UI (BookMyShow Style)

"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import BookingCard from "@/components/bookings/BookingCard";
import { useAuth } from "@/hooks/useAuth";
import { useUserBookings } from "@/hooks/useUserBookings";
import LoginModal from "@/components/auth/LoginModal";
import { useState } from "react";

function MyBookingsPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { bookings, loading: bookingsLoading, error } = useUserBookings(user?.uid || null);
  
  // Check if error is related to Firestore index
  const isIndexError = error && (
    typeof error === "string" && (
      error.includes("index") || 
      error.includes("failed-precondition") ||
      error.includes("requires an index")
    )
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Redirect to profile with login prompt if not logged in
  if (!loading && !user) {
    router.push("/profile?login=true");
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

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-24 px-4 sm:px-6">
        {/* Page Header */}
        <div className="space-y-3 pt-4">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Wallet</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">My premium passes</h1>
          <p className="text-slate-300">Tap a ticket for QR entry, downloads, or concierge chat.</p>
        </div>

        {/* Bookings List */}
        {userBookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <p className="text-lg font-semibold text-white mb-2">No bookings yet</p>
            <p className="text-sm text-slate-400 mb-6">
              Discover an experience on the home page and book your first ticket.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-2xl bg-[#0B62FF] px-6 py-3 text-white font-semibold hover:bg-[#0A5AE6] transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userBookings.map((booking: any) => {
              // Transform booking data to match BookingCard props
              const transformedBooking = {
                id: booking.bookingId || booking.id || "",
                bookingId: booking.bookingId || booking.id || "",
                eventTitle: booking.eventTitle || "Event",
                eventDetails: {
                  title: booking.eventTitle || "Event",
                  coverPortraitUrl: booking.coverUrl || booking.eventImage || "/placeholder-event.jpg",
                  coverWideUrl: booking.coverUrl || booking.eventImage || "/placeholder-event.jpg",
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
              };

              return (
                <BookingCard
                  key={booking.bookingId || booking.id || Math.random()}
                  booking={transformedBooking}
                  onClick={() => router.push(`/booking/success?bookingId=${booking.bookingId || booking.id}`)}
                />
              );
            })}
          </div>
        )}

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            router.refresh();
          }}
        />
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
