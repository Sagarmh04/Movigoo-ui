"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "info" | "error";

type ToastPayload = {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  pushToast: (payload: ToastPayload) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantMap: Record<ToastVariant, { icon: ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle2 className="text-emerald-300" size={18} />,
    classes: "border-emerald-500/40 bg-emerald-500/10"
  },
  info: {
    icon: <Info className="text-sky-300" size={18} />,
    classes: "border-sky-500/40 bg-sky-500/10"
  },
  error: {
    icon: <AlertTriangle className="text-rose-300" size={18} />,
    classes: "border-rose-500/40 bg-rose-500/10"
  }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((payload: ToastPayload) => {
    const id = payload.id ?? crypto.randomUUID();
    setToasts((prev) => [...prev, { ...payload, id }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastViewport = ({
  toasts,
  onDismiss
}: {
  toasts?: ToastPayload[];
  onDismiss?: (id: string) => void;
}) => (
  <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-2">
    <AnimatePresence>
      {toasts?.map((toast) => {
        const variant = toast.variant ?? "info";
        const map = variantMap[variant];
        return (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            layout
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-2xl",
              map.classes
            )}
            role="status"
          >
            {map.icon}
            <div className="flex-1 text-sm">
              <p className="font-semibold text-white">{toast.title}</p>
              {toast.description && <p className="text-slate-200">{toast.description}</p>}
            </div>
            {onDismiss && toast.id && (
              <button
                onClick={() => onDismiss(toast.id!)}
                className="text-xs text-slate-400 transition hover:text-white"
              >
                Close
              </button>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

