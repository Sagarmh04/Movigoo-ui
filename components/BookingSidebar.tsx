"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/auth/LoginModal";

type BookingSidebarProps = {
  event: Event;
  ticketTypes: TicketType[];
};

const BookingSidebar = ({ event, ticketTypes }: BookingSidebarProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failure">("idle");
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const mutation = useCreateBooking();
  const { pushToast } = useToast();

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
    // Check if user is logged in - show login modal if not
    if (!user || !user.uid) {
      // Store the intended destination for after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bookingRedirect", `/events/${event.id}/checkout`);
      }
      setShowLoginModal(true);
      return;
    }

    const { errors, payload } = validateTicketSelection(selection, ticketTypes);
    if (errors.length) {
      errors.forEach((error) =>
          pushToast({ title: "Selection issue", description: error, variant: "error" })
      );
      return;
    }

    // Save booking state and redirect to checkout
    // Store selection in sessionStorage for checkout page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bookingSelection", JSON.stringify({
        eventId: event.id,
        items: payload.map((item) => ({
          ...item,
          price: ticketTypes.find((ticket) => ticket.id === item.ticketTypeId)?.price ?? 0
        })),
        promoCode: coupon || undefined,
      }));
    }

    router.push(`/events/${event.id}/checkout`);
  };

  const resetFlow = () => {
    setStatus("idle");
    setConfirmedBooking(null);
  };

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-card-glass backdrop-blur-xl sm:space-y-6 sm:p-6 sm:rounded-3xl mb-20 sm:mb-0",
          "lg:sticky lg:top-24",
          status === "failure" ? "border-rose-500/40" : ""
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
                className="rounded-2xl"
              />
            </div>
            {/* Desktop: Show full breakdown */}
            <div className="hidden space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:block">
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
            {/* Desktop: Show button */}
            <div className="hidden sm:block">
              <Button
                onClick={handleBooking}
                className="w-full rounded-2xl py-3 text-base"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Reserving seats..." : "Book with Movigoo"}
              </Button>
              <p className="mt-2 text-xs text-slate-400">
                Next step: secure payment via trusted partners. Instant refunds for failed payments.
              </p>
            </div>
          </>
        )}
      </motion.aside>

      {/* Mobile: Sticky bottom bar with total and CTA - Above navbar (z-50) */}
      {status === "idle" && (
        <div 
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl sm:hidden"
          style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
        >
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-medium text-white">Total</div>
              <div className="text-base font-semibold text-emerald-300">
                {currencyFormatter.format(totals.total)}
              </div>
            </div>
            <Button
              onClick={handleBooking}
              className="flex-1 rounded-full bg-[#0B62FF] py-2.5 text-sm font-semibold shadow-lg transition hover:bg-[#0A5AE6] sm:flex-none sm:px-6"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Reserving..." : "BOOK WITH MOVIGOO"}
            </Button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          router.refresh();
        }}
      />
    </>
  );
};

export default BookingSidebar;

