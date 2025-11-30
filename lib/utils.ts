import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | Record<string, boolean>)[]) {
  return twMerge(clsx(inputs));
}

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0
});

export function formatDateRange(startISO: string, endISO?: string) {
  const start = new Date(startISO);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric"
  };
  const startLabel = new Intl.DateTimeFormat("en-IN", opts).format(start);
  if (!endISO) return startLabel;
  const end = new Date(endISO);
  const sameDay = start.toDateString() === end.toDateString();
  const endOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    day: sameDay ? undefined : "numeric",
    month: sameDay ? undefined : "short"
  };
  return `${startLabel} — ${new Intl.DateTimeFormat("en-IN", endOpts).format(end)}`;
}

export function truncate(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export const TAX_RATE = 0.12;

