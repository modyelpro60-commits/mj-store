"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../components/auth/AuthProvider";
import { AdminOnlyGuard } from "../admin-guard";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";
import StatusDropdown from "../../../components/StatusDropdown";
import Skeleton from "../../../components/Skeleton";
import UserAvatar, { VerifiedBadge } from "../../../components/ui/UserAvatar";

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
  verified?: boolean;
};

type UsersApiResponse = { success: boolean; data?: AdminUserRow[]; error?: string };
type ActionApiResponse = { success: boolean; error?: string };

const ROLE_LABEL_KEYS: Record<RoleOption, "admin.users.role.user" | "admin.users.role.helper" | "admin.users.role.moderator" | "admin.users.role.admin"> = {
  user:      "admin.users.role.user",
  helper:    "admin.users.role.helper",
  moderator: "admin.users.role.moderator",
  admin:     "admin.users.role.admin",
};

function roleBadgeCls(role: RoleOption) {
  if (role === "admin")     return "border-purple-400/30 bg-purple-500/15 text-purple-200";
  if (role === "moderator") return "border-blue-400/25 bg-blue-500/10 text-blue-200";
  if (role === "helper")    return "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200";
  return "border-white/10 bg-white/5 text-zinc-400";
}

function statusBadgeCls(status: StatusOption) {
  if (status === "Active")    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (status === "Suspended") return "border-yellow-500/25 bg-yellow-500/10 text-yellow-200";
  return "border-red-500/25 bg-red-500/10 text-red-200";
}

function formatJoinDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function FilterPill({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  allLabel: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={allLabel}
        className="w-full appearance-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2.5 pr-9 text-sm font-semibold text-zinc-200 outline-none transition-all focus:border-purple-400/40 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2716%27%20height%3D%2716%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23a1a1aa%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E')] [background-repeat:no-repeat] [background-position:right_10px_center] [background-size:14px]"
      >
        <option value="All">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function UsersPageInner() {
  const router = useRouter();
  const { accessToken, profile, role, status, isLoading } = useAuth();
  const { translate } = useLanguage();

  const adminId = profile?.id ?? null;
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (status && status !== "Active") return;
    if (role !== "admin") router.replace("/");
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
        setError(json.error || translate("admin.toast.error"));
        return;
      }
      setUsers(json.data);
    } catch (e) {
      console.error(e);
      setUsers([]);
      setError(translate("admin.toast.error"));
    } finally {
      setLoading(false);
    }
  }

  async function setUserRole(userId: string, nextRole: RoleOption) {
    try {
      setSavingUserId(userId);
      const res = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const json = (await res.json()) as ActionApiResponse;
      if (!json.success) { toast.error(json.error || translate("admin.toast.error")); return; }
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(translate("admin.toast.error"));
    } finally {
      setSavingUserId(null);
    }
  }

  async function setUserStatus(userId: string, nextStatus: StatusOption) {
    try {
      setSavingUserId(userId);
      const res = await fetch("/api/admin/users/set-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const json = (await res.json()) as ActionApiResponse;
      if (!json.success) { toast.error(json.error || translate("admin.toast.error")); return; }
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(translate("admin.toast.error"));
    } finally {
      setSavingUserId(null);
    }
  }

  async function setUserVerified(userId: string, verified: boolean) {
    try {
      setSavingUserId(userId);
      const res = await fetch("/api/admin/users/set-verified", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ userId, verified }),
      });
      const json = (await res.json()) as ActionApiResponse;
      if (!json.success) { toast.error(json.error || translate("admin.toast.error")); return; }
      // Optimistic local update
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, verified } : u));
    } catch (e) {
      console.error(e);
      toast.error(translate("admin.toast.error"));
    } finally {
      setSavingUserId(null);
    }
  }

  const totals = useMemo(() => ({
    totalUsers: users.length,
    active:    users.filter((u) => u.status === "Active").length,
    suspended: users.filter((u) => u.status === "Suspended").length,
    banned:    users.filter((u) => u.status === "Banned").length,
  }), [users]);

  return (
    <div className="space-y-5">

      {/* ── Header + stats ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{translate("admin.users.badge")}</p>
              <h1 className="text-xl font-black">{translate("admin.users.title")}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { labelKey: "admin.users.stat.total"     as const, value: totals.totalUsers, cls: "border-white/[0.07] bg-white/[0.03]" },
              { labelKey: "admin.users.stat.active"    as const, value: totals.active,     cls: "border-emerald-500/15 bg-emerald-500/[0.06]" },
              { labelKey: "admin.users.stat.suspended" as const, value: totals.suspended,  cls: "border-yellow-500/15 bg-yellow-500/[0.06]" },
              { labelKey: "admin.users.stat.banned"    as const, value: totals.banned,     cls: "border-red-500/15 bg-red-500/[0.06]" },
            ].map((s) => (
              <div key={s.labelKey} className={`rounded-[1.25rem] border px-4 py-3 text-center ${s.cls}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{translate(s.labelKey)}</p>
                <p className="mt-0.5 text-xl font-black text-white">{loading ? "—" : s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}
      </motion.section>

      {/* ── Search + Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate("admin.users.search.placeholder")}
            className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-900 pl-11 pr-4 text-sm font-semibold outline-none transition-all placeholder:text-zinc-600 focus:border-purple-400/40"
          />
        </div>

        <FilterPill
          value={roleFilter}
          onChange={(v) => setRoleFilter(v as RoleFilter)}
          options={ROLE_OPTIONS}
          allLabel={translate("admin.users.filter.allRoles")}
        />

        <FilterPill
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={STATUS_OPTIONS}
          allLabel={translate("admin.users.filter.allStatuses")}
        />
      </motion.div>

      {/* ── User cards grid ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton count={6} />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-10 text-center text-zinc-500">
          {translate("admin.users.noUsers")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u, i) => {
            const isSelf = adminId ? u.id === adminId : false;
            const roleValue = (ROLE_OPTIONS.includes(u.role as RoleOption) ? u.role : "user") as RoleOption;
            const isSaving = savingUserId === u.id;

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.025 }}
                className="rounded-[1.75rem] border border-white/[0.07] bg-zinc-950/80 p-5 transition-all duration-300 hover:border-purple-400/20 hover:bg-purple-500/[0.04]"
              >
                {/* Top: avatar + name + badges */}
                <div className="flex items-start gap-3">
                  <UserAvatar role={roleValue} verified={u.verified} size="lg" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-white">{u.full_name ?? "—"}</p>
                    <p className="truncate text-xs text-zinc-500">{u.email ?? "—"}</p>
                  </div>

                  {isSaving ? (
                    <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-purple-400" />
                  ) : null}
                </div>

                {/* Badges row */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${roleBadgeCls(roleValue)}`}>
                    {translate(ROLE_LABEL_KEYS[roleValue])}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadgeCls(u.status)}`}>
                    {u.status}
                  </span>
                  {u.verified && <VerifiedBadge />}
                </div>

                {/* Meta */}
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
                  <span>{translate("admin.users.joined")}: {formatJoinDate(u.created_at)}</span>
                  <span className="font-semibold text-zinc-400">
                    {translate("admin.users.orders")}: <span className="text-white">{u.orders_count}</span>
                  </span>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-white/[0.06]" />

                {/* Actions */}
                {isSelf ? (
                  <p className="text-xs text-yellow-300/80">
                    <span className="font-bold">{translate("admin.users.protected")}:</span>{" "}
                    {translate("admin.users.protectedDesc")}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                          {translate("admin.users.col.role")}
                        </p>
                        <StatusDropdown
                          value={roleValue}
                          onChange={(v) => setUserRole(u.id, v as RoleOption)}
                          options={ROLE_OPTIONS}
                          disabled={isSaving}
                        />
                      </div>

                      <div>
                        <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                          {translate("admin.users.col.status")}
                        </p>
                        <StatusDropdown
                          value={u.status}
                          onChange={(v) => setUserStatus(u.id, v as StatusOption)}
                          options={STATUS_OPTIONS}
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    {/* Verified toggle */}
                    <button
                      type="button"
                      onClick={() => setUserVerified(u.id, !u.verified)}
                      disabled={isSaving}
                      className={`mt-3 w-full flex items-center justify-between rounded-xl border px-3 py-2 text-[12px] font-bold transition-all disabled:opacity-50 ${
                        u.verified
                          ? "border-teal-500/30 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20"
                          : "border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:border-teal-500/20 hover:text-teal-400"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 10 10" fill="none" className={`h-3 w-3 shrink-0 ${u.verified ? "opacity-100" : "opacity-0"}`}>
                          <path d="M1.5 5.5L4 8L8.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {u.verified ? "Verified Customer" : "Not Verified"}
                      </span>
                      <span className="text-[10px] font-normal text-zinc-600">
                        {u.verified ? "Click to unverify" : "Click to verify"}
                      </span>
                    </button>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function UsersPage() {
  return <AdminOnlyGuard><UsersPageInner /></AdminOnlyGuard>;
}
