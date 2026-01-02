"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  isActive?: boolean;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isActive = item.isActive ?? isLast;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {index === 0 && item.href === "/events" && (
              <Home size={14} className="text-slate-400" />
            )}
            {item.href && !isActive ? (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-[#0B62FF] transition-colors truncate max-w-[200px] sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[200px] sm:max-w-none",
                  isActive
                    ? "text-white font-medium"
                    : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                size={14}
                className="text-slate-500 flex-shrink-0"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

