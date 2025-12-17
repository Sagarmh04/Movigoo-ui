// components/auth/LoginModal.tsx
// Login modal component for simulated authentication

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithGoogle, loginWithEmail } from "@/lib/fakeAuth";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginWithGoogle();
      setIsLoading(false);
      onSuccess?.();
      onClose();
      // Redirect to profile after login
      router.push("/profile");
      router.refresh();
    }, 500);
  };

  const handleEmailLogin = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      loginWithEmail(email);
      setIsLoading(false);
      onSuccess?.();
      onClose();
      setEmail("");
      setShowEmailInput(false);
      // Redirect to profile after login
      router.push("/profile");
      router.refresh();
    }, 500);
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus:border-[#0B62FF]"
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEmailInput(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="flex-1 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="flex-1 rounded-2xl bg-[#0B62FF] text-white hover:bg-[#0A5AE6]"
                  >
                    {isLoading ? "Logging in..." : "Proceed"}
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
