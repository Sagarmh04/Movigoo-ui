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
        // High z-index to ensure visibility
        "fixed z-[100]",
        // Mobile: Centered with safe margins
        "inset-x-4 top-1/2 -translate-y-1/2",
        "w-[calc(100vw-2rem)]",
        "max-h-[90vh]",
        "overflow-y-auto overflow-x-hidden",
        "rounded-2xl",
        "border border-white/10",
        "bg-slate-900/98",
        "p-5",
        "shadow-2xl",
        "backdrop-blur-3xl",
        // Desktop: Centered with fixed width
        "sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
        "sm:w-[440px] sm:max-w-[440px]",
        "sm:max-h-[88vh]",
        "sm:p-6",
        // Ensure visibility
        "box-border",
        "transform",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full flex flex-col relative"
      >
        <DialogClose
          className="absolute right-3 top-3 z-10 flex items-center justify-center rounded-full border border-white/10 bg-slate-800/90 p-1.5 text-slate-200 transition hover:bg-white/10 hover:border-white/20 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </DialogClose>
        <div className="w-full">
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

