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
  isSoldOut?: boolean; // Per-ticketType sold out flag (from ticketType.ticketsSold >= ticketType.totalQuantity)
};

type TicketSelectionCardProps = {
  ticket: TicketType;
  quantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
  disabled?: boolean;
};

export default function TicketSelectionCard({
  ticket,
  quantity,
  onQuantityChange,
  disabled = false,
}: TicketSelectionCardProps) {
  const available = ticket.available ?? ticket.totalQuantity;
  const maxPerOrder = ticket.maxPerOrder ?? available;
  const isSoldOut = available === 0;
  const canIncrease = !disabled && !isSoldOut && quantity < maxPerOrder && quantity < available;
  const canDecrease = !disabled && quantity > 0;

  const handleClick = () => {
    if (isSoldOut) {
      alert("This ticket type is sold out. All tickets have been booked.");
    }
  };

  return (
    <div 
      className={cn(
        "rounded-2xl border p-4 backdrop-blur-xl transition-all sm:p-6",
        isSoldOut 
          ? "border-red-500/50 bg-red-950/20 opacity-75 cursor-not-allowed" 
          : disabled 
            ? "border-white/10 bg-white/5 opacity-60 cursor-not-allowed" 
            : "border-white/10 bg-white/5 hover:border-[#0B62FF]/50"
      )}
      onClick={isSoldOut ? handleClick : undefined}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Ticket Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white sm:text-xl">{ticket.typeName}</h3>
            {isSoldOut && (
              <span className="rounded-full bg-red-500/20 border border-red-500/50 px-3 py-1 text-xs font-bold text-red-400 uppercase tracking-wide">
                SOLD OUT
              </span>
            )}
          </div>
          <p className={cn(
            "mt-1 text-2xl font-bold sm:text-3xl",
            isSoldOut ? "text-slate-500" : "text-[#0B62FF]"
          )}>
            {currencyFormatter.format(ticket.price)}
          </p>
          {isSoldOut ? (
            <p className="mt-2 text-sm text-red-400 font-semibold">All tickets have been booked</p>
          ) : disabled ? (
            <p className="mt-2 text-xs text-red-400 font-medium">All tickets have been booked</p>
          ) : available > 0 ? (
            <p className="mt-2 text-xs text-slate-400">
              {available} available {maxPerOrder < available && `• Max ${maxPerOrder} per order`}
            </p>
          ) : null}
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-10 rounded-xl border-white/10 p-0",
                (!canDecrease || isSoldOut) ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={!canDecrease || disabled || isSoldOut}
              onClick={(e) => {
                e.stopPropagation();
                if (isSoldOut) {
                  alert("This ticket type is sold out. All tickets have been booked.");
                  return;
                }
                if (canDecrease && !disabled) {
                  onQuantityChange(ticket.id, quantity - 1);
                }
              }}
            >
              <Minus size={18} />
            </Button>
          <span className={cn(
            "min-w-[3rem] text-center text-xl font-semibold",
            isSoldOut ? "text-slate-500" : "text-white"
          )}>
            {quantity}
          </span>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-10 rounded-xl border-white/10 p-0",
                (!canIncrease || isSoldOut) ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={!canIncrease || disabled || isSoldOut}
              onClick={(e) => {
                e.stopPropagation();
                if (isSoldOut) {
                  alert("This ticket type is sold out. All tickets have been booked.");
                  return;
                }
                if (canIncrease && !disabled) {
                  onQuantityChange(ticket.id, quantity + 1);
                }
              }}
            >
              <Plus size={18} />
            </Button>
        </div>
      </div>
    </div>
  );
}

