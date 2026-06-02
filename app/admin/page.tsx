"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Coins,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AnimatedNumber from "./animated-number";

interface ProductRecord {
  id: number;
  name: string;
  price: number;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  bestSellingProduct: {
    id: number | null;
    name: string;
    sales: number;
  } | null;
}

interface StatsApiResponse {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

interface ProductsApiResponse extends Array<ProductRecord> {}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45 },
  }),
};

export default function AdminPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [productsRes, statsRes] = await Promise.all([
        fetch("/api/get-products"),
        fetch("/api/admin/dashboard-stats"),
      ]);

      const productsData = (await productsRes.json()) as ProductsApiResponse;
      const statsData = (await statsRes.json()) as StatsApiResponse;

      setProducts(productsData);
      setStats(statsData.success && statsData.data ? statsData.data : null);

      if (!statsData.success && statsData.error) {
        setError(statsData.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      setProducts([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  const quickMetrics = useMemo(
    () => [
      {
        label: "Products",
        value: stats?.totalProducts ?? products.length,
        suffix: "",
        icon: Boxes,
        accent: "from-purple-500/30 via-purple-500/15 to-white/5",
      },
      {
        label: "Orders",
        value: stats?.totalOrders ?? 0,
        suffix: "",
        icon: ShoppingCart,
        accent: "from-fuchsia-500/25 via-purple-500/15 to-white/5",
      },
      {
        label: "Revenue",
        value: stats?.totalRevenue ?? 0,
        suffix: " EGP",
        icon: Coins,
        accent: "from-violet-500/25 via-purple-500/15 to-white/5",
      },
      {
        label: "Active Listings",
        value: products.length,
        suffix: "",
        icon: PackageCheck,
        accent: "from-emerald-500/20 via-purple-500/15 to-white/5",
      },
    ],
    [products.length, stats?.totalOrders, stats?.totalProducts, stats?.totalRevenue]
  );

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
              <Sparkles className="h-4 w-4" />
              Premium Admin Overview
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              MJ Store Admin Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              High-clarity dashboard for products, orders, and revenue with neon gaming polish,
              strong spacing, and smooth motion hierarchy.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <Link
              href="/admin/products"
              className="group flex items-center justify-between rounded-2xl border border-purple-400/20 bg-white/5 px-4 py-4 transition-all duration-300 hover:border-purple-400/40 hover:bg-purple-500/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]"
            >
              <span>
                <span className="block text-sm uppercase tracking-[0.24em] text-zinc-500">
                  Manage
                </span>
                <span className="mt-1 block text-lg font-bold">Products</span>
              </span>
              <ArrowRight className="h-5 w-5 text-purple-300 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/orders"
              className="group flex items-center justify-between rounded-2xl border border-purple-400/20 bg-white/5 px-4 py-4 transition-all duration-300 hover:border-purple-400/40 hover:bg-purple-500/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]"
            >
              <span>
                <span className="block text-sm uppercase tracking-[0.24em] text-zinc-500">
                  Manage
                </span>
                <span className="mt-1 block text-lg font-bold">Orders</span>
              </span>
              <ArrowRight className="h-5 w-5 text-purple-300 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickMetrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <motion.article
              key={metric.label}
              custom={index * 0.08}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-purple-400/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.18)]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.accent} opacity-70`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.26em] text-zinc-500">
                    {metric.label}
                  </p>
                  <div className="mt-3 text-4xl font-black tracking-tight text-white">
                    {loading ? (
                      <LoaderCircle className="h-8 w-8 animate-spin text-purple-300" />
                    ) : (
                      <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                    )}
                  </div>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-purple-200 transition-all duration-300 group-hover:border-purple-400/30 group-hover:bg-purple-500/15">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Store Snapshot</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                A quick view of live inventory and business performance.
              </p>
            </div>

            <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
              Live data
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Best Seller</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight">
                {stats?.bestSellingProduct?.name || "No sales yet"}
              </h3>
              <p className="mt-2 text-zinc-400">
                {stats?.bestSellingProduct
                  ? `${stats.bestSellingProduct.sales} orders`
                  : "Orders will appear here once customers start buying."}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Revenue</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight">
                {loading ? (
                  <LoaderCircle className="h-7 w-7 animate-spin text-purple-300" />
                ) : (
                  <AnimatedNumber value={stats?.totalRevenue ?? 0} suffix=" EGP" />
                )}
              </h3>
              <p className="mt-2 text-zinc-400">Total income across all completed orders.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-purple-500/15 bg-gradient-to-br from-purple-500/10 via-white/5 to-transparent p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/15 text-purple-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Dashboard hierarchy tuned for fast scanning</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Big numbers, focused card grouping, and clean contrast for a premium admin feel.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <h2 className="text-2xl font-black tracking-tight">Recent Inventory</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Clean overview of the current catalog with sharper spacing and more readable grouping.
          </p>

          <div className="mt-6 space-y-3">
            {products.length === 0 && loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-zinc-400">
                No products available yet.
              </div>
            ) : (
              products.slice(0, 5).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-purple-400/25 hover:bg-purple-500/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{product.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">Product ID #{product.id}</p>
                  </div>

                  <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
                    {product.price} EGP
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
