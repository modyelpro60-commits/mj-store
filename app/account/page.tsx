"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LoaderCircle,
  Store,
  Sparkles,
  UserRound,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShoppingBag,
  DollarSign,
  LayoutDashboard,
  Package2,
  ClipboardList,
  ArrowLeft,
  Gem,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useMyOrders } from "../../components/members/useMyOrders";

function formatRoleLabel(role: string | null) {
  const r = (role ?? "").toLowerCase().trim();
  if (r === "admin") return "Admin";
  if (r === "manager") return "Manager";
  if (r === "support") return "Support";
  if (r === "customer" || r === "member") return "Customer";
  return "Customer";
}

function roleBadgeStyle(roleLabel: string) {
  switch (roleLabel) {
    case "Admin":
      return "border-purple-500/20 bg-purple-500/10 text-purple-200";
    case "Manager":
      return "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200";
    case "Support":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    default:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + second).toUpperCase();
}

function parseMoney(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatEGP(amount: number) {
  // Runtime already has i18n; keep simple and safe.
  return `${amount} EGP`;
}

type TabKey = "overview" | "orders" | "settings";

export default function MembersDashboardPage() {
  const router = useRouter();
  const { profile, accessToken, role, isLoading } = useAuth();

  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "orders" || t === "settings" || t === "overview") setTab(t);
    else setTab("overview");
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isLoading, router]);

  // UI-only: fetch more so we can compute Total Spent from completed orders in the payload.
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useMyOrders(50);

  const roleLabel = useMemo(() => formatRoleLabel(role), [role]);
  const isAdmin = roleLabel === "Admin";

  const fullName = profile?.full_name || profile?.email || "Unknown";
  const email = profile?.email || "Unknown";
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
  };

  const recentOrdersToShow = useMemo(() => {
    return ordersData?.recentOrders?.slice(0, 5) ?? [];
  }, [ordersData]);

  const totalSpent = useMemo(() => {
    const items = ordersData?.recentOrders ?? [];
    const completed = items.filter((o) => o.status === "Completed");
    const sum = completed.reduce((acc, o) => acc + parseMoney(o.price), 0);
    return sum;
  }, [ordersData]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-6 w-6 animate-spin text-purple-300" />
              <p className="font-semibold">Loading your dashboard…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!accessToken) return null;

  const StatCard = ({
    icon,
    label,
    value,
    accentClass,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    accentClass: string;
  }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative flex min-h-[120px] flex-col justify-between rounded-[1.5rem] border bg-white/5 p-4 ${accentClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
          {icon}
        </div>
        <div className="text-xs font-semibold text-zinc-400">{label}</div>
      </div>

      <div className="mt-2 flex items-end justify-between">
        <div className="text-3xl font-black text-white">{value}</div>
        <div className="text-sm font-semibold text-purple-200 group-hover:opacity-90">
          View
        </div>
      </div>
    </motion.div>
  );

  const ProfileCard = () => (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.03 }}
      className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] h-full"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
        >
          <UserRound className="h-7 w-7 text-purple-200" />
        </div>

        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.26em] text-zinc-400">Profile</div>
          <div className="mt-2 truncate text-2xl font-black text-white">{fullName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-4 py-2 text-xs font-bold ${roleBadgeStyle(roleLabel)}`}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-purple-200" />
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Email</div>
          </div>
          <div className="mt-2 break-words text-sm font-semibold text-white">{email}</div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-200" />
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Join date</div>
          </div>
          <div className="mt-2 text-sm font-semibold text-white">
            {createdAt
              ? createdAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })
              : "—"}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Avatar</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                <span className="text-sm font-black text-white">{getInitials(fullName)}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{fullName}</div>
                <div className="text-xs text-zinc-400">Member since</div>
              </div>
            </div>

            <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
              Active
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const QuickActions = () => {
    if (!isAdmin) return null;

    const CardButton = ({
      href,
      icon,
      title,
      desc,
    }: {
      href: string;
      icon: React.ReactNode;
      title: string;
      desc: string;
    }) => (
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      >
        <Link href={href} className="block h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                  {icon}
                </div>
                <div className="text-sm font-black text-white">{title}</div>
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">{desc}</div>
            </div>

            <div className="text-xs font-semibold text-purple-200 group-hover:opacity-90">
              Open →
            </div>
          </div>
        </Link>
      </motion.div>
    );

    return (
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.04 }}
        className="mt-5 rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.26em] text-zinc-400">Admin quick actions</div>
            <div className="mt-2 text-2xl font-black tracking-tight">Admin control</div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-white/5 px-4 py-2 text-xs font-semibold text-purple-200">
            <LayoutDashboard className="h-4 w-4" />
            Premium mode
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <CardButton
            href="/admin"
            icon={<Package2 className="h-5 w-5 text-purple-200" />}
            title="Admin Panel"
            desc="Overview & system stats"
          />
          <CardButton
            href="/admin/products"
            icon={<ShoppingBag className="h-5 w-5 text-purple-200" />}
            title="Manage Products"
            desc="Create, update, and remove"
          />
          <CardButton
            href="/admin/orders"
            icon={<ClipboardList className="h-5 w-5 text-purple-200" />}
            title="Manage Orders"
            desc="Update statuses in seconds"
          />
        </div>
      </motion.section>
    );
  };

  const overviewContent = (
    <>
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
              <Store className="h-4 w-4" />
              Members Dashboard
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome back, <span className="text-purple-200">{fullName}</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Manage your profile, track activity, and review your latest purchases.
            </p>
          </div>
        </div>
      </motion.section>

      <QuickActions />

      {/* Top grid: Profile + Stats */}
      <div className="mt-5 grid gap-6 md:grid-cols-3 md:items-stretch">
        <div className="md:col-span-1">
          <ProfileCard />
        </div>

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
          className="md:col-span-2 rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] h-full"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-zinc-400">Account Activity</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Premium stats</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                A quick snapshot of your orders.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ordersLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[120px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                />
              ))
            ) : ordersError ? (
              <div className="sm:col-span-2 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                {ordersError}
              </div>
            ) : (
              <>
                <StatCard
                  icon={<Sparkles className="h-5 w-5 text-purple-200" />}
                  label="Total Orders"
                  value={ordersData?.totalOrders ?? 0}
                  accentClass=""
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-200" />}
                  label="Completed Orders"
                  value={ordersData?.completedOrders ?? 0}
                  accentClass="border-emerald-500/25 bg-emerald-500/10"
                />
                <StatCard
                  icon={<Clock3 className="h-5 w-5 text-purple-200" />}
                  label="Pending Orders"
                  value={ordersData?.pendingOrders ?? 0}
                  accentClass="border-purple-500/25 bg-purple-500/10"
                />
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group relative flex min-h-[120px] flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                      <DollarSign className="h-5 w-5 text-purple-200" />
                    </div>
                    <div className="text-xs font-semibold text-zinc-400">Total Spent</div>
                  </div>

                  <div className="mt-2 flex items-end justify-between">
                    <div className="text-3xl font-black text-white">{totalSpent}</div>
                    <div className="text-sm font-semibold text-purple-200 group-hover:opacity-90">
                      EGP
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </motion.section>
      </div>

      {/* Recent Orders (premium table) */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
        className="mt-5 rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Recent Orders</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Your latest purchases, with status and pricing.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-white/5 px-4 py-2 text-xs font-semibold text-purple-200">
            <Sparkles className="h-4 w-4" />
            Showing latest 5
          </div>
        </div>

        {ordersLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[62px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : ordersData?.recentOrders?.length ? (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1.8fr_1fr_1fr_0.9fr]">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                Product
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                Status
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                Purchase Date
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 text-right">
                Price
              </div>
            </div>

            {recentOrdersToShow.map((o, idx) => (
              <motion.div
                key={`${o.productName}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.015 }}
                whileHover={{ y: -2 }}
                className="grid grid-cols-1 items-center gap-0 border-t border-white/10 sm:grid-cols-[1.8fr_1fr_1fr_0.9fr]"
              >
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                      <span className="text-sm font-black text-white">
                        {getInitials(o.productName)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-white">{o.productName}</div>
                      <div className="mt-1 text-xs text-zinc-400">Order #{idx + 1}</div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4">
                  <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200">
                    {o.status}
                  </div>
                </div>

                <div className="px-4 py-4">
                  <div className="text-sm text-zinc-400">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>

                <div className="px-4 py-4 text-right">
                  <div className="text-sm font-black text-white">
                    {formatEGP(parseMoney(o.price))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-zinc-400">
            No orders yet.
          </div>
        )}
      </motion.section>
    </>
  );

  const placeholderOrders = (
    <div className="mt-6 rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <h2 className="text-2xl font-black tracking-tight">Orders</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Placeholder — implement later.</p>
    </div>
  );

  const placeholderSettings = (
    <div className="mt-6 rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <h2 className="text-2xl font-black tracking-tight">Settings</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Placeholder — implement later.</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 overflow-hidden">
      <div className="mx-auto max-w-5xl">
        {/* Premium dashboard header */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full rounded-[22px] border border-purple-500/20 bg-white/5 px-4 py-3 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <motion.button
                type="button"
                onClick={() => router.push("/")}
                whileHover={{ boxShadow: "0 0 0 1px rgba(168,85,247,0.28), 0 0 30px rgba(168,85,247,0.18)" }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group flex items-center gap-3 rounded-[18px] border border-transparent bg-white/5 px-4 py-3 text-[16px] font-semibold text-zinc-200 transition-colors hover:bg-white/10 focus:outline-none sm:px-5"
              >
                {/* Arrow */}
                <motion.span
                  aria-hidden
                  whileHover={{ x: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20 transition-colors group-hover:border-purple-500/30"
                >
                  <ArrowLeft className="h-4 w-4 text-purple-200" />
                </motion.span>

                <span className="leading-none">
                  ← Back to Store
                </span>
              </motion.button>

              <div className="flex items-center gap-2 rounded-[18px] border border-purple-500/25 bg-purple-500/10 px-4 py-3 text-[15px] font-semibold text-purple-200">
                <UserRound className="h-4 w-4" />
                My Account
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Dashboard</h1>

              <p className="mt-3 text-zinc-400">
                Profile, activity, and recent purchases in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("overview")}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  tab === "overview"
                    ? "border-purple-400/40 bg-purple-500/15 text-white shadow-[0_0_20px_rgba(168,85,247,0.22)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-purple-500/25 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setTab("orders")}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  tab === "orders"
                    ? "border-purple-400/40 bg-purple-500/15 text-white shadow-[0_0_20px_rgba(168,85,247,0.22)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-purple-500/25 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                Orders
              </button>

              <button
                type="button"
                onClick={() => setTab("settings")}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  tab === "settings"
                    ? "border-purple-400/40 bg-purple-500/15 text-white shadow-[0_0_20px_rgba(168,85,247,0.22)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-purple-500/25 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {tab === "overview" ? overviewContent : null}
        {tab === "orders" ? placeholderOrders : null}
        {tab === "settings" ? placeholderSettings : null}
      </div>
    </main>
  );
}
