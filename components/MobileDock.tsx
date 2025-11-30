"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Ticket, Search, CalendarRange, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const dockItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarRange },
  { href: "/search", label: "Search", icon: Search },
  { href: "/my-bookings", label: "Bookings", icon: Ticket },
  { href: "/profile", label: "Profile", icon: UserRound }
];

const MobileDock = () => {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[90%] max-w-2xl items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-2xl md:hidden">
      {dockItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center rounded-full px-2 py-1 text-[10px] font-medium text-slate-400 transition",
              active ? "text-white" : undefined
            )}
            aria-label={label}
          >
            {active && (
              <motion.span
                layoutId="dock-pill"
                className="absolute inset-x-0 -z-10 h-full rounded-full bg-white/10"
              />
            )}
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </div>
  );
};

export default MobileDock;

