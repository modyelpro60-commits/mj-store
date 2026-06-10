"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Coins,
  ExternalLink,
  LoaderCircle,
  Package,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import AnimatedNumber from "./animated-number";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { AdminOnlyGuard } from "./admin-guard";

interface ProductRecord {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  badge?: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  bestSellingProduct: { id: number | null; name: string; sales: number } | null;
}

interface StatsApiResponse {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

interface OrderRecord {
  id: number;
  customer_name: string;
  product_name: string;
  price: number | string;
  status: string;
  created_at?: string | null;
}

interface OrdersApiResponse {
  success: boolean;
  data?: OrderRecord[];
  error?: string;
}

const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function parsePrice(v: number | string): number {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatTs(ts: string | null | undefined) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" }) +
    "  " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function statusBadgeCls(s: string) {
  if (s === "Pending")    return "text-purple-300 bg-purple-500/10 border-purple-500/20";
  if (s === "Processing") return "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20";
  if (s === "Completed")  return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
  return "text-red-300 bg-red-500/10 border-red-500/20";
}

function statusBarCls(s: string) {
  if (s === "Pending")    return "bg-purple-500";
  if (s === "Processing") return "bg-fuchsia-500";
  if (s === "Completed")  return "bg-emerald-500";
  return "bg-red-500";
}

function statusIcon(s: string) {
  if (s === "Completed") return CheckCircle2;
  if (s === "Cancelled") return XCircle;
  if (s === "Processing") return Zap;
  return Clock3;
}

function AdminPageInner() {
  const { accessToken } = useAuth();
  const { translate } = useLanguage();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    if (!accessToken) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const [productsRes, statsRes, ordersRes] = await Promise.all([
        fetch("/api/get-products"),
        fetch("/api/admin/dashboard-stats", { headers: authHeaders }),
        fetch("/api/get-orders", { headers: authHeaders }),
      ]);
      const productsData = (await productsRes.json()) as ProductRecord[];
      const statsData    = (await statsRes.json()) as StatsApiResponse;
      const ordersData   = (await ordersRes.json()) as OrdersApiResponse;

      setProducts(Array.isArray(productsData) ? productsData : []);
      setStats(statsData.success && statsData.data ? statsData.data : null);
      setOrders(ordersData.success && ordersData.data ? ordersData.data : []);
      if (!statsData.success && statsData.error) setError(statsData.error);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      setProducts([]);
      setStats(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const avgOrderValue = useMemo(() => {
    if (!stats?.totalOrders || !stats.totalRevenue) return 0;
    return Math.round(stats.totalRevenue / stats.totalOrders);
  }, [stats]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { Pending: 0, Processing: 0, Completed: 0, Cancelled: 0 };
    for (const o of orders) {
      const s = ORDER_STATUSES.includes(o.status as OrderStatus) ? o.status : "Pending";
      c[s] += 1;
    }
    return c;
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        })
        .slice(0, 5),
    [orders]
  );

  const kpiCards = useMemo(
    () => [
      {
        key: "admin.stat.products" as const,
        value: stats?.totalProducts ?? products.length,
        suffix: "",
        icon: Boxes,
        accent: "border-purple-500/30 bg-purple-500/8 hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.22)]",
        iconCls: "bg-purple-500/15 border-purple-400/25 text-purple-300",
      },
      {
        key: "admin.stat.orders" as const,
        value: stats?.totalOrders ?? 0,
        suffix: "",
        icon: ShoppingCart,
        accent: "border-fuchsia-500/30 bg-fuchsia-500/8 hover:border-fuchsia-400/50 hover:shadow-[0_0_40px_rgba(217,70,239,0.22)]",
        iconCls: "bg-fuchsia-500/15 border-fuchsia-400/25 text-fuchsia-300",
      },
      {
        key: "admin.stat.revenue" as const,
        value: stats?.totalRevenue ?? 0,
        suffix: " EGP",
        icon: Coins,
        accent: "border-violet-500/30 bg-violet-500/8 hover:border-violet-400/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.22)]",
        iconCls: "bg-violet-500/15 border-violet-400/25 text-violet-300",
      },
      {
        key: "admin.stat.activeListings" as const,
        value: products.length,
        suffix: "",
        icon: PackageCheck,
        accent: "border-white/10 bg-white/[0.03] hover:border-purple-400/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.14)]",
        iconCls: "bg-white/5 border-white/10 text-zinc-400",
      },
    ],
    [products.length, stats]
  );

  /* ────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ══════════════════════════════════════════════
          SECTION 1 — EXECUTIVE HEADER
      ══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 px-6 py-5 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: title + date + status */}
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/15 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {translate("admin.store.snapshot")}
                </h1>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {translate("admin.stat.liveData")}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{todayLabel}</p>
            </div>
          </div>

          {/* Right: compact metrics */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: translate("admin.stat.revenue"), value: loading ? "—" : `${stats?.totalRevenue ?? 0} EGP` },
              { label: translate("admin.stat.products"), value: loading ? "—" : String(stats?.totalProducts ?? products.length) },
              { label: translate("admin.stat.orders"), value: loading ? "—" : String(stats?.totalOrders ?? 0) },
            ].map((m) => (
              <div key={m.label} className="rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{m.label}</p>
                <p className="mt-0.5 text-lg font-black text-white">{m.value}</p>
              </div>
            ))}
          </div>

        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — KPI GRID
      ══════════════════════════════════════════════ */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.06 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 ${card.accent}`}
            >
              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.025] to-transparent" />

              <div className="relative flex items-start justify-between gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl border transition-all duration-300 ${card.iconCls}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {/* Trend arrow (decorative — no historical data) */}
                <div className="flex items-center gap-1 rounded-full border border-purple-500/15 bg-purple-500/[0.06] px-2 py-1 text-[10px] font-bold text-purple-400/70">
                  ↑
                </div>
              </div>

              <div className="relative mt-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  {translate(card.key)}
                </p>
                <div className="mt-2 text-4xl font-black tracking-tight text-white">
                  {loading ? (
                    <LoaderCircle className="h-8 w-8 animate-spin text-zinc-700" />
                  ) : (
                    <AnimatedNumber value={card.value} suffix={card.suffix} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — SALES ANALYTICS
      ══════════════════════════════════════════════ */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">

        {/* Left: Order status chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {translate("admin.orders.badge")}
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {translate("admin.nav.orders")}
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-purple-500/25 hover:text-purple-300"
            >
              {translate("admin.overview.manage")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Status bars */}
          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <ShoppingCart className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-600">{translate("admin.orders.noOrders")}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {ORDER_STATUSES.map((status) => {
                const count = statusCounts[status] ?? 0;
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                const labelKey = `admin.orders.status.${status}` as
                  | "admin.orders.status.Pending"
                  | "admin.orders.status.Processing"
                  | "admin.orders.status.Completed"
                  | "admin.orders.status.Cancelled";

                return (
                  <div key={status} className="group">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-300">{translate(labelKey)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500">{count}</span>
                        <span className="w-8 text-right text-xs font-bold text-zinc-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className={`h-full rounded-full ${statusBarCls(status)}`}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-400">{translate("admin.orders.stat.total")}</span>
                  <span className="text-2xl font-black text-white">
                    <AnimatedNumber value={orders.length} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* Right: Store health */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.38 }}
          className="flex flex-col gap-3 rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 p-6"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              {translate("admin.store.snapshot")}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Store Health</h2>
          </div>

          <div className="flex-1 space-y-2">
            {[
              {
                label: translate("admin.stat.activeListings"),
                value: loading ? "—" : String(products.length),
                icon: PackageCheck,
              },
              {
                label: translate("admin.store.bestSeller"),
                value: loading ? "—" : (stats?.bestSellingProduct?.name ?? translate("admin.store.noSales")),
                icon: Star,
                truncate: true,
              },
              {
                label: translate("admin.store.revenue"),
                value: loading ? "—" : `${stats?.totalRevenue ?? 0} EGP`,
                icon: Coins,
              },
              {
                label: "Avg Order",
                value: loading ? "—" : (avgOrderValue ? `${avgOrderValue} EGP` : "—"),
                icon: Package,
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] px-4 py-3.5"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <Icon className="h-3.5 w-3.5 text-purple-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{row.label}</p>
                    <p className={`mt-0.5 text-sm font-black text-white ${row.truncate ? "truncate" : ""}`}>
                      {row.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {error ? (
            <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          ) : null}
        </motion.section>

      </div>

      {/* ══════════════════════════════════════════════
          SECTION 4 — RECENT ACTIVITY
      ══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.44 }}
        className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Timeline</p>
            <h2 className="mt-1 text-xl font-black text-white">Recent Activity</h2>
          </div>
          {orders.length > 5 ? (
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 transition-colors hover:text-purple-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                  {i < 3 ? <div className="h-10 w-px bg-white/[0.06]" /> : null}
                </div>
                <div className="flex-1 pb-3">
                  <div className="h-14 animate-pulse rounded-[1.25rem] bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Clock3 className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-600">{translate("admin.orders.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {recentOrders.map((order, i) => {
              const isLast = i === recentOrders.length - 1;
              const StatusIcon = statusIcon(order.status);
              const safeParsed = parsePrice(order.price);

              return (
                <div key={order.id} className="flex gap-4">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center gap-0">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${statusBadgeCls(order.status)}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                    </div>
                    {!isLast ? (
                      <div className="my-1 h-6 w-px shrink-0 bg-white/[0.06]" />
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${!isLast ? "pb-3" : ""}`}>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                      className="flex flex-col gap-1 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition-all hover:border-purple-400/20 hover:bg-purple-500/[0.04]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">#{order.id}</span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-sm font-semibold text-zinc-300">{order.customer_name}</span>
                        </div>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeCls(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-500">{order.product_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-purple-300">{safeParsed} EGP</span>
                          <span className="text-xs text-zinc-600">{formatTs(order.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — QUICK ACTIONS
      ══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.5 }}
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-zinc-600">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/admin/products",
              icon: Boxes,
              label: translate("admin.nav.products"),
              sub: translate("admin.overview.manage"),
              glow: "hover:shadow-[0_0_35px_rgba(168,85,247,0.18)] hover:border-purple-400/40",
            },
            {
              href: "/admin/orders",
              icon: ShoppingCart,
              label: translate("admin.nav.orders"),
              sub: translate("admin.overview.manage"),
              glow: "hover:shadow-[0_0_35px_rgba(217,70,239,0.15)] hover:border-fuchsia-400/35",
            },
            {
              href: "/admin/users",
              icon: Users,
              label: translate("admin.nav.users"),
              sub: translate("admin.overview.manage"),
              glow: "hover:shadow-[0_0_35px_rgba(139,92,246,0.15)] hover:border-violet-400/35",
            },
            {
              href: "/",
              icon: ExternalLink,
              label: translate("admin.nav.home"),
              sub: "View",
              glow: "hover:shadow-[0_0_35px_rgba(168,85,247,0.1)] hover:border-white/20",
            },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.54 + i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={action.href}
                  className={`group flex h-full flex-col gap-4 rounded-[1.75rem] border border-white/[0.08] bg-zinc-950/80 p-5 transition-all duration-300 ${action.glow}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300 transition-all duration-300 group-hover:bg-purple-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-700 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{action.sub}</p>
                    <p className="mt-1 text-base font-black text-white">{action.label}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════
          SECTION 6 — TOP PRODUCTS
      ══════════════════════════════════════════════ */}
      {products.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.56 }}
          className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {translate("admin.recent.inventory")}
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {translate("admin.products.list.title")}
              </h2>
            </div>
            <Link
              href="/admin/products"
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-purple-500/25 hover:text-purple-300"
            >
              {translate("admin.overview.manage")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[1.5rem] bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {products.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.04 }}
                  whileHover={{ y: -3 }}
                  className="group overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] transition-all duration-300 hover:border-purple-400/25 hover:bg-purple-500/[0.05]"
                >
                  {/* Image */}
                  {product.image ? (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-purple-600/10 to-fuchsia-600/5">
                      <Boxes className="h-8 w-8 text-purple-500/30" />
                    </div>
                  )}

                  <div className="p-4">
                    <p className="truncate font-black text-white">{product.name}</p>
                    {product.category ? (
                      <p className="mt-0.5 text-xs text-zinc-600">{product.category}</p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-200">
                        {product.price} EGP
                      </span>
                      {product.badge ? (
                        <span className="text-xs font-semibold text-zinc-500">{product.badge}</span>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      ) : null}

    </div>
  );
}

export default function AdminPage() {
  return <AdminOnlyGuard><AdminPageInner /></AdminOnlyGuard>;
}
