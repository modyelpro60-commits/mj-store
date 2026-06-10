"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronLeft,
  Copy,
  ImageIcon,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  Trash2,
  Upload,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import type { PaymentAccount } from "../../app/lib/payment/config";

/* ── Types ─────────────────────────────────────────────────── */
type Method = "vodafone" | "instapay" | "usdt";
type Step   = "method" | "pay" | "upload";

/* ── Helpers ────────────────────────────────────────────────── */
function egp(n: number) {
  return `${n.toLocaleString("en")} EGP`;
}

/* ═══════════════════════════════════════════════════════════════
   PaymentModal
   - Fetches the active assigned account from /api/payment-accounts/next
   - Displays live values (no hardcoded numbers anywhere)
   - Passes payment_account_id to the order so the account is locked
═══════════════════════════════════════════════════════════════ */
export default function PaymentModal({
  open,
  onClose,
  accessToken,
  subtotal,
  onPaid,
}: {
  open:         boolean;
  onClose:      () => void;
  accessToken:  string | null;
  subtotal:     number;
  onPaid?:      () => void;
}) {
  const router = useRouter();

  /* ── Wizard ── */
  const [step,   setStep]   = useState<Step>("method");
  const [method, setMethod] = useState<Method | null>(null);

  /* ── Live payment account from DB ── */
  const [assignedAccount,  setAssignedAccount]  = useState<PaymentAccount | null>(null);
  const [accountLoading,   setAccountLoading]   = useState(false);
  const [accountError,     setAccountError]     = useState(false);

  /* ── USDT rate settings ── */
  const [usdtRate,    setUsdtRate]    = useState(50);
  const [usdtFeePct,  setUsdtFeePct]  = useState(3);

  /* ── Copy ── */
  const [copied, setCopied] = useState(false);

  /* ── Proof upload ── */
  const fileRef                              = useRef<HTMLInputElement>(null);
  const [proofFile,    setProofFile]         = useState<File | null>(null);
  const [proofPreview, setProofPreview]      = useState<string | null>(null);
  const [isDragging,   setIsDragging]        = useState(false);
  const [uploadError,  setUploadError]       = useState<string | null>(null);

  /* ── Submission ── */
  const [uploading, setUploading] = useState(false);
  const [placing,   setPlacing]   = useState(false);

  /* ── Derived: USDT amount ── */
  const usdtAmount = usdtRate > 0
    ? Math.ceil((subtotal / usdtRate) * (1 + usdtFeePct / 100) * 100) / 100
    : 0;

  /* ── Fetch USDT rate on mount ── */
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const rate = parseFloat(d.usdt_rate_egp);
        const fee  = parseFloat(d.usdt_fee_pct);
        if (rate > 0) setUsdtRate(rate);
        if (fee >= 0) setUsdtFeePct(fee);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  /* ── Fetch assigned account whenever method changes ── */
  useEffect(() => {
    if (!method || !accessToken) return;
    setAssignedAccount(null);
    setAccountError(false);
    setAccountLoading(true);
    fetch(`/api/payment-accounts/next?method=${method}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PaymentAccount | null) => {
        setAssignedAccount(data);
        setAccountError(!data);
      })
      .catch(() => { setAssignedAccount(null); setAccountError(true); })
      .finally(() => setAccountLoading(false));
  }, [method, accessToken]);

  /* ── Helpers ── */
  function reset() {
    setStep("method");
    setMethod(null);
    setAssignedAccount(null);
    setAccountLoading(false);
    setAccountError(false);
    setCopied(false);
    setProofFile(null);
    setProofPreview(null);
    setIsDragging(false);
    setUploadError(null);
    setUploading(false);
    setPlacing(false);
  }

  function close() {
    if (placing || uploading) return;
    reset();
    onClose();
  }

  function pick(m: Method) {
    setMethod(m);
    setStep("pay");
  }

  function copyAccount() {
    const val = assignedAccount?.value;
    if (!val) return;
    navigator.clipboard.writeText(val)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  }

  function goBack() {
    if (step === "pay")    { setStep("method"); setMethod(null); }
    if (step === "upload") { setStep("pay"); }
  }

  /* ── Proof file ── */
  function acceptFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("يرجى اختيار صورة فقط (PNG · JPG · WEBP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("حجم الصورة يجب أن يكون أقل من 8MB");
      return;
    }
    setUploadError(null);
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setProofPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeProof() {
    setProofFile(null);
    setProofPreview(null);
  }

  /* ── Drag & Drop ── */
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  /* ── Submit ── */
  async function done() {
    if (!proofFile || !method || placing || uploading) return;
    setUploadError(null);

    /* 1. Upload proof image */
    setUploading(true);
    let proofUrl: string;
    try {
      const fd = new FormData();
      fd.append("file", proofFile);
      const upRes  = await fetch("/api/chat/upload", {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body:    fd,
      });
      const upData = await upRes.json() as { success?: boolean; url?: string; error?: string };
      if (!upData.success || !upData.url) {
        setUploadError(upData.error ?? "فشل رفع الصورة، حاول مرة أخرى.");
        return;
      }
      proofUrl = upData.url;
    } catch {
      setUploadError("خطأ في الاتصال أثناء رفع الصورة.");
      return;
    } finally {
      setUploading(false);
    }

    /* 2. Place the order — pass account_id so the server locks it to this order */
    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        method,
        payment_proof_url:  proofUrl,
        payment_account_id: assignedAccount?.id ?? null,
      };
      if (method === "usdt") {
        body.usdt_amount  = usdtAmount;
        body.usdt_rate    = usdtRate;
        body.usdt_fee_pct = usdtFeePct;
      }

      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        onPaid?.();
        reset();
        onClose();
        router.push(d.roomId ? `/chat?room=${d.roomId}` : "/chat");
      } else {
        toast.error(d.error ?? "تعذّر إنشاء الطلب");
        setPlacing(false);
      }
    } catch {
      toast.error("تعذّر إنشاء الطلب");
      setPlacing(false);
    }
  }

  /* ── Step title ── */
  const stepTitle =
    step === "method" ? "اختر طريقة الدفع" :
    step === "pay"    ? (method === "vodafone" ? "فودافون كاش" : method === "instapay" ? "إنستا باي" : "USDT (BEP20)") :
                        "ارفع صورة الإيصال";

  const STEPS: { key: Step; label: string }[] = [
    { key: "method", label: "الطريقة" },
    { key: "pay",    label: "التحويل" },
    { key: "upload", label: "الإيصال" },
  ];
  const stepIdx = step === "method" ? 0 : step === "pay" ? 1 : 2;

  /* ── Account value display helper ── */
  function AccountBlock() {
    if (accountLoading) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-zinc-900/40 py-6 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-semibold">جاري تحميل بيانات الحساب…</span>
        </div>
      );
    }
    if (accountError || !assignedAccount) {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>لا توجد حسابات متاحة لهذه الطريقة حالياً. جرّب طريقة أخرى أو تواصل مع الدعم.</span>
        </div>
      );
    }
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0B18] shadow-[0_40px_100px_rgba(0,0,0,0.75)]"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center gap-2">
                {step !== "method" && (
                  <button type="button" onClick={goBack} disabled={placing || uploading}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <h3 className="text-base font-black text-white">{stepTitle}</h3>
              </div>
              <button type="button" onClick={close} disabled={placing || uploading}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-white/30 hover:text-white disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ── Step indicator ── */}
              <div className="flex items-center gap-0" dir="ltr">
                {STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={[
                        "h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-black transition-all",
                        i < stepIdx
                          ? "border-emerald-500 bg-emerald-600/20 text-emerald-400"
                          : i === stepIdx
                          ? "border-purple-500 bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          : "border-zinc-700 bg-zinc-800 text-zinc-600",
                      ].join(" ")}>
                        {i < stepIdx ? <CheckCircle className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold ${i === stepIdx ? "text-white" : i < stepIdx ? "text-emerald-400" : "text-zinc-600"}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="relative mx-1.5 mb-3.5 h-px w-10 overflow-hidden rounded-full bg-zinc-800">
                        <div className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-400"
                          style={{ width: i < stepIdx ? "100%" : "0%" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Amount chip ── */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-zinc-400">المبلغ المطلوب</span>
                <div className="text-right">
                  <span className="text-lg font-black text-white" style={{ textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
                    {egp(subtotal)}
                  </span>
                  {method === "usdt" && usdtAmount > 0 && (
                    <p className="text-xs font-bold text-yellow-400 tabular-nums">
                      ≈ {usdtAmount} USDT
                    </p>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════
                  STEP CONTENT
              ════════════════════════════════ */}
              <AnimatePresence mode="wait" initial={false}>

                {/* ── STEP 1: Choose method ── */}
                {step === "method" && (
                  <motion.div key="method"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {/* Vodafone Cash */}
                    <button type="button" onClick={() => pick("vodafone")}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-right transition hover:bg-red-500/[0.12]">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-white">Vodafone Cash</p>
                        <p className="text-xs text-zinc-500">حوّل على رقم المحفظة</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                    </button>

                    {/* InstaPay */}
                    <button type="button" onClick={() => pick("instapay")}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-4 text-right transition hover:bg-purple-500/[0.12]">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-white">InstaPay</p>
                        <p className="text-xs text-zinc-500">امسح كود الـ QR وحوّل</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                    </button>

                    {/* USDT */}
                    <button type="button" onClick={() => pick("usdt")}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/[0.05] p-4 text-right transition hover:bg-yellow-500/[0.10]">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-yellow-600/80 text-white shadow-[0_0_20px_rgba(234,179,8,0.35)]">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-white">USDT (BEP20)</p>
                        <p className="text-xs text-zinc-500">BNB Smart Chain</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: Payment instructions ── */}
                {step === "pay" && (
                  <motion.div key="pay"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Account error / loading */}
                    <AccountBlock />

                    {/* ── Vodafone Cash ── */}
                    {method === "vodafone" && assignedAccount && (
                      <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4 text-center">
                        <p className="text-xs text-zinc-400">حوّل المبلغ على رقم فودافون كاش</p>
                        {assignedAccount.name && (
                          <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">{assignedAccount.name}</p>
                        )}
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-2xl font-black tracking-wider text-white" dir="ltr">
                            {assignedAccount.value}
                          </span>
                          <button type="button" onClick={copyAccount}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white">
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        {copied && <p className="mt-1 text-[10px] font-bold text-emerald-400">✓ تم النسخ!</p>}

                        {/* QR if available */}
                        {assignedAccount.qr_image && (
                          <div className="mt-3 flex justify-center">
                            <img src={assignedAccount.qr_image} alt="QR"
                              className="h-40 w-40 rounded-xl border border-white/10 bg-white object-contain p-1"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}

                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-zinc-950/50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400 text-right">
                          ١. افتح تطبيق فودافون كاش<br />
                          ٢. اضغط «تحويل أموال»<br />
                          ٣. حوّل <span className="font-bold text-white">{egp(subtotal)}</span> للرقم أعلاه<br />
                          ٤. خذ <span className="font-bold text-amber-300">سكرين شوت للإيصال</span> — ستحتاجه في الخطوة التالية
                        </div>
                      </div>
                    )}

                    {/* ── InstaPay ── */}
                    {method === "instapay" && assignedAccount && (
                      <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.05] p-4 text-center">
                        <p className="mb-1 text-xs text-zinc-400">حوّل عبر InstaPay إلى</p>
                        {assignedAccount.name && (
                          <p className="text-[11px] font-semibold text-zinc-500 mb-2">{assignedAccount.name}</p>
                        )}

                        {/* Handle / username */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="text-xl font-black text-white" dir="ltr">
                            @{assignedAccount.value}
                          </span>
                          <button type="button" onClick={copyAccount}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white">
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        {copied && <p className="mb-2 text-[10px] font-bold text-emerald-400">✓ تم النسخ!</p>}

                        {/* QR if available */}
                        {assignedAccount.qr_image ? (
                          <img src={assignedAccount.qr_image} alt="InstaPay QR"
                            className="mx-auto h-44 w-44 rounded-xl border border-white/10 bg-white object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="mx-auto grid h-36 w-36 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center text-[11px] leading-relaxed text-zinc-600">
                            <QrCode className="h-8 w-8 mb-1 opacity-30" />
                            لا يوجد QR
                          </div>
                        )}

                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-zinc-950/50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400 text-right">
                          ١. افتح تطبيق InstaPay أو بنكك<br />
                          ٢. حوّل <span className="font-bold text-white">{egp(subtotal)}</span> للحساب أعلاه<br />
                          ٣. خذ <span className="font-bold text-amber-300">سكرين شوت للإيصال</span> — ستحتاجه في الخطوة التالية
                        </div>
                      </div>
                    )}

                    {/* ── USDT ── */}
                    {method === "usdt" && assignedAccount && (
                      <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.04] p-4 space-y-3">
                        {/* BEP20 warning */}
                        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                          <p className="text-xs font-bold text-red-300">
                            تأكد من الإرسال على شبكة <span className="text-white">BNB Smart Chain (BEP20)</span> فقط
                          </p>
                        </div>

                        {/* USDT amount */}
                        <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600 mb-1">المبلغ المطلوب</p>
                          <p className="text-3xl font-black tabular-nums text-yellow-300">
                            {usdtAmount} <span className="text-lg text-yellow-400/80">USDT</span>
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-600">
                            {subtotal.toLocaleString("en")} EGP ÷ {usdtRate} + {usdtFeePct}% رسوم
                          </p>
                        </div>

                        {/* Wallet address */}
                        {assignedAccount.name && (
                          <p className="text-[11px] font-semibold text-zinc-500 text-center">{assignedAccount.name}</p>
                        )}
                        <div className="rounded-xl border border-yellow-500/20 bg-zinc-950/50 px-3 py-2.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">عنوان المحفظة</p>
                          <div className="flex items-center gap-2">
                            <p className="flex-1 break-all text-xs font-mono text-zinc-300 leading-relaxed" dir="ltr">
                              {assignedAccount.value}
                            </p>
                            <button type="button" onClick={copyAccount}
                              className="shrink-0 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-yellow-300">
                              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          {copied && <p className="mt-1 text-[10px] font-bold text-emerald-400">✓ تم النسخ!</p>}
                        </div>

                        {/* QR if available */}
                        {assignedAccount.qr_image && (
                          <div className="flex justify-center">
                            <img src={assignedAccount.qr_image} alt="USDT QR"
                              className="h-40 w-40 rounded-xl border border-yellow-500/20 bg-white object-contain p-1"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}

                        <div className="rounded-xl border border-white/[0.05] bg-zinc-950/50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400 text-right">
                          ١. افتح محفظتك (Trust Wallet / MetaMask / Binance…)<br />
                          ٢. اختر شبكة <span className="font-bold text-white">BNB Smart Chain</span><br />
                          ٣. أرسل <span className="font-bold text-yellow-300">{usdtAmount} USDT</span> للعنوان أعلاه<br />
                          ٤. خذ <span className="font-bold text-amber-300">سكرين شوت للمعاملة</span> — ستحتاجه في الخطوة التالية
                        </div>
                      </div>
                    )}

                    {/* Next → upload (only enabled when account is loaded) */}
                    <button type="button"
                      onClick={() => setStep("upload")}
                      disabled={accountLoading || accountError || !assignedAccount}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.55)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ImageIcon className="h-4 w-4" />
                      التالي — رفع الإيصال
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 3: Upload proof ── */}
                {step === "upload" && (
                  <motion.div key="upload"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {uploadError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2.5 text-sm text-red-300"
                        >
                          <XCircle className="h-4 w-4 shrink-0" />
                          {uploadError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Payment reminder chip */}
                    {assignedAccount && (
                      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-4 py-3">
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${
                          method === "usdt"
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                            : method === "instapay"
                            ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                            : "border-red-500/20 bg-red-500/10 text-red-300"
                        }`}>
                          {method === "usdt" ? <Wallet className="h-4 w-4" /> : method === "instapay" ? <QrCode className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                            {method === "vodafone" ? "Vodafone Cash" : method === "instapay" ? "InstaPay" : "USDT (BEP20)"}
                          </p>
                          <p className="truncate text-sm font-bold text-white font-mono" dir="ltr">
                            {method === "instapay" ? "@" : ""}
                            {assignedAccount.value.length > 22
                              ? `${assignedAccount.value.slice(0, 14)}…`
                              : assignedAccount.value}
                          </p>
                          <p className="text-xs tabular-nums text-zinc-500">
                            {method === "usdt"
                              ? <span className="text-yellow-400">{usdtAmount} USDT</span>
                              : <span className="text-purple-300">{egp(subtotal)}</span>}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); e.target.value = ""; }} />

                    {/* Upload zone / preview */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                          {method === "usdt" ? "سكرين شوت المعاملة" : "صورة إيصال التحويل"}
                        </p>
                        <span className="text-[10px] font-bold text-red-400">* مطلوبة</span>
                      </div>

                      <AnimatePresence mode="wait">
                        {proofPreview ? (
                          <motion.div key="preview"
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-950/70"
                          >
                            <div className="relative bg-zinc-950">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={proofPreview} alt="Payment proof"
                                className="w-full object-contain" style={{ maxHeight: "220px" }} />
                              <div className="absolute left-2 top-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 backdrop-blur-sm">
                                  <CheckCircle className="h-2.5 w-2.5" />
                                  الصورة جاهزة
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 border-t border-white/[0.05] px-3 py-2.5">
                              <p className="flex-1 truncate text-xs text-zinc-600">{proofFile?.name ?? "صورة الإيصال"}</p>
                              <button type="button" onClick={() => fileRef.current?.click()}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-400 transition hover:border-purple-500/30 hover:text-purple-300">
                                <RefreshCw className="h-3 w-3" /> استبدال
                              </button>
                              <button type="button" onClick={removeProof}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/15">
                                <Trash2 className="h-3 w-3" /> إزالة
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="dropzone"
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            role="button" tabIndex={0}
                            onClick={() => fileRef.current?.click()}
                            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                            className={[
                              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-5 transition-all duration-200",
                              isDragging
                                ? "border-purple-500/60 bg-purple-500/[0.08] text-purple-300"
                                : "border-white/[0.1] bg-white/[0.02] text-zinc-500 hover:border-purple-500/40 hover:bg-purple-500/[0.04] hover:text-purple-300",
                            ].join(" ")}
                          >
                            <div className={`grid h-12 w-12 place-items-center rounded-2xl border transition-colors ${isDragging ? "border-purple-500/30 bg-purple-500/15" : "border-white/[0.08] bg-zinc-800/60"}`}>
                              {isDragging
                                ? <Upload className="h-5 w-5 text-purple-400 animate-bounce" />
                                : <Upload className="h-5 w-5" />}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-black">{isDragging ? "أفلت الصورة هنا" : "اضغط أو اسحب صورة الإيصال"}</p>
                              <p className="mt-0.5 text-xs text-zinc-600">PNG · JPG · WEBP · حتى 8MB</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Done button */}
                    <div className="space-y-2">
                      <button type="button" onClick={done}
                        disabled={!proofFile || placing || uploading}
                        className={[
                          "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-all",
                          proofFile && !placing && !uploading
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:shadow-[0_0_44px_rgba(168,85,247,0.55)] cursor-pointer"
                            : (placing || uploading)
                            ? "bg-purple-500/20 text-purple-400 cursor-not-allowed"
                            : "bg-zinc-800/70 text-zinc-500 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> جاري رفع الصورة…</>
                        ) : placing ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> جاري إنشاء الطلب…</>
                        ) : proofFile ? (
                          <><CheckCircle className="h-4 w-4" /> إتمام الطلب</>
                        ) : (
                          <><Upload className="h-4 w-4" /> ارفع صورة الإيصال أولاً</>
                        )}
                      </button>
                      <p className="text-center text-[10px] leading-relaxed text-zinc-700">
                        بالضغط فإنك تؤكد أن عملية التحويل تمت فعلاً.
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
