"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type FillingFastBadgeProps = {
  className?: string;
};

/**
 * FillingFastBadge - A subtle momentum indicator badge
 * 
 * Design principles:
 * - Subtle, not alarming (no red panic colors)
 * - No numbers or countdown
 * - Trust-first, not pressure tactics
 */
const FillingFastBadge = ({ className }: FillingFastBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
        "border border-amber-400/30",
        "px-2.5 py-1",
        "text-xs font-medium text-amber-200",
        "backdrop-blur-sm",
        "shadow-sm shadow-amber-500/10",
        className
      )}
    >
      <Flame size={12} className="text-amber-400" />
      <span>Filling Fast</span>
    </div>
  );
};

export default FillingFastBadge;

