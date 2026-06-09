"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  ChevronRight,
  CheckCheck,
  Crown,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

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

const ROLE_LABEL_AR: Record<string, string> = {
  admin: "الأدمن",
  moderator: "المشرف",
  helper: "المساعد",
};
function fmtCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ═════════════════════════════ Role badge ════════════════════════════════ */
const ROLE_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  admin:     { label: "أدمن",  cls: "border-amber-500/40 bg-amber-500/15 text-amber-300",       icon: Crown },
  moderator: { label: "مشرف",  cls: "border-blue-500/40 bg-blue-500/15 text-blue-300",          icon: ShieldCheck },
  helper:    { label: "مساعد", cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", icon: Wrench },
};
function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-black leading-none ${m.cls}`}>
      <Icon className="h-2 w-2" />
      {m.label}
    </span>
  );
}

/* ═══════════════════════════════ Helpers ═════════════════════════════════ */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}
function initial(name: string) {
  return name?.trim().charAt(0).toUpperCase() ?? "?";
}
function Avatar({ name, role, size = "sm" }: { name: string; role?: string | null; size?: "sm" | "md" }) {
  const isStaffRole = role && ROLE_META[role];
  const dim = size === "md" ? "h-9 w-9 text-sm rounded-xl" : "h-7 w-7 text-[11px] rounded-lg";
  return (
    <div
      className={`${dim} shrink-0 grid place-items-center font-black border bg-gradient-to-br ${
        isStaffRole
          ? "from-amber-600/25 to-orange-600/15 border-amber-500/25 text-amber-200"
          : "from-purple-600/25 to-fuchsia-600/15 border-purple-500/25 text-purple-200"
      }`}
    >
      {initial(name)}
    </div>
  );
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
  const { accessToken, role } = useAuth();
  const isStaff = role === "admin" || role === "moderator" || role === "helper";
  const isAdmin = role === "admin";

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
      toast.error("تعذّر بدء المحادثة. حاول مرة أخرى.");
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
        toast.error(d.error ?? "فشل إرسال الرسالة");
        setInput(body);
      } else {
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch {
      toast.error("فشل إرسال الرسالة");
      setInput(body);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function sendImage(file: File) {
    if (!accessToken || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر صورة");
      return;
    }
    let roomId = activeRoomId;
    if (!roomId && !isStaff) {
      roomId = await ensureRoom();
      if (roomId) setActiveRoomId(roomId);
    }
    if (!roomId) {
      toast.error("تعذّر بدء المحادثة");
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
        toast.error(ud.error ?? "تعذّر رفع الصورة");
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
        toast.error(d.error ?? "فشل إرسال الصورة");
      } else {
        await fetchMessages(roomId, true);
        if (isStaff) fetchRooms(true);
      }
    } catch {
      toast.error("تعذّر رفع الصورة");
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
        toast.success("تم تأكيد الدفع ✅");
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? "حدث خطأ");
      }
    } catch {
      toast.error("حدث خطأ");
    }
    setConfirming(false);
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
        toast.success(action === "close" ? "تم إغلاق المحادثة" : "تم إعادة فتح المحادثة");
        await fetchMessages(activeRoomId, true);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? "حدث خطأ");
      }
    } catch {
      toast.error("حدث خطأ");
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
        toast.success("تم مسح المحادثة");
        setConfirmDelete(false);
        setActiveRoomId(null);
        setMessages([]);
        fetchRooms(true);
      } else {
        toast.error(d.error ?? "تعذّر مسح المحادثة");
      }
    } catch {
      toast.error("تعذّر مسح المحادثة");
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
  const title = activeRoom?.title ?? (isStaff ? activeRoom?.userName ?? "المحادثات" : "الدعم الفني");
  const isClosed = roomMeta.status === "closed";
  const orderRef = roomMeta.orderRef ?? activeRoom?.orderRef ?? null;
  const orderStatus = roomMeta.orderStatus ?? activeRoom?.orderStatus ?? null;
  const showSidebarPanel = isStaff || variant === "page" || rooms.length > 1;
  const hasActive = showSidebarPanel ? !!activeRoomId : true;
  const customerSentImage = messages.some((m) => m.isOwn && m.imageUrl);
  const awaitingPayment = orderStatus === "Awaiting Payment";
  const showPaymentBanner = !isStaff && awaitingPayment && !customerSentImage;

  // Full static class strings so Tailwind's JIT can see them
  const expanded  = showSidebar || !activeRoomId;
  let sidebarCls: string;
  if (variant === "page") {
    sidebarCls = expanded ? "w-[300px] opacity-100" : "w-0 md:w-[300px] opacity-0 md:opacity-100";
  } else if (isStaff) {
    // wide floating staff widget — side by side
    sidebarCls = expanded ? "w-[230px] opacity-100" : "w-0 md:w-[230px] opacity-0 md:opacity-100";
  } else {
    // narrow customer widget — full-width list, then full-width chat
    sidebarCls = expanded ? "w-full opacity-100" : "w-0 opacity-0";
  }

  /* ═════════════════════════════ Render ═══════════════════════════════════ */
  return (
    <div className="flex h-full w-full overflow-hidden" dir="rtl" style={{ background: "#0A0A14" }}>

      {/* ── Sidebar (staff = all customers; customer = their order threads) ── */}
      {showSidebarPanel && (
        <div
          className={`flex flex-col border-l border-white/[0.05] overflow-hidden shrink-0 transition-[width,opacity] duration-200 ${sidebarCls}`}
          style={{ background: "#07070F" }}
        >
          <div className="flex items-center gap-1.5 px-3.5 py-3 border-b border-white/[0.04] shrink-0">
            <Users className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/25">{isStaff ? "العملاء" : "محادثاتي"}</span>
            <span className="mr-auto text-[10px] font-bold text-white/15">{rooms.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-20 gap-2 text-white/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">جاري التحميل…</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-white/15 text-xs">لا توجد محادثات بعد</div>
            ) : (
              rooms.map((room) => {
                const mainLabel = room.title ?? room.userName;
                const isPaying = room.orderStatus === "Awaiting Payment";
                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-right transition-all border-b border-white/[0.03] hover:bg-white/[0.035]
                      ${activeRoomId === room.id ? "bg-purple-500/[0.10] shadow-[inset_2px_0_0_0_rgb(168,85,247)]" : ""}`}
                  >
                    <div className="relative">
                      <Avatar name={room.userName} size="md" />
                      {room.unread && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07070F] bg-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${room.unread ? "text-white" : "text-white/65"}`}>
                          {mainLabel}
                        </p>
                        {isPaying && <span className="shrink-0 rounded bg-orange-500/15 px-1 text-[8px] font-black text-orange-300">دفع</span>}
                        {room.status === "closed" && <Lock className="h-2.5 w-2.5 text-white/20 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-white/25 truncate mt-0.5">
                        {isStaff && room.title ? room.userName : (room.lastMsg ?? fmtDate(room.lastMessageAt))}
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
                    <Lock className="h-2.5 w-2.5" /> محادثة مغلقة
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> متصل الآن
                  </p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Resolve / reopen (staff, with an active room — hidden during the
                1-minute closing countdown) */}
            {isStaff && activeRoomId && !roomMeta.closing && (
              isClosed ? (
                <button
                  onClick={() => setClosed("reopen")}
                  disabled={closing}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-white/60 hover:text-white hover:border-white/15 transition-all disabled:opacity-50"
                >
                  {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  إعادة فتح
                </button>
              ) : (
                <button
                  onClick={() => setClosed("close")}
                  disabled={closing}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                  إغلاق
                </button>
              )
            )}

            {/* Delete conversation (admin only, with an active room) */}
            {isAdmin && activeRoomId && (
              <button
                onClick={() => setConfirmDelete((v) => !v)}
                title="مسح المحادثة"
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
              مسح المحادثة نهائياً؟ لا يمكن التراجع.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={deleteChat}
                disabled={deleting}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-600 text-[11px] font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                مسح نهائي
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-7 px-3 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-white/60 hover:text-white transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* "Closing in 1 minute" banner (customer + moderator + helper) */}
        {roomMeta.closing && (
          <div className="shrink-0 px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/[0.08] text-center">
            <p className="text-[11.5px] text-amber-300 font-semibold leading-relaxed">
              <Lock className="inline h-2.5 w-2.5 mb-0.5" />{" "}
              قام {ROLE_LABEL_AR[roomMeta.closedByRole ?? ""] ?? "أحد المسؤولين"} بإغلاق المحادثة، سوف تنتهي المحادثة
              {countdown != null && countdown > 0 ? ` خلال ${fmtCountdown(countdown)}` : " الآن"}
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
              <p className="text-white/20 text-sm font-semibold">{isStaff ? "اختر محادثة" : "اختر محادثة طلب"}</p>
              <p className="text-white/10 text-xs mt-0.5">{isStaff ? "من قائمة العملاء" : "من القائمة"}</p>
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
                  <span className="text-sm">جاري التحميل…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <MessageCircle className="h-8 w-8 text-white/[0.05]" />
                  <div>
                    <p className="text-white/20 text-sm">ابدأ المحادثة</p>
                    <p className="text-white/10 text-xs mt-0.5">سنرد عليك في أقرب وقت</p>
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
                        <Avatar name={msg.senderName} role={msg.senderRole} />
                      </div>
                      <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-1.5 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-[10px] text-white/35 font-bold">{msg.isOwn ? "أنت" : msg.senderName}</span>
                          {msg.senderRole && <RoleBadge role={msg.senderRole} />}
                        </div>
                        {msg.imageUrl ? (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer"
                            className="block overflow-hidden rounded-2xl border border-white/[0.08]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.imageUrl} alt="مرفق" className="max-h-56 w-auto max-w-[220px] object-cover" />
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
                        <span className="text-[9px] text-white/15 px-0.5">{fmtTime(msg.createdAt)}</span>
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
                    ? `أُغلقت المحادثة بواسطة ${roomMeta.closedByName}`
                    : "تم إغلاق هذه المحادثة"}
                  {!isStaff && " — أرسل رسالة لإعادة فتحها"}
                </p>
              </div>
            )}

            {/* Payment-proof prompt (customer, while the order awaits payment) */}
            {showPaymentBanner && (
              <div className="shrink-0 border-t-2 border-amber-500/40 bg-amber-500/[0.10] px-4 py-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-200">
                  <Camera className="h-4 w-4" /> الرجاء إرسال صورة إثبات الدفع
                </p>
                <p className="mt-0.5 text-[11px] text-amber-100/70">ارفق سكرين شوت التحويل من زرار الصورة 👇</p>
              </div>
            )}

            {/* Confirm-payment (staff, order awaiting payment) */}
            {isStaff && awaitingPayment && (
              <div className="shrink-0 flex items-center justify-between gap-2 border-t-2 border-orange-500/40 bg-orange-500/[0.10] px-4 py-2.5">
                <span className="text-xs font-bold text-orange-200">طلب بانتظار تأكيد الدفع — راجع صورة التحويل</span>
                <button
                  onClick={confirmPayment}
                  disabled={confirming}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-3 py-1.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                  تأكيد الدفع
                </button>
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
                  title="إرفاق صورة"
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
                  placeholder="اكتب رسالتك…"
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
                Enter للإرسال · Shift+Enter لسطر جديد
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
