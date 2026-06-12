"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  Package,
  PackageCheck,
  RotateCcw,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Smile,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import UserAvatar from "../ui/UserAvatar";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import ImageViewer from "./ImageViewer";
import { useTypingBroadcast } from "./useTypingBroadcast";
import { useChatSounds } from "./useChatSounds";

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
type Message = {
  id: number;
  senderId: string;
  senderName: string;
  senderRole: string | null;
  body: string;
  imageUrl?: string | null;
  isSystem?: boolean;
  createdAt: string;
  isOwn: boolean;
};

type Room = {
  id: string;
  userId: string;
  userName: string;
  title?: string | null;
  orderRef?: string | null;
  orderStatus?: string | null;
  lastMessageAt: string;
  lastMsg: string | null;
  status: string;
  unread: boolean;
};

type RoomMeta = {
  status: string;
  closedByName: string | null;
  closedAt: string | null;
  closing?: boolean;
  closedByRole?: string | null;
  clearAt?: string | null;
  orderRef?: string | null;
  orderStatus?: string | null;
  title?: string | null;
  productName?: string | null;
  productImage?: string | null;
  price?: number | string | null;
  paymentMethod?: string | null;
  customerName?: string | null;
  orderCreatedAt?: string | null;
};

/* ═══════════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════════ */
const STAFF_ROLES = ["owner", "admin", "moderator", "helper"];
const TERMINAL_STATUSES = ["Completed", "Cancelled", "Rejected"] as const;

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string; glow: string }> = {
  "Awaiting Payment": { label: "Awaiting Payment", dot: "bg-amber-400",   pill: "border-amber-500/30 bg-amber-500/15 text-amber-200",   glow: "shadow-amber-500/20" },
  "payment_rejected": { label: "Rejected",          dot: "bg-rose-400",    pill: "border-rose-500/30 bg-rose-500/15 text-rose-200",      glow: "shadow-rose-500/20"  },
  "Pending":          { label: "Pending",           dot: "bg-yellow-400",  pill: "border-yellow-500/30 bg-yellow-500/15 text-yellow-200", glow: "shadow-yellow-500/20"},
  "Processing":       { label: "Processing",        dot: "bg-blue-400 animate-pulse", pill: "border-blue-500/30 bg-blue-500/15 text-blue-200", glow: "shadow-blue-500/20" },
  "Completed":        { label: "Completed",         dot: "bg-emerald-400", pill: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200", glow: "shadow-emerald-500/20" },
  "Cancelled":        { label: "Cancelled",         dot: "bg-red-400",     pill: "border-red-500/30 bg-red-500/15 text-red-200",         glow: "shadow-red-500/20"   },
};

const ROLE_META: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  owner:     { cls: "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]", icon: Crown, label: "Owner" },
  admin:     { cls: "border-purple-500/40 bg-purple-500/15 text-purple-300",       icon: Crown,      label: "Admin"     },
  moderator: { cls: "border-blue-500/40 bg-blue-500/15 text-blue-300",             icon: ShieldCheck, label: "Mod"       },
  helper:    { cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",    icon: Wrench,     label: "Helper"    },
};

const COMMON_EMOJIS = [
  "😊","😂","🙏","👍","❤️","🔥","✅","⭐","🎉","💯",
  "😮","🤔","👏","💪","🙌","🤝","💬","📦","💰","🚀",
  "⚡","🎯","✨","🔒","📸","📱","💻","🌟","⚠️","❌",
  "🕐","📅","💎","🎁","🛒","💳","🔑","📋","📝","🔔",
];

/* ═══════════════════════════════════════════════════════════
   Small helper components
═══════════════════════════════════════════════════════════ */
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${cfg.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md border px-1 py-0.5 text-[9px] font-black leading-none ${m.cls}`}>
      <Icon className="h-2 w-2" />{m.label}
    </span>
  );
}

function fmtCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function fmtCurrency(v: number | string | null | undefined) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
}

/* ── Order Timeline ── */
function OrderTimeline({ status }: { status: string | null | undefined }) {
  if (!status) return null;

  const steps = [
    { key: "created",   label: "Order Created",     icon: Package   },
    { key: "payment",   label: "Payment Uploaded",  icon: Camera    },
    { key: "confirmed", label: "Payment Confirmed", icon: Check     },
    { key: "processing",label: "Processing",        icon: Settings  },
    { key: "delivered", label: "Delivered",         icon: PackageCheck },
  ];

  // Determine active step index
  let activeIdx = 0;
  if (status === "Awaiting Payment" || status === "payment_rejected") activeIdx = 1;
  else if (status === "Pending") activeIdx = 2;
  else if (status === "Processing") activeIdx = 3;
  else if (status === "Completed") activeIdx = 4;
  const cancelled = status === "Cancelled";

  return (
    <div className="flex items-center justify-center gap-0 py-3 px-4 overflow-x-auto">
      {steps.map((step, i) => {
        const done    = cancelled ? false : i < activeIdx;
        const current = !cancelled && i === activeIdx;
        const Icon    = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[56px]">
              <motion.div
                initial={false}
                animate={{
                  scale: current ? [1, 1.12, 1] : 1,
                  transition: { duration: 0.4, repeat: current ? Infinity : 0, repeatDelay: 2 },
                }}
                className={`h-7 w-7 rounded-full grid place-items-center border-2 transition-all duration-300
                  ${done    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : ""}
                  ${current ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]" : ""}
                  ${!done && !current ? "border-white/10 bg-white/[0.03] text-white/20" : ""}
                  ${cancelled ? "border-red-500/30 bg-red-500/10 text-red-400/40" : ""}
                `}
              >
                {done ? <Check className="h-3 w-3 stroke-[3]" /> : <Icon className="h-3 w-3" />}
              </motion.div>
              <p className={`text-[9px] font-bold text-center leading-tight max-w-[52px] transition-colors
                ${done    ? "text-emerald-400/80" : ""}
                ${current ? "text-purple-300" : ""}
                ${!done && !current ? "text-white/20" : ""}
                ${cancelled ? "text-red-400/40" : ""}
              `}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px mb-4 flex-shrink-0 transition-colors duration-500
                ${i < activeIdx && !cancelled ? "bg-emerald-500/50" : "bg-white/[0.06]"}`}
              />
            )}
          </div>
        );
      })}
      {cancelled && (
        <div className="absolute top-1 right-3">
          <span className="text-[9px] font-black text-red-400/70 uppercase tracking-widest">Cancelled</span>
        </div>
      )}
    </div>
  );
}

/* ── System Message Card ── */
type CardVariant = "success" | "error" | "warning" | "info" | "neutral";

function SystemCard({ body, createdAt, locale }: { body: string; createdAt: string; locale: string }) {
  // Detect card type from body
  let variant: CardVariant = "info";
  let icon: React.ReactNode = <MessageCircle className="h-4 w-4" />;
  let title = "";

  if (body.includes("تم تأكيد الدفع بنجاح") || body.includes("Payment confirmed")) {
    variant = "success"; icon = <Check className="h-4 w-4" />; title = "✅ Payment Confirmed";
  } else if (body.includes("تم تسليم الطلب بنجاح") || body.includes("order delivered")) {
    variant = "success"; icon = <PackageCheck className="h-4 w-4" />; title = "🎉 Order Delivered";
  } else if (body.includes("تم رفض إثبات الدفع") || body.includes("payment rejected")) {
    variant = "error"; icon = <XCircle className="h-4 w-4" />; title = "❌ Payment Rejected";
  } else if (body.includes("تم إلغاء الطلب") || body.includes("order cancelled")) {
    variant = "error"; icon = <Ban className="h-4 w-4" />; title = "🚫 Order Cancelled";
  } else if (body.includes("بإغلاق المحادثة") || body.includes("closed the conversation")) {
    variant = "neutral"; icon = <Lock className="h-4 w-4" />; title = "🔒 Chat Closed";
  } else if (body.includes("تم استلام لقطة الشاشة") || body.includes("screenshot received")) {
    variant = "success"; icon = <Camera className="h-4 w-4" />; title = "📸 Screenshot Received";
  }

  const isSpecialCard = !!title;

  if (!isSpecialCard) {
    // Generic system message
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[88%] px-4 py-2.5 rounded-2xl border border-purple-500/15 bg-purple-500/[0.06] text-center">
          <p className="text-[11px] font-semibold text-purple-200/70 whitespace-pre-line leading-relaxed">{body}</p>
          <p className="text-[9px] text-white/20 mt-1">{fmtTime(createdAt, locale)}</p>
        </div>
      </div>
    );
  }

  const variantStyles: Record<CardVariant, { border: string; bg: string; icon: string; badge: string }> = {
    success: { border: "border-emerald-500/25", bg: "bg-emerald-500/[0.07]", icon: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25", badge: "text-emerald-300" },
    error:   { border: "border-red-500/25",     bg: "bg-red-500/[0.07]",     icon: "text-red-400 bg-red-500/15 border-red-500/25",             badge: "text-red-300"     },
    warning: { border: "border-amber-500/25",   bg: "bg-amber-500/[0.07]",   icon: "text-amber-400 bg-amber-500/15 border-amber-500/25",       badge: "text-amber-300"   },
    info:    { border: "border-blue-500/25",     bg: "bg-blue-500/[0.07]",    icon: "text-blue-400 bg-blue-500/15 border-blue-500/25",          badge: "text-blue-300"    },
    neutral: { border: "border-white/10",        bg: "bg-white/[0.04]",       icon: "text-white/50 bg-white/[0.07] border-white/10",            badge: "text-white/40"    },
  };

  const s = variantStyles[variant];

  // Parse body lines for display (skip the emoji-title line if body starts with it)
  const lines = body.split("\n").filter(Boolean);
  const descLines = lines.filter(l =>
    !l.startsWith("🎉") && !l.startsWith("✅") && !l.startsWith("❌") &&
    !l.startsWith("🚫") && !l.startsWith("🔒") && !l.startsWith("📸") &&
    !l.startsWith("قام المسؤول") && l.trim() !== ""
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex justify-center my-3 px-2"
    >
      <div className={`w-full max-w-sm rounded-2xl border ${s.border} ${s.bg} overflow-hidden`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`h-8 w-8 flex-shrink-0 rounded-xl border grid place-items-center ${s.icon}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-black ${s.badge}`}>{title}</p>
            {descLines.length > 0 && (
              <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed whitespace-pre-line">
                {descLines.slice(0, 3).join("\n")}
              </p>
            )}
          </div>
          <p className="text-[9px] text-white/20 flex-shrink-0 self-start mt-0.5">
            {fmtTime(createdAt, locale)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Typing Dots ── */
function TypingDots({ name }: { name?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04]">
        {[0, 0.18, 0.36].map((delay) => (
          <motion.span
            key={delay}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-white/30"
          />
        ))}
      </div>
      {name && (
        <span className="text-[10px] text-white/25 font-semibold">{name} is typing…</span>
      )}
    </motion.div>
  );
}

/* ── Emoji Picker ── */
function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("emoji-picker-popover");
      if (el && !el.contains(e.target as Node)) onClose();
    };
    setTimeout(() => window.addEventListener("mousedown", handler), 0);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      id="emoji-picker-popover"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="absolute bottom-full mb-2 left-0 z-30 p-2 rounded-2xl border border-white/10 bg-[#0F0E1E]/95 shadow-xl backdrop-blur-xl"
      style={{ width: 224 }}
    >
      <div className="grid grid-cols-8 gap-0.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="h-7 w-7 text-base rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════ */
export default function ChatWorkspace({
  variant = "floating",
  onRequestClose,
  initialRoomId = null,
}: {
  variant?: "floating" | "page";
  onRequestClose?: () => void;
  initialRoomId?: string | null;
}) {
  const { accessToken, role, profile } = useAuth();
  const userId = (profile as Record<string, unknown> | null)?.id as string | null ?? null;
  const { language, translate } = useLanguage();
  const isStaff = STAFF_ROLES.includes(role ?? "");
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner"; // owner has all admin capabilities
  const dir    = language === "ar" ? "rtl" : "ltr";
  const locale = language === "ar" ? "ar-EG" : language === "fr" ? "fr-FR" : "en-US";
  const withVars = (key: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce((t, [n, v]) => t.replaceAll(`{${n}}`, v), translate(key));

  /* ── Core state ── */
  const [rooms,        setRooms]        = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [roomMeta,     setRoomMeta]     = useState<RoomMeta>({ status: "open", closedByName: null, closedAt: null });
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [msgsLoading,  setMsgsLoading]  = useState(false);
  const [showSidebar,  setShowSidebar]  = useState(true);
  const [closing,      setClosing]      = useState(false);
  const [confirmDelete,setConfirmDelete]= useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [countdown,    setCountdown]    = useState<number | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [confirming,   setConfirming]   = useState(false);
  const [delivering,   setDelivering]   = useState(false);
  const [showRejectModal,    setShowRejectModal]    = useState(false);
  const [rejectingPayment,   setRejectingPayment]   = useState(false);
  const [rejectReason,       setRejectReason]       = useState("");
  const [showCancelModal,    setShowCancelModal]    = useState(false);
  const [cancelling,         setCancelling]         = useState(false);

  /* ── NEW state ── */
  const [viewerSrc,    setViewerSrc]    = useState<string | null>(null);
  const [emojiOpen,    setEmojiOpen]    = useState(false);
  const [imgPreview,   setImgPreview]   = useState<{ file: File; url: string } | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [sidePanelOpen,setSidePanelOpen]= useState(false);
  const [mobileActions,setMobileActions]= useState(false);
  const [prevMsgCount, setPrevMsgCount] = useState(0);

  /* ── Refs ── */
  const messagesRef   = useRef<HTMLDivElement>(null);
  const stickRef      = useRef(true);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const fileRef       = useRef<HTMLInputElement>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReadId    = useRef<number>(0);
  const activeRef     = useRef<string | null>(null);
  const handledInitial= useRef<string | null>(null);
  activeRef.current   = activeRoomId;

  /* ── Sound & typing ── */
  const { enabled: soundsEnabled, setEnabled: setSoundsEnabled, playIncoming, playOutgoing } = useChatSounds();
  const { otherIsTyping, broadcastTyping } = useTypingBroadcast(activeRoomId, userId);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (!stickRef.current) return;
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function onMessagesScroll() {
    const el = messagesRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }

  /* ── Countdown ── */
  useEffect(() => {
    if (!roomMeta.closing || !roomMeta.clearAt) { setCountdown(null); return; }
    const target = new Date(roomMeta.clearAt).getTime();
    let id: ReturnType<typeof setInterval>;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setCountdown(rem);
      if (rem <= 0) {
        clearInterval(id);
        if (activeRef.current) fetchMessages(activeRef.current, true);
        if (isStaff) fetchRooms(true);
      }
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomMeta.closing, roomMeta.clearAt]);

  /* ── Play sound on new incoming messages ── */
  useEffect(() => {
    if (messages.length > prevMsgCount && prevMsgCount > 0) {
      const latest = messages[messages.length - 1];
      if (latest && !latest.isOwn && !latest.isSystem) playIncoming();
    }
    setPrevMsgCount(messages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [input]);

  const hdrs = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

  /* ── API ── */
  const markRead = useCallback(async (roomId: string) => {
    if (!accessToken) return;
    try {
      await fetch(`/api/chat/rooms/${roomId}`, {
        method: "PATCH", headers: hdrs(), body: JSON.stringify({ action: "read" }),
      });
    } catch {}
  }, [accessToken, hdrs]);

  const fetchRooms = useCallback(async (silent = false) => {
    if (!accessToken) return;
    if (!silent) setRoomsLoading(true);
    try {
      const res = await fetch("/api/chat/rooms", { headers: hdrs() });
      const d = await res.json();
      if (d.success) setRooms(d.data ?? []);
    } catch {}
    if (!silent) setRoomsLoading(false);
  }, [accessToken, hdrs]);

  const ensureRoom = useCallback(async (): Promise<string | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch("/api/chat/rooms", { method: "POST", headers: hdrs() });
      const d = await res.json();
      return d.success ? d.roomId : null;
    } catch { return null; }
  }, [accessToken, hdrs]);

  const fetchMessages = useCallback(async (roomId: string, silent = false) => {
    if (!accessToken) return;
    if (!silent) setMsgsLoading(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, { headers: hdrs() });
      const d = await res.json();
      if (d.success) {
        const incoming: Message[] = d.data ?? [];
        setMessages(incoming);
        if (d.room) setRoomMeta(d.room);
        const newest = incoming[incoming.length - 1];
        if (newest && !newest.isOwn && newest.id !== lastReadId.current && activeRef.current === roomId) {
          lastReadId.current = newest.id;
          markRead(roomId);
        }
      }
    } catch {}
    if (!silent) setMsgsLoading(false);
  }, [accessToken, hdrs, markRead]);

  /* ── Init ── */
  useEffect(() => {
    if (!accessToken) return;
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isStaff]);

  /* ── Auto-select ── */
  useEffect(() => {
    if (initialRoomId && initialRoomId !== handledInitial.current && rooms.some((r) => r.id === initialRoomId)) {
      handledInitial.current = initialRoomId;
      selectRoom(initialRoomId);
      return;
    }
    if (!activeRoomId && !isStaff && rooms.length === 1) selectRoom(rooms[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, initialRoomId]);

  /* ── Polling ── */
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!accessToken) return;
    pollRef.current = setInterval(() => {
      if (activeRef.current) fetchMessages(activeRef.current, true);
      fetchRooms(true);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [accessToken, isStaff, fetchMessages, fetchRooms]);

  /* ── Kick non-admin staff out of closed rooms ── */
  useEffect(() => {
    if (!isStaff || isAdmin || !activeRoomId) return;
    if (!rooms.some((r) => r.id === activeRoomId)) {
      setActiveRoomId(null); setMessages([]); setConfirmDelete(false);
    }
  }, [rooms, isStaff, isAdmin, activeRoomId]);

  /* ════════════════════ Actions ════════════════════ */
  async function selectRoom(roomId: string) {
    if (activeRoomId === roomId) { setShowSidebar(false); return; }
    setActiveRoomId(roomId);
    setMessages([]);
    setShowSidebar(false);
    setConfirmDelete(false);
    lastReadId.current = 0;
    stickRef.current = true;
    await fetchMessages(roomId);
    markRead(roomId);
    fetchRooms(true);
  }

  async function send() {
    const body = input.trim();
    if ((!body && !imgPreview) || !accessToken || sending) return;

    let roomId = activeRoomId;
    if (!roomId && !isStaff) {
      roomId = await ensureRoom();
      if (roomId) setActiveRoomId(roomId);
    }
    if (!roomId) { toast.error(translate("chat.workspace.toast.sendFailed")); return; }

    // If there's an image preview, send it first
    if (imgPreview) {
      await sendImage(imgPreview.file, roomId);
      URL.revokeObjectURL(imgPreview.url);
      setImgPreview(null);
      if (!body) return;
    }

    if (!body) return;
    setSending(true);
    setInput("");
    stickRef.current = true;
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST", headers: hdrs(), body: JSON.stringify({ body }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (!d.success) {
        toast.error(d.error ?? translate("chat.workspace.toast.messageFailed"));
        setInput(body);
      } else {
        playOutgoing();
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch {
      toast.error(translate("chat.workspace.toast.messageFailed")); setInput(body);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function sendImage(file: File, overrideRoomId?: string) {
    if (!accessToken || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error(translate("chat.workspace.toast.imageTypeError")); return;
    }
    let roomId = overrideRoomId ?? activeRoomId;
    if (!roomId && !isStaff) {
      roomId = await ensureRoom();
      if (roomId) setActiveRoomId(roomId);
    }
    if (!roomId) { toast.error(translate("chat.workspace.toast.chatStartFailed")); return; }
    setUploading(true); stickRef.current = true;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/chat/upload", {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: fd,
      });
      const ud = await up.json().catch(() => ({ success: false }));
      if (!ud.success || !ud.url) {
        toast.error(ud.error ?? translate("chat.workspace.toast.uploadFailed"));
        setUploading(false); return;
      }
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST", headers: hdrs(), body: JSON.stringify({ imageUrl: ud.url }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (!d.success) toast.error(d.error ?? translate("chat.workspace.toast.messageFailed"));
      else {
        playOutgoing();
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch { toast.error(translate("chat.workspace.toast.uploadFailed")); }
    setUploading(false);
  }

  async function confirmPayment() {
    if (!activeRoomId || !accessToken || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/confirm-payment`, { method: "POST", headers: hdrs() });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) { toast.success(translate("chat.workspace.toast.paymentConfirmed")); await fetchMessages(activeRoomId, true); fetchRooms(true); }
      else toast.error(d.error ?? translate("chat.workspace.toast.error"));
    } catch { toast.error(translate("chat.workspace.toast.error")); }
    setConfirming(false);
  }

  async function rejectPayment() {
    if (!activeRoomId || !accessToken || rejectingPayment) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error(translate("chat.workspace.toast.rejectRequired")); return; }
    setRejectingPayment(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/reject-payment`, {
        method: "POST", headers: hdrs(), body: JSON.stringify({ reason }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.paymentRejected"));
        setShowRejectModal(false); setRejectReason("");
        await fetchMessages(activeRoomId, true); fetchRooms(true);
      } else toast.error(d.error ?? translate("chat.workspace.toast.error"));
    } catch { toast.error(translate("chat.workspace.toast.error")); }
    setRejectingPayment(false);
  }

  async function deliverOrder() {
    if (!activeRoomId || !accessToken || delivering) return;
    setDelivering(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/deliver`, { method: "POST", headers: hdrs() });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) { toast.success(translate("chat.workspace.toast.orderDelivered")); await fetchMessages(activeRoomId, true); fetchRooms(true); }
      else toast.error(d.error ?? translate("chat.workspace.toast.error"));
    } catch { toast.error(translate("chat.workspace.toast.error")); }
    setDelivering(false);
  }

  async function cancelOrder() {
    if (!activeRoomId || !accessToken || cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/cancel-order`, { method: "POST", headers: hdrs() });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.orderCancelled"));
        setShowCancelModal(false);
        await fetchMessages(activeRoomId, true); fetchRooms(true);
      } else toast.error(d.error ?? translate("chat.workspace.toast.error"));
    } catch { toast.error(translate("chat.workspace.toast.error")); }
    setCancelling(false);
  }

  async function setClosed(action: "close" | "reopen") {
    if (!activeRoomId || !accessToken) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}`, {
        method: "PATCH", headers: hdrs(), body: JSON.stringify({ action }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(action === "close" ? translate("chat.workspace.toast.chatClosed") : translate("chat.workspace.toast.chatReopened"));
        await fetchMessages(activeRoomId, true); fetchRooms(true);
      } else toast.error(d.error ?? translate("chat.workspace.toast.error"));
    } catch { toast.error(translate("chat.workspace.toast.error")); }
    setClosing(false);
  }

  async function deleteChat() {
    if (!activeRoomId || !accessToken) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}`, { method: "DELETE", headers: hdrs() });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.chatDeleted"));
        setConfirmDelete(false); setActiveRoomId(null); setMessages([]);
        fetchRooms(true);
      } else toast.error(d.error ?? translate("chat.workspace.toast.chatDeleteFailed"));
    } catch { toast.error(translate("chat.workspace.toast.chatDeleteFailed")); }
    setDeleting(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) { toast.error(translate("chat.workspace.toast.imageTypeError")); return; }
    const url = URL.createObjectURL(file);
    setImgPreview({ file, url });
  }

  /* ════════════════════ Derived state ════════════════════ */
  const activeRoom   = rooms.find((r) => r.id === activeRoomId);
  const isClosed     = roomMeta.status === "closed";
  const orderRef     = roomMeta.orderRef ?? activeRoom?.orderRef ?? null;
  const orderStatus  = roomMeta.orderStatus ?? activeRoom?.orderStatus ?? null;
  const productName  = roomMeta.productName ?? activeRoom?.title ?? null;
  const productImage = roomMeta.productImage ?? null;
  const orderPrice   = fmtCurrency(roomMeta.price);
  const paymentMethod= roomMeta.paymentMethod ?? null;
  const orderCreated = roomMeta.orderCreatedAt ?? null;
  const customerName = roomMeta.customerName ?? activeRoom?.userName ?? null;
  const chatTitle    = roomMeta.title ?? (isStaff ? (activeRoom?.userName ?? translate("chat.workspace.customers")) : translate("account.support"));

  const showSidebarPanel  = isStaff || variant === "page" || rooms.length > 1;
  const hasActive         = showSidebarPanel ? !!activeRoomId : true;
  const awaitingPayment   = orderStatus === "Awaiting Payment";
  const paymentRejected   = orderStatus === "payment_rejected";
  const customerSentImage = messages.some((m) => m.isOwn && m.imageUrl);
  const showPaymentBanner = !isStaff && awaitingPayment && !customerSentImage;
  const showRejectedBanner= !isStaff && paymentRejected;
  const isTerminalOrder   = !!orderStatus && (TERMINAL_STATUSES as readonly string[]).includes(orderStatus);
  const customerCanSend   = isStaff || (!isClosed && !roomMeta.closing && !isTerminalOrder && !paymentRejected);
  const showOrderPanel    = !!orderRef && (isStaff ? true : !!productName);

  /* sidebar layout */
  const expanded = showSidebar || !activeRoomId;
  let sidebarCls: string;
  if (variant === "page") {
    sidebarCls = expanded
      ? "absolute inset-0 md:relative md:inset-auto w-full md:w-[280px] opacity-100 z-10"
      : "w-0 opacity-0 pointer-events-none";
  } else if (isStaff) {
    sidebarCls = expanded
      ? "absolute inset-0 md:relative md:inset-auto w-full md:w-[240px] opacity-100 z-10"
      : "w-0 opacity-0 pointer-events-none";
  } else {
    sidebarCls = expanded ? "w-full opacity-100" : "w-0 opacity-0";
  }

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="relative flex h-full w-full overflow-hidden" dir={dir} style={{ background: "#07071A" }}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      {showSidebarPanel && (
        <div
          className={`flex flex-col border-e border-white/[0.04] overflow-hidden shrink-0 transition-[width,opacity] duration-200 ${sidebarCls}`}
          style={{ background: "rgba(5,5,18,0.95)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.04] shrink-0">
            <div className="h-6 w-6 grid place-items-center rounded-lg bg-purple-500/15 border border-purple-500/20">
              <Users className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white/25">
              {isStaff ? translate("chat.workspace.customers") : translate("chat.workspace.myChats")}
            </span>
            <span className="ms-auto h-5 min-w-[20px] px-1.5 rounded-full bg-white/[0.05] text-[10px] font-black text-white/30 grid place-items-center">
              {rooms.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-24 gap-2 text-white/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">{translate("chat.workspace.loading")}</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-white/15">
                <MessageCircle className="h-8 w-8 opacity-30" />
                <span className="text-xs">{translate("chat.workspace.noConversations")}</span>
              </div>
            ) : (
              rooms.map((room) => {
                const mainLabel = room.title ?? room.userName;
                const sc = room.orderStatus ? STATUS_CONFIG[room.orderStatus] : null;
                return (
                  <motion.button
                    key={room.id}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onClick={() => selectRoom(room.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-start transition-all border-b border-white/[0.025]
                      ${activeRoomId === room.id
                        ? "bg-purple-500/[0.12] shadow-[inset_2px_0_0_0_rgb(168,85,247)]"
                        : "hover:bg-white/[0.025]"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar role={null} size="md" />
                      {room.unread && (
                        <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050512] bg-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${room.unread ? "text-white" : "text-white/60"}`}>{mainLabel}</p>
                        {room.status === "closed" && <Lock className="h-2.5 w-2.5 text-white/20 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {sc && (
                          <span className="flex items-center gap-1">
                            <span className={`h-1 w-1 rounded-full ${sc.dot}`} />
                            <span className={`text-[9px] font-bold ${sc.pill.split(" ").find(c => c.startsWith("text-")) ?? "text-white/30"}`}>{sc.label}</span>
                          </span>
                        )}
                        <p className="text-[10px] text-white/20 truncate">
                          {room.lastMsg ?? fmtDate(room.lastMessageAt, locale)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ MAIN AREA ══════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Premium Header ── */}
        <div
          className="shrink-0 border-b border-white/[0.06]"
          style={{
            background: "linear-gradient(135deg, rgba(76,29,149,0.45) 0%, rgba(10,7,28,0.97) 60%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Back button */}
            {showSidebarPanel && activeRoomId && (
              <button
                onClick={() => setShowSidebar(true)}
                className="h-8 w-8 flex-shrink-0 grid place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white/80 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Product image / avatar */}
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImage}
                alt={productName ?? "Product"}
                className="h-9 w-9 flex-shrink-0 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-600/40 to-fuchsia-600/20 border border-purple-500/20 grid place-items-center">
                {orderRef
                  ? <Package className="h-4 w-4 text-purple-300" />
                  : <MessageCircle className="h-4 w-4 text-purple-300" />}
              </div>
            )}

            {/* Title & meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-black text-white truncate">
                  {productName ?? chatTitle}
                </p>
                {orderRef && (
                  <span className="text-[9px] font-bold text-white/25 font-mono bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md flex-shrink-0">
                    #{String(orderRef).slice(0, 8).toUpperCase()}
                  </span>
                )}
                {orderStatus && hasActive && <StatusPill status={orderStatus} />}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {hasActive && (
                  isClosed ? (
                    <span className="flex items-center gap-1 text-[10px] text-white/30">
                      <Lock className="h-2.5 w-2.5" /> {translate("chat.workspace.closedChat")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isStaff && customerName ? customerName : translate("chat.workspace.online")}
                    </span>
                  )
                )}
                {orderPrice && (
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <DollarSign className="h-2.5 w-2.5" />{orderPrice}
                  </span>
                )}
                {paymentMethod && (
                  <span className="flex items-center gap-1 text-[10px] text-white/25">
                    <CreditCard className="h-2.5 w-2.5" />{paymentMethod}
                  </span>
                )}
                {orderCreated && (
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Clock className="h-2.5 w-2.5" />{fmtDate(orderCreated, locale)}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              <HeaderActions />
            </div>

            {/* Mobile: more button */}
            <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundsEnabled(!soundsEnabled)}
                className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white/80 transition-all"
                title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
              >
                {soundsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              {activeRoomId && (
                <button
                  onClick={() => setMobileActions(v => !v)}
                  className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white/80 transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
              {onRequestClose && (
                <button onClick={onRequestClose} className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-white/80 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile action dropdown */}
          <AnimatePresence>
            {mobileActions && activeRoomId && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.05]"
              >
                <div className="flex flex-wrap gap-2 px-4 py-3">
                  <HeaderActions compact />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order timeline (collapsible) */}
          {orderRef && hasActive && (
            <div className="border-t border-white/[0.04]">
              <button
                onClick={() => setTimelineOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-bold text-white/25 hover:text-white/40 transition-colors"
              >
                <span className="uppercase tracking-widest">Order Progress</span>
                {timelineOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <AnimatePresence initial={false}>
                {timelineOpen && (
                  <motion.div
                    key="timeline"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <OrderTimeline status={orderStatus} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Body row (messages + side panel) ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Messages column ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* Delete confirm bar */}
            <AnimatePresence>
              {isAdmin && activeRoomId && confirmDelete && (
                <motion.div
                  key="delete-bar"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-red-500/20 bg-red-500/[0.07]">
                    <span className="text-xs font-semibold text-red-300">{translate("chat.workspace.deleteChatConfirm")}</span>
                    <div className="flex items-center gap-2">
                      <ActionBtn onClick={deleteChat} loading={deleting} danger size="sm" icon={<Trash2 className="h-3 w-3" />}>
                        {translate("chat.workspace.deleteFinal")}
                      </ActionBtn>
                      <ActionBtn onClick={() => setConfirmDelete(false)} size="sm">{translate("chat.workspace.cancel")}</ActionBtn>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Closing countdown banner */}
            <AnimatePresence>
              {roomMeta.closing && !isAdmin && (
                <motion.div
                  key="countdown-banner"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-red-500/20 bg-gradient-to-r from-red-900/20 to-red-800/10">
                    <div className="flex items-center justify-center gap-3">
                      <Lock className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-red-300">{translate("chat.workspace.closedChat")}</span>
                      {countdown != null && countdown > 0 && (
                        <span className="font-mono text-sm font-black text-red-200 tabular-nums bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg">
                          {fmtCountdown(countdown)}
                        </span>
                      )}
                    </div>
                    <p className="text-center text-[10px] text-red-400/50 mt-1">
                      {withVars("chat.workspace.closingCountdown", { time: countdown != null ? fmtCountdown(countdown) : "00:00" })}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages scrollable area */}
            {showSidebarPanel && !activeRoomId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
                <div
                  className="h-20 w-20 rounded-3xl border border-white/[0.04] bg-white/[0.02] grid place-items-center"
                  style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.08),rgba(59,7,100,0.05))" }}
                >
                  <MessageCircle className="h-9 w-9 text-white/[0.06]" />
                </div>
                <div>
                  <p className="text-white/20 text-sm font-bold">{isStaff ? translate("chat.workspace.selectConversation") : translate("chat.workspace.selectOrder")}</p>
                  <p className="text-white/10 text-xs mt-1">{isStaff ? translate("chat.workspace.selectFromList") : translate("chat.workspace.fromList")}</p>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={messagesRef}
                  onScroll={onMessagesScroll}
                  className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}
                >
                  {msgsLoading ? (
                    <div className="flex items-center justify-center h-full gap-2 text-white/15">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{translate("chat.workspace.messagesLoading")}</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                      <MessageCircle className="h-10 w-10 text-white/[0.04]" />
                      <p className="text-white/15 text-sm">{translate("chat.workspace.startConversation")}</p>
                    </div>
                  ) : (
                    <div className="mt-auto space-y-1">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          msg.isSystem ? (
                            <SystemCard key={msg.id} body={msg.body} createdAt={msg.createdAt} locale={locale} />
                          ) : (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 340, damping: 28 }}
                              className={`flex gap-2.5 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}
                            >
                              <div className="mt-5 flex-shrink-0">
                                <UserAvatar role={msg.senderRole} verified={msg.isOwn ? profile?.verified : undefined} size="sm" />
                              </div>
                              <div className={`flex flex-col gap-1 max-w-[72%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                                {/* Sender name + role */}
                                <div className={`flex items-center gap-1.5 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                  <span className="text-[10px] text-white/35 font-bold">
                                    {msg.isOwn ? translate("chat.workspace.you") : msg.senderName}
                                  </span>
                                  {msg.senderRole && !msg.isOwn && <RoleBadge role={msg.senderRole} />}
                                </div>
                                {/* Bubble */}
                                {msg.imageUrl ? (
                                  <button
                                    onClick={() => setViewerSrc(msg.imageUrl!)}
                                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-purple-500/30 transition-all"
                                    title="Click to enlarge"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={msg.imageUrl}
                                      alt={translate("chat.workspace.attachment")}
                                      className="max-h-52 w-auto max-w-[220px] object-cover block"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                ) : (
                                  <div
                                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words
                                      ${msg.isOwn
                                        ? "rounded-tr-sm text-white"
                                        : "rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-white/80"
                                      }`}
                                    style={msg.isOwn ? {
                                      background: "linear-gradient(135deg,#6d28d9,#9333ea)",
                                      boxShadow: "0 4px 24px rgba(147,51,234,0.35)",
                                    } : {
                                      backdropFilter: "blur(8px)",
                                    }}
                                  >
                                    {msg.body}
                                  </div>
                                )}
                                {/* Timestamp + sent indicator */}
                                <div className={`flex items-center gap-1 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                  <span className="text-[9px] text-white/15 px-0.5">{fmtTime(msg.createdAt, locale)}</span>
                                  {msg.isOwn && <Check className="h-2.5 w-2.5 text-white/20" />}
                                </div>
                              </div>
                            </motion.div>
                          )
                        ))}
                      </AnimatePresence>
                      {/* Typing indicator */}
                      <AnimatePresence>
                        {otherIsTyping && (
                          <TypingDots key="typing" name={isStaff ? customerName ?? "Customer" : "Support"} />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ── Banners ── */}
                {/* Closed */}
                {isClosed && (
                  <div className="shrink-0 px-4 py-2.5 border-t border-amber-500/10 bg-amber-500/[0.05] text-center">
                    <p className="text-[11px] text-amber-300/70">
                      <Lock className="inline h-2.5 w-2.5 mb-0.5 me-1" />
                      {roomMeta.closedByName
                        ? withVars("chat.workspace.closedBy", { name: roomMeta.closedByName })
                        : translate("chat.workspace.conversationClosed")}
                      {!isStaff && ` ${translate("chat.workspace.reOpenByMessage")}`}
                    </p>
                  </div>
                )}

                {/* Payment proof prompt */}
                {showPaymentBanner && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="shrink-0 border-t-2 border-amber-500/50 px-4 py-3 text-center"
                    style={{ background: "linear-gradient(135deg,rgba(180,83,9,0.12),rgba(120,53,15,0.08))" }}
                  >
                    <p className="flex items-center justify-center gap-1.5 text-sm font-black text-amber-200">
                      <Camera className="h-4 w-4" /> {translate("chat.workspace.sendProofPrompt")}
                    </p>
                    <p className="text-[11px] text-amber-100/60 mt-0.5">{translate("chat.workspace.attachScreenshot")}</p>
                  </motion.div>
                )}

                {/* Payment rejected re-upload */}
                {showRejectedBanner && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="shrink-0 border-t-2 border-rose-500/50 px-4 py-3 text-center"
                    style={{ background: "linear-gradient(135deg,rgba(159,18,57,0.12),rgba(136,19,55,0.08))" }}
                  >
                    <p className="flex items-center justify-center gap-1.5 text-sm font-black text-rose-200">
                      <XCircle className="h-4 w-4" /> {translate("chat.workspace.paymentRejectedBanner")}
                    </p>
                    <p className="text-[11px] text-rose-100/50 mt-0.5">{translate("chat.workspace.attachScreenshot")}</p>
                  </motion.div>
                )}

                {/* Terminal order locked */}
                {!isStaff && isTerminalOrder && (
                  <div className="shrink-0 border-t border-white/[0.05] bg-white/[0.02] px-4 py-2 text-center">
                    <p className="text-[11px] text-white/25 font-semibold">
                      <Lock className="inline h-2.5 w-2.5 mb-0.5 me-1" />
                      {translate("chat.workspace.orderClosedNotice")}
                    </p>
                  </div>
                )}

                {/* Admin payment action bar */}
                {isAdmin && awaitingPayment && (
                  <div
                    className="shrink-0 border-t-2 border-orange-500/30 px-4 py-3"
                    style={{ background: "linear-gradient(135deg,rgba(146,64,14,0.12),rgba(120,53,15,0.07))" }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-xs font-black text-orange-200">{translate("chat.workspace.awaitingPayment")}</p>
                        <p className="text-[10px] text-orange-300/50 mt-0.5">Review the payment proof above</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ActionBtn onClick={() => { setShowRejectModal(true); setRejectReason(""); }} disabled={confirming} danger icon={<XCircle className="h-3.5 w-3.5" />} size="sm">
                          {translate("chat.workspace.reject")}
                        </ActionBtn>
                        <ActionBtn onClick={confirmPayment} loading={confirming} success icon={<CheckCheck className="h-3.5 w-3.5" />} size="sm">
                          {translate("chat.workspace.confirmPayment")}
                        </ActionBtn>
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-admin staff: waiting notice */}
                {isStaff && !isAdmin && awaitingPayment && (
                  <div className="shrink-0 flex items-center gap-2 border-t border-orange-500/15 bg-orange-500/[0.05] px-4 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-300 flex-shrink-0" />
                    <span className="text-xs text-orange-200/60">{translate("chat.workspace.awaitingAdmin")}</span>
                  </div>
                )}

                {/* ── Input area ── */}
                <div className="shrink-0 px-3 py-3 border-t border-white/[0.05]" style={{ background: "rgba(5,5,18,0.7)" }}>
                  {customerCanSend || isStaff ? (
                    <div>
                      {/* Image preview */}
                      <AnimatePresence>
                        {imgPreview && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-2"
                          >
                            <div className="flex items-start gap-2 p-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.06]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgPreview.url} alt="preview" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white/50 truncate">{imgPreview.file.name}</p>
                                <p className="text-[10px] text-white/25">{(imgPreview.file.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <button
                                onClick={() => { URL.revokeObjectURL(imgPreview.url); setImgPreview(null); }}
                                className="h-6 w-6 rounded-lg bg-white/[0.05] text-white/40 hover:text-white grid place-items-center flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        className="flex items-end gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 focus-within:border-purple-500/30 transition-colors"
                        style={{ backdropFilter: "blur(8px)" }}
                      >
                        {/* Hidden file input */}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
                        />

                        {/* Emoji button */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setEmojiOpen(v => !v)}
                            className="h-8 w-8 grid place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/30 hover:text-white hover:border-white/15 transition-all"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {emojiOpen && (
                              <EmojiPicker
                                onSelect={(e) => setInput(v => v + e)}
                                onClose={() => setEmojiOpen(false)}
                              />
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Image attach */}
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className={`h-8 w-8 flex-shrink-0 grid place-items-center rounded-xl border transition-all disabled:opacity-40
                            ${(showPaymentBanner || showRejectedBanner) && !customerSentImage
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-300 animate-pulse"
                              : "border-white/[0.07] bg-white/[0.03] text-white/30 hover:text-white hover:border-white/15"
                            }`}
                          title={translate("chat.workspace.attachImage")}
                        >
                          {uploading
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ImagePlus className="h-4 w-4" />}
                        </button>

                        {/* Textarea */}
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
                          onKeyDown={onKey}
                          placeholder={translate("chat.workspace.messagePlaceholder")}
                          rows={1}
                          className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed overflow-y-auto"
                          style={{ maxHeight: 100 }}
                        />

                        {/* Char counter */}
                        {input.length > 1600 && (
                          <span className={`text-[10px] font-mono flex-shrink-0 self-end pb-0.5 ${input.length > 1900 ? "text-red-400" : "text-white/25"}`}>
                            {2000 - input.length}
                          </span>
                        )}

                        {/* Send button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={send}
                          disabled={(!input.trim() && !imgPreview) || sending}
                          className="h-8 w-8 flex-shrink-0 rounded-xl grid place-items-center transition-all disabled:opacity-20 hover:opacity-90"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                        >
                          {sending
                            ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                            : <Send className="h-3.5 w-3.5 text-white" />}
                        </motion.button>
                      </div>
                      <p className="text-center text-[9px] text-white/10 mt-1.5 select-none">
                        {translate("chat.workspace.enterToSend")}
                      </p>
                    </div>
                  ) : (
                    /* Locked input */
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.04] bg-white/[0.015] px-4 py-3">
                      <Lock className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                      <p className="text-xs text-white/25 font-semibold select-none">
                        {translate("chat.workspace.orderClosedNotice")}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Right sticky Order Panel (desktop) ── */}
          {showOrderPanel && hasActive && (
            <>
              {/* Toggle button (desktop) */}
              <button
                onClick={() => setSidePanelOpen(v => !v)}
                className="hidden lg:flex h-full w-6 items-center justify-center border-s border-white/[0.04] hover:bg-white/[0.02] transition-colors flex-shrink-0"
                title={sidePanelOpen ? "Hide order panel" : "Show order panel"}
              >
                {sidePanelOpen
                  ? <ChevronRight className="h-3 w-3 text-white/20" />
                  : <ChevronRight className="h-3 w-3 text-white/20 rotate-180" />}
              </button>

              <AnimatePresence initial={false}>
                {sidePanelOpen && (
                  <motion.div
                    key="side-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="hidden lg:flex flex-col border-s border-white/[0.04] overflow-hidden flex-shrink-0"
                    style={{ background: "rgba(5,5,18,0.92)" }}
                  >
                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Order Summary</p>

                      {/* Product image */}
                      {productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={productImage}
                          alt={productName ?? "Product"}
                          className="w-full aspect-video rounded-xl object-cover border border-white/[0.06]"
                        />
                      ) : (
                        <div className="w-full aspect-video rounded-xl border border-white/[0.04] bg-purple-500/[0.05] grid place-items-center">
                          <Package className="h-8 w-8 text-white/[0.06]" />
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2.5">
                        <PanelRow icon={<Package className="h-3.5 w-3.5" />} label="Product" value={productName ?? "—"} />
                        {orderRef && <PanelRow icon={<Shield className="h-3.5 w-3.5" />} label="Order ID" value={`#${String(orderRef).slice(0,8).toUpperCase()}`} mono />}
                        {orderPrice && <PanelRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Total" value={orderPrice} accent />}
                        {paymentMethod && <PanelRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment" value={paymentMethod} />}
                        {orderCreated && <PanelRow icon={<Clock className="h-3.5 w-3.5" />} label="Created" value={fmtDate(orderCreated, locale)} />}
                        {orderStatus && (
                          <div className="pt-1">
                            <StatusPill status={orderStatus} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════ MODALS ════════════════════ */}

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <Modal key="cancel-modal" onClose={() => setShowCancelModal(false)}>
            <ModalHeader icon={<Ban className="h-5 w-5" />} danger title={translate("chat.workspace.cancelOrder")} subtitle={translate("chat.workspace.cancelOrder.confirm")} onClose={() => setShowCancelModal(false)} />
            <div className="p-5 flex gap-2">
              <ActionBtn onClick={() => setShowCancelModal(false)} disabled={cancelling} fullWidth>{translate("chat.workspace.cancel")}</ActionBtn>
              <ActionBtn onClick={cancelOrder} loading={cancelling} danger fullWidth icon={<Ban className="h-4 w-4" />}>{translate("chat.workspace.cancelOrder.yes")}</ActionBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reject Payment Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <Modal key="reject-modal" onClose={() => setShowRejectModal(false)}>
            <ModalHeader icon={<XCircle className="h-5 w-5" />} danger title={translate("chat.workspace.rejectPayment.title")} subtitle={translate("chat.workspace.rejectPayment.subtitle")} onClose={() => setShowRejectModal(false)} />
            <div className="p-5 space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={translate("chat.workspace.rejectPayment.placeholder")}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/[0.07] bg-zinc-950/60 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-zinc-600 focus:border-red-500/40 transition-all"
              />
              <div className="flex gap-2">
                <ActionBtn onClick={() => setShowRejectModal(false)} disabled={rejectingPayment} fullWidth>{translate("chat.workspace.cancel")}</ActionBtn>
                <ActionBtn onClick={rejectPayment} loading={rejectingPayment} disabled={!rejectReason.trim()} danger fullWidth icon={<XCircle className="h-4 w-4" />}>
                  {translate("chat.workspace.rejectPayment.confirm")}
                </ActionBtn>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {viewerSrc && <ImageViewer key="viewer" src={viewerSrc} onClose={() => setViewerSrc(null)} />}
      </AnimatePresence>
    </div>
  );

  /* ══════════════════ Sub-renders (as closures to access state) ══════════════════ */

  function HeaderActions({ compact = false }: { compact?: boolean }) {
    const btnCls = compact ? "text-xs" : "text-[11px]";
    return (
      <>
        {/* Deliver Order */}
        {isAdmin && activeRoomId && orderStatus === "Processing" && (
          <ActionBtn onClick={deliverOrder} loading={delivering} success compact={compact} icon={<PackageCheck className="h-3 w-3" />}>
            <span className={btnCls}>{translate("chat.workspace.deliverOrder")}</span>
          </ActionBtn>
        )}

        {/* Cancel Order */}
        {isAdmin && activeRoomId && orderRef && !isTerminalOrder && (
          <ActionBtn onClick={() => setShowCancelModal(true)} disabled={cancelling} danger compact={compact} icon={<Ban className="h-3 w-3" />}>
            <span className={btnCls}>{translate("chat.workspace.cancelOrder")}</span>
          </ActionBtn>
        )}

        {/* Close / Reopen */}
        {isStaff && activeRoomId && !roomMeta.closing && (
          isClosed ? (
            <ActionBtn onClick={() => setClosed("reopen")} loading={closing} compact={compact} icon={<RotateCcw className="h-3 w-3" />}>
              <span className={btnCls}>{translate("chat.workspace.reopen")}</span>
            </ActionBtn>
          ) : (
            <ActionBtn onClick={() => setClosed("close")} loading={closing} success compact={compact} icon={<CheckCheck className="h-3 w-3" />}>
              <span className={btnCls}>{translate("chat.workspace.close")}</span>
            </ActionBtn>
          )
        )}

        {/* Delete */}
        {isAdmin && activeRoomId && (
          <button
            onClick={() => setConfirmDelete(v => !v)}
            className={`h-7 w-7 flex-shrink-0 grid place-items-center rounded-lg border transition-all
              ${confirmDelete ? "border-red-500/40 bg-red-500/20 text-red-300" : "border-red-500/20 bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-300"}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Sound toggle */}
        <button
          onClick={() => setSoundsEnabled(!soundsEnabled)}
          className="h-7 w-7 grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/30 hover:text-white/70 transition-all"
          title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
        >
          {soundsEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        </button>

        {/* Close widget button */}
        {onRequestClose && (
          <button onClick={onRequestClose} className="h-7 w-7 grid place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-white/80 transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </>
    );
  }
}

/* ═══════════════════════════════════════════════════════════
   Shared UI atoms
═══════════════════════════════════════════════════════════ */
function ActionBtn({
  onClick, loading, disabled, children, danger, success, icon, size = "md", fullWidth, compact,
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  danger?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const base = "flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all disabled:opacity-50 flex-shrink-0";
  const sz   = size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[11px]";
  const fw   = fullWidth ? "flex-1" : "";
  const col  = danger
    ? "border border-red-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/25"
    : success
      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-90"
      : "border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white";

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sz} ${fw} ${col} ${compact ? "" : ""}`}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
      {children}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-zinc-950 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalHeader({
  icon, title, subtitle, onClose, danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 ${danger ? "bg-red-500/[0.06]" : "bg-white/[0.02]"}`}>
      <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border ${danger ? "border-red-500/25 bg-red-500/15 text-red-300" : "border-white/10 bg-white/[0.05] text-white/60"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      <button onClick={onClose} className="h-7 w-7 flex-shrink-0 grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white transition">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PanelRow({
  icon, label, value, mono, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-white/20 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
        <p className={`text-[11px] font-bold break-all mt-0.5 ${mono ? "font-mono text-purple-300/70" : accent ? "text-emerald-300" : "text-white/70"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
