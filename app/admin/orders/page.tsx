"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  LoaderCircle,
  Package,
  Phone,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";
import AnimatedNumber from "../animated-number";
import StatusDropdown from "../../../components/StatusDropdown";

/* ─────────────────────── Types ─────────────────────── */
const ORDER_STATUSES = ["Awaiting Payment", "Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

interface OrderRecord {
  id: number;
  customer_name: string;
  customer_phone?: string | null;
  product_name: string;
  product_image?: string | null;
  product_category?: string | null;
  price: number | string;
  status: string;
  payment_method?: string | null;
  created_at?: string | null;
  handled_by?: string | null;
  handled_by_name?: string | null;
  handled_at?: string | null;
}

interface OrdersApiResponse { success: boolean; data?: OrderRecord[]; error?: string }
interface ActionApiResponse  { success: boolean; error?: string }

/* ─────────────────────── Status config ─────────────────────── */
const SC: Record<OrderStatus, { dot: string; pill: string; text: string; ring: string; bg: string }> = {
  "Awaiting Payment": { dot: "bg-orange-400", pill: "border-orange-500/30 bg-orange-500/10 text-orange-300", text: "text-orange-300", ring: "ring-orange-500/20", bg: "bg-orange-500/[0.04]" },
  Pending:    { dot: "bg-amber-400",   pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",    text: "text-amber-300",    ring: "ring-amber-500/20",    bg: "bg-amber-500/[0.04]"    },
  Processing: { dot: "bg-blue-400",    pill: "border-blue-500/30 bg-blue-500/10 text-blue-300",       text: "text-blue-300",     ring: "ring-blue-500/20",     bg: "bg-blue-500/[0.04]"     },
  Completed:  { dot: "bg-emerald-400", pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", text: "text-emerald-300", ring: "ring-emerald-500/20", bg: "bg-emerald-500/[0.04]" },
  Cancelled:  { dot: "bg-red-400",     pill: "border-red-500/30 bg-red-500/10 text-red-300",          text: "text-red-300",      ring: "ring-red-500/20",      bg: "bg-red-500/[0.04]"      },
};

const STATUS_TRANSLATE_KEYS = {
  "Awaiting Payment": "admin.orders.status.AwaitingPayment",
  Pending:    "admin.orders.status.Pending",
  Processing: "admin.orders.status.Processing",
  Completed:  "admin.orders.status.Completed",
  Cancelled:  "admin.orders.status.Cancelled",
} as const;

/* ─────────────────────── Helpers ─────────────────────── */
function parsePrice(v: number | string): number {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function safeStatus(s: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : "Pending";
}

function fmtDate(v?: string | null, style: "short" | "long" = "short") {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return style === "long"
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function fmtTime(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getInitials(n: string) {
  const p = n.trim().split(" ").filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "#";
}

/* ─────────────────────── Status pill ─────────────────────── */
function StatusPill({ status }: { status: OrderStatus }) {
  const m = SC[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
}

/* ─────────────────────── Metric card ─────────────────────── */
function MetricCard({ icon: Icon, label, value, suffix, accent, loading }: {
  icon: React.ElementType; label: string; value: number; suffix?: string;
  accent: string; loading: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-zinc-900/60 p-4 ${accent}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{label}</p>
          <p className="mt-2 text-2xl font-black text-white tabular-nums leading-none">
            {loading ? <span className="text-zinc-700">—</span> : <AnimatedNumber value={value} suffix={suffix} />}
          </p>
        </div>
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-zinc-800/60">
          <Icon className="h-4 w-4 text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Order row ─────────────────────── */
function OrderRow({
  order, isSelected, isSaving, canEdit, canDelete,
  onSelect, onStatusChange, onDelete,
}: {
  order: OrderRecord; isSelected: boolean; isSaving: boolean;
  canEdit: boolean; canDelete: boolean;
  onSelect(): void; onStatusChange(s: OrderStatus): void; onDelete(): void;
}) {
  const status = safeStatus(order.status);
  const m      = SC[status];
  const price  = parsePrice(order.price);

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={[
        "group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-white/[0.03] last:border-0 select-none",
        isSelected
          ? "bg-purple-600/[0.13] border-l-2 border-l-purple-500"
          : "hover:bg-white/[0.025] border-l-2 border-l-transparent",
      ].join(" ")}
    >
      {/* Avatar */}
      <div className={[
        "h-9 w-9 flex-shrink-0 grid place-items-center rounded-xl text-xs font-black transition-all",
        isSelected ? "ring-1 ring-purple-500/30" : "",
        "bg-gradient-to-br from-purple-700/30 to-fuchsia-700/20 text-purple-200",
      ].join(" ")}>
        {getInitials(order.customer_name)}
      </div>

      {/* Left info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-zinc-100 leading-none truncate">{order.customer_name}</p>
          {isSaving && <LoaderCircle className="h-3 w-3 animate-spin text-purple-400 flex-shrink-0" />}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-600">
          <span className="font-bold text-zinc-500">#{order.id}</span>
          <span>·</span>
          <span className="truncate max-w-[120px]">{order.product_name}</span>
          <span>·</span>
          <span>{fmtDate(order.created_at)}</span>
        </div>
      </div>

      {/* Status + price */}
      <div className="flex flex-shrink-0 items-center gap-3 group-hover:opacity-0 transition-opacity duration-100">
        <StatusPill status={status} />
        <span className="text-sm font-black text-white tabular-nums">
          {price.toLocaleString()}
          <span className="text-[9px] font-bold text-zinc-600 ml-0.5">EGP</span>
        </span>
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-40" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            value={status}
            onChange={(v) => onStatusChange(v as OrderStatus)}
            options={ORDER_STATUSES}
            disabled={isSaving || !canEdit}
          />
        </div>
        {canDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="grid h-7 w-7 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Order detail drawer ─────────────────────── */
function OrderDrawer({
  order, isSaving, canEdit, canDelete,
  onStatusChange, onDelete, onClose,
}: {
  order: OrderRecord; isSaving: boolean; canEdit: boolean; canDelete: boolean;
  onStatusChange(s: OrderStatus): void; onDelete(): void; onClose(): void;
}) {
  const status = safeStatus(order.status);
  const m      = SC[status];
  const price  = parsePrice(order.price);

  /* Pseudo timeline: just the creation + handled events */
  const timeline = [
    { label: "Order placed",  time: order.created_at,  dot: "bg-purple-400" },
    ...(order.handled_at ? [{ label: `Marked ${order.status}`, time: order.handled_at, dot: m.dot }] : []),
  ].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">Order #{order.id}</span>
          <StatusPill status={status} />
        </div>
        <button onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Product hero */}
        <div className={`px-5 py-5 border-b border-white/[0.05] ${m.bg}`}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 grid place-items-center">
              {order.product_image
                ? <img src={order.product_image} alt={order.product_name} className="h-full w-full object-cover" />
                : <Package className="h-6 w-6 text-zinc-600" />}
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-white leading-tight truncate">{order.product_name}</p>
              {order.product_category && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                  {order.product_category}
                </span>
              )}
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tabular-nums">{price.toLocaleString()}</span>
                <span className="text-xs font-bold text-purple-300">EGP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Customer info */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Customer</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3.5 py-2.5">
                <User className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-600">Name</p>
                  <p className="text-sm font-bold text-zinc-200">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3.5 py-2.5">
                <Phone className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-600">Phone</p>
                  <p className="text-sm font-bold text-zinc-200">{order.customer_phone || "—"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Order meta */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Order Details</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3.5 py-2.5">
                <span className="text-xs text-zinc-600">Order Date</span>
                <span className="text-xs font-bold text-zinc-300">{fmtDate(order.created_at, "long")}</span>
              </div>
              {order.payment_method && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3.5 py-2.5">
                  <span className="text-xs text-zinc-600">Payment Method</span>
                  <span className="text-xs font-bold text-zinc-300">
                    {order.payment_method === "vodafone" ? "Vodafone Cash" : order.payment_method === "instapay" ? "InstaPay" : order.payment_method}
                  </span>
                </div>
              )}
              {order.handled_by_name && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3.5 py-2.5">
                  <span className="text-xs text-zinc-600">Handled By</span>
                  <span className="text-xs font-bold text-zinc-300">{order.handled_by_name}</span>
                </div>
              )}
            </div>
          </section>

          {/* Payment received — quick confirm for Awaiting Payment orders */}
          {canEdit && status === "Awaiting Payment" && (
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400/70 mb-3">بانتظار تأكيد الدفع</p>
              <button
                type="button"
                onClick={() => onStatusChange("Processing")}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(16,185,129,0.3)] transition hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> ✓ تأكيد استلام الفلوس
              </button>
              <p className="mt-1.5 text-center text-[11px] text-zinc-600">
                اضغط بعد مراجعة صورة التحويل — الطلب هيتحوّل لـ <span className="text-blue-300">Processing</span>
              </p>
            </section>
          )}

          {/* Status management */}
          {canEdit && (
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {ORDER_STATUSES.map((s) => {
                  const sm   = SC[s];
                  const isActive = status === s;
                  return (
                    <button key={s} type="button"
                      disabled={isSaving || isActive}
                      onClick={() => onStatusChange(s)}
                      className={[
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-150",
                        isActive
                          ? `${sm.pill} scale-[1.02] cursor-default`
                          : "border-white/[0.07] bg-zinc-900/50 text-zinc-500 hover:border-white/10 hover:bg-zinc-800/40 disabled:opacity-40",
                      ].join(" ")}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                      {s}
                      {isActive && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Timeline</p>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-transparent" />
              <div className="space-y-4">
                {timeline.map((t, i) => (
                  <div key={i} className="relative flex gap-3">
                    <div className={`absolute -left-5 top-[3px] h-3 w-3 rounded-full border-2 border-zinc-950 ${t.dot}`} />
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">{t.label}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{fmtDate(t.time, "long")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      {canDelete && (
        <div className="px-5 py-4 border-t border-white/[0.06] bg-zinc-950/60">
          <button type="button" onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/15 py-2.5 text-sm font-semibold text-red-400/80 transition hover:bg-red-500/[0.07] hover:text-red-400">
            <Trash2 className="h-4 w-4" /> Delete Order
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function OrdersPage() {
  const { accessToken, role }  = useAuth();
  const { translate }          = useLanguage();

  const [orders, setOrders]               = useState<OrderRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [savingId, setSavingId]           = useState<number | null>(null);
  const [error, setError]                 = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [selectedId, setSelectedId]       = useState<number | null>(null);

  /* Filters */
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<"all" | OrderStatus>("all");
  const [sortDir, setSortDir]             = useState<"desc" | "asc">("desc");

  const canEdit   = role === "admin" || role === "moderator";
  const canDelete = role === "admin";

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      setLoading(true); setError("");
      const res  = await fetch("/api/get-orders", { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
      const data = await res.json() as OrdersApiResponse;
      if (!data.success || !data.data) { setError(data.error || translate("admin.toast.error")); setOrders([]); return; }
      setOrders(data.data);
    } catch { setError(translate("admin.toast.error")); setOrders([]); }
    finally { setLoading(false); }
  }

  async function updateStatus(id: number, status: OrderStatus) {
    if (!canEdit) return;
    try {
      setSavingId(id);
      const res  = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json() as ActionApiResponse;
      if (data.success) loadOrders();
      else toast.error(data.error || translate("admin.toast.error"));
    } catch { toast.error(translate("admin.toast.error")); }
    finally { setSavingId(null); }
  }

  async function deleteOrder(id: number) {
    if (!canDelete) return;
    try {
      setSavingId(id);
      const res  = await fetch("/api/delete-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ id }),
      });
      const data = await res.json() as ActionApiResponse;
      if (data.success) { setPendingDeleteId(null); if (selectedId === id) setSelectedId(null); loadOrders(); }
      else { setPendingDeleteId(null); toast.error(data.error || translate("admin.toast.error")); }
    } catch { setPendingDeleteId(null); toast.error(translate("admin.toast.error")); }
    finally { setSavingId(null); }
  }

  /* ── Metrics ── */
  const metrics = useMemo(() => {
    const counts: Record<OrderStatus, number> = { "Awaiting Payment": 0, Pending: 0, Processing: 0, Completed: 0, Cancelled: 0 };
    let revenue  = 0;
    for (const o of orders) {
      const s = safeStatus(o.status);
      counts[s]++;
      revenue += parsePrice(o.price);
    }
    return { counts, revenue, total: orders.length };
  }, [orders]);

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => {
        const matchQ = !q || String(o.id).includes(q) || o.customer_name.toLowerCase().includes(q) || (o.customer_phone ?? "").includes(q) || o.product_name.toLowerCase().includes(q);
        const matchS = statusFilter === "all" || safeStatus(o.status) === statusFilter;
        return matchQ && matchS;
      })
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDir === "desc" ? db - da : da - db;
      });
  }, [orders, search, statusFilter, sortDir]);

  const selectedOrder = selectedId !== null ? orders.find((o) => o.id === selectedId) ?? null : null;

  /* ══ RENDER ══ */
  return (
    <>
      <div className="flex flex-col h-full min-h-screen bg-zinc-950 text-white">

        {/* ════════ TOP BAR ════════ */}
        <header className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05] bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-30 flex-wrap gap-y-2">
          <div className="flex items-center gap-2 mr-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg border border-purple-500/20 bg-purple-500/[0.10] text-purple-300">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Orders Control</p>
              <p className="text-[10px] text-zinc-600 leading-none mt-0.5">{translate("admin.orders.badge")}</p>
            </div>
          </div>

          <div className="h-4 w-px bg-white/[0.07] hidden sm:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, phone…"
              className="w-full rounded-xl border border-white/[0.07] bg-zinc-900/70 pl-8 pr-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/40 transition" />
          </div>

          {/* Status filter */}
          <div className="relative hidden sm:block">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
              className="appearance-none rounded-xl border border-white/[0.07] bg-zinc-900/70 pl-3 pr-7 py-1.5 text-xs text-zinc-400 outline-none focus:border-purple-500/30 cursor-pointer">
              <option value="all">All Status</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
          </div>

          {/* Sort */}
          <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
            title={`Sort ${sortDir === "desc" ? "oldest first" : "newest first"}`}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-zinc-900/70 text-zinc-500 hover:text-zinc-300 transition hidden sm:grid">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>

          <span className="text-xs text-zinc-700 font-semibold tabular-nums hidden md:block">
            {filtered.length}{orders.length !== filtered.length ? `/${orders.length}` : ""} orders
          </span>

          {error && <span className="text-xs text-red-400 font-semibold">{error}</span>}
        </header>

        {/* ════════ METRICS ════════ */}
        <div className="px-5 py-4 border-b border-white/[0.04] bg-zinc-950/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard icon={ShoppingCart} label="Total Orders"  value={metrics.total}             loading={loading} accent="border-white/[0.07]" />
            <MetricCard icon={DollarSign}   label="Revenue"       value={metrics.revenue}  suffix=" EGP" loading={loading} accent="border-purple-500/15" />
            <MetricCard icon={Clock}        label="Pending"        value={metrics.counts.Pending}    loading={loading} accent="border-amber-500/15" />
            <MetricCard icon={Zap}          label="Processing"     value={metrics.counts.Processing}  loading={loading} accent="border-blue-500/15" />
            <MetricCard icon={CheckCircle2} label="Completed"      value={metrics.counts.Completed}   loading={loading} accent="border-emerald-500/15" />
            <MetricCard icon={XCircle}      label="Cancelled"      value={metrics.counts.Cancelled}   loading={loading} accent="border-red-500/15" />
          </div>
        </div>

        {/* ════════ QUICK FILTERS ════════ */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.03] overflow-x-auto">
          {(["all", ...ORDER_STATUSES] as const).map((s) => {
            const active = statusFilter === s;
            const count  = s === "all" ? orders.length : metrics.counts[s];
            const dotCls = s !== "all" ? SC[s].dot : "bg-zinc-500";
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold flex-shrink-0 transition-all duration-150",
                  active
                    ? s === "all"
                      ? "border-white/15 bg-white/10 text-white"
                      : `${SC[s as OrderStatus].pill} scale-[1.02]`
                    : "border-white/[0.06] bg-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300",
                ].join(" ")}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
                {s === "all" ? "All" : s}
                <span className={`text-[10px] tabular-nums ${active ? "" : "text-zinc-700"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ════════ MAIN SPLIT ════════ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: Order List ── */}
          <div className={[
            "flex flex-col border-r border-white/[0.04] overflow-hidden transition-all duration-300",
            selectedOrder ? "w-[55%]" : "w-full",
          ].join(" ")}>

            {/* Column header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.03] bg-zinc-900/20">
              <div className="w-9 flex-shrink-0" />
              <span className="flex-1 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">Customer / Order</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 pr-8">Status / Price</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03]">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-28 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-2 w-40 rounded bg-white/[0.03] animate-pulse" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/[0.06] bg-zinc-900/50 text-zinc-700">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400">{search ? "No orders match" : translate("admin.orders.noOrders")}</p>
                    <p className="text-xs text-zinc-700 mt-0.5">{search ? "Try a different search" : "Orders will appear here once placed"}</p>
                  </div>
                  {orders.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {search && <button onClick={() => setSearch("")} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition">Clear search</button>}
                      {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition">Show all</button>}
                    </div>
                  )}
                </div>
              ) : (
                filtered.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isSelected={selectedId === order.id}
                    isSaving={savingId === order.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onSelect={() => setSelectedId(selectedId === order.id ? null : order.id)}
                    onStatusChange={(s) => updateStatus(order.id, s)}
                    onDelete={() => setPendingDeleteId(order.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT: Order Drawer ── */}
          <AnimatePresence>
            {selectedOrder && (
              <motion.div
                key="drawer"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden bg-zinc-950/60 border-l border-white/[0.04]"
                style={{ width: "45%" }}
              >
                <OrderDrawer
                  order={selectedOrder}
                  isSaving={savingId === selectedOrder.id}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onStatusChange={(s) => updateStatus(selectedOrder.id, s)}
                  onDelete={() => setPendingDeleteId(selectedOrder.id)}
                  onClose={() => setSelectedId(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Delete modal ── */}
      {typeof window !== "undefined" && pendingDeleteId !== null
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPendingDeleteId(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-zinc-950 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
              >
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-center text-sm font-bold">{translate("admin.confirm.deleteOrder")}</h3>
                <p className="mt-1.5 text-center text-xs text-zinc-500">{translate("admin.confirm.cannotUndo")}</p>
                <div className="mt-5 flex gap-2.5">
                  <button type="button" onClick={() => deleteOrder(pendingDeleteId)} disabled={savingId === pendingDeleteId}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
                    {savingId === pendingDeleteId
                      ? <><LoaderCircle className="h-4 w-4 animate-spin" /> {translate("admin.confirm.deleting")}</>
                      : translate("admin.products.list.delete")}
                  </button>
                  <button type="button" onClick={() => setPendingDeleteId(null)} disabled={savingId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50">
                    {translate("admin.confirm.cancel")}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
