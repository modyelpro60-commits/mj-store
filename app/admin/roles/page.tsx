"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Crown,
  Edit2,
  Info,
  Lock,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import { OwnerOnlyGuard } from "../admin-guard";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  is_system: boolean;
  is_protected: boolean;
  sort_order: number;
  permission_count: number;
  user_count: number;
};

type Permission = {
  key: string;
  name: string;
  description: string | null;
  category: string;
  sort_order: number;
  granted?: boolean;
};

type PermissionsByCategory = Record<string, Permission[]>;

// ─── Color palette ────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#f59e0b", "#a855f7", "#3b82f6", "#10b981",
  "#6b7280", "#ef4444", "#f97316", "#06b6d4",
  "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16",
];

// ─── Category icons ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Products:  <Zap className="h-3.5 w-3.5" />,
  Orders:    <ShieldCheck className="h-3.5 w-3.5" />,
  Chat:      <Users className="h-3.5 w-3.5" />,
  Users:     <Users className="h-3.5 w-3.5" />,
  Payments:  <Shield className="h-3.5 w-3.5" />,
  Analytics: <ChevronRight className="h-3.5 w-3.5" />,
  System:    <Crown className="h-3.5 w-3.5" />,
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  return (
    <OwnerOnlyGuard>
      <RolesContent />
    </OwnerOnlyGuard>
  );
}

function RolesContent() {
  const { accessToken } = useAuth();
  const { translate } = useLanguage();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editorRole, setEditorRole] = useState<Role | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPermissions, setEditorPermissions] = useState<string[]>([]);
  const [editorName, setEditorName] = useState("");
  const [editorDesc, setEditorDesc] = useState("");
  const [editorColor, setEditorColor] = useState("#6b7280");
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorSaved, setEditorSaved] = useState(false);
  const [editorSelectedCategory, setEditorSelectedCategory] = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState("#6b7280");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${accessToken ?? ""}` }),
    [accessToken]
  );

  // ── Load data ───────────────────────────────────────────────────────────────

  async function loadRoles() {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/admin/roles", { headers: authHeader() }),
        fetch("/api/admin/permissions", { headers: authHeader() }),
      ]);
      const rolesJson = await rolesRes.json();
      const permsJson = await permsRes.json();
      if (rolesJson.success) setRoles(rolesJson.data ?? []);
      if (permsJson.success) setAllPermissions(permsJson.data ?? []);
    } catch {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRoles(); }, []);

  // ── Editor open ─────────────────────────────────────────────────────────────

  async function openEditor(role: Role) {
    setEditorRole(role);
    setEditorName(role.name);
    setEditorDesc(role.description ?? "");
    setEditorColor(role.color);
    setEditorSaved(false);

    // Load this role's permissions
    const res = await fetch(`/api/admin/roles/${role.id}/permissions`, {
      headers: authHeader(),
    });
    const json = await res.json();
    if (json.success) {
      const granted: string[] = (json.data as Permission[])
        .filter((p) => p.granted)
        .map((p) => p.key);
      setEditorPermissions(granted);
    }

    const firstCat = allPermissions[0]?.category ?? null;
    setEditorSelectedCategory(firstCat);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditorRole(null);
  }

  // ── Save permissions ─────────────────────────────────────────────────────────

  async function savePermissions() {
    if (!editorRole) return;
    setEditorSaving(true);
    try {
      // Save metadata
      await fetch(`/api/admin/roles/${editorRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          name: editorName,
          description: editorDesc || null,
          color: editorColor,
        }),
      });

      // Save permissions
      const res = await fetch(`/api/admin/roles/${editorRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ permissions: editorPermissions }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setEditorSaved(true);
      await loadRoles();
      setTimeout(() => setEditorSaved(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditorSaving(false);
    }
  }

  function togglePermission(key: string) {
    setEditorPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function selectAllInCategory(category: string) {
    const catKeys = allPermissions
      .filter((p) => p.category === category)
      .map((p) => p.key);
    setEditorPermissions((prev) => {
      const existing = new Set(prev);
      catKeys.forEach((k) => existing.add(k));
      return Array.from(existing);
    });
  }

  function clearAllInCategory(category: string) {
    const catKeys = new Set(
      allPermissions.filter((p) => p.category === category).map((p) => p.key)
    );
    setEditorPermissions((prev) => prev.filter((k) => !catKeys.has(k)));
  }

  // ── Create role ─────────────────────────────────────────────────────────────

  async function createRole() {
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ name: createName, description: createDesc, color: createColor }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCreateOpen(false);
      setCreateName("");
      setCreateDesc("");
      setCreateColor("#6b7280");
      await loadRoles();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Delete role ─────────────────────────────────────────────────────────────

  async function deleteRole() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setDeleteTarget(null);
      await loadRoles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Grouped permissions by category ─────────────────────────────────────────

  const groupedPermissions: PermissionsByCategory = {};
  for (const p of allPermissions) {
    if (!groupedPermissions[p.category]) groupedPermissions[p.category] = [];
    groupedPermissions[p.category].push(p);
  }
  const categories = Object.keys(groupedPermissions);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            <ShieldCheck className="h-3 w-3" />
            {translate("admin.roles.badge")}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {translate("admin.roles.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{translate("admin.roles.subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-2xl border border-purple-400/30 bg-purple-500/15 px-4 py-2.5 text-sm font-bold text-purple-200 transition-all hover:bg-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          <Plus className="h-4 w-4" />
          {translate("admin.roles.create")}
        </button>
      </div>

      {/* ── Roles grid ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {roles.map((role, idx) => (
              <RoleCard
                key={role.id}
                role={role}
                index={idx}
                translate={translate}
                onEdit={() => openEditor(role)}
                onDelete={() => setDeleteTarget(role)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Owner Controls ── */}
      <OwnerControlsPanel />

      {/* ── Permission Editor Panel ── */}
      <AnimatePresence>
        {editorOpen && editorRole && (
          <motion.div
            key="editor-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
            onClick={closeEditor}
          >
            <motion.div
              key="editor-panel"
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative mx-auto flex h-[90vh] w-full max-w-4xl flex-col rounded-t-[2rem] border border-white/[0.1] bg-[#0c0c1a] shadow-[0_0_120px_rgba(168,85,247,0.12)] sm:rounded-[2rem]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Editor header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-white/10"
                    style={{ background: editorColor }}
                  />
                  <h2 className="text-lg font-black">{editorRole.is_protected && editorRole.slug === "owner" ? editorRole.name : editorName || editorRole.name}</h2>
                  {editorRole.is_protected && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                      <Lock className="h-2.5 w-2.5" />
                      {translate("admin.roles.protected")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editorRole.is_protected && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={savePermissions}
                      disabled={editorSaving}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                        editorSaved
                          ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                          : "border border-purple-400/30 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25"
                      }`}
                    >
                      {editorSaving ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
                      ) : editorSaved ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {editorSaving
                        ? translate("admin.roles.editor.saving")
                        : editorSaved
                        ? translate("admin.roles.editor.saved")
                        : translate("admin.roles.editor.save")}
                    </motion.button>
                  )}
                  <button
                    onClick={closeEditor}
                    className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editorRole.slug === "owner" ? (
                // Owner: read-only message
                <div className="flex flex-1 items-center justify-center p-10">
                  <div className="text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                      <Crown className="h-7 w-7 text-amber-300" />
                    </div>
                    <p className="text-lg font-bold text-white">Owner Role</p>
                    <p className="mt-2 max-w-sm text-sm text-zinc-500">
                      {translate("admin.roles.ownerProtected")}
                      <br />
                      The Owner has unrestricted access to all features.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1">
                  {/* ── Left: Metadata + categories ── */}
                  <div className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] p-4">
                    {/* Name input */}
                    {!editorRole.is_system && (
                      <div className="mb-4 space-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {translate("admin.roles.editor.name")}
                          </label>
                          <input
                            value={editorName}
                            onChange={(e) => setEditorName(e.target.value)}
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {translate("admin.roles.editor.color")}
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {COLOR_PALETTE.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditorColor(c)}
                                className={`h-6 w-6 rounded-lg transition-all ${
                                  editorColor === c
                                    ? "ring-2 ring-white ring-offset-1 ring-offset-[#0c0c1a] scale-110"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category list */}
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Categories
                    </p>
                    <nav className="flex-1 space-y-0.5 overflow-y-auto">
                      {categories.map((cat) => {
                        const catPerms = groupedPermissions[cat] ?? [];
                        const grantedCount = catPerms.filter((p) =>
                          editorPermissions.includes(p.key)
                        ).length;
                        const isActive = editorSelectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEditorSelectedCategory(cat)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                              isActive
                                ? "bg-purple-500/15 text-white"
                                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={isActive ? "text-purple-300" : "text-zinc-600"}>
                                {CATEGORY_ICONS[cat] ?? <Shield className="h-3.5 w-3.5" />}
                              </span>
                              {translate(`admin.roles.perm.${cat}` as any) || cat}
                            </span>
                            <span className={`text-[10px] font-black ${
                              grantedCount > 0 ? "text-purple-300" : "text-zinc-700"
                            }`}>
                              {grantedCount}/{catPerms.length}
                            </span>
                          </button>
                        );
                      })}
                    </nav>

                    {/* Total badge */}
                    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <p className="text-[10px] text-zinc-500">Total Granted</p>
                      <p className="text-xl font-black text-purple-300">
                        {editorPermissions.length}
                        <span className="text-sm text-zinc-600"> / {allPermissions.length}</span>
                      </p>
                    </div>
                  </div>

                  {/* ── Right: Permissions in selected category ── */}
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {editorSelectedCategory && (
                      <>
                        {/* Category header */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                          <p className="font-bold text-white">
                            {translate(`admin.roles.perm.${editorSelectedCategory}` as any) || editorSelectedCategory}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selectAllInCategory(editorSelectedCategory)}
                              className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-zinc-400 transition hover:border-emerald-400/30 hover:text-emerald-300"
                            >
                              {translate("admin.roles.editor.selectAll")}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearAllInCategory(editorSelectedCategory)}
                              className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-zinc-400 transition hover:border-red-400/30 hover:text-red-300"
                            >
                              {translate("admin.roles.editor.clearAll")}
                            </button>
                          </div>
                        </div>

                        {/* Permission toggles */}
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(groupedPermissions[editorSelectedCategory] ?? []).map((perm) => {
                              const isGranted = editorPermissions.includes(perm.key);
                              return (
                                <motion.button
                                  key={perm.key}
                                  type="button"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => togglePermission(perm.key)}
                                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                                    isGranted
                                      ? "border-purple-400/25 bg-purple-500/10"
                                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                                  }`}
                                >
                                  {/* Toggle indicator */}
                                  <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                      isGranted
                                        ? "border-purple-400 bg-purple-400"
                                        : "border-zinc-600"
                                    }`}
                                  >
                                    {isGranted && <Check className="h-3 w-3 text-white" />}
                                  </span>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-bold ${isGranted ? "text-white" : "text-zinc-400"}`}>
                                      {perm.name}
                                    </p>
                                    {perm.description && (
                                      <p className="mt-0.5 text-[11px] text-zinc-600 line-clamp-2">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Role Modal ── */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            key="create-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              key="create-modal"
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-md rounded-[2rem] border border-white/[0.1] bg-[#0c0c1a] p-6 shadow-[0_0_80px_rgba(168,85,247,0.12)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black">{translate("admin.roles.create.title")}</h2>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-400">
                    {translate("admin.roles.editor.name")} *
                  </label>
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Support Agent"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:border-purple-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-400">
                    {translate("admin.roles.editor.desc")}
                  </label>
                  <textarea
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    rows={2}
                    placeholder="Brief description of this role…"
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:border-purple-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-400">
                    {translate("admin.roles.editor.color")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCreateColor(c)}
                        className={`h-7 w-7 rounded-xl transition-all ${
                          createColor === c
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#0c0c1a] scale-110"
                            : "opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {createError && (
                <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {createError}
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={createRole}
                  disabled={createLoading || !createName.trim()}
                  className="flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/15 px-5 py-2 text-sm font-bold text-purple-200 transition-all hover:bg-purple-500/25 disabled:opacity-50"
                >
                  {createLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {createLoading
                    ? translate("admin.roles.create.creating")
                    : translate("admin.roles.create.submit")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              key="delete-modal"
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-sm rounded-[2rem] border border-red-500/20 bg-[#0c0c1a] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-base font-black text-white">Delete "{deleteTarget.name}"?</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {translate("admin.roles.deleteConfirm")}
              </p>
              {deleteTarget.user_count > 0 && (
                <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  ⚠ {deleteTarget.user_count} user(s) currently have this role. Reassign them before deleting.
                </p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteRole}
                  disabled={deleteLoading || deleteTarget.user_count > 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/15 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/25 disabled:opacity-40"
                >
                  {deleteLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  index,
  translate,
  onEdit,
  onDelete,
}: {
  role: Role;
  index: number;
  translate: (key: any) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOwner = role.slug === "owner";

  return (
    <motion.div
      key={role.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 26 }}
      className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/80 p-5 transition-all duration-300 hover:border-white/[0.14] hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]"
    >
      {/* Color accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: `linear-gradient(90deg, ${role.color}, transparent)` }}
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.07]"
        style={{ background: role.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: `${role.color}22`, border: `1px solid ${role.color}33` }}
          >
            {isOwner ? (
              <Crown className="h-5 w-5" style={{ color: role.color }} />
            ) : (
              <Shield className="h-5 w-5" style={{ color: role.color }} />
            )}
          </div>
          <div>
            <p className="font-black text-white">{role.name}</p>
            {(role.is_system || role.is_protected) && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                {role.is_protected ? (
                  <><Lock className="h-2.5 w-2.5" />{translate("admin.roles.protected")}</>
                ) : (
                  translate("admin.roles.system")
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {role.description && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
          {role.description}
        </p>
      )}

      {/* Stats */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
          <Users className="h-3 w-3 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-300">{role.user_count}</span>
          <span className="text-[10px] text-zinc-600">{translate("admin.roles.users")}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
          <ShieldCheck className="h-3 w-3 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-300">{role.permission_count}</span>
          <span className="text-[10px] text-zinc-600">{translate("admin.roles.permissions")}</span>
        </div>
      </div>

      {/* Permission bar */}
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (role.permission_count / 32) * 100)}%`,
              background: `linear-gradient(90deg, ${role.color}, ${role.color}88)`,
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-xs font-bold text-zinc-400 transition-all hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-purple-300"
        >
          <Edit2 className="h-3 w-3" />
          {translate("admin.roles.edit")}
        </button>
        {!role.is_protected && (
          <button
            type="button"
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] text-zinc-600 transition-all hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Owner Controls Panel ─────────────────────────────────────────────────────
// Full premium Owner Control Center. Visible ONLY to Owner.

type OwnerStats = {
  totalRoles: number;
  totalPermissions: number;
  totalAuditEvents: number;
  ownerUserCount: number;
  adminUserCount: number;
  lastOwnerAssignment: string | null;
  lastPermissionChange: string | null;
  lastSecurityEvent: string | null;
  permissionCoverage: number;
  protectedResources: number;
  systemRolesCount: number;
};

function formatRelative(isoStr: string | null): string {
  if (!isoStr) return "Never";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "Unknown";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function OwnerControlsPanel() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyConfirm, setEmergencyConfirm] = useState("");
  const [emergencyRunning, setEmergencyRunning] = useState(false);
  const [emergencyDone, setEmergencyDone] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setStatsLoading(true);
    fetch("/api/admin/owner/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => { if (json.success) setStats(json.data); })
      .catch(() => null)
      .finally(() => setStatsLoading(false));
  }, [accessToken]);

  async function runEmergencyReset() {
    if (!accessToken) return;
    setEmergencyRunning(true);
    try {
      const res = await fetch("/api/admin/owner/emergency-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ confirm: "EMERGENCY_RESET_CONFIRMED" }),
      });
      const json = await res.json();
      if (json.success) {
        setEmergencyDone(true);
      } else {
        alert(json.error ?? "Reset failed");
      }
    } catch {
      alert("Reset failed. Check console.");
    } finally {
      setEmergencyRunning(false);
    }
  }

  const OWNER_EXCLUSIVE = [
    { key: "assign_owner",       label: "Assign Owner" },
    { key: "revoke_owner",       label: "Revoke Owner" },
    { key: "override_permissions", label: "Override Permissions" },
    { key: "emergency_reset_rbac", label: "Emergency RBAC Reset" },
    { key: "view_security_audit",  label: "View Security Audit" },
    { key: "manage_system_roles",  label: "Manage System Roles" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: "rgba(245,158,11,0.25)",
        background: "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(0,0,0,0) 60%)",
        animation: "mj-owner-card-glow 4s ease-in-out infinite",
      }}
    >
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_left,_rgba(245,158,11,0.10),_transparent_55%)]" />
      {/* Shimmer line at top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)",
          backgroundSize: "200% auto",
          animation: "mj-owner-shimmer 3s linear infinite",
        }}
      />

      {/* ── Header ─── */}
      <div className="flex items-center justify-between border-b border-amber-400/[0.14] px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15"
            style={{ animation: "mj-owner-glow-pulse 2.8s ease-in-out infinite" }}
          >
            <Crown
              className="h-5 w-5 text-amber-300"
              style={{ animation: "mj-crown-float 3s ease-in-out infinite" }}
            />
          </div>
          <div>
            <p className="text-lg font-black text-white">Owner Control Center</p>
            <p className="text-[11px] text-zinc-500">Exclusive capabilities — not accessible by Admin or below</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-200"
          style={{
            borderColor: "rgba(245,158,11,0.40)",
            background: "linear-gradient(90deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.24) 50%, rgba(245,158,11,0.18) 100%)",
            backgroundSize: "200% auto",
            animation: "mj-owner-shimmer 3.5s linear infinite",
          }}
        >
          <Crown className="h-2.5 w-2.5" />
          Owner Only
        </span>
      </div>

      {/* ── 4-card grid ─── */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* Card 1 — System Controls */}
        <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-500/10">
              <Zap className="h-3.5 w-3.5 text-purple-300" />
            </div>
            <p className="text-sm font-bold text-white">System Controls</p>
          </div>
          <ul className="flex-1 space-y-2.5 text-xs text-zinc-400">
            {[
              { label: "Protected Role Management", icon: Lock },
              { label: "Permission Schema Override", icon: Shield },
              { label: "Assign Owner Role", icon: Crown },
              { label: "Revoke Owner Role", icon: ShieldOff },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-3 w-3 shrink-0 text-amber-400/60" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2 text-[10px] text-amber-300/70">
            Manage via: <span className="font-bold">Roles grid above</span>
          </div>
        </div>

        {/* Card 2 — Emergency Recovery */}
        <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
            </div>
            <p className="text-sm font-bold text-white">Emergency Recovery</p>
          </div>
          <p className="mb-3 flex-1 text-[11px] leading-relaxed text-zinc-500">
            Force-reset Helper &amp; Moderator roles to User. Use only if permission state is corrupted. Owner and Admin are never affected.
          </p>
          <button
            type="button"
            onClick={() => { setEmergencyConfirm(""); setEmergencyDone(false); setEmergencyOpen(true); }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
          >
            <ShieldOff className="h-3 w-3" />
            Emergency Reset
          </button>
        </div>

        {/* Card 3 — Security Audit */}
        <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <p className="text-sm font-bold text-white">Security Audit</p>
          </div>
          <ul className="flex-1 space-y-2.5 text-xs text-zinc-400">
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Total RBAC changes</span>
              <span className="font-black text-white">
                {statsLoading ? "—" : (stats?.totalAuditEvents ?? 0).toLocaleString()}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Last owner assign</span>
              <span className="font-bold text-amber-300 tabular-nums">
                {statsLoading ? "—" : formatRelative(stats?.lastOwnerAssignment ?? null)}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Last perm change</span>
              <span className="font-bold text-purple-300 tabular-nums">
                {statsLoading ? "—" : formatRelative(stats?.lastPermissionChange ?? null)}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Last security event</span>
              <span className="font-bold text-blue-300 tabular-nums">
                {statsLoading ? "—" : formatRelative(stats?.lastSecurityEvent ?? null)}
              </span>
            </li>
          </ul>
          <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-300/70">
            Full log: <span className="font-bold">Activity Log page</span>
          </div>
        </div>

        {/* Card 4 — System Health */}
        <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10">
              <Info className="h-3.5 w-3.5 text-blue-300" />
            </div>
            <p className="text-sm font-bold text-white">System Health</p>
          </div>
          <ul className="flex-1 space-y-2.5 text-xs text-zinc-400">
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Active Roles</span>
              <span className="font-black text-white">
                {statsLoading ? "—" : stats?.totalRoles ?? 0}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Total Permissions</span>
              <span className="font-black text-white">
                {statsLoading ? "—" : stats?.totalPermissions ?? 0}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Coverage</span>
              <span className={`font-black ${(stats?.permissionCoverage ?? 0) >= 80 ? "text-emerald-300" : "text-yellow-300"}`}>
                {statsLoading ? "—" : `${stats?.permissionCoverage ?? 0}%`}
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span className="text-zinc-500">Protected Resources</span>
              <span className="font-black text-amber-300">
                {statsLoading ? "—" : stats?.protectedResources ?? 0}
              </span>
            </li>
          </ul>
          {/* Coverage bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: statsLoading ? "0%" : `${stats?.permissionCoverage ?? 0}%`,
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                }}
              />
            </div>
            <p className="mt-1 text-[9px] text-zinc-600">Role permission coverage</p>
          </div>
        </div>

      </div>

      {/* ── Owner-Exclusive Permissions ─── */}
      <div className="border-t border-amber-400/[0.12] px-6 py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Owner-Exclusive Permissions
        </p>
        <div className="flex flex-wrap gap-2">
          {OWNER_EXCLUSIVE.map(({ key, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 px-3 py-1 text-[10px] font-bold text-amber-200"
              style={{
                background: "linear-gradient(90deg, rgba(245,158,11,0.12), rgba(251,191,36,0.16), rgba(245,158,11,0.12))",
              }}
            >
              <Lock className="h-2.5 w-2.5" />
              {label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          These 6 permissions are hardcoded to Owner only. They cannot be assigned to any other role — not even Admin.
          All attempts are blocked at both API and DB levels.
        </p>
      </div>

      {/* ── Emergency Reset Modal ─── */}
      <AnimatePresence>
        {emergencyOpen && (
          <motion.div
            key="emergency-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
            onClick={() => !emergencyRunning && setEmergencyOpen(false)}
          >
            <motion.div
              key="emergency-modal"
              initial={{ scale: 0.90, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.90, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-[2rem] border border-red-500/30 bg-[#0c0c1a] p-6 shadow-[0_0_120px_rgba(239,68,68,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10">
                <AlertTriangle className="h-7 w-7 text-red-400" style={{ animation: emergencyRunning ? undefined : "mj-crown-float 2s ease-in-out infinite" }} />
              </div>

              {emergencyDone ? (
                <>
                  <h2 className="text-center text-lg font-black text-emerald-300">Reset Complete</h2>
                  <p className="mt-2 text-center text-sm text-zinc-400">
                    Helper and Moderator roles have been reset to User. The system is now in a clean state.
                  </p>
                  <button
                    onClick={() => setEmergencyOpen(false)}
                    className="mt-5 w-full rounded-xl border border-emerald-400/20 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-center text-lg font-black text-white">Emergency RBAC Reset</h2>
                  <p className="mt-2 text-center text-sm text-zinc-400">
                    This will reset all Helper and Moderator roles to User. Owner and Admin accounts are preserved.
                    <strong className="block mt-2 text-red-300">This action is logged and cannot be undone.</strong>
                  </p>

                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-bold text-zinc-400">
                      Type <span className="font-mono text-red-300">CONFIRM RESET</span> to proceed:
                    </label>
                    <input
                      value={emergencyConfirm}
                      onChange={(e) => setEmergencyConfirm(e.target.value)}
                      placeholder="CONFIRM RESET"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-700 focus:border-red-400/50 focus:outline-none"
                    />
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => setEmergencyOpen(false)}
                      disabled={emergencyRunning}
                      className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={runEmergencyReset}
                      disabled={emergencyRunning || emergencyConfirm !== "CONFIRM RESET"}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/25 disabled:opacity-40"
                    >
                      {emergencyRunning ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5" />
                      )}
                      {emergencyRunning ? "Resetting…" : "Execute Reset"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
