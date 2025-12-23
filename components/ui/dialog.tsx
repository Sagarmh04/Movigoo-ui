import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type DialogProps = DialogPrimitive.DialogProps;

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({ className, ...props }: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-40 bg-black/45 backdrop-blur-sm",
      className
    )}
    {...props}
  />
);

type ContentProps = DialogPrimitive.DialogContentProps & {
  children: ReactNode;
};

const DialogContent = ({ className, children, ...props }: ContentProps) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      {...props}
      className={cn(
        // Mobile-first: Fixed positioning with safe margins
        "fixed z-50",
        // Mobile: Full width minus safe margins, centered
        "left-4 right-4 top-[50%] -translate-y-1/2",
        "w-[calc(100vw-2rem)]",
        "max-w-none",
        "max-h-[85vh]",
        "overflow-y-auto",
        "rounded-2xl",
        "border border-white/10",
        "bg-slate-900/95",
        "p-4",
        "shadow-2xl",
        "backdrop-blur-3xl",
        // Desktop: Centered with fixed width
        "sm:left-1/2 sm:right-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
        "sm:w-[420px] sm:max-w-[420px]",
        "sm:max-h-[85vh]",
        "sm:p-6",
        // Prevent overflow
        "box-border",
        className
      )}
      asChild
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full flex flex-col relative"
      >
        <DialogClose
          className="absolute right-2 top-2 sm:right-3 sm:top-3 z-20 flex items-center justify-center rounded-full border border-white/10 bg-slate-800/80 p-1.5 text-slate-200 transition hover:bg-white/10 hover:border-white/20 cursor-pointer touch-manipulation"
          aria-label="Close dialog"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </DialogClose>
        <div className="w-full flex-1 overflow-hidden">
          {children}
        </div>
      </motion.div>
    </DialogPrimitive.Content>
  </DialogPortal>
);

const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
};

