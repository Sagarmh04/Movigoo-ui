// app/my-bookings/page.tsx
// My Bookings page with BookMyShow-style UI

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import BookingsPanel from "@/components/bookings/BookingsPanel";
import { getFakeUser } from "@/lib/fakeAuth";

function MyBookingsPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getFakeUser();
    setUser(currentUser);

    // Redirect to profile with login prompt if not logged in
    if (!currentUser) {
      router.push("/profile?login=true");
    }
  }, [router]);

  if (!mounted) {
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

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-24">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Wallet</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">My premium passes</h1>
          <p className="text-slate-300">Tap a ticket for QR entry, downloads, or concierge chat.</p>
        </div>
        <BookingsPanel />
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
