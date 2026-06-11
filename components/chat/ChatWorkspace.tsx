"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  CheckCheck,
  Crown,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import UserAvatar from "../ui/UserAvatar";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

/* ═══════════════════════════════ Types ═══════════════════════════════════ */
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
};

const ROLE_TRANSLATE_KEYS: Record<string, string> = {
  admin: "admin.role.admin",
  moderator: "admin.role.moderator",
  helper: "admin.role.helper",
};
function fmtCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ═════════════════════════════ Role badge ════════════════════════════════ */
const ROLE_META: Record<string, { labelKey: string; cls: string; icon: React.ElementType }> = {
  admin:     { labelKey: "admin.role.admin",      cls: "border-amber-500/40 bg-amber-500/15 text-amber-300",       icon: Crown },
  moderator: { labelKey: "admin.role.moderator",  cls: "border-blue-500/40 bg-blue-500/15 text-blue-300",          icon: ShieldCheck },
  helper:    { labelKey: "admin.role.helper",     cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", icon: Wrench },
};
function RoleBadge({ role, translate }: { role: string; translate: (key: string) => string }) {
  const m = ROLE_META[role];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-black leading-none ${m.cls}`}>
      <Icon className="h-2 w-2" />
      {translate(m.labelKey)}
    </span>
  );
}

/* ═══════════════════════════════ Helpers ═════════════════════════════════ */
function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
}
/* ═══════════════════════════════ Component ═══════════════════════════════ */
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
  const { language, translate } = useLanguage();
  const isStaff = role === "admin" || role === "moderator" || role === "helper";
  const isAdmin = role === "admin";
  const dir = language === "ar" ? "rtl" : "ltr";
  const locale = language === "ar" ? "ar-EG" : language === "fr" ? "fr-FR" : "en-US";
  const withVars = (key: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), translate(key));

  const [rooms, setRooms]               = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [roomMeta, setRoomMeta]         = useState<RoomMeta>({ status: "open", closedByName: null, closedAt: null });
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [msgsLoading, setMsgsLoading]   = useState(false);
  const [showSidebar, setShowSidebar]   = useState(true);
  const [closing, setClosing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [countdown, setCountdown]       = useState<number | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [delivering, setDelivering]     = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const messagesRef = useRef<HTMLDivElement>(null);
  const stickRef    = useRef(true); // are we "stuck" to the bottom?
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReadId  = useRef<number>(0);
  const activeRef   = useRef<string | null>(null);
  const handledInitial = useRef<string | null>(null);
  activeRef.current = activeRoomId;

  // Auto-scroll the MESSAGES CONTAINER (never the page) — and only when the
  // user is already near the bottom, so it doesn't yank them up while reading.
  useEffect(() => {
    if (!stickRef.current) return;
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function onMessagesScroll() {
    const el = messagesRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Live countdown for the "closing in 1 minute" banner. When it hits zero we
  // refetch so the chat clears (customer) / disappears (moderator/helper).
  useEffect(() => {
    if (!roomMeta.closing || !roomMeta.clearAt) {
      setCountdown(null);
      return;
    }
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

  const hdrs = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

  /* ── API ── */
  const markRead = useCallback(
    async (roomId: string) => {
      if (!accessToken) return;
      try {
        await fetch(`/api/chat/rooms/${roomId}`, {
          method: "PATCH",
          headers: hdrs(),
          body: JSON.stringify({ action: "read" }),
        });
      } catch {}
    },
    [accessToken, hdrs]
  );

  const fetchRooms = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setRoomsLoading(true);
      try {
        const res = await fetch("/api/chat/rooms", { headers: hdrs() });
        const d = await res.json();
        if (d.success) setRooms(d.data ?? []);
      } catch {}
      if (!silent) setRoomsLoading(false);
    },
    [accessToken, hdrs]
  );

  const ensureRoom = useCallback(async (): Promise<string | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch("/api/chat/rooms", { method: "POST", headers: hdrs() });
      const d = await res.json();
      return d.success ? d.roomId : null;
    } catch {
      return null;
    }
  }, [accessToken, hdrs]);

  const fetchMessages = useCallback(
    async (roomId: string, silent = false) => {
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
    },
    [accessToken, hdrs, markRead]
  );

  /* ── Init: everyone loads their room list ── */
  useEffect(() => {
    if (!accessToken) return;
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isStaff]);

  /* ── Auto-select: the requested room (after payment), else the only room ── */
  useEffect(() => {
    if (initialRoomId && initialRoomId !== handledInitial.current && rooms.some((r) => r.id === initialRoomId)) {
      handledInitial.current = initialRoomId;
      selectRoom(initialRoomId);
      return;
    }
    if (!activeRoomId && !isStaff && rooms.length === 1) {
      selectRoom(rooms[0].id);
    }
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
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [accessToken, isStaff, fetchMessages, fetchRooms]);

  /* ── For moderator/helper: when a chat is closed it leaves their list, so
   *    bump them out of it (only admins keep closed conversations open). ── */
  useEffect(() => {
    if (!isStaff || isAdmin || !activeRoomId) return;
    if (!rooms.some((r) => r.id === activeRoomId)) {
      setActiveRoomId(null);
      setMessages([]);
      setConfirmDelete(false);
    }
  }, [rooms, isStaff, isAdmin, activeRoomId]);

  /* ── Actions ── */
  async function selectRoom(roomId: string) {
    if (activeRoomId === roomId) {
      setShowSidebar(false);
      return;
    }
    setActiveRoomId(roomId);
    setMessages([]);
    setShowSidebar(false);
    setConfirmDelete(false);
    lastReadId.current = 0;
    stickRef.current = true; // jump to latest when opening a conversation
    await fetchMessages(roomId);
    markRead(roomId);
    fetchRooms(true);
  }

  async function send() {
    const body = input.trim();
    if (!body || !accessToken || sending) return;

    let roomId = activeRoomId;
    if (!roomId && !isStaff) {
      roomId = await ensureRoom();
      if (roomId) setActiveRoomId(roomId);
    }
    if (!roomId) {
      toast.error(translate("chat.workspace.toast.sendFailed"));
      return;
    }

    setSending(true);
    setInput("");
    stickRef.current = true; // always scroll down to show the message we just sent
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ body }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (!d.success) {
        toast.error(d.error ?? translate("chat.workspace.toast.messageFailed"));
        setInput(body);
      } else {
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch {
      toast.error(translate("chat.workspace.toast.messageFailed"));
      setInput(body);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function sendImage(file: File) {
    if (!accessToken || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error(translate("chat.workspace.toast.imageTypeError"));
      return;
    }
    let roomId = activeRoomId;
    if (!roomId && !isStaff) {
      roomId = await ensureRoom();
      if (roomId) setActiveRoomId(roomId);
    }
    if (!roomId) {
      toast.error(translate("chat.workspace.toast.chatStartFailed"));
      return;
    }
    setUploading(true);
    stickRef.current = true;
    try {
      // 1) upload the image
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/chat/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const ud = await up.json().catch(() => ({ success: false }));
      if (!ud.success || !ud.url) {
        toast.error(ud.error ?? translate("chat.workspace.toast.uploadFailed"));
        setUploading(false);
        return;
      }
      // 2) send a message carrying the image
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ imageUrl: ud.url }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (!d.success) {
        toast.error(d.error ?? translate("chat.workspace.toast.messageFailed"));
      } else {
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch {
      toast.error(translate("chat.workspace.toast.uploadFailed"));
    }
    setUploading(false);
  }

  async function confirmPayment() {
    if (!activeRoomId || !accessToken || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/confirm-payment`, {
        method: "POST",
        headers: hdrs(),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.paymentConfirmed"));
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? translate("chat.workspace.toast.error"));
      }
    } catch {
      toast.error(translate("chat.workspace.toast.error"));
    }
    setConfirming(false);
  }

  async function rejectPayment() {
    if (!activeRoomId || !accessToken || rejectingPayment) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error(translate("chat.workspace.toast.rejectRequired")); return; }
    setRejectingPayment(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/reject-payment`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ reason }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.paymentRejected"));
        setShowRejectModal(false);
        setRejectReason("");
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? translate("chat.workspace.toast.error"));
      }
    } catch {
      toast.error(translate("chat.workspace.toast.error"));
    }
    setRejectingPayment(false);
  }

  async function deliverOrder() {
    if (!activeRoomId || !accessToken || delivering) return;
    setDelivering(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/deliver`, {
        method: "POST",
        headers: hdrs(),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.orderDelivered"));
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? translate("chat.workspace.toast.error"));
      }
    } catch {
      toast.error(translate("chat.workspace.toast.error"));
    }
    setDelivering(false);
  }

  async function setClosed(action: "close" | "reopen") {
    if (!activeRoomId || !accessToken) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}`, {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify({ action }),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(action === "close" ? translate("chat.workspace.toast.chatClosed") : translate("chat.workspace.toast.chatReopened"));
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? translate("chat.workspace.toast.error"));
      }
    } catch {
      toast.error(translate("chat.workspace.toast.error"));
    }
    setClosing(false);
  }

  async function deleteChat() {
    if (!activeRoomId || !accessToken) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}`, {
        method: "DELETE",
        headers: hdrs(),
      });
      const d = await res.json().catch(() => ({ success: false }));
      if (d.success) {
        toast.success(translate("chat.workspace.toast.chatDeleted"));
        setConfirmDelete(false);
        setActiveRoomId(null);
        setMessages([]);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? translate("chat.workspace.toast.chatDeleteFailed"));
      }
    } catch {
      toast.error(translate("chat.workspace.toast.chatDeleteFailed"));
    }
    setDeleting(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  /* ── Derived ── */
  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const title = activeRoom?.title ?? (isStaff ? activeRoom?.userName ?? translate("chat.workspace.customers") : translate("account.support"));
  const isClosed = roomMeta.status === "closed";
  const orderRef = roomMeta.orderRef ?? activeRoom?.orderRef ?? null;
  const orderStatus = roomMeta.orderStatus ?? activeRoom?.orderStatus ?? null;
  const showSidebarPanel = isStaff || variant === "page" || rooms.length > 1;
  const hasActive = showSidebarPanel ? !!activeRoomId : true;
  const customerSentImage = messages.some((m) => m.isOwn && m.imageUrl);
  const awaitingPayment = orderStatus === "Awaiting Payment";
  const showPaymentBanner = !isStaff && awaitingPayment && !customerSentImage;

  // Mobile: sidebar is an absolute overlay; desktop: side-by-side
  const expanded  = showSidebar || !activeRoomId;
  // On mobile (< md), sidebar overlays full-width. On md+, it sits beside.
  // Customer widget always stays full-width → full-chat toggle (no change).
  let sidebarCls: string;
  if (variant === "page") {
    if (expanded) {
      sidebarCls = "absolute inset-0 md:relative md:inset-auto w-full md:w-[300px] opacity-100 z-10";
    } else {
      sidebarCls = "w-0 opacity-0 pointer-events-none";
    }
  } else if (isStaff) {
    if (expanded) {
      sidebarCls = "absolute inset-0 md:relative md:inset-auto w-full md:w-[230px] opacity-100 z-10";
    } else {
      sidebarCls = "w-0 opacity-0 pointer-events-none";
    }
  } else {
    // narrow customer widget — full-width list, then full-width chat
    sidebarCls = expanded ? "w-full opacity-100" : "w-0 opacity-0";
  }

  /* ═════════════════════════════ Render ═══════════════════════════════════ */
  return (
    <div className="relative flex h-full w-full overflow-hidden" dir={dir} style={{ background: "#0A0A14" }}>

      {/* ── Sidebar (staff = all customers; customer = their order threads) ── */}
      {showSidebarPanel && (
        <div
          className={`flex flex-col border-l border-white/[0.05] overflow-hidden shrink-0 transition-[width,opacity] duration-200 ${sidebarCls}`}
          style={{ background: "#07070F" }}
        >
          <div className="flex items-center gap-1.5 px-3.5 py-3 border-b border-white/[0.04] shrink-0">
            <Users className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/25">{isStaff ? translate("chat.workspace.customers") : translate("chat.workspace.myChats")}</span>
            <span className="ms-auto text-[10px] font-bold text-white/15">{rooms.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-20 gap-2 text-white/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">{translate("chat.workspace.loading")}</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-white/15 text-xs">{translate("chat.workspace.noConversations")}</div>
            ) : (
              rooms.map((room) => {
                const mainLabel = room.title ?? room.userName;
                const isPaying = room.orderStatus === "Awaiting Payment";
                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-start transition-all border-b border-white/[0.03] hover:bg-white/[0.035]
                      ${activeRoomId === room.id ? "bg-purple-500/[0.10] shadow-[inset_2px_0_0_0_rgb(168,85,247)]" : ""}`}
                  >
                    <div className="relative">
                      <UserAvatar role={null} size="md" />
                      {room.unread && (
                        <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07070F] bg-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${room.unread ? "text-white" : "text-white/65"}`}>
                          {mainLabel}
                        </p>
                        {isPaying && <span className="shrink-0 rounded bg-orange-500/15 px-1 text-[8px] font-black text-orange-300">{translate("chat.workspace.paying")}</span>}
                        {room.status === "closed" && <Lock className="h-2.5 w-2.5 text-white/20 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-white/25 truncate mt-0.5">
                        {isStaff && room.title ? room.userName : (room.lastMsg ?? fmtDate(room.lastMessageAt, locale))}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.05] shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(88,28,135,0.4) 0%,rgba(15,10,30,0.9) 100%)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {showSidebarPanel && activeRoomId && (
              <button
                onClick={() => setShowSidebar(true)}
                className="h-7 w-7 shrink-0 grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white/80 transition-all"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 border border-purple-500/20 grid place-items-center">
              <MessageCircle className="h-4 w-4 text-purple-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{title}</p>
              {hasActive && (
                isClosed ? (
                  <p className="flex items-center gap-1 text-[10px] text-white/30">
                    <Lock className="h-2.5 w-2.5" /> {translate("chat.workspace.closedChat")}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> {translate("chat.workspace.online")}
                  </p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mark as Delivered (admin only, when order is Processing) */}
            {isAdmin && activeRoomId && orderStatus === "Processing" && (
              <button
                onClick={deliverOrder}
                disabled={delivering}
                title={translate("chat.workspace.deliverOrder")}
                className="flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
              >
                {delivering ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
                <span className="hidden sm:inline">{translate("chat.workspace.deliverOrder")}</span>
              </button>
            )}

            {/* Resolve / reopen (staff, with an active room — hidden during the
                1-minute closing countdown) */}
            {isStaff && activeRoomId && !roomMeta.closing && (
              isClosed ? (
                <button
                  onClick={() => setClosed("reopen")}
                  disabled={closing}
                  title={translate("chat.workspace.reopen")}
                  className="flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-white/60 hover:text-white hover:border-white/15 transition-all disabled:opacity-50"
                >
                  {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  <span className="hidden sm:inline">{translate("chat.workspace.reopen")}</span>
                </button>
              ) : (
                <button
                  onClick={() => setClosed("close")}
                  disabled={closing}
                  title={translate("chat.workspace.close")}
                  className="flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                  <span className="hidden sm:inline">{translate("chat.workspace.close")}</span>
                </button>
              )
            )}

            {/* Delete conversation (admin only, with an active room) */}
            {isAdmin && activeRoomId && (
              <button
                onClick={() => setConfirmDelete((v) => !v)}
                title={translate("chat.workspace.deleteFinal")}
                className={`h-7 w-7 shrink-0 grid place-items-center rounded-lg border transition-all ${
                  confirmDelete
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-red-500/20 bg-red-500/10 text-red-400/80 hover:bg-red-500/20 hover:text-red-300"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {onRequestClose && (
              <button
                onClick={onRequestClose}
                className="h-7 w-7 shrink-0 grid place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-white/80 hover:border-white/15 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation bar (admin only) */}
        {isAdmin && activeRoomId && confirmDelete && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-red-500/20 bg-red-500/[0.08]">
            <span className="text-xs font-semibold text-red-300">
              {translate("chat.workspace.deleteChatConfirm")}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={deleteChat}
                disabled={deleting}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-600 text-[11px] font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                {translate("chat.workspace.deleteFinal")}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-7 px-3 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-white/60 hover:text-white transition-all disabled:opacity-50"
              >
                {translate("chat.workspace.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* "Closing in 1 minute" banner (customer + moderator + helper) */}
        {roomMeta.closing && (
          <div className="shrink-0 px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/[0.08] text-center">
            <p className="text-[11.5px] text-amber-300 font-semibold leading-relaxed">
              <Lock className="inline h-2.5 w-2.5 mb-0.5" />{" "}
              {withVars(
                roomMeta.closedByRole ? "chat.workspace.closedBannerRole" : "chat.workspace.closedBannerSomeone",
                { role: translate(ROLE_TRANSLATE_KEYS[roomMeta.closedByRole ?? ""] ?? "admin.role.admin") }
              )}
              {countdown != null && countdown > 0
                ? withVars("chat.workspace.closingIn", { time: fmtCountdown(countdown) })
                : translate("chat.workspace.closingNow")}
            </p>
          </div>
        )}

        {/* Body */}
        {showSidebarPanel && !activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="h-16 w-16 rounded-2xl border border-white/[0.04] bg-white/[0.02] grid place-items-center">
              <MessageCircle className="h-7 w-7 text-white/[0.07]" />
            </div>
            <div>
              <p className="text-white/20 text-sm font-semibold">{isStaff ? translate("chat.workspace.selectConversation") : translate("chat.workspace.selectOrder")}</p>
              <p className="text-white/10 text-xs mt-0.5">{isStaff ? translate("chat.workspace.selectFromList") : translate("chat.workspace.fromList")}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div
              ref={messagesRef}
              onScroll={onMessagesScroll}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col"
            >
              {msgsLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-white/20">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{translate("chat.workspace.messagesLoading")}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <MessageCircle className="h-8 w-8 text-white/[0.05]" />
                  <div>
                    <p className="text-white/20 text-sm">{translate("chat.workspace.startConversation")}</p>
                    <p className="text-white/10 text-xs mt-0.5">{translate("chat.workspace.replyPrompt")}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-auto space-y-4">
                  {messages.map((msg) =>
                    msg.isSystem ? (
                      <div key={msg.id} className="flex justify-center">
                        <div className="max-w-[88%] whitespace-pre-line rounded-xl border border-purple-500/20 bg-purple-500/[0.08] px-3.5 py-2 text-center text-[12px] font-semibold leading-relaxed text-purple-100/90">
                          {msg.body}
                        </div>
                      </div>
                    ) : (
                    <div key={msg.id} className={`flex gap-2 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="mt-5 shrink-0">
                        <UserAvatar
                          role={msg.senderRole}
                          verified={msg.isOwn ? profile?.verified : undefined}
                          size="sm"
                        />
                      </div>
                      <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-1.5 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-[10px] text-white/35 font-bold">{msg.isOwn ? translate("chat.workspace.you") : msg.senderName}</span>
                          {msg.senderRole && <RoleBadge role={msg.senderRole} translate={translate} />}
                        </div>
                        {msg.imageUrl ? (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer"
                            className="block overflow-hidden rounded-2xl border border-white/[0.08]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.imageUrl} alt={translate("chat.workspace.attachment")} className="max-h-56 w-auto max-w-[220px] object-cover" />
                          </a>
                        ) : (
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                              msg.isOwn ? "rounded-tr-sm text-white" : "rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-white/75"
                            }`}
                            style={msg.isOwn ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" } : {}}
                          >
                            {msg.body}
                          </div>
                        )}
                        <span className="text-[9px] text-white/15 px-0.5">{fmtTime(msg.createdAt, locale)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Closed banner */}
            {isClosed && (
              <div className="shrink-0 px-4 py-2 border-t border-amber-500/15 bg-amber-500/[0.06] text-center">
                <p className="text-[11px] text-amber-300/80">
                  <Lock className="inline h-2.5 w-2.5 mb-0.5" />{" "}
                  {roomMeta.closedByName
                    ? withVars("chat.workspace.closedBy", { name: roomMeta.closedByName })
                    : translate("chat.workspace.conversationClosed")}
                  {!isStaff && ` ${translate("chat.workspace.reOpenByMessage")}`}
                </p>
              </div>
            )}

            {/* Payment-proof prompt (customer, while the order awaits payment) */}
            {showPaymentBanner && (
              <div className="shrink-0 border-t-2 border-amber-500/40 bg-amber-500/[0.10] px-4 py-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-200">
                  <Camera className="h-4 w-4" /> {translate("chat.workspace.sendProofPrompt")}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-100/70">{translate("chat.workspace.attachScreenshot")}</p>
              </div>
            )}

            {/* Confirm / Reject payment (admin only, order awaiting payment) */}
            {isAdmin && awaitingPayment && (
              <div className="shrink-0 border-t-2 border-orange-500/40 bg-orange-500/[0.10] px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-orange-200">
                    {translate("chat.workspace.awaitingPayment")}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Reject */}
                    <button
                      onClick={() => { setShowRejectModal(true); setRejectReason(""); }}
                      disabled={confirming}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-black text-red-300 transition hover:bg-red-500/25 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {translate("chat.workspace.reject")}
                    </button>
                    {/* Confirm */}
                    <button
                      onClick={confirmPayment}
                      disabled={confirming}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-3 py-1.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                      {translate("chat.workspace.confirmPayment")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Non-admin staff: view-only notice when order awaits payment */}
            {isStaff && !isAdmin && awaitingPayment && (
              <div className="shrink-0 flex items-center gap-2 border-t border-orange-500/20 bg-orange-500/[0.06] px-4 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-300 shrink-0" />
                <span className="text-xs text-orange-200/70">{translate("chat.workspace.awaitingAdmin")}</span>
              </div>
            )}

            {/* Input */}
            <div className="shrink-0 px-3 py-3 border-t border-white/[0.05]">
              <div className="flex items-end gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 focus-within:border-purple-500/30 transition-colors">
                {/* Attach image */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) sendImage(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title={translate("chat.workspace.attachImage")}
                  className={`h-8 w-8 shrink-0 grid place-items-center rounded-lg border transition-all disabled:opacity-40 ${
                    showPaymentBanner && !customerSentImage
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300 animate-pulse"
                      : "border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white"
                  }`}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={translate("chat.workspace.messagePlaceholder")}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed max-h-[90px] overflow-y-auto"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="h-8 w-8 shrink-0 rounded-lg grid place-items-center transition-all disabled:opacity-25 hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Send className="h-3.5 w-3.5 text-white" />}
                </button>
              </div>
              <p className="text-center text-[9px] text-white/10 mt-1.5 select-none">
                {translate("chat.workspace.enterToSend")}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Reject Payment Modal ── */}
      {showRejectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl border border-red-500/25 bg-zinc-900 shadow-[0_0_80px_rgba(239,68,68,0.15)] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/[0.06] bg-red-500/[0.08] px-5 py-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/25 bg-red-500/15 text-red-300">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{translate("chat.workspace.rejectPayment.title")}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{translate("chat.workspace.rejectPayment.subtitle")}</p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="ms-auto grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 hover:text-white transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={translate("chat.workspace.rejectPayment.placeholder")}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-zinc-950/60 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-zinc-600 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/15 transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejectingPayment}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-bold text-white/60 hover:text-white transition disabled:opacity-50"
                >
                  {translate("chat.workspace.cancel")}
                </button>
                <button
                  onClick={rejectPayment}
                  disabled={rejectingPayment || !rejectReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {rejectingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {translate("chat.workspace.rejectPayment.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
