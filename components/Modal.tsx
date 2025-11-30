"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

type ModalProps = {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Modal = ({ trigger, title, description, children, open, onOpenChange }: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <div className="space-y-4">
          <DialogTitle className="text-2xl font-semibold text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-slate-300">{description}</DialogDescription>
          )}
          <div>{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;

