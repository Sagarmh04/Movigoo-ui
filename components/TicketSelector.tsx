"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { TicketType } from "@/types/event";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter } from "@/lib/utils";

type TicketSelectorProps = {
  tickets: TicketType[];
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
};

const spring = { type: "spring", stiffness: 400, damping: 30 };

const TicketSelector = ({ tickets, value, onChange }: TicketSelectorProps) => {
  const totalSelected = useMemo(
    () => Object.values(value).reduce((sum, qty) => sum + qty, 0),
    [value]
  );

  const handleChange = (id: string, delta: number) => {
    onChange({
      ...value,
      [id]: Math.max(0, (value[id] ?? 0) + delta)
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Tickets</p>
        <motion.span
          layout
          transition={spring}
          className="rounded-full bg-gradient-indigo/20 px-3 py-1 text-xs text-gradient"
        >
          {totalSelected} selected
        </motion.span>
      </div>
      <div className="space-y-4">
        {tickets.map((ticket) => {
          const qty = value[ticket.id] ?? 0;
          const maxQty = Math.min(ticket.available, ticket.maxPerOrder);
          const disabled = qty >= maxQty;
          return (
            <motion.div
              key={ticket.id}
              layout
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 sm:rounded-3xl sm:p-4 sm:text-sm"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white sm:text-base">{ticket.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 sm:text-xs">{ticket.perks}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-base font-semibold text-white sm:text-lg">
                    {currencyFormatter.format(ticket.price)}
                  </p>
                  <p className="text-[10px] text-slate-400 sm:text-xs">
                    {ticket.available} left • max {ticket.maxPerOrder}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 p-1.5 sm:mt-3 sm:rounded-2xl sm:p-2">
                <button
                  aria-label={`Decrease ${ticket.name}`}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/10 sm:h-10 sm:w-10 sm:rounded-2xl",
                    qty === 0 ? "opacity-50" : undefined
                  )}
                  disabled={qty === 0}
                  onClick={() => handleChange(ticket.id, -1)}
                >
                  <Minus size={14} className="sm:w-4 sm:h-4" />
                </button>
                <motion.span
                  layout
                  transition={spring}
                  className="text-lg font-semibold text-white sm:text-xl"
                  aria-live="polite"
                >
                  {qty}
                </motion.span>
                <button
                  aria-label={`Increase ${ticket.name}`}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/10 sm:h-10 sm:w-10 sm:rounded-2xl",
                    disabled ? "opacity-50" : undefined
                  )}
                  disabled={disabled}
                  onClick={() => handleChange(ticket.id, 1)}
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketSelector;

