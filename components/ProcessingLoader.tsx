"use client";

import { motion } from "framer-motion";

const dots = [0, 1, 2];

const ProcessingLoader = ({ label = "Processing payment" }: { label?: string }) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300">
    <motion.div className="flex gap-2">
      {dots.map((dot) => (
        <motion.span
          key={dot}
          className="h-2.5 w-2.5 rounded-full bg-gradient-indigo"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: dot * 0.15 }}
        />
      ))}
    </motion.div>
    <p>{label} • Stay tuned ✨</p>
  </div>
);

export default ProcessingLoader;

