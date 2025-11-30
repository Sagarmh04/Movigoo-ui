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
              className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="text-base font-semibold text-white">{ticket.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{ticket.perks}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {currencyFormatter.format(ticket.price)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {ticket.available} left • max {ticket.maxPerOrder}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 p-2">
                <button
                  aria-label={`Decrease ${ticket.name}`}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white transition hover:bg-white/10",
                    qty === 0 && "opacity-50"
                  )}
                  disabled={qty === 0}
                  onClick={() => handleChange(ticket.id, -1)}
                >
                  <Minus size={16} />
                </button>
                <motion.span
                  layout
                  transition={spring}
                  className="text-xl font-semibold text-white"
                  aria-live="polite"
                >
                  {qty}
                </motion.span>
                <button
                  aria-label={`Increase ${ticket.name}`}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white transition hover:bg-white/10",
                    disabled && "opacity-50"
                  )}
                  disabled={disabled}
                  onClick={() => handleChange(ticket.id, 1)}
                >
                  <Plus size={16} />
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

