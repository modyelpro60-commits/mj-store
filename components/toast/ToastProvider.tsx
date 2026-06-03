"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  createdAt: number;
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, "id" | "createdAt"> & { id?: string; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}

export function useToast() {
  return useToastContext();
}

function toastColorClass(type: ToastType) {
  switch (type) {
    case "success":
      return {
        pill: "border-green-500/30 bg-green-500/10 text-green-200",
        border: "border-green-500/20",
      };
    case "error":
      return {
        pill: "border-red-500/30 bg-red-500/10 text-red-200",
        border: "border-red-500/20",
      };
    default:
      return {
        pill: "border-purple-500/30 bg-purple-500/10 text-purple-200",
        border: "border-purple-500/20",
      };
  }
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(
    toast: Omit<Toast, "id" | "createdAt"> & { id?: string; durationMs?: number }
  ) {
    const id = toast.id ?? makeId();
    const durationMs = toast.durationMs ?? 4000;

    const nextToast: Toast = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, nextToast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-16 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const colors = toastColorClass(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto rounded-2xl border ${colors.border} bg-zinc-950/90 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                      <span className={colors.pill}>{t.type}</span>
                    </div>
                    <div className="mt-2 truncate text-sm font-bold text-white">
                      {t.title}
                    </div>
                    {t.message ? (
                      <div className="mt-1 text-sm text-zinc-300">
                        {t.message}
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
