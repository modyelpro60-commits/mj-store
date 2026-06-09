"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle,
  LoaderCircle,
  MessageSquare,
  Package,
  Shield,
  ShieldOff,
  ShoppingCart,
  Star,
  Truck,
  UserCog,
  X,
  XCircle,
} from "lucide-react";
import { useNotifications, type AppNotification } from "../../lib/notifications/useNotifications";
import { useNotificationSound } from "../../lib/sounds/useNotificationSound";
import NotificationSoundToggle from "./NotificationSoundToggle";

/* ─── Helpers ────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
  // legacy / existing
  order_approved:    { icon: Package,       color: "text-emerald-400", dot: "bg-emerald-400" },
  order_rejected:    { icon: Package,       color: "text-red-400",     dot: "bg-red-400"     },
  new_message:       { icon: MessageSquare, color: "text-blue-400",    dot: "bg-blue-400"    },
  review_reply:      { icon: Star,          color: "text-amber-400",   dot: "bg-amber-400"   },
  support_reply:     { icon: MessageSquare, color: "text-purple-400",  dot: "bg-purple-400"  },
  role_changed:      { icon: UserCog,       color: "text-purple-400",  dot: "bg-purple-400"  },
  status_changed:    { icon: Shield,        color: "text-fuchsia-400", dot: "bg-fuchsia-400" },
  // order flow v2
  new_order:         { icon: ShoppingCart,  color: "text-amber-400",   dot: "bg-amber-400"   },
  payment_confirmed: { icon: CheckCircle,   color: "text-emerald-400", dot: "bg-emerald-400" },
  payment_rejected:  { icon: XCircle,       color: "text-red-400",     dot: "bg-red-400"     },
  order_delivered:   { icon: Truck,         color: "text-sky-400",     dot: "bg-sky-400"     },
};

const DEFAULT_META = { icon: Bell, color: "text-white/40", dot: "bg-white/30" };

/* ─── Single Notification Row ────────────────────────────────────── */

function NotifRow({
  n,
  onRead,
}: {
  n: AppNotification;
  onRead: (id: number, link: string | null) => void;
}) {
  const meta = TYPE_META[n.type] ?? DEFAULT_META;
  const Icon = meta.icon;

  return (
    <motion.button
      key={n.id}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      type="button"
      onClick={() => onRead(n.id, n.link)}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 group ${
        n.is_read
          ? "hover:bg-white/[0.03]"
          : "bg-purple-500/[0.07] hover:bg-purple-500/[0.12] border border-purple-500/[0.12]"
      }`}
    >
      {/* Icon */}
      <div className={`relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${
        n.is_read
          ? "border-white/[0.06] bg-white/[0.03]"
          : "border-purple-500/20 bg-purple-500/10"
      }`}>
        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
        {!n.is_read && (
          <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#09091A] ${meta.dot}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[12.5px] font-bold leading-snug truncate ${n.is_read ? "text-white/45" : "text-white/80"}`}>
          {n.title}
        </p>
        <p className={`text-[11px] leading-relaxed mt-0.5 ${n.is_read ? "text-white/22" : "text-white/40"} line-clamp-2`}>
          {n.message}
        </p>
        <p className={`text-[10px] mt-1 font-semibold ${n.is_read ? "text-white/15" : "text-purple-400/50"}`}>
          {timeAgo(n.created_at)}
        </p>
      </div>
    </motion.button>
  );
}

/* ─── Bell Button ────────────────────────────────────────────────── */

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { processNotifications } = useNotificationSound();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* ── Play sound for each genuinely new notification ── */
  useEffect(() => {
    processNotifications(notifications);
  }, [notifications, processNotifications]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  async function handleRead(id: number, link: string | null) {
    await markRead(id);
    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  const isEmpty = notifications.length === 0;

  return (
    <div ref={ref} className="relative">

      {/* ── Bell button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
          open
            ? "border-purple-500/35 bg-purple-500/12 text-purple-300"
            : "border-white/[0.07] bg-white/[0.03] text-white/55 hover:border-purple-500/25 hover:bg-purple-500/[0.08] hover:text-white"
        }`}
      >
        <Bell className="h-[17px] w-[17px]" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[#08081A] bg-gradient-to-r from-purple-600 to-fuchsia-600 px-1 text-[10px] font-black leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[340px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09091A]/98 shadow-[0_24px_72px_rgba(0,0,0,0.7),0_0_0_1px_rgba(168,85,247,0.07)_inset] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/[0.05] px-4 py-3.5">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-500/[0.07] to-transparent" />
              <div className="relative flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-400/70" />
                <p className="text-[13px] font-black text-white">Notifications</p>
                {unreadCount > 0 && (
                  <span className="rounded-full border border-purple-500/25 bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-black text-purple-300">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="relative flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-white/35 transition-all hover:border-purple-500/20 hover:text-purple-300"
                  >
                    <CheckCheck className="h-3 w-3" />
                    All read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-white/20 hover:bg-white/[0.05] hover:text-white/50 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-white/20">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                    <BellOff className="h-5 w-5 text-white/[0.10]" />
                  </div>
                  <p className="text-[12px] text-white/20">No notifications yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n) => (
                    <NotifRow key={n.id} n={n} onRead={(id, link) => void handleRead(id, link)} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer — sound toggle + count */}
            <div className="border-t border-white/[0.04] px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-[10px] text-white/15 leading-none">
                {isEmpty ? "No notifications" : `${notifications.length} notifications`}
              </p>
              <NotificationSoundToggle variant="inline" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
