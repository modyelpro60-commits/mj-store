"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bitcoin,
  Camera,
  Check,
  Clock,
  DollarSign,
  Hash,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Percent,
  Phone,
  Plus,
  Save,
  Settings,
  Shield,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import { AdminOnlyGuard } from "../admin-guard";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";
import type { PaymentAccount, PaymentSettings } from "../../lib/payment/config";

/* ─────────────────── shared input style ───────────────────── */
const inp =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-900/70 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-purple-500/50 focus:bg-purple-500/[0.06] focus:ring-1 focus:ring-purple-500/20";

/* ─────────────────── Toggle chip ──────────────────────────── */
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const { translate } = useLanguage();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 disabled:opacity-50 ${
        value
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-zinc-700/60 bg-zinc-800/50 text-zinc-500"
      }`}
    >
      {disabled
        ? <LoaderCircle className="h-4 w-4 animate-spin" />
        : value ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      {value ? translate("admin.settings.toggle.enabled") : translate("admin.settings.toggle.disabled")}
    </button>
  );
}

/* ─────────────────── QR Upload zone ───────────────────────── */
function QRUpload({
  preview, uploading, onFile, onClear, compact = false,
}: {
  preview: string; uploading: boolean;
  onFile: (f: File) => void; onClear: () => void; compact?: boolean;
}) {
  const { translate } = useLanguage();
  const ref = useRef<HTMLInputElement>(null);
  const sz  = compact ? "h-20 w-20" : "h-28 w-28";
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">QR Code</p>
      {preview ? (
        <div className="relative w-fit">
          <img src={preview} alt="QR" className={`${sz} rounded-xl border border-white/[0.08] bg-white object-contain p-1.5`} />
          <div className="absolute -top-1.5 -right-1.5 flex gap-1">
            <button type="button" onClick={() => ref.current?.click()}
              className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-zinc-800 text-zinc-400 hover:text-white transition shadow-lg">
              <Upload className="h-2.5 w-2.5" />
            </button>
            <button type="button" onClick={onClear}
              className="grid h-5 w-5 place-items-center rounded-full border border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25 transition shadow-lg">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
              <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className={`${sz} flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/[0.08] bg-zinc-900/40 text-zinc-600 hover:border-purple-500/30 hover:text-purple-400 transition-colors`}
        >
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : (
            <>
              <ImageIcon className="h-4 w-4" />
              <span className="text-[9px] font-bold">{translate("admin.settings.accounts.uploadQR")}</span>
            </>
          )}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

/* ─────────────────── Method icon ──────────────────────────── */
function MethodIcon({ method, active }: { method: string; active: boolean }) {
  const Icon = method === "vodafone" ? Smartphone : method === "instapay" ? Camera : Wallet;
  return (
    <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border transition-colors ${
      active ? "border-purple-500/25 bg-purple-500/10 text-purple-300" : "border-zinc-700/40 bg-zinc-800/40 text-zinc-600"
    }`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* ─────────────────── Relative time ────────────────────────── */
function RelativeTime({ iso }: { iso: string | null }) {
  const { translate } = useLanguage();
  if (!iso) return <span className="text-zinc-600">{translate("admin.settings.relTime.notUsed")}</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const label = m < 1
    ? translate("admin.settings.relTime.justNow")
    : m < 60 ? `${m}${translate("admin.settings.relTime.minsAgo")}`
    : h < 24 ? `${h}${translate("admin.settings.relTime.hoursAgo")}`
    : `${d}${translate("admin.settings.relTime.daysAgo")}`;
  return <span className="text-zinc-500">{label}</span>;
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
function SettingsPageInner() {
  const { accessToken } = useAuth();
  const { translate } = useLanguage();

  /* ── Global settings (store_settings) ─────────────────── */
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [savingGlobal,  setSavingGlobal]  = useState(false);
  const [vodafoneEnabled, setVodafoneEnabled] = useState(true);
  const [instapayEnabled, setInstapayEnabled] = useState(true);
  const [usdtEnabled,     setUsdtEnabled]     = useState(false);
  const [usdtRateEgp,     setUsdtRateEgp]     = useState("50");
  const [usdtFeePct,      setUsdtFeePct]       = useState("3");

  /* ── Payment accounts ──────────────────────────────────── */
  const [accounts,        setAccounts]        = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  /* ── Edit state (inline per card) ──────────────────────── */
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVal,  setEditVal]  = useState("");
  const [editQr,   setEditQr]   = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  /* ── Add form state (per method) ───────────────────────── */
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  const [addName,  setAddName]  = useState("");
  const [addVal,   setAddVal]   = useState("");
  const [addQr,    setAddQr]    = useState("");
  const [addSaving, setAddSaving] = useState(false);

  /* ── QR upload loading keys ─────────────────────────────── */
  const [qrLoading, setQrLoading] = useState<string | null>(null); // "edit-{id}" | "add"

  /* ── Delete confirm ─────────────────────────────────────── */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  /* ── Toggle loading ─────────────────────────────────────── */
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ════════════════════════════════════════════════════════
     Load global settings
  ════════════════════════════════════════════════════════ */
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: PaymentSettings) => {
        setVodafoneEnabled(s.vodafone_enabled !== "false");
        setInstapayEnabled(s.instapay_enabled !== "false");
        setUsdtEnabled(s.usdt_enabled === "true");
        setUsdtRateEgp(s.usdt_rate_egp ?? "50");
        setUsdtFeePct(s.usdt_fee_pct  ?? "3");
      })
      .catch(() => {})
      .finally(() => setLoadingGlobal(false));
  }, []);

  /* ════════════════════════════════════════════════════════
     Load payment accounts
  ════════════════════════════════════════════════════════ */
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res  = await fetch("/api/admin/payment-accounts", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json() as PaymentAccount[];
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error(translate("admin.settings.toast.loadFailed"));
    } finally {
      setLoadingAccounts(false);
    }
  }, [accessToken]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);

  /* ════════════════════════════════════════════════════════
     Save global settings
  ════════════════════════════════════════════════════════ */
  async function saveGlobal() {
    setSavingGlobal(true);
    try {
      const res  = await fetch("/api/admin/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({
          vodafone_enabled: String(vodafoneEnabled),
          instapay_enabled: String(instapayEnabled),
          usdt_enabled:     String(usdtEnabled),
          usdt_rate_egp:    usdtRateEgp,
          usdt_fee_pct:     usdtFeePct,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) toast.success(translate("admin.settings.toast.saved"));
      else toast.error(data.error ?? translate("admin.settings.toast.saveFailed"));
    } catch {
      toast.error(translate("admin.settings.toast.saveFailed"));
    } finally {
      setSavingGlobal(false);
    }
  }

  /* ════════════════════════════════════════════════════════
     QR image upload helper
  ════════════════════════════════════════════════════════ */
  async function uploadQR(file: File, key: string, onDone: (url: string) => void) {
    setQrLoading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload-image", {
        method: "POST", body: fd,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json() as { success?: boolean; url?: string; error?: string };
      if (data.success && data.url) { onDone(data.url); toast.success(translate("admin.settings.toast.imageUploaded")); }
      else toast.error(data.error ?? translate("admin.settings.toast.uploadFailed"));
    } catch {
      toast.error(translate("admin.settings.toast.uploadFailed"));
    } finally {
      setQrLoading(null);
    }
  }

  /* ════════════════════════════════════════════════════════
     Account CRUD
  ════════════════════════════════════════════════════════ */

  /* Toggle is_active */
  async function toggleActive(acc: PaymentAccount) {
    setTogglingId(acc.id);
    try {
      const res  = await fetch(`/api/admin/payment-accounts/${acc.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ is_active: !acc.is_active }),
      });
      const data = await res.json() as { success?: boolean; account?: PaymentAccount; error?: string };
      if (data.success && data.account) {
        setAccounts((prev) => prev.map((a) => a.id === acc.id ? data.account! : a));
        toast.success(data.account.is_active ? translate("admin.settings.toast.activated") : translate("admin.settings.toast.deactivated"));
      } else {
        toast.error(data.error ?? translate("admin.settings.toast.toggleFailed"));
      }
    } catch {
      toast.error(translate("admin.settings.toast.toggleFailed"));
    } finally {
      setTogglingId(null);
    }
  }

  /* Start inline edit */
  function startEdit(acc: PaymentAccount) {
    setEditId(acc.id);
    setEditName(acc.name);
    setEditVal(acc.value);
    setEditQr(acc.qr_image ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
    setEditVal("");
    setEditQr("");
  }

  /* Save edit */
  async function saveEdit(id: string) {
    if (!editVal.trim()) { toast.error(translate("admin.settings.accounts.valueRequired")); return; }
    setSavingId(id);
    try {
      const res  = await fetch(`/api/admin/payment-accounts/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ name: editName.trim(), value: editVal.trim(), qr_image: editQr || null }),
      });
      const data = await res.json() as { success?: boolean; account?: PaymentAccount; error?: string };
      if (data.success && data.account) {
        setAccounts((prev) => prev.map((a) => a.id === id ? data.account! : a));
        cancelEdit();
        toast.success(translate("admin.settings.toast.editSaved"));
      } else {
        toast.error(data.error ?? translate("admin.settings.toast.editFailed"));
      }
    } catch {
      toast.error(translate("admin.settings.toast.editFailed"));
    } finally {
      setSavingId(null);
    }
  }

  /* Delete */
  async function deleteAccount(id: string) {
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/admin/payment-accounts/${id}`, {
        method:  "DELETE",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setConfirmDeleteId(null);
        toast.success(translate("admin.settings.toast.deleted"));
      } else {
        toast.error(data.error ?? translate("admin.settings.toast.deleteFailed"));
      }
    } catch {
      toast.error(translate("admin.settings.toast.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  /* Open add form */
  function openAdd(method: string) {
    setAddingMethod(method);
    setAddName("");
    setAddVal("");
    setAddQr("");
  }

  function cancelAdd() { setAddingMethod(null); }

  /* Submit add */
  async function submitAdd(method: string) {
    if (!addVal.trim()) { toast.error(translate("admin.settings.accounts.valueRequired")); return; }
    setAddSaving(true);
    try {
      const res  = await fetch("/api/admin/payment-accounts", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ method, name: addName.trim(), value: addVal.trim(), qr_image: addQr || null }),
      });
      const data = await res.json() as { success?: boolean; account?: PaymentAccount; error?: string };
      if (data.success && data.account) {
        setAccounts((prev) => [...prev, data.account!]);
        cancelAdd();
        toast.success(translate("admin.settings.toast.added"));
      } else {
        toast.error(data.error ?? translate("admin.settings.toast.addFailed"));
      }
    } catch {
      toast.error(translate("admin.settings.toast.addFailed"));
    } finally {
      setAddSaving(false);
    }
  }

  /* ════════════════════════════════════════════════════════
     Derived
  ════════════════════════════════════════════════════════ */
  const byMethod = (m: string) => accounts.filter((a) => a.method === m);
  const exampleRate  = Number(usdtRateEgp) || 50;
  const exampleFee   = Number(usdtFeePct)  || 0;
  const exampleEgp   = 150;
  const exampleBase  = exampleEgp / exampleRate;
  const exampleTotal = Math.ceil(exampleBase * (1 + exampleFee / 100) * 100) / 100;

  if (loadingGlobal) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 pb-12" dir="rtl">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
            <Settings className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">{translate("admin.settings.title")}</h1>
            <p className="text-xs text-zinc-600">{translate("admin.settings.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={saveGlobal}
          disabled={savingGlobal}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:shadow-[0_0_36px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {savingGlobal ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {savingGlobal ? translate("admin.settings.saving") : translate("admin.settings.save")}
        </button>
      </div>

      {/* ── Global enable/disable toggles ──────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
          {translate("admin.settings.enableMethods")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { id: "vodafone", label: "Vodafone Cash", badge: translate("admin.settings.localPayment"), icon: Smartphone, enabled: vodafoneEnabled, setEnabled: setVodafoneEnabled },
            { id: "instapay", label: "InstaPay",      badge: translate("admin.settings.localPayment"), icon: Camera,     enabled: instapayEnabled, setEnabled: setInstapayEnabled },
            { id: "usdt",     label: "USDT (BEP20)",  badge: "BNB Smart Chain", icon: Bitcoin,    enabled: usdtEnabled,     setEnabled: setUsdtEnabled     },
          ] as const).map(({ id, label, badge, icon: Icon, enabled, setEnabled }) => (
            <div key={id} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-zinc-900/50 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <MethodIcon method={id} active={enabled} />
                <div>
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="text-[10px] text-zinc-600">{badge}</p>
                </div>
              </div>
              <Toggle value={enabled} onChange={setEnabled} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ACCOUNTS SECTIONS — one per method
      ══════════════════════════════════════════════════ */}
      {(["vodafone", "instapay", "usdt"] as const).map((method) => {
        const methodAccounts = byMethod(method);
        const isVf = method === "vodafone";
        const isIp = method === "instapay";
        const isUSDT = method === "usdt";
        const methodLabel = isVf ? "Vodafone Cash" : isIp ? "InstaPay" : "USDT (BEP20)";
        const valuePlaceholder = isVf ? "01XXXXXXXXX" : isIp ? translate("admin.settings.accounts.usernamePlaceholder") : "0xXXXXXXXX…";
        const valueLabel = isVf ? translate("admin.settings.accounts.phoneLabel") : isIp ? translate("admin.settings.accounts.usernameLabel") : translate("admin.settings.accounts.walletLabel");
        const showQR = isIp || isUSDT;

        return (
          <section key={method} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MethodIcon method={method} active />
                <div>
                  <p className="text-sm font-black text-white">
                    {translate("admin.settings.accounts.header").replace("{method}", methodLabel)}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {methodAccounts.length} {translate("admin.settings.accounts.count")} ·{" "}
                    {methodAccounts.filter((a) => a.is_active).length} {translate("admin.settings.accounts.active")}
                  </p>
                </div>
              </div>
              {addingMethod !== method && (
                <button
                  type="button"
                  onClick={() => openAdd(method)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 transition hover:bg-purple-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {translate("admin.settings.accounts.addBtn")}
                </button>
              )}
            </div>

            {/* Account list */}
            <div className="space-y-2">
              {loadingAccounts && methodAccounts.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.05] bg-zinc-900/30 py-6 text-zinc-600">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span className="text-xs">{translate("admin.settings.accounts.loading")}</span>
                </div>
              ) : methodAccounts.length === 0 && addingMethod !== method ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/[0.07] bg-zinc-900/20 py-8 text-center text-zinc-600">
                  <Hash className="h-6 w-6 opacity-40" />
                  <p className="text-xs font-semibold">{translate("admin.settings.accounts.empty.title")}</p>
                  <p className="text-[10px]">{translate("admin.settings.accounts.empty.desc")}</p>
                </div>
              ) : (
                methodAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`rounded-2xl border transition-colors ${
                      editId === acc.id
                        ? "border-purple-500/30 bg-purple-500/[0.05]"
                        : acc.is_active
                        ? "border-white/[0.07] bg-zinc-900/50"
                        : "border-white/[0.04] bg-zinc-900/25 opacity-60"
                    }`}
                  >
                    {editId === acc.id ? (
                      /* ── EDIT MODE ── */
                      <div className="space-y-4 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-purple-400">{translate("admin.settings.accounts.editTitle")}</p>
                        <div className={`grid gap-3 ${showQR ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2"}`}>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-zinc-500">{translate("admin.settings.accounts.nameLabel")}</label>
                            <input value={editName} onChange={(e) => setEditName(e.target.value)}
                              placeholder={translate("admin.settings.accounts.namePlaceholder")} className={inp} />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-zinc-500">{valueLabel}</label>
                            <input value={editVal} onChange={(e) => setEditVal(e.target.value)}
                              placeholder={valuePlaceholder} className={inp} dir="ltr" />
                          </div>
                          {showQR && (
                            <QRUpload
                              compact
                              preview={editQr}
                              uploading={qrLoading === `edit-${acc.id}`}
                              onFile={(f) => uploadQR(f, `edit-${acc.id}`, setEditQr)}
                              onClear={() => setEditQr("")}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(acc.id)}
                            disabled={savingId === acc.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                          >
                            {savingId === acc.id
                              ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />}
                            {translate("admin.settings.accounts.save")}
                          </button>
                          <button type="button" onClick={cancelEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition">
                            <X className="h-3.5 w-3.5" /> {translate("admin.settings.accounts.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteId === acc.id ? (
                      /* ── DELETE CONFIRM ── */
                      <div className="flex items-center gap-3 px-4 py-3">
                        <p className="flex-1 text-sm font-bold text-red-300">{translate("admin.settings.accounts.deleteConfirm").replace("{val}", acc.value)}</p>
                        <button
                          type="button"
                          onClick={() => deleteAccount(acc.id)}
                          disabled={deletingId === acc.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                        >
                          {deletingId === acc.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          {translate("admin.settings.accounts.delete")}
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white transition">
                          <X className="h-3 w-3" /> {translate("admin.settings.accounts.cancel")}
                        </button>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Status dot */}
                        <div className={`h-2 w-2 flex-shrink-0 rounded-full ${acc.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />

                        {/* Main info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {acc.name && (
                              <span className="text-[10px] font-bold text-purple-400">{acc.name}</span>
                            )}
                            <span className="font-mono text-sm font-bold text-white truncate" dir="ltr">
                              {isIp ? `@${acc.value}` : acc.value}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[10px]">
                            <span className="inline-flex items-center gap-1 text-zinc-600">
                              <Zap className="h-2.5 w-2.5" />
                              {acc.usage_count} {translate("admin.settings.accounts.usageCount")}
                            </span>
                            <span className="inline-flex items-center gap-1 text-zinc-600">
                              <Clock className="h-2.5 w-2.5" />
                              <RelativeTime iso={acc.last_used_at} />
                            </span>
                            {acc.qr_image && (
                              <span className="text-teal-500">QR ✓</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Toggle
                            value={acc.is_active}
                            onChange={() => toggleActive(acc)}
                            disabled={togglingId === acc.id}
                          />
                          <button type="button" onClick={() => startEdit(acc)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.08] bg-zinc-800/60 text-zinc-500 hover:border-purple-500/30 hover:text-purple-300 transition">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(acc.id)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.06] bg-zinc-900/40 text-zinc-600 hover:border-red-500/30 hover:text-red-400 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* ── ADD FORM (inline) ── */}
              {addingMethod === method && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">{translate("admin.settings.accounts.addFormTitle")}</p>
                  <div className={`grid gap-3 ${showQR ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2"}`}>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-zinc-500">{translate("admin.settings.accounts.nameLabel")}</label>
                      <input value={addName} onChange={(e) => setAddName(e.target.value)}
                        placeholder={translate("admin.settings.accounts.namePlaceholder")} className={inp} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-zinc-500">{valueLabel} *</label>
                      <div className="relative">
                        {isIp && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600 pointer-events-none">@</span>
                        )}
                        <input
                          value={addVal}
                          onChange={(e) => setAddVal(e.target.value.replace(/^@/, ""))}
                          placeholder={valuePlaceholder}
                          className={`${inp} ${isIp ? "pr-8" : ""}`}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {showQR && (
                      <QRUpload
                        compact
                        preview={addQr}
                        uploading={qrLoading === "add"}
                        onFile={(f) => uploadQR(f, "add", setAddQr)}
                        onClear={() => setAddQr("")}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => submitAdd(method)}
                      disabled={addSaving || !addVal.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      {addSaving
                        ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        : <Plus className="h-3.5 w-3.5" />}
                      {translate("admin.settings.accounts.addSave")}
                    </button>
                    <button type="button" onClick={cancelAdd}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition">
                      <X className="h-3.5 w-3.5" /> {translate("admin.settings.accounts.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ══════════════════════════════════════════════════
          USDT Exchange Rate Settings
      ══════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-white/[0.07] bg-zinc-900/50 p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{translate("admin.settings.usdt.title")}</p>
            <p className="text-[10px] text-zinc-600">{translate("admin.settings.usdt.desc")}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-zinc-500">{translate("admin.settings.usdt.rateLabel")}</label>
            <div className="relative">
              <input value={usdtRateEgp} onChange={(e) => setUsdtRateEgp(e.target.value)}
                type="number" min="1" step="0.5" placeholder="50" className={inp} dir="ltr" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 pointer-events-none">EGP / USDT</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-zinc-500">{translate("admin.settings.usdt.feeLabel")}</label>
            <div className="relative">
              <input value={usdtFeePct} onChange={(e) => setUsdtFeePct(e.target.value)}
                type="number" min="0" max="20" step="0.1" placeholder="3" className={inp} dir="ltr" />
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.05] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-3">{translate("admin.settings.usdt.preview.title")}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3 py-2.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">{translate("admin.settings.usdt.preview.example")}</p>
              <p className="text-sm font-black text-white">{exampleEgp} EGP</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 px-3 py-2.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">{translate("admin.settings.usdt.preview.base")}</p>
              <p className="text-sm font-black text-amber-300">{exampleBase.toFixed(4)} USDT</p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">{translate("admin.settings.usdt.preview.afterFees")}</p>
              <p className="text-sm font-black text-emerald-300">{exampleTotal} USDT</p>
            </div>
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-700 text-center">
            {exampleEgp} EGP ÷ {exampleRate} × (1 + {exampleFee}%) = <span className="text-zinc-400 font-bold">{exampleTotal} USDT</span>
          </p>
        </div>
      </section>

      {/* ── Network notice ─────────────────────────────── */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
        <Shield className="h-4 w-4 flex-shrink-0 text-amber-400" />
        <p className="text-[11px] font-bold text-amber-300/80">
          {translate("admin.settings.usdt.network")}
        </p>
      </div>

    </div>
  );
}

export default function SettingsPage() {
  return <AdminOnlyGuard><SettingsPageInner /></AdminOnlyGuard>;
}
