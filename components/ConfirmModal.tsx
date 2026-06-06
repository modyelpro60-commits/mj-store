"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, LoaderCircle, LogOut, Trash2, X } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "default";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, { border: string; bg: string; btn: string; hoverBtn: string; iconBorder: string; iconBg: string }> = {
  danger: {
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    btn: "bg-red-600",
    hoverBtn: "hover:bg-red-700",
    iconBorder: "border-red-500/20",
    iconBg: "bg-red-500/10",
  },
  warning: {
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/10",
    btn: "bg-yellow-600",
    hoverBtn: "hover:bg-yellow-700",
    iconBorder: "border-yellow-500/20",
    iconBg: "bg-yellow-500/10",
  },
  default: {
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
    btn: "bg-purple-600",
    hoverBtn: "hover:bg-purple-700",
    iconBorder: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
      if (e.key === "Enter" && !loading) onConfirm();
    },
    [loading, onCancel, onConfirm]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus the confirm button
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const cfg = variantConfig[variant];

  const defaultIcon = variant === "danger" ? (
    <Trash2 className="h-5 w-5 text-red-300" />
  ) : variant === "warning" ? (
    <AlertCircle className="h-5 w-5 text-yellow-300" />
  ) : (
    <LogOut className="h-5 w-5 text-purple-300" />
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={loading ? undefined : onCancel}
        >
          <motion.div
            key="confirm-card"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-zinc-950/95 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${cfg.iconBorder} ${cfg.iconBg}`}>
                {icon ?? defaultIcon}
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-zinc-200 transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border ${cfg.border} ${cfg.btn} px-4 py-3 font-bold text-white transition-all duration-200 ${cfg.hoverBtn} disabled:opacity-50`}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    {confirmLabel}...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
