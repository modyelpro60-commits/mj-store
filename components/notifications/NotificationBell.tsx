"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useDragControls,
} from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle,
  LoaderCircle,
  MessageSquare,
  Package,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  UserCog,
  X,
  XCircle,
} from "lucide-react";
import { useNotifications, type AppNotification } from "../../lib/notifications/useNotifications";
import { useNotificationSound } from "../../lib/sounds/useNotificationSound";
import NotificationSoundToggle from "./NotificationSoundToggle";

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */

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

/** Always sort newest-first */
function newestFirst(arr: AppNotification[]): AppNotification[] {
  return [...arr].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/* ══════════════════════════════════════════════════════════════════
   TYPE → ICON MAP
══════════════════════════════════════════════════════════════════ */

const TYPE_META: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
  order_approved:    { icon: Package,       color: "text-emerald-400", dot: "bg-emerald-400" },
  order_rejected:    { icon: Package,       color: "text-red-400",     dot: "bg-red-400"     },
  new_message:       { icon: MessageSquare, color: "text-blue-400",    dot: "bg-blue-400"    },
  review_reply:      { icon: Star,          color: "text-amber-400",   dot: "bg-amber-400"   },
  support_reply:     { icon: MessageSquare, color: "text-purple-400",  dot: "bg-purple-400"  },
  role_changed:      { icon: UserCog,       color: "text-purple-400",  dot: "bg-purple-400"  },
  status_changed:    { icon: Shield,        color: "text-fuchsia-400", dot: "bg-fuchsia-400" },
  new_order:         { icon: ShoppingCart,  color: "text-amber-400",   dot: "bg-amber-400"   },
  payment_confirmed: { icon: CheckCircle,   color: "text-emerald-400", dot: "bg-emerald-400" },
  payment_rejected:  { icon: XCircle,       color: "text-red-400",     dot: "bg-red-400"     },
  order_delivered:   { icon: Truck,         color: "text-sky-400",     dot: "bg-sky-400"     },
  account_verified:  { icon: Sparkles,      color: "text-teal-400",    dot: "bg-teal-400"    },
};
const DEFAULT_META = { icon: Bell, color: "text-white/40", dot: "bg-white/30" };

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════════ */

function EmptyState({ large = false }: { large?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 text-center" style={{ paddingTop: large ? "3rem" : "2.5rem", paddingBottom: large ? "3rem" : "2.5rem" }}>
      {/* Animated icon */}
      <div className="relative mb-5">
        {/* Ambient glow rings */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl"
          style={{ transform: "scale(2.2)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.08, 0.25] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute inset-0 rounded-full bg-fuchsia-500/20 blur-3xl"
          style={{ transform: "scale(3)" }}
        />

        {/* Icon box */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className={`relative grid place-items-center rounded-3xl border border-white/[0.07] bg-gradient-to-br from-purple-900/40 via-zinc-900/60 to-zinc-900/80 shadow-[0_0_40px_rgba(168,85,247,0.15)]
            ${large ? "h-24 w-24" : "h-16 w-16"}`}
        >
          <BellOff className={`text-purple-400/35 ${large ? "h-10 w-10" : "h-7 w-7"}`} />
        </motion.div>

        {/* Sparkle */}
        <motion.div
          animate={{ scale: [0, 1, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className={`absolute -top-1 -right-1 ${large ? "h-5 w-5" : "h-4 w-4"} grid place-items-center rounded-full bg-purple-600/80`}
        >
          <Sparkles className={`text-white ${large ? "h-2.5 w-2.5" : "h-2 w-2"}`} />
        </motion.div>
      </div>

      <p className={`font-black text-white/30 ${large ? "text-[16px]" : "text-[13px]"}`}>
        All caught up!
      </p>
      <p className={`mt-1.5 text-white/15 leading-relaxed ${large ? "text-[13px] max-w-[220px]" : "text-[11px] max-w-[180px]"}`}>
        New notifications will appear here when something happens.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NOTIFICATION ROW
══════════════════════════════════════════════════════════════════ */

function NotifRow({
  n,
  onRead,
  large = false,
}: {
  n: AppNotification;
  onRead: (id: number, link: string | null) => void;
  large?: boolean;
}) {
  const meta = TYPE_META[n.type] ?? DEFAULT_META;
  const Icon = meta.icon;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      type="button"
      onClick={() => onRead(n.id, n.link)}
      className={`w-full flex items-start gap-3 rounded-xl text-left transition-all duration-150 group
        ${large ? "px-4 py-3.5" : "px-3 py-2.5"}
        ${n.is_read
          ? "hover:bg-white/[0.03] active:bg-white/[0.05]"
          : "bg-purple-500/[0.07] hover:bg-purple-500/[0.11] active:bg-purple-500/[0.14] border border-purple-500/[0.13]"
        }`}
    >
      {/* Icon */}
      <div className={`relative mt-0.5 shrink-0 grid place-items-center rounded-xl border
        ${large ? "h-10 w-10" : "h-8 w-8"}
        ${n.is_read
          ? "border-white/[0.06] bg-white/[0.03]"
          : "border-purple-500/20 bg-purple-500/10"
        }`}>
        <Icon className={`${large ? "h-[18px] w-[18px]" : "h-3.5 w-3.5"} ${meta.color}`} />
        {!n.is_read && (
          <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#09091A] ${meta.dot}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold leading-snug truncate
          ${large ? "text-[14px]" : "text-[12.5px]"}
          ${n.is_read ? "text-white/45" : "text-white/85"}`}>
          {n.title}
        </p>
        <p className={`leading-relaxed mt-0.5 line-clamp-2
          ${large ? "text-[12.5px]" : "text-[11px]"}
          ${n.is_read ? "text-white/22" : "text-white/45"}`}>
          {n.message}
        </p>
        <p className={`mt-1 font-semibold
          ${large ? "text-[11px]" : "text-[10px]"}
          ${n.is_read ? "text-white/15" : "text-purple-400/55"}`}>
          {timeAgo(n.created_at)}
        </p>
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PANEL CONTENT  (shared by both dropdown and bottom-sheet)
══════════════════════════════════════════════════════════════════ */

type PanelProps = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  large?: boolean;
  onMarkAllRead: () => void;
  onClose: () => void;
  onRead: (id: number, link: string | null) => void;
};

function PanelContent({
  notifications, unreadCount, loading,
  large = false, onMarkAllRead, onClose, onRead,
}: PanelProps) {
  const sorted   = newestFirst(notifications);
  const isEmpty  = sorted.length === 0;
  const px       = large ? "px-5" : "px-4";
  const iconSz   = large ? "h-[18px] w-[18px]" : "h-4 w-4";
  const titleSz  = large ? "text-[15px]" : "text-[13px]";
  const btnSz    = large ? "h-8 w-8" : "h-7 w-7";

  return (
    <>
      {/* ── STICKY HEADER ── */}
      <div className={`relative flex items-center justify-between border-b border-white/[0.05] shrink-0 ${px} ${large ? "py-4" : "py-3.5"}`}>
        {/* purple wash */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-500/[0.08] to-transparent" />

        <div className="relative flex items-center gap-2">
          <Bell className={`text-purple-400/75 ${iconSz}`} />
          <span className={`font-black text-white ${titleSz}`}>Notifications</span>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full border border-purple-500/30 bg-purple-500/18 px-1.5 py-0.5 text-[10px] font-black text-purple-300"
            >
              {unreadCount} new
            </motion.span>
          )}
        </div>

        <div className="relative flex items-center gap-1.5">
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.button
                key="mark-all"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                type="button"
                onClick={onMarkAllRead}
                className={`flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] font-bold text-white/35
                  transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.07] hover:text-purple-300 active:scale-95
                  ${large ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]"}`}
              >
                <CheckCheck className={large ? "h-3.5 w-3.5" : "h-3 w-3"} />
                All read
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={onClose}
            className={`grid place-items-center rounded-lg text-white/25 hover:bg-white/[0.06] hover:text-white/60 active:scale-90 transition-all ${btnSz}`}
          >
            <X className={large ? "h-[18px] w-[18px]" : "h-3.5 w-3.5"} />
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE LIST ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {loading && sorted.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-white/20">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : isEmpty ? (
          <EmptyState large={large} />
        ) : (
          <motion.div
            className={`space-y-1 ${large ? "p-3" : "p-2"}`}
            initial={false}
          >
            <AnimatePresence initial={false}>
              {sorted.map((n) => (
                <NotifRow key={n.id} n={n} large={large} onRead={onRead} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className={`border-t border-white/[0.04] flex items-center justify-between gap-3 shrink-0 ${px} ${large ? "py-3" : "py-2.5"}`}>
        <p className={`text-white/15 leading-none tabular-nums ${large ? "text-[11px]" : "text-[10px]"}`}>
          {isEmpty ? "No notifications" : `${sorted.length} notification${sorted.length !== 1 ? "s" : ""}`}
        </p>
        <NotificationSoundToggle variant="inline" />
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MOBILE BOTTOM SHEET  (portaled)
══════════════════════════════════════════════════════════════════ */

function MobileSheet({
  open,
  onClose,
  panelProps,
}: {
  open: boolean;
  onClose: () => void;
  panelProps: PanelProps;
}) {
  const dragControls = useDragControls();
  // Track latest close fn without re-registering effects
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="nb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* ── Sheet ── */}
          <motion.div
            key="nb-sheet"
            /* open/close animation */
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { type: "spring", damping: 30, stiffness: 320 } }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.85 }}
            /* swipe-to-close via drag from handle */
            drag="y"
            dragControls={dragControls}
            dragListener={false}          /* drag ONLY starts from the handle */
            dragConstraints={{ top: 0 }}  /* cannot drag upward */
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, { offset, velocity }) => {
              /* close on fast swipe OR drag-past threshold */
              if (offset.y > 90 || velocity.y > 380) {
                onCloseRef.current();
              }
              /* otherwise framer-motion snaps back to animate={{ y: 0 }} */
            }}
            className="fixed inset-x-0 bottom-0 z-[201] flex flex-col overflow-hidden
              rounded-t-[1.75rem] border-t border-x border-white/[0.09]
              bg-[#09091A]
              shadow-[0_-28px_80px_rgba(0,0,0,0.75),0_0_0_1px_rgba(168,85,247,0.09)_inset]"
            style={{ maxHeight: "80svh" }}
          >
            {/* ── Drag handle ── */}
            <div
              className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <motion.div
                className="h-[5px] w-11 rounded-full bg-white/[0.18]"
                whileTap={{ scaleX: 0.75, backgroundColor: "rgba(168,85,247,0.45)" }}
                transition={{ duration: 0.12 }}
              />
            </div>

            {/* ── Content ── */}
            <PanelContent {...panelProps} large />

            {/* ── iPhone home-bar spacer ── */}
            <div
              aria-hidden
              className="shrink-0"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT — Bell button + panel switcher
══════════════════════════════════════════════════════════════════ */

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { processNotifications } = useNotificationSound();

  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobile,  setMobile]  = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  /* ── Mount flag ── */
  useEffect(() => setMounted(true), []);

  /* ── Mobile breakpoint detector ── */
  useEffect(() => {
    function check() { setMobile(window.innerWidth < 640); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Sound on new notifications ── */
  useEffect(() => {
    processNotifications(notifications);
  }, [notifications, processNotifications]);

  /* ── Desktop: close on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!mobile && bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobile]);

  /* ── ESC to close (both variants) ── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Body scroll-lock while mobile sheet is open ── */
  useEffect(() => {
    if (mobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobile, open]);

  async function handleRead(id: number, link: string | null) {
    await markRead(id);
    if (link) { setOpen(false); router.push(link); }
  }

  const panelProps: PanelProps = {
    notifications,
    unreadCount,
    loading,
    onMarkAllRead: () => void markAllRead(),
    onClose:       () => setOpen(false),
    onRead:        (id, link) => void handleRead(id, link),
  };

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Bell button ─────────────────────────────────────────── */}
      <div ref={bellRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Notifications"
          aria-expanded={open}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
            open
              ? "border-purple-500/35 bg-purple-500/[0.12] text-purple-300"
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
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[#08081A] bg-gradient-to-r from-purple-600 to-fuchsia-600 px-1 text-[10px] font-black leading-none text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* ── DESKTOP dropdown (sm+) ──────────────────────────────── */}
        <AnimatePresence>
          {!mobile && open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-[calc(100%+10px)] z-50 flex flex-col w-[340px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09091A]/98 shadow-[0_24px_72px_rgba(0,0,0,0.7),0_0_0_1px_rgba(168,85,247,0.07)_inset] backdrop-blur-2xl"
              style={{ maxHeight: "min(520px,calc(100vh - 80px))" }}
            >
              <PanelContent {...panelProps} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE bottom sheet (portaled) ──────────────────────── */}
      {mounted && createPortal(
        <MobileSheet open={mobile && open} onClose={() => setOpen(false)} panelProps={panelProps} />,
        document.body
      )}
    </>
  );
}
