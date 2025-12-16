// components/booking/TicketSelectionCard.tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter } from "@/lib/utils";

export type TicketType = {
  id: string;
  typeName: string;
  price: number;
  totalQuantity: number;
  available?: number;
  maxPerOrder?: number;
};

type TicketSelectionCardProps = {
  ticket: TicketType;
  quantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
};

export default function TicketSelectionCard({
  ticket,
  quantity,
  onQuantityChange,
}: TicketSelectionCardProps) {
  const available = ticket.available ?? ticket.totalQuantity;
  const maxPerOrder = ticket.maxPerOrder ?? available;
  const canIncrease = quantity < maxPerOrder && quantity < available;
  const canDecrease = quantity > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:border-[#0B62FF]/50 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Ticket Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white sm:text-xl">{ticket.typeName}</h3>
          <p className="mt-1 text-2xl font-bold text-[#0B62FF] sm:text-3xl">
            {currencyFormatter.format(ticket.price)}
          </p>
          {available > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {available} available {maxPerOrder < available && `• Max ${maxPerOrder} per order`}
            </p>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-10 rounded-xl border-white/10 p-0",
                !canDecrease ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={!canDecrease}
              onClick={() => canDecrease && onQuantityChange(ticket.id, quantity - 1)}
            >
              <Minus size={18} />
            </Button>
          <span className="min-w-[3rem] text-center text-xl font-semibold text-white">
            {quantity}
          </span>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-10 rounded-xl border-white/10 p-0",
                !canIncrease ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={!canIncrease}
              onClick={() => canIncrease && onQuantityChange(ticket.id, quantity + 1)}
            >
              <Plus size={18} />
            </Button>
        </div>
      </div>
    </div>
  );
}

