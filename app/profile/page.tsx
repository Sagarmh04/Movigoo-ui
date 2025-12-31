// app/profile/page.tsx
// Profile page with real Firebase Authentication

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Ticket, HelpCircle, LogOut, ChevronRight, Chrome, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import LayoutWrapper from "@/components/LayoutWrapper";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import Image from "next/image";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const redirectUrl = searchParams.get("redirect");

  // Handle redirect after login
  useEffect(() => {
    if (user && redirectUrl) {
      router.replace(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  // Check if login modal should be shown
  useEffect(() => {
    if (searchParams?.get("login") === "true") {
      setShowLoginModal(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLoginSuccess = () => {
    // Check if there's a redirect stored (e.g., from booking flow)
    if (typeof window !== "undefined") {
      const redirect = sessionStorage.getItem("bookingRedirect");
      if (redirect) {
        sessionStorage.removeItem("bookingRedirect");
        router.push(redirect);
        return;
      }
    }
    router.refresh();
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-2xl space-y-6 pb-24">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">My Profile</h1>
        </div>

        {!user ? (
          /* Not Logged In - Show Login Button */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0B62FF] to-indigo-600">
              <User size={40} className="text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-white">Login / Sign In</h2>
            <p className="mb-6 text-slate-400">Login to access your profile and bookings</p>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="w-full rounded-2xl bg-[#0B62FF] px-8 py-6 text-base font-semibold hover:bg-[#0A5AE6] sm:w-auto"
            >
              Login / Sign In
            </Button>
          </motion.div>
        ) : (
          /* Logged In - Show Profile */
          <>
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0B62FF] bg-gradient-to-br from-[#0B62FF] to-indigo-600">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={40} className="text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </h2>
                  <p className="mt-1 text-slate-400">{user.email || "No email"}</p>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </Button>
              </div>
            </motion.div>

            {/* Menu Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <button
                onClick={() => router.push("/my-bookings")}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Ticket size={20} className="text-[#0B62FF]" />
                  <span className="text-white">Manage Bookings</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <button
                onClick={() => router.push("/support-tickets")}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={20} className="text-[#0B62FF]" />
                  <span className="text-white">Help & Support</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <button
                onClick={() => router.push("/terms-policy")}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={20} className="text-[#0B62FF]" />
                  <span className="text-white">Terms & Privacy</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>
            </motion.div>
          </>
        )}

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </LayoutWrapper>
  );
}

export default function ProfilePage() {
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
      <ProfilePageContent />
    </Suspense>
  );
}
