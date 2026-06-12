"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Crown,
  DollarSign,
  Layers,
  LoaderCircle,
  MessageCircle,
  Package,
  Package2,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useMyOrders } from "../../components/members/useMyOrders";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import NotificationSoundToggle from "../../components/notifications/NotificationSoundToggle";
import UserAvatar, { VerifiedBadge } from "../../components/ui/UserAvatar";

/* ─────────────────────── Helpers ─────────────────────── */
function parseMoney(v: number | string | undefined): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(v: string | null | undefined, style: "short" | "long" = "short") {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return style === "long"
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function fmtTime(v: string | null | undefined) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────── Status config ───────────────── */
const orderStatus = {
  "Awaiting Payment": { dot: "bg-orange-400", pill: "border-orange-500/25 bg-orange-500/10 text-orange-300" },
  Completed:  { dot: "bg-emerald-400", pill: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  Processing: { dot: "bg-blue-400",    pill: "border-blue-500/25 bg-blue-500/10 text-blue-300" },
  Pending:    { dot: "bg-amber-400",   pill: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  Cancelled:  { dot: "bg-red-400",     pill: "border-red-500/25 bg-red-500/10 text-red-300" },
} as const;
type OrderStatusKey = keyof typeof orderStatus;

function statusConfig(s: string) {
  return (
    orderStatus[s as OrderStatusKey] ??
    { dot: "bg-purple-400", pill: "border-purple-500/25 bg-purple-500/10 text-purple-300" }
  );
}

/* ─────────────────────── Stat card ───────────────────── */
function StatCard({
  icon: Icon, label, value, unit, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-4 flex flex-col gap-3">
      <div className={`grid h-9 w-9 place-items-center rounded-xl border ${accent ?? "border-purple-500/20 bg-purple-500/10 text-purple-300"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
        <p className="mt-1 text-2xl font-black text-white tabular-nums leading-none">
          {value}
          {unit && <span className="text-xs font-bold text-zinc-500 ml-1">{unit}</span>}
        </p>
      </div>
      <div className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-purple-500/[0.07] blur-2xl" />
    </div>
  );
}

/* ─────────────────────── Order row ──────────────────── */
const ORDER_STATUS_KEYS: Record<string, string> = {
  "Awaiting Payment": "order.status.awaitingPayment",
  "Completed":        "order.status.completed",
  "Processing":       "order.status.processing",
  "Pending":          "order.status.pending",
  "Cancelled":        "order.status.cancelled",
};

function OrderCard({
  order, index,
}: {
  order: { productName: string; status: string; price: number | string; createdAt: string | null };
  index: number;
}) {
  const { translate } = useLanguage();
  const sc    = statusConfig(order.status);
  const price = parseMoney(order.price);
  const statusLabel = ORDER_STATUS_KEYS[order.status]
    ? translate(ORDER_STATUS_KEYS[order.status])
    : order.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-4 py-3.5 transition-all duration-200 hover:border-purple-500/20 hover:bg-purple-500/[0.04]"
    >
      {/* Product icon */}
      <div className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-700/30 to-fuchsia-700/20 ring-1 ring-purple-500/15">
        <Package className="h-5 w-5 text-purple-300" />
        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 ${sc.dot}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-white group-hover:text-purple-100 transition-colors">
          {order.productName}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-600">
          <span>{fmtDate(order.createdAt)}</span>
          {fmtTime(order.createdAt) && (
            <><span>·</span><span>{fmtTime(order.createdAt)}</span></>
          )}
        </div>
        {/* Status chip — mobile only */}
        <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:hidden ${sc.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {statusLabel}
        </span>
      </div>

      {/* Right side */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${sc.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {statusLabel}
        </span>
        <span className="text-sm font-black text-white tabular-nums">
          {price.toLocaleString()}
          <span className="text-[10px] font-bold text-zinc-600 ml-0.5">EGP</span>
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Activity timeline ─────────────── */
function ActivityTimeline({
  orders,
}: {
  orders: Array<{ productName: string; status: string; price: number | string; createdAt: string | null }>;
}) {
  const { translate } = useLanguage();
  const items = orders.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-transparent" />
      <div className="space-y-0">
        {items.map((o, i) => {
          const sc = statusConfig(o.status);
          const statusLabel = ORDER_STATUS_KEYS[o.status]
            ? translate(ORDER_STATUS_KEYS[o.status])
            : o.status;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              <div className={`relative z-10 mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-950 ${sc.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-200">{o.productName}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{fmtDate(o.createdAt)} {fmtTime(o.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${sc.pill}`}>
                      {statusLabel}
                    </span>
                    <p className="mt-1 text-xs font-black text-white tabular-nums">
                      {parseMoney(o.price).toLocaleString()}{" "}
                      <span className="text-[9px] text-zinc-600">EGP</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function AccountPage() {
  const router = useRouter();
  const { profile, accessToken, role, status, isLoading } = useAuth();
  const { translate } = useLanguage();

  useEffect(() => {
    if (!isLoading && !accessToken) router.replace("/login");
  }, [accessToken, isLoading, router]);

  const { data: ordersData, isLoading: ordersLoading } = useMyOrders(50);

  const isOwner  = role === "owner";
  const isAdmin  = role === "admin" || role === "owner";
  const fullName = profile?.full_name || profile?.email || translate("account.unknown");
  const email    = profile?.email ?? "—";
  const createdAt = profile?.created_at ?? null;

  const totalSpent = useMemo(
    () =>
      (ordersData?.recentOrders ?? [])
        .filter((o) => o.status === "Completed")
        .reduce((acc, o) => acc + parseMoney(o.price), 0),
    [ordersData]
  );

  const allOrders = ordersData?.recentOrders ?? [];

  /* ── Loading ── */
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
          <p className="text-xs text-zinc-600 font-semibold">{translate("account.loading")}</p>
        </div>
      </main>
    );
  }

  if (!accessToken) return null;

  /* ── Blocked ── */
  if (status && status !== "Active") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-zinc-900/60 p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white">
            {status === "Suspended"
              ? translate("account.accountSuspended")
              : translate("account.accountBanned")}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">{translate("account.statusBlocked")}</p>
        </div>
      </main>
    );
  }

  /* ══════════ RENDER ══════════ */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-700/[0.07] blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.05] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-5">

        {/* ── TOP NAV ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-purple-500/25 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {translate("account.backToStore")}
          </button>
          <div className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.08] px-4 py-2 text-sm font-semibold text-purple-300">
            <Layers className="h-4 w-4" />
            {translate("account.myAccount")}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            1. PROFILE HEADER — full-width banner
        ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-zinc-900/50"
        >
          {/* Banner */}
          <div className="h-28 w-full bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-fuchsia-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(168,85,247,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(217,70,239,0.12),transparent_60%)]" />
            <div className="absolute right-8 top-5 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-purple-300" />
              ))}
            </div>
          </div>

          {/* Profile row */}
          <div className="px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  role={role}
                  verified={profile?.verified}
                  size="2xl"
                  className="sm:h-28 sm:w-28 ring-2 ring-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 sm:mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-none">{fullName}</h1>
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                      <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5 shrink-0">
                        <path d="M1.5 7.5V6L3 3L5 5L7 3L8.5 6V7.5Z" fill="currentColor" fillOpacity="0.9"/>
                        <rect x="1.5" y="7.5" width="7" height="1.3" rx="0.4" fill="currentColor" fillOpacity="0.9"/>
                      </svg>
                      {translate("admin.role.owner")}
                    </span>
                  )}
                  {!isOwner && isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                      <Crown className="h-2.5 w-2.5" /> {translate("admin.role.admin")}
                    </span>
                  )}
                  {profile?.verified && <VerifiedBadge />}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {translate("account.active")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-zinc-500 truncate">{email}</p>
                <p className="mt-0.5 text-xs text-zinc-700">
                  {translate("account.memberSince")} {fmtDate(createdAt, "long")}
                </p>
              </div>

              {/* Admin shortcut in hero */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-2.5 text-sm font-bold text-purple-200 transition hover:bg-purple-500/20 hover:border-purple-400/40 flex-shrink-0 mb-1"
                >
                  <Layers className="h-4 w-4" />
                  {translate("account.adminPanel")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════
            2. STATISTICS — 4-card row
        ══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <StatCard
            icon={Sparkles}
            label={translate("account.totalOrders")}
            value={ordersLoading ? "—" : (ordersData?.totalOrders ?? 0)}
          />
          <StatCard
            icon={CheckCircle2}
            label={translate("account.completedOrders")}
            value={ordersLoading ? "—" : (ordersData?.completedOrders ?? 0)}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          />
          <StatCard
            icon={Clock3}
            label={translate("account.pendingOrders")}
            value={ordersLoading ? "—" : (ordersData?.pendingOrders ?? 0)}
            accent="border-amber-500/20 bg-amber-500/10 text-amber-300"
          />
          <StatCard
            icon={DollarSign}
            label={translate("account.totalSpent")}
            value={ordersLoading ? "—" : totalSpent.toLocaleString()}
            unit="EGP"
            accent="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300"
          />
        </motion.div>

        {/* ══════════════════════════════════
            3. MY ORDERS — full width
        ══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{translate("account.orders")}</p>
                {!ordersLoading && (
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {allOrders.length > 0
                      ? `${allOrders.length} ${allOrders.length === 1 ? translate("account.orderCount.one") : translate("account.orderCount.other")}`
                      : translate("account.noOrders")}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-purple-500/25 hover:text-purple-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {translate("account.support")}
            </Link>
          </div>

          {/* Order list */}
          <div className="p-4">
            {ordersLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/[0.04] bg-zinc-800/40" />
                ))}
              </div>
            ) : allOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.06] bg-zinc-800/50 text-zinc-600">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-zinc-400">{translate("account.noOrders")}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{translate("account.ordersEmptyDesc")}</p>
                </div>
                <Link
                  href="/#products"
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/15"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {translate("account.browseProducts")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {allOrders.map((order, i) => (
                  <OrderCard key={`${order.productName}-${i}`} order={order} index={i} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ══════════════════════════════════
            4 + 5. ACCOUNT INFO | NOTIFICATIONS
            Two equal columns — always balanced
        ══════════════════════════════════ */}
        <div className="grid gap-5 sm:grid-cols-2">

          {/* 4. Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">
              {translate("account.accountInfo")}
            </p>
            <div className="space-y-2.5">
              {[
                { label: translate("account.email"),    value: email },
                { label: translate("account.joinDate"), value: fmtDate(createdAt, "long") },
                { label: translate("account.roleLabel"), value: role === "owner" ? translate("admin.role.owner") : role === "admin" ? translate("admin.role.admin") : role === "moderator" ? translate("admin.role.moderator") : role === "helper" ? translate("admin.role.helper") : translate("account.roleUser") },
                { label: translate("account.status"),   value: status ?? translate("account.active") },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3.5 py-2.5"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex-shrink-0">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-200 truncate text-right">
                    {value}
                  </span>
                </div>
              ))}
              {/* Verified row */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3.5 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  {translate("account.verified")}
                </span>
                {profile?.verified
                  ? <VerifiedBadge />
                  : <span className="text-xs font-semibold text-zinc-600">{translate("account.notYet")}</span>}
              </div>
            </div>
          </motion.div>

          {/* 5. Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <NotificationSoundToggle variant="card" />
          </motion.div>
        </div>

        {/* ══════════════════════════════════
            6. RECENT ACTIVITY — full width
            Only shown when the user has orders
        ══════════════════════════════════ */}
        {allOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                {translate("account.recentActivity")}
              </p>
            </div>
            <ActivityTimeline orders={allOrders} />
          </motion.div>
        )}

        {/* ══════════════════════════════════
            7. QUICK ACTIONS — horizontal pills
        ══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">
            {translate("account.quickActions")}
          </p>

          <div className="flex flex-wrap gap-2.5">
            {/* Chat — always visible, primary accent */}
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/25 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 hover:border-purple-400/35"
            >
              <MessageCircle className="h-4 w-4" />
              {translate("account.chatsAndSupport")}
            </Link>

            {/* Browse Products */}
            <Link
              href="/#products"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-800/50 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-purple-500/20 hover:bg-purple-500/[0.06] hover:text-white"
            >
              <Package className="h-4 w-4" />
              {translate("account.browseProducts")}
            </Link>

            {/* Best Sellers */}
            <Link
              href="/#best-sellers"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-800/50 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/20 hover:bg-amber-500/[0.06] hover:text-amber-200"
            >
              <Zap className="h-4 w-4" />
              {translate("account.bestSellers")}
            </Link>

            {/* Admin-only shortcuts */}
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/15 px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/25 hover:border-purple-400/45"
                >
                  <Package2 className="h-4 w-4" />
                  {translate("account.adminPanel")}
                </Link>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-800/50 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-purple-500/20 hover:bg-purple-500/[0.06] hover:text-white"
                >
                  <ClipboardList className="h-4 w-4" />
                  {translate("account.manageOrders")}
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-800/50 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-purple-500/20 hover:bg-purple-500/[0.06] hover:text-white"
                >
                  <Users className="h-4 w-4" />
                  {translate("account.manageUsers")}
                </Link>
              </>
            )}
          </div>
        </motion.div>

      </div>
    </main>
  );
}
