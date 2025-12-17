// app/auth/login/page.tsx
// Simulated login page for booking flow

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { loginWithGoogle, fakeGetUser } from "@/lib/fakeAuth";
import { Chrome, Mail, Phone } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const redirect = searchParams?.get("redirect") ?? "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!mounted) return;
    const user = fakeGetUser();
    if (user && user.id) {
      router.push(redirect);
    }
  }, [mounted, redirect, router]);

  function handleLogin() {
    setIsLoading(true);
    // Simulate login delay - use loginWithGoogle for explicit login
    setTimeout(() => {
      loginWithGoogle();
      setIsLoading(false);
      router.push(redirect);
    }, 500);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Movigoo Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-block rounded-2xl bg-gradient-to-r from-[#0B62FF] to-indigo-600 px-4 py-2 text-xs uppercase tracking-[0.3em] font-semibold mb-4"
          >
            MOVIGOO
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Login to continue your booking</h1>
          <p className="text-sm text-slate-400">Login is required to proceed with booking</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-3">
            {/* Google Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Chrome size={20} className="text-[#0B62FF]" />
                Continue with Google
                {isLoading && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
              </Button>
            </motion.div>

            {/* Email Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Mail size={20} className="text-[#0B62FF]" />
                Continue with Email
              </Button>
            </motion.div>

            {/* Mobile Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Phone size={20} className="text-[#0B62FF]" />
                Continue with Mobile Number
              </Button>
            </motion.div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to Movigoo&apos;s Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#050016] via-[#0b0220] to-[#05010a] text-white flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
