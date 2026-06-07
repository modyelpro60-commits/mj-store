"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Crown,
  Lock,
  LoaderCircle,
  PackagePlus,
  Pencil,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";

/* ─── Types ─── */
type Log = {
  id: number;
  action: string;
  actorName: string;
  actorRole: string | null;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  createdAt: string;
};

/* ─── Action metadata ─── */
const ACTION_META: Record<string, { label: string; Icon: React.ElementType; cls: string; ring: string }> = {
  "product.create": { label: "Created product",  Icon: PackagePlus, cls: "text-emerald-300", ring: "border-emerald-500/25 bg-emerald-500/10" },
  "product.update": { label: "Updated product",  Icon: Pencil,      cls: "text-blue-300",    ring: "border-blue-500/25 bg-blue-500/10" },
  "product.delete": { label: "Deleted product",  Icon: Trash2,      cls: "text-red-300",     ring: "border-red-500/25 bg-red-500/10" },
  "chat.close":     { label: "Closed chat",      Icon: Lock,        cls: "text-amber-300",   ring: "border-amber-500/25 bg-amber-500/10" },
  "chat.reopen":    { label: "Reopened chat",    Icon: RotateCcw,   cls: "text-purple-300",  ring: "border-purple-500/25 bg-purple-500/10" },
  "chat.delete":    { label: "Deleted chat",     Icon: Trash2,      cls: "text-red-300",     ring: "border-red-500/25 bg-red-500/10" },
};

const ROLE_CHIP: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  admin:     { label: "Admin",     cls: "border-amber-500/30 bg-amber-500/10 text-amber-300", Icon: Crown },
  moderator: { label: "Moderator", cls: "border-blue-500/30 bg-blue-500/10 text-blue-300",    Icon: ShieldCheck },
  helper:    { label: "Helper",    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", Icon: Wrench },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
function absTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function LogsPage() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/logs", { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (d.success) setLogs(d.data ?? []);
      else setError(d.error ?? "Failed to load logs");
    } catch {
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/15 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Activity Log</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Who did what across the store</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-purple-500/25 hover:text-purple-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </section>

      {/* List */}
      <section className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/90 p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-[1.25rem] bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Activity className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-600">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((log, i) => {
              const meta = ACTION_META[log.action] ?? { label: log.action, Icon: Activity, cls: "text-zinc-300", ring: "border-white/10 bg-white/5" };
              const Icon = meta.Icon;
              const roleChip = log.actorRole ? ROLE_CHIP[log.actorRole] : null;
              const isLast = i === logs.length - 1;

              return (
                <div key={log.id} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${meta.ring} ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && <div className="my-1 h-full min-h-[18px] w-px shrink-0 bg-white/[0.06]" />}
                  </div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                    className={`flex-1 ${!isLast ? "pb-3" : ""}`}
                  >
                    <div className="flex flex-col gap-1 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition-all hover:border-purple-400/20 hover:bg-purple-500/[0.04]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-white">{log.actorName}</span>
                        {roleChip && (
                          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${roleChip.cls}`}>
                            <roleChip.Icon className="h-2.5 w-2.5" />
                            {roleChip.label}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${meta.cls}`}>{meta.label}</span>
                        {log.targetLabel && (
                          <span className="text-sm text-zinc-400">
                            “<span className="font-semibold text-zinc-200">{log.targetLabel}</span>”
                          </span>
                        )}
                        {log.targetId && !log.targetLabel && (
                          <span className="text-xs text-zinc-600">#{log.targetId}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <span title={absTime(log.createdAt)}>{relTime(log.createdAt)}</span>
                        <span className="text-zinc-800">·</span>
                        <span>{absTime(log.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
