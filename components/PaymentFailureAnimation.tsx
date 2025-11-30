"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const PaymentFailureAnimation = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ x: 0 }}
    animate={{ x: [0, -10, 10, -5, 5, 0] }}
    transition={{ duration: 0.5 }}
    className="space-y-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-center"
  >
    <div className="flex flex-col items-center gap-3">
      <AlertTriangle size={42} className="text-rose-300" />
      <div>
        <p className="text-lg font-semibold text-white">Payment failed</p>
        <p className="text-sm text-rose-100">We couldn’t confirm the transaction.</p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
    >
      Retry payment
    </button>
  </motion.div>
);

export default PaymentFailureAnimation;

