// components/auth/LoginModal.tsx
// Real Firebase Authentication login modal

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError("Firebase Auth not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsLoading(false);
      onSuccess?.();
      onClose();
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!auth) {
      setError("Firebase Auth not initialized");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to sign in first, if user doesn't exist, create account
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInError: any) {
        // If user doesn't exist, create account
        if (signInError.code === "auth/user-not-found" || signInError.code === "auth/invalid-credential") {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInError;
        }
      }

      setIsLoading(false);
      onSuccess?.();
      onClose();
      setEmail("");
      setPassword("");
      setShowEmailInput(false);
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.error("Email login error:", err);
      setError(err.message || "Failed to sign in with email");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Movigoo Branding */}
          <div className="text-center mb-6">
            <div className="inline-block rounded-2xl bg-gradient-to-r from-[#0B62FF] to-indigo-600 px-4 py-2 text-xs uppercase tracking-[0.3em] font-semibold mb-4">
              MOVIGOO
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Login to continue</h2>
            <p className="text-sm text-slate-400">Choose your preferred login method</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* Login Options */}
          <div className="space-y-3">
            {/* Google Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleGoogleLogin}
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

            {/* Email Login Toggle */}
            {!showEmailInput ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowEmailInput(true)}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
                >
                  <Mail size={20} className="text-[#0B62FF]" />
                  Continue with Email
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleEmailLogin}
                className="space-y-3"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus:border-[#0B62FF]"
                  required
                />
                <Input
                  type="password"
                  placeholder="Enter your password (min 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus:border-[#0B62FF]"
                  required
                  minLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEmailInput(false);
                      setEmail("");
                      setPassword("");
                      setError(null);
                    }}
                    variant="outline"
                    className="flex-1 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="flex-1 rounded-2xl bg-[#0B62FF] text-white hover:bg-[#0A5AE6]"
                  >
                    {isLoading ? "Logging in..." : "Sign In / Sign Up"}
                  </Button>
                </div>
              </motion.form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to Movigoo&apos;s Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
