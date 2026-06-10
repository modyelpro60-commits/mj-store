"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Eye,
  LoaderCircle,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import { AdminOnlyGuard } from "../admin-guard";

/* ─── Types ──────────────────────────────────────────────── */

interface ProductStat {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  is_active: boolean;
  views: number;
  add_to_cart: number;
  checkout_start: number;
  purchases: number;
  conversion_rate: number;
}

interface Funnel {
  views: number;
  add_to_cart: number;
  checkout_start: number;
  purchases: number;
}

interface Insights {
  topViewed: ProductStat[];
  topSelling: ProductStat[];
  bestConversion: ProductStat[];
  worstConversion: ProductStat[];
}

interface AnalyticsData {
  products: ProductStat[];
  funnel: Funnel;
  insights: Insights;
  period: string;
}

type Period = "7d" | "30d" | "all";
type SortKey = "views" | "add_to_cart" | "checkout_start" | "purchases" | "conversion_rate";

/* ─── Helpers ────────────────────────────────────────────── */

function pct(part: number, total: number): string {
  if (!total) return "—";
  return (part / total * 100).toFixed(1) + "%";
}

function stepPct(current: number, prev: number): string {
  if (!prev) return "—";
  return (current / prev * 100).toFixed(1) + "%";
}

function cvrColor(rate: number): string {
  if (rate >= 10) return "text-emerald-400";
  if (rate >= 3)  return "text-amber-400";
  return "text-red-400";
}

function cvrBg(rate: number): string {
  if (rate >= 10) return "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400";
  if (rate >= 3)  return "border-amber-500/20  bg-amber-500/[0.07]  text-amber-400";
  return                  "border-red-500/20    bg-red-500/[0.07]    text-red-400";
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatChip({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{label}</span>
      <span className="text-2xl font-black text-white tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-white/30">{sub}</span>}
    </div>
  );
}

/* ─── Funnel Stage ───────────────────────────────────────── */

function FunnelStage({
  icon: Icon,
  label,
  count,
  totalViews,
  fromPrev,
  color,
  isFirst,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  totalViews: number;
  fromPrev?: number;
  color: string;
  isFirst?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {!isFirst && (
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 px-1">
          <ArrowRight className="h-4 w-4 text-white/15" />
          {fromPrev !== undefined && (
            <span className="text-[9px] font-black text-white/20 whitespace-nowrap">{fromPrev !== undefined ? stepPct(count, fromPrev) : ""}</span>
          )}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 min-w-0"
      >
        <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl border ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</p>
        <p className="text-3xl font-black text-white tabular-nums">{count.toLocaleString()}</p>
        <p className="mt-1 text-xs font-semibold text-white/30">
          {pct(count, totalViews)} of views
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Insight Card ───────────────────────────────────────── */

function InsightCard({
  title,
  icon: Icon,
  color,
  items,
  valueKey,
  valueSuffix = "",
  emptyText,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  items: ProductStat[];
  valueKey: keyof ProductStat;
  valueSuffix?: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`grid h-8 w-8 place-items-center rounded-xl border ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-black text-white/70">{title}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-white/20 py-2">{emptyText}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2.5">
              <span className="text-[10px] font-black text-white/20 w-4 shrink-0">{i + 1}.</span>
              {p.image && (
                <img src={p.image} alt="" className="h-7 w-7 rounded-lg object-contain bg-white/[0.04] border border-white/[0.05] shrink-0" />
              )}
              <span className="flex-1 min-w-0 text-xs font-semibold text-white/55 truncate">{p.name}</span>
              <span className={`text-sm font-black tabular-nums shrink-0 ${valueKey === "conversion_rate" ? cvrColor(p[valueKey] as number) : "text-white/80"}`}>
                {String(p[valueKey])}{valueSuffix}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

function AnalyticsPageInner() {
  const { accessToken } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async (p: Period) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json() as { success: boolean } & AnalyticsData;
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(period); }, [period, load]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sortedProducts = data
    ? [...data.products].sort((a, b) => {
        const diff = (a[sortKey] as number) - (b[sortKey] as number);
        return sortAsc ? diff : -diff;
      })
    : [];

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(k)}
      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
        sortKey === k ? "text-purple-300" : "text-white/25 hover:text-white/50"
      }`}
    >
      {label}
      {sortKey === k && <span className="text-[8px]">{sortAsc ? "▲" : "▼"}</span>}
    </button>
  );

  /* ── Period tabs ── */
  const PERIODS: { key: Period; label: string }[] = [
    { key: "7d",  label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Product Analytics</h1>
          <p className="text-sm text-white/30 mt-0.5">Conversion funnel, top performers & weak spots</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-black transition-all duration-200 ${
                period === key
                  ? "bg-purple-500/20 border border-purple-500/30 text-purple-200"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
            <p className="text-sm text-white/30">Loading analytics…</p>
          </div>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-white/20">Failed to load analytics data.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >

            {/* ══════════════════════════════════════════
                CONVERSION FUNNEL
            ══════════════════════════════════════════ */}
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="grid h-8 w-8 place-items-center rounded-xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Conversion Funnel</p>
                  <p className="text-[10px] text-white/25">End-to-end purchase journey</p>
                </div>

                {/* Overall CVR badge */}
                <div className="ml-auto">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${cvrBg(data.funnel.views > 0 ? data.funnel.purchases / data.funnel.views * 100 : 0)}`}>
                    {data.funnel.views > 0
                      ? `${(data.funnel.purchases / data.funnel.views * 100).toFixed(1)}% overall CVR`
                      : "No data yet"}
                  </span>
                </div>
              </div>

              <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                <FunnelStage
                  icon={Eye}
                  label="Views"
                  count={data.funnel.views}
                  totalViews={data.funnel.views}
                  color="border-blue-500/25 bg-blue-500/10 text-blue-300"
                  isFirst
                />
                <FunnelStage
                  icon={ShoppingCart}
                  label="Add to Cart"
                  count={data.funnel.add_to_cart}
                  totalViews={data.funnel.views}
                  fromPrev={data.funnel.views}
                  color="border-purple-500/25 bg-purple-500/10 text-purple-300"
                />
                <FunnelStage
                  icon={Zap}
                  label="Checkout"
                  count={data.funnel.checkout_start}
                  totalViews={data.funnel.views}
                  fromPrev={data.funnel.add_to_cart}
                  color="border-amber-500/25 bg-amber-500/10 text-amber-300"
                />
                <FunnelStage
                  icon={ShoppingBag}
                  label="Purchase"
                  count={data.funnel.purchases}
                  totalViews={data.funnel.views}
                  fromPrev={data.funnel.checkout_start}
                  color="border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                />
              </div>
            </section>

            {/* ══════════════════════════════════════════
                INSIGHT CARDS
            ══════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <InsightCard
                title="Top Viewed"
                icon={Trophy}
                color="border-blue-500/25 bg-blue-500/10 text-blue-300"
                items={data.insights.topViewed}
                valueKey="views"
                emptyText="No views tracked yet."
              />
              <InsightCard
                title="Top Selling"
                icon={ShoppingBag}
                color="border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                items={data.insights.topSelling}
                valueKey="purchases"
                emptyText="No purchases tracked yet."
              />
              <InsightCard
                title="Best Conversion"
                icon={TrendingUp}
                color="border-purple-500/25 bg-purple-500/10 text-purple-300"
                items={data.insights.bestConversion}
                valueKey="conversion_rate"
                valueSuffix="%"
                emptyText="Need ≥5 views per product."
              />
              <InsightCard
                title="Needs Attention"
                icon={TrendingDown}
                color="border-red-500/25 bg-red-500/10 text-red-300"
                items={data.insights.worstConversion}
                valueKey="conversion_rate"
                valueSuffix="%"
                emptyText="Need ≥5 views per product."
              />
            </div>

            {/* ══════════════════════════════════════════
                PRODUCTS TABLE
            ══════════════════════════════════════════ */}
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

              {/* Table header */}
              <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/30">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">All Products</p>
                    <p className="text-[10px] text-white/25">{data.products.length} products · click column to sort</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/20">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5 text-emerald-400 font-black">≥10%</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20  bg-amber-500/[0.07]  px-2 py-0.5 text-amber-400  font-black">3–9%</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20    bg-red-500/[0.07]    px-2 py-0.5 text-red-400    font-black">&lt;3%</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Product</span>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <SortBtn k="views"           label="Views"    />
                      </th>
                      <th className="px-4 py-3 text-right">
                        <SortBtn k="add_to_cart"     label="Cart"     />
                      </th>
                      <th className="px-4 py-3 text-right">
                        <SortBtn k="checkout_start"  label="Checkout" />
                      </th>
                      <th className="px-4 py-3 text-right">
                        <SortBtn k="purchases"       label="Bought"   />
                      </th>
                      <th className="px-4 py-3 text-right">
                        <SortBtn k="conversion_rate" label="CVR"      />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {sortedProducts.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.2 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Product name + image */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {p.image ? (
                              <img src={p.image} alt="" className="h-9 w-9 rounded-xl object-contain bg-white/[0.03] border border-white/[0.05] shrink-0" />
                            ) : (
                              <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.05] shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white/80 truncate max-w-[180px]">{p.name}</p>
                              {p.category && (
                                <p className="text-[10px] text-white/25 truncate">{p.category}</p>
                              )}
                            </div>
                            {!p.is_active && (
                              <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-black text-white/20">
                                inactive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Views */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-black text-blue-300 tabular-nums">{p.views.toLocaleString()}</span>
                        </td>

                        {/* Cart */}
                        <td className="px-4 py-3.5 text-right">
                          <div>
                            <span className="text-sm font-black text-purple-300 tabular-nums">{p.add_to_cart.toLocaleString()}</span>
                            <p className="text-[9px] text-white/20">{pct(p.add_to_cart, p.views)}</p>
                          </div>
                        </td>

                        {/* Checkout */}
                        <td className="px-4 py-3.5 text-right">
                          <div>
                            <span className="text-sm font-black text-amber-300 tabular-nums">{p.checkout_start.toLocaleString()}</span>
                            <p className="text-[9px] text-white/20">{pct(p.checkout_start, p.views)}</p>
                          </div>
                        </td>

                        {/* Purchases */}
                        <td className="px-4 py-3.5 text-right">
                          <div>
                            <span className="text-sm font-black text-emerald-300 tabular-nums">{p.purchases.toLocaleString()}</span>
                            <p className="text-[9px] text-white/20">{pct(p.purchases, p.views)}</p>
                          </div>
                        </td>

                        {/* CVR */}
                        <td className="px-4 py-3.5 text-right">
                          <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-black tabular-nums ${cvrBg(p.conversion_rate)}`}>
                            {p.views > 0 ? `${p.conversion_rate}%` : "—"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}

                    {sortedProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-sm text-white/20">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Empty state notice */}
              {data.funnel.views === 0 && (
                <div className="border-t border-white/[0.04] px-5 py-4 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-white/30">
                    No analytics data yet. Views, cart adds, and purchases will appear here as customers browse your store.
                  </p>
                </div>
              )}
            </section>

            {/* ══════════════════════════════════════════
                PRODUCT STUDIO — quick stats per product
            ══════════════════════════════════════════ */}
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="grid h-8 w-8 place-items-center rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Product Studio</p>
                  <p className="text-[10px] text-white/25">Individual performance snapshot</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.products.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-purple-500/20 hover:bg-purple-500/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-10 w-10 rounded-xl object-contain bg-white/[0.03] border border-white/[0.05] shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.05] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-white/70 truncate">{p.name}</p>
                        {p.category && <p className="text-[10px] text-white/25">{p.category}</p>}
                      </div>
                      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-black tabular-nums ${cvrBg(p.conversion_rate)}`}>
                        {p.views > 0 ? `${p.conversion_rate}%` : "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-blue-500/[0.12] bg-blue-500/[0.05] px-2.5 py-2 text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-blue-400/60 mb-0.5">Views</p>
                        <p className="text-base font-black text-blue-300 tabular-nums">{p.views.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/[0.12] bg-emerald-500/[0.05] px-2.5 py-2 text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400/60 mb-0.5">Sales</p>
                        <p className="text-base font-black text-emerald-300 tabular-nums">{p.purchases.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-purple-500/[0.12] bg-purple-500/[0.05] px-2.5 py-2 text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-purple-400/60 mb-0.5">Cart</p>
                        <p className="text-base font-black text-purple-300 tabular-nums">{p.add_to_cart.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return <AdminOnlyGuard><AnalyticsPageInner /></AdminOnlyGuard>;
}
