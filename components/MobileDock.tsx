"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Ticket, Film, CalendarRange, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const dockItems = [
  { href: "/", label: "Home", icon: Home, key: "home" },
  { href: "/events", label: "Events", icon: CalendarRange, key: "events" },
  { href: "#", label: "Movies", icon: Film, key: "movies" },
  { href: "/my-bookings", label: "Bookings", icon: Ticket, key: "bookings" },
  { href: "/profile", label: "Profile", icon: UserRound, key: "profile" }
];

const MobileDock = () => {
  const pathname = usePathname();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [animateMovie, setAnimateMovie] = useState(false);

  const handleMovieClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setAnimateMovie(true);
    setTimeout(() => {
      setShowComingSoon(true);
      setAnimateMovie(false);
    }, 500);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[90%] max-w-2xl items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-2xl md:hidden">
        {dockItems.map(({ href, icon: Icon, label, key }) => {
          const active = pathname === href;
          const isMovies = key === "movies";

          if (isMovies) {
            return (
              <button
                key={key}
                onClick={handleMovieClick}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center rounded-full px-2 py-1 text-[10px] font-medium text-slate-400 transition"
                )}
                aria-label={label}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    animateMovie && "animate-moviePulse"
                  )}
                >
                  <Icon 
                    size={18} 
                    className={cn(
                      "transition-colors duration-200",
                      animateMovie && "text-red-500"
                    )} 
                  />
                  {animateMovie && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                {label}
              </button>
            );
          }

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

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowComingSoon(false)}
        >
          <div 
            className="bg-slate-900 border border-white/10 rounded-3xl px-6 py-8 w-80 text-center animate-scaleIn shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center animate-reelSpin shadow-lg shadow-red-500/30">
              <span className="text-3xl">🎬</span>
            </div>

            <h3 className="text-xl font-bold text-white">Movies</h3>
            <p className="text-sm text-slate-400 mt-2">
              Coming Soon
            </p>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              We&apos;re bringing movies & showtimes to Movigoo very soon. Stay tuned!
            </p>

            <button
              onClick={() => setShowComingSoon(false)}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#0B62FF] text-white text-sm font-semibold hover:bg-[#0A5AE6] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes moviePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .animate-moviePulse {
          animation: moviePulse 0.4s ease-out;
        }

        @keyframes reelSpin {
          0% { transform: rotate(-10deg) scale(0.8); opacity: 0; }
          60% { transform: rotate(10deg) scale(1.05); opacity: 1; }
          100% { transform: rotate(0deg) scale(1); }
        }

        .animate-reelSpin {
          animation: reelSpin 0.5s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileDock;
