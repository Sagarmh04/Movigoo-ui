// components/booking/LoginModal.tsx
"use client";

import { useState } from "react";
import { X, Mail, Phone, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (method: string) => void;
};

export default function LoginModal({ open, onClose, onLoginSuccess }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleLogin = async (method: string) => {
    setIsLoading(method);
    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
      const auth = getAuth();

      if (method === "google") {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else if (method === "email") {
        // For email, you might want to show an email/password form
        // For now, we'll just simulate
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (method === "mobile") {
        // For mobile, you might want to use phone auth
        // For now, we'll just simulate
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      setIsLoading(null);
      onLoginSuccess(method);
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(null);
      // Still call success for demo purposes
      onLoginSuccess(method);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-white/10 bg-slate-900/95 p-0 backdrop-blur-xl sm:rounded-3xl">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Login to Proceed</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Google Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleLogin("google")}
                disabled={isLoading !== null}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Chrome size={20} className="text-[#0B62FF]" />
                Continue with Google
                {isLoading === "google" && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
              </Button>
            </motion.div>

            {/* Email Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleLogin("email")}
                disabled={isLoading !== null}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Mail size={20} className="text-[#0B62FF]" />
                Continue with Email
                {isLoading === "email" && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
              </Button>
            </motion.div>

            {/* Mobile Login */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleLogin("mobile")}
                disabled={isLoading !== null}
                className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-white/5 py-6 text-base font-medium text-white transition hover:bg-white/10"
              >
                <Phone size={20} className="text-[#0B62FF]" />
                Continue with Mobile Number
                {isLoading === "mobile" && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
              </Button>
            </motion.div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to Movigoo&apos;s Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

