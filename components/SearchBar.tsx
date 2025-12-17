// components/SearchBar.tsx
// Premium responsive search bar component

"use client";

import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search events, shows, artists...",
  className 
}: SearchBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          flex items-center gap-3
          rounded-2xl
          border border-white/10
          bg-gradient-to-br from-white/5 to-white/[0.02]
          backdrop-blur-xl
          px-4 py-3
          shadow-lg shadow-black/20
          transition-all duration-200
          focus-within:border-[#0B62FF]/50
          focus-within:bg-gradient-to-br from-white/10 to-white/5
          focus-within:shadow-[#0B62FF]/20
          focus-within:shadow-xl
          max-w-lg mx-auto
          w-full
        "
      >
        <Search className="w-5 h-5 text-[#0B62FF] flex-shrink-0" />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent outline-none
            text-sm md:text-base
            text-white placeholder:text-slate-400
            w-full
          "
        />
        
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="
              rounded-full p-1.5
              text-slate-400 hover:text-white
              hover:bg-white/10
              transition-colors
              flex-shrink-0
            "
            aria-label="Clear search"
          >
            <X size={16} />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

