"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

/* ─────────────────────── Helpers ─────────────────────── */
function getInitials(name: string) {
  const parts = name.split(" ").map((p) => p.trim()).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase() || "?";
}

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
  return orderStatus[s as OrderStatusKey] ?? { dot: "bg-purple-400", pill: "border-purple-500/25 bg-purple-500/10 text-purple-300" };
}

/* ─────────────────────── Stat card ───────────────────── */
function StatCard({ icon: Icon, label, value, unit, accent }: {
  icon: React.ElementType; label: string; value: number | string; unit?: string; accent?: string;
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
      {/* subtle corner glow */}
      <div className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-purple-500/[0.07] blur-2xl" />
    </div>
  );
}

/* ─────────────────────── Order card ──────────────────── */
function OrderCard({ order, index }: { order: { productName: string; status: string; price: number | string; createdAt: string | null }; index: number }) {
  const sc  = statusConfig(order.status);
  const price = parseMoney(order.price);
  const initials = getInitials(order.productName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-4 py-3.5 transition-all duration-200 hover:border-purple-500/20 hover:bg-purple-500/[0.04]"
    >
      {/* Avatar / product image placeholder */}
      <div className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-700/30 to-fuchsia-700/20 text-xs font-black text-purple-200 ring-1 ring-purple-500/15">
        {initials}
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
        {/* Status visible on all screens */}
        <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:hidden ${sc.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {order.status}
        </span>
      </div>

      {/* Right */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${sc.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {order.status}
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
function ActivityTimeline({ orders }: { orders: Array<{ productName: string; status: string; price: number | string; createdAt: string | null }> }) {
  const items = orders.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-transparent" />

      <div className="space-y-0">
        {items.map((o, i) => {
          const sc = statusConfig(o.status);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              {/* Dot */}
              <div className={`relative z-10 mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-950 ${sc.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-200">{o.productName}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{fmtDate(o.createdAt)} {fmtTime(o.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${sc.pill}`}>
                      {o.status}
                    </span>
                    <p className="mt-1 text-xs font-black text-white tabular-nums">
                      {parseMoney(o.price).toLocaleString()} <span className="text-[9px] text-zinc-600">EGP</span>
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
type TabKey = "overview" | "orders";

export default function AccountPage() {
  const router = useRouter();
  const { profile, accessToken, role, status, isLoading } = useAuth();
  const { translate } = useLanguage();
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (!isLoading && !accessToken) router.replace("/login");
  }, [accessToken, isLoading, router]);

  const { data: ordersData, isLoading: ordersLoading } = useMyOrders(50);

  const isAdmin   = role === "admin";
  const fullName  = profile?.full_name || profile?.email || translate("account.unknown");
  const email     = profile?.email ?? "—";
  const createdAt = profile?.created_at ?? null;
  const initials  = getInitials(fullName);

  const totalSpent = useMemo(() =>
    (ordersData?.recentOrders ?? []).filter((o) => o.status === "Completed").reduce((acc, o) => acc + parseMoney(o.price), 0),
    [ordersData]
  );

  const allOrders    = ordersData?.recentOrders ?? [];
  const ordersToShow = tab === "orders" ? allOrders : allOrders.slice(0, 5);

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
            {status === "Suspended" ? translate("account.accountSuspended") : translate("account.accountBanned")}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">{translate("account.statusBlocked")}</p>
        </div>
      </main>
    );
  }

  /* ══════════ RENDER ══════════ */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-700/[0.07] blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.05] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ── TOP NAV ── */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-purple-500/25 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {translate("account.backToStore")}
          </button>
          <div className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.08] px-4 py-2 text-sm font-semibold text-purple-300">
            <Layers className="h-4 w-4" />
            {translate("account.myAccount")}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HERO SECTION — Full-width profile banner
        ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-zinc-900/50"
        >
          {/* Banner gradient */}
          <div className="h-32 w-full bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-fuchsia-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(168,85,247,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(217,70,239,0.12),transparent_60%)]" />
            {/* Decorative dots */}
            <div className="absolute right-8 top-6 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-purple-300" />
              ))}
            </div>
          </div>

          {/* Profile row */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-2xl border-4 border-zinc-950 bg-gradient-to-br from-purple-600 to-fuchsia-600 text-2xl sm:text-3xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.35)]">
                  {initials}
                </div>
                {/* Online dot */}
                <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-zinc-950 bg-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-none">{fullName}</h1>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                      <Crown className="h-2.5 w-2.5" /> Admin
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {translate("account.active")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-zinc-500 truncate">{email}</p>
                <p className="mt-0.5 text-xs text-zinc-700">
                  Member since {fmtDate(createdAt, "long")}
                </p>
              </div>

              {/* Quick actions */}
              {isAdmin && (
                <Link href="/admin"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-2.5 text-sm font-bold text-purple-200 transition hover:bg-purple-500/20 hover:border-purple-400/40 flex-shrink-0">
                  <Layers className="h-4 w-4" /> Admin Panel
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════
            STATS ROW
        ══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          <StatCard icon={Sparkles}     label={translate("account.totalOrders")}     value={ordersLoading ? "—" : (ordersData?.totalOrders ?? 0)} />
          <StatCard icon={CheckCircle2} label={translate("account.completedOrders")} value={ordersLoading ? "—" : (ordersData?.completedOrders ?? 0)}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-300" />
          <StatCard icon={Clock3}       label={translate("account.pendingOrders")}   value={ordersLoading ? "—" : (ordersData?.pendingOrders ?? 0)}
            accent="border-amber-500/20 bg-amber-500/10 text-amber-300" />
          <StatCard icon={DollarSign}   label={translate("account.totalSpent")}      value={ordersLoading ? "—" : totalSpent.toLocaleString()} unit="EGP"
            accent="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300" />
        </motion.div>

        {/* ══════════════════════════════════
            MAIN GRID
        ══════════════════════════════════ */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Tabs + Orders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14 }}
              className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div className="flex gap-1">
                  {(["overview", "orders"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
                        tab === t
                          ? "bg-purple-600/20 border border-purple-500/25 text-white"
                          : "text-zinc-500 hover:text-zinc-300",
                      ].join(" ")}
                    >
                      {t === "overview" ? translate("account.overview") : translate("account.orders")}
                      <span className="ml-2 text-[10px] font-black text-zinc-700 tabular-nums">
                        {t === "overview" ? Math.min(allOrders.length, 5) : allOrders.length}
                      </span>
                    </button>
                  ))}
                </div>
                {tab === "overview" && allOrders.length > 5 && (
                  <button onClick={() => setTab("orders")}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition inline-flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Orders */}
              <div className="p-4">
                {ordersLoading ? (
                  <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/[0.04] bg-zinc-800/40" />
                    ))}
                  </div>
                ) : ordersToShow.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.06] bg-zinc-800/50 text-zinc-600">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-400">{translate("account.noOrders")}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Your orders will appear here</p>
                    </div>
                    <Link href="/#products"
                      className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/15">
                      <ShoppingBag className="h-4 w-4" /> Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ordersToShow.map((order, i) => (
                      <OrderCard key={`${order.productName}-${i}`} order={order} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Admin section */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="rounded-3xl border border-purple-500/15 bg-zinc-900/40 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-500/10">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{translate("account.adminQuickActions")}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Manage your store from here</p>
                  </div>
                </div>

                <div className="p-4 grid gap-2.5 sm:grid-cols-2">
                  {[
                    { href: "/admin",           icon: Package2,     title: translate("account.adminPanel"),      desc: translate("account.adminPanelDesc") },
                    { href: "/admin/products",  icon: ShoppingBag,  title: translate("account.manageProducts"),  desc: translate("account.manageProductsDesc") },
                    { href: "/admin/orders",    icon: ClipboardList,title: translate("account.manageOrders"),    desc: translate("account.manageOrdersDesc") },
                    { href: "/admin/users",     icon: Users,        title: "Manage Users",                       desc: "View and manage user accounts" },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-zinc-900/50 p-3.5 transition-all duration-200 hover:border-purple-500/20 hover:bg-purple-500/[0.06]"
                    >
                      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-purple-500/15 bg-purple-500/[0.08] text-purple-300">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors leading-none">{item.title}</p>
                        <p className="text-[11px] text-zinc-600 mt-1 leading-none">{item.desc}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Account info card */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Account Info</p>
              <div className="space-y-3">
                {[
                  { label: translate("account.email"),    value: email },
                  { label: translate("account.joinDate"), value: fmtDate(createdAt, "long") },
                  { label: "Role",                        value: role ?? "user" },
                  { label: "Status",                      value: status ?? "Active" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3.5 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</span>
                    <span className="text-sm font-semibold text-zinc-200 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notification Sound Settings */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
            >
              <NotificationSoundToggle variant="card" />
            </motion.div>

            {/* Activity timeline */}
            {allOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.18 }}
                className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
              >
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Recent Activity</p>
                </div>
                <ActivityTimeline orders={allOrders} />
              </motion.div>
            )}

            {/* Quick store access */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.24 }}
              className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Quick Access</p>
              <div className="space-y-2">
                <Link href="/chat"
                  className="group flex items-center gap-3 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3.5 py-2.5 transition hover:bg-purple-500/20">
                  <MessageCircle className="h-4 w-4 text-purple-300" />
                  <span className="text-sm font-bold text-purple-100">محادثات الطلبات والدعم</span>
                  <ArrowRight className="h-3 w-3 text-purple-400 ml-auto transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="/#products"
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3.5 py-2.5 transition hover:border-purple-500/20 hover:bg-purple-500/[0.06]">
                  <Package className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                  <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">Browse Products</span>
                  <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-purple-400 ml-auto transition-colors" />
                </Link>
                <Link href="/#best-sellers"
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3.5 py-2.5 transition hover:border-purple-500/20 hover:bg-purple-500/[0.06]">
                  <Zap className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                  <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">Best Sellers</span>
                  <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-purple-400 ml-auto transition-colors" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

    </main>
  );
}
