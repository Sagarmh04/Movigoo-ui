"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Event, TicketType } from "@/types/event";
import type { Booking } from "@/types/booking";
import TicketSelector from "@/components/TicketSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn, currencyFormatter, TAX_RATE } from "@/lib/utils";
import { validateTicketSelection } from "@/lib/validators";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import ProcessingLoader from "@/components/ProcessingLoader";
import PaymentSuccessAnimation from "@/components/PaymentSuccessAnimation";
import PaymentFailureAnimation from "@/components/PaymentFailureAnimation";
import { useToast } from "@/components/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type BookingSidebarProps = {
  event: Event;
  ticketTypes: TicketType[];
};

const BookingSidebar = ({ event, ticketTypes }: BookingSidebarProps) => {
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failure">("idle");
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const mutation = useCreateBooking();
  const { pushToast } = useToast();
  const { user } = useCurrentUser();

  const totals = useMemo(() => {
    const subtotal = ticketTypes.reduce(
      (sum, ticket) => sum + (selection[ticket.id] ?? 0) * ticket.price,
      0
    );
    const discount = coupon ? subtotal * 0.05 : 0;
    const taxed = (subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + taxed;
    return { subtotal, discount, taxed, total };
  }, [selection, ticketTypes, coupon]);

  const handleBooking = async () => {
    const { errors, payload } = validateTicketSelection(selection, ticketTypes);
    if (errors.length) {
      errors.forEach((error) =>
          pushToast({ title: "Selection issue", description: error, variant: "error" })
      );
      return;
    }

    setStatus("processing");
    try {
      const response = await mutation.mutateAsync({
        eventId: event.id,
        items: payload.map((item) => ({
          ...item,
          price: ticketTypes.find((ticket) => ticket.id === item.ticketTypeId)?.price ?? 0
        })),
        promoCode: coupon || undefined,
        userId: user.id
      });

      if (response.status === "requires_payment" && response.paymentUrl) {
        window.location.href = response.paymentUrl;
        return;
      }

      setConfirmedBooking(response.booking);
      setStatus("success");
      pushToast({
        title: "Booking locked in",
        description: "We emailed your premium ticket.",
        variant: "success"
      });
    } catch (error) {
      console.error(error);
      setStatus("failure");
    }
  };

  const resetFlow = () => {
    setStatus("idle");
    setConfirmedBooking(null);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "sticky top-24 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-card-glass backdrop-blur-3xl",
        status === "failure" && "border-rose-500/40"
      )}
    >
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Booking</p>
      {status === "processing" && <ProcessingLoader label="Locking seats" />}
      {status === "success" && confirmedBooking ? (
        <PaymentSuccessAnimation booking={confirmedBooking} onDone={resetFlow} />
      ) : status === "failure" ? (
        <PaymentFailureAnimation onRetry={handleBooking} />
      ) : (
        <>
          <TicketSelector tickets={ticketTypes} value={selection} onChange={setSelection} />
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Promo or gift code</p>
            <Input
              placeholder="MAGICGOLD"
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{currencyFormatter.format(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tax & fees</span>
              <span>{currencyFormatter.format(totals.taxed)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-emerald-300">
                <span>Discount</span>
                <span>-{currencyFormatter.format(totals.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-white">
              <span>Total</span>
              <span className="text-xl font-semibold">{currencyFormatter.format(totals.total)}</span>
            </div>
          </div>
          <Button
            onClick={handleBooking}
            className="w-full rounded-2xl py-3 text-base"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Reserving seats..." : "Book with Movigoo"}
          </Button>
          <p className="text-xs text-slate-400">
            Next step: secure payment via trusted partners. Instant refunds for failed payments.
          </p>
        </>
      )}
    </motion.aside>
  );
};

export default BookingSidebar;

