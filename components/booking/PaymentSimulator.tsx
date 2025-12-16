// components/booking/PaymentSimulator.tsx
"use client";

import { useState } from "react";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type PaymentSimulatorProps = {
  totalAmount: number;
  onPaymentSuccess: () => void;
};

export default function PaymentSimulator({ totalAmount, onPaymentSuccess }: PaymentSimulatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const simulatePayUSuccess = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsProcessing(false);
    setIsSuccess(true);
    // Call success handler after a brief delay
    setTimeout(() => {
      onPaymentSuccess();
    }, 800);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
      >
        <CheckCircle2 size={64} className="text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">Payment Successful!</h3>
        <p className="text-sm text-slate-300">Processing your booking...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
      {/* PayU Branding */}
      <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-[#0B62FF]/20 to-purple-500/20 p-4">
        <div className="flex items-center gap-2">
          <Lock size={24} className="text-[#0B62FF]" />
          <div>
            <p className="text-sm font-semibold text-white">Secure Payment by</p>
            <p className="text-lg font-bold text-[#0B62FF]">PayU</p>
          </div>
        </div>
      </div>

      {/* Payment Form Placeholder */}
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">Card Number</p>
              <p className="text-sm font-mono text-slate-300">**** **** **** 4242</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Expiry</p>
            <p className="text-sm font-mono text-slate-300">12/25</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">CVV</p>
            <p className="text-sm font-mono text-slate-300">***</p>
          </div>
        </div>
      </div>

      {/* Simulate Payment Button */}
      <Button
        onClick={simulatePayUSuccess}
        disabled={isProcessing}
        className="w-full rounded-2xl bg-[#0B62FF] py-6 text-base font-semibold text-white shadow-lg transition hover:bg-[#0A5AE6] disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing Payment...
          </span>
        ) : (
          "Simulate Successful Payment"
        )}
      </Button>

      <p className="text-center text-xs text-slate-400">
        This is a demo. In production, this will integrate with PayU payment gateway.
      </p>
    </div>
  );
}

