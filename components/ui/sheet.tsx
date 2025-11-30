import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = SheetPrimitive.Overlay;

type SheetContentProps = SheetPrimitive.DialogContentProps & {
  side?: "left" | "right" | "top" | "bottom";
};

const variants = {
  left: { initial: { x: "-100%" }, animate: { x: 0 } },
  right: { initial: { x: "100%" }, animate: { x: 0 } },
  bottom: { initial: { y: "100%" }, animate: { y: 0 } },
  top: { initial: { y: "-100%" }, animate: { y: 0 } }
};

const SheetContent = ({ side = "right", className, children, ...props }: SheetContentProps) => (
  <SheetPortal>
    <SheetOverlay className="fixed inset-0 bg-black/60 backdrop-blur-md" />
    <SheetPrimitive.Content asChild {...props}>
      <motion.div
        initial={variants[side].initial}
        animate={variants[side].animate}
        exit={variants[side].initial}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed inset-y-0 z-50 w-full border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-3xl md:w-[420px]",
          side === "left" && "left-0 rounded-r-3xl",
          side === "right" && "right-0 rounded-l-3xl",
          side === "bottom" && "bottom-0 rounded-t-3xl",
          side === "top" && "top-0 rounded-b-3xl",
          className
        )}
      >
        <SheetClose className="absolute right-4 top-4 rounded-full border border-white/10 p-1 text-slate-200 transition hover:bg-white/10">
          <X size={18} />
          <span className="sr-only">Close sheet</span>
        </SheetClose>
        <div className="h-full overflow-y-auto p-6">{children}</div>
      </motion.div>
    </SheetPrimitive.Content>
  </SheetPortal>
);

export { Sheet, SheetTrigger, SheetClose, SheetContent };

