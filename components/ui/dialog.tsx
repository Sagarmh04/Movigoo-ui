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
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-4 sm:p-6 shadow-2xl backdrop-blur-3xl",
        className
      )}
      asChild
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogClose
          className="absolute right-3 top-3 z-10 flex items-center justify-center rounded-full border border-white/10 bg-slate-800/50 p-1.5 text-slate-200 transition hover:bg-white/10 hover:border-white/20 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </DialogClose>
        {children}
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

