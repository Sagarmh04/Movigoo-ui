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
        "fixed left-[50%] top-[50%] z-50 w-[calc(100vw-24px)] max-w-[360px] max-h-[calc(100vh-48px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-3xl",
        "box-border mx-auto",
        "sm:max-w-[420px] sm:p-6",
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
        className="w-full max-w-full box-border"
        style={{ 
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        <DialogClose
          className="absolute right-3 top-3 z-10 flex items-center justify-center rounded-full border border-white/10 bg-slate-800/50 p-1.5 text-slate-200 transition hover:bg-white/10 hover:border-white/20 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </DialogClose>
        <div className="w-full max-w-full box-border [&>*]:max-w-full [&>*]:break-words">
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

