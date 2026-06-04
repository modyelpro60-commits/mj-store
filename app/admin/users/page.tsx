"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Check,
  LoaderCircle,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";

const ROLE_OPTIONS = ["user", "helper", "moderator", "admin"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

const STATUS_OPTIONS = ["Active", "Suspended", "Banned"] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type RoleFilter = RoleOption | "All";
type StatusFilter = StatusOption | "All";

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: StatusOption;
  created_at: string | null;
  orders_count: number;
};

type UsersApiResponse = {
  success: boolean;
  data?: AdminUserRow[];
  error?: string;
};

type ActionApiResponse = {
  success: boolean;
  error?: string;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45 },
  }),
};

function roleLabel(role: RoleOption): string {
  if (role === "user") return "User";
  if (role === "helper") return "Helper";
  if (role === "moderator") return "Moderator";
  return "Admin";
}

function roleBadgeClass(role: RoleOption): string {
  if (role === "user") return "bg-zinc-600/20 border-zinc-500/30 text-zinc-200";
  if (role === "helper") return "bg-blue-600/20 border-blue-500/30 text-blue-200";
  if (role === "moderator") return "bg-purple-600/20 border-purple-500/30 text-purple-200";
  return "bg-red-600/20 border-red-500/30 text-red-200";
}

function statusBadgeClass(status: StatusOption): string {
  if (status === "Active") return "bg-emerald-600/20 border-emerald-500/30 text-emerald-200";
  if (status === "Suspended") return "bg-yellow-500/20 border-yellow-400/30 text-yellow-200";
  return "bg-red-600/20 border-red-500/30 text-red-200";
}

export default function UsersPage() {
  const router = useRouter();
  const { accessToken, profile, role, status, isLoading } = useAuth();

  const adminId = profile?.id ?? null;
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [error, setError] = useState<string>("");

  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Suspended/Banned admins are not allowed into any admin page.
    if (status && status !== "Active") return;

    // Role-based admin-only page.
    if (role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, role, status, router]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (roleFilter !== "All") params.set("role", roleFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);

    params.set("limit", "100");
    return params.toString();
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/users?${queryString}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      const json = (await res.json()) as UsersApiResponse;

      if (!json.success || !json.data) {
        setUsers([]);
        setError(json.error || "Failed to load users");
        return;
      }

      setUsers(json.data);
    } catch (e) {
      console.error(e);
      setUsers([]);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function setRole(userId: string, nextRole: RoleOption) {
    try {
      setSavingUserId(userId);

      const res = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userId, role: nextRole }),
      });

      const json = (await res.json()) as ActionApiResponse;

      if (!json.success) {
        alert(json.error || "Role update failed");
        return;
      }

      await loadUsers();
    } catch (e) {
      console.error(e);
      alert("Role update failed");
    } finally {
      setSavingUserId(null);
    }
  }

  async function setStatus(userId: string, nextStatus: StatusOption) {
    try {
      setSavingUserId(userId);

      const res = await fetch("/api/admin/users/set-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userId, status: nextStatus }),
      });

      const json = (await res.json()) as ActionApiResponse;

      if (!json.success) {
        alert(json.error || "Status update failed");
        return;
      }

      await loadUsers();
    } catch (e) {
      console.error(e);
      alert("Status update failed");
    } finally {
      setSavingUserId(null);
    }
  }

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const active = users.filter((u) => u.status === "Active").length;
    const suspended = users.filter((u) => u.status === "Suspended").length;
    const banned = users.filter((u) => u.status === "Banned").length;

    return { totalUsers, active, suspended, banned };
  }, [users]);

  const selfId = adminId;

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
              <UserRound className="h-4 w-4" />
              Users Management
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Admin Users</h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Search, filter, and manage roles + account status. All updates are enforced server-side.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.02}
              whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total</p>
              <p className="mt-2 text-2xl font-black text-white">{loading ? "…" : totals.totalUsers}</p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.08}
              whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
              className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Active</p>
              <p className="mt-2 text-2xl font-black text-white">{loading ? "…" : totals.active}</p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.14}
              whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
              className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-yellow-200">Suspended</p>
              <p className="mt-2 text-2xl font-black text-white">{loading ? "…" : totals.suspended}</p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.2}
              whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
              className="group relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-red-200">Banned</p>
              <p className="mt-2 text-2xl font-black text-white">{loading ? "…" : totals.banned}</p>
            </motion.div>
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
        transition={{ duration: 0.45, delay: 0.06 }}
        className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-300" />
              <h2 className="text-2xl font-black tracking-tight">Search & Filters</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Search by name or email. Filter by role and status.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:w-[520px]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40"
            >
              <option value="All">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[140px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-zinc-400">
              No users found.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                  <div className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.7fr_1fr] gap-0 border-b border-white/10 px-5 py-4 text-sm font-bold text-zinc-200">
                    <div>Full Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Orders / Actions</div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {users.map((u, index) => {
                      const isSelf = selfId ? u.id === selfId : false;
                      const roleValue = (u.role ?? "user") as RoleOption;

                      return (
                        <div
                          key={u.id}
                          className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.7fr_1fr] gap-0 px-5 py-4 items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20 text-purple-200">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-white font-bold">{u.full_name ?? "—"}</p>
                                <p className="truncate text-zinc-500 text-sm">Joined: {u.created_at ? u.created_at.slice(0, 10) : "—"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-zinc-200">{u.email ?? "—"}</p>
                          </div>

                          <div>
                            <div className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${roleBadgeClass(roleValue)}`}>
                              {roleLabel(roleValue)}
                            </div>
                          </div>

                          <div>
                            <div className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${statusBadgeClass(u.status)}`}>
                              {u.status}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="text-zinc-200 font-semibold">
                              Orders: <span className="text-white">{u.orders_count}</span>
                            </div>

                            <div className="flex gap-3">
                              <div className="min-w-[170px]">
                                <label className="block text-xs uppercase tracking-[0.22em] text-zinc-500 mb-2">
                                  Role
                                </label>
                                <select
                                  disabled={savingUserId === u.id}
                                  value={roleValue}
                                  onChange={(e) => setRole(u.id, e.target.value as RoleOption)}
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40 disabled:opacity-50"
                                >
                                  {ROLE_OPTIONS.map((r) => {
                                    const disabled = isSelf && r !== "admin";
                                    return (
                                      <option key={r} value={r} disabled={disabled}>
                                        {roleLabel(r)}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="min-w-[170px]">
                                <label className="block text-xs uppercase tracking-[0.22em] text-zinc-500 mb-2">
                                  Status
                                </label>
                                <select
                                  disabled={savingUserId === u.id}
                                  value={u.status}
                                  onChange={(e) => setStatus(u.id, e.target.value as StatusOption)}
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40 disabled:opacity-50"
                                >
                                  {STATUS_OPTIONS.map((s) => {
                                    const disabled = isSelf && s !== "Active";
                                    return (
                                      <option key={s} value={s} disabled={disabled}>
                                        {s}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            </div>

                            {savingUserId === u.id ? (
                              <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
                                Updating…
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden mt-4 grid gap-4">
                {users.map((u) => {
                  const isSelf = selfId ? u.id === selfId : false;
                  const roleValue = (u.role ?? "user") as RoleOption;

                  return (
                    <div
                      key={u.id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white font-bold text-lg">{u.full_name ?? "—"}</p>
                          <p className="mt-1 text-zinc-400 text-sm">{u.email ?? "—"}</p>
                          <p className="mt-1 text-zinc-500 text-sm">
                            Joined: {u.created_at ? u.created_at.slice(0, 10) : "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-zinc-500 text-xs uppercase tracking-[0.24em]">Orders</p>
                          <p className="text-white font-black text-2xl">{u.orders_count}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${roleBadgeClass(roleValue)}`}>
                          {roleLabel(roleValue)}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${statusBadgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs uppercase tracking-[0.22em] text-zinc-500 mb-2">
                            Role
                          </label>
                          <select
                            disabled={savingUserId === u.id}
                            value={roleValue}
                            onChange={(e) => setRole(u.id, e.target.value as RoleOption)}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40 disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r} disabled={isSelf && r !== "admin"}>
                                {roleLabel(r)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-[0.22em] text-zinc-500 mb-2">
                            Status
                          </label>
                          <select
                            disabled={savingUserId === u.id}
                            value={u.status}
                            onChange={(e) => setStatus(u.id, e.target.value as StatusOption)}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-all duration-300 focus:border-purple-400/40 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} disabled={isSelf && s !== "Active"}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {savingUserId === u.id ? (
                        <div className="mt-3 text-sm text-zinc-400 flex items-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
                          Updating…
                        </div>
                      ) : null}

                      {isSelf ? (
                        <div className="mt-3 text-sm text-yellow-200/90">
                          <span className="font-bold">Protected:</span> You can’t remove your Admin role, and you can only activate your own account.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.section>
    </div>
  );
}
