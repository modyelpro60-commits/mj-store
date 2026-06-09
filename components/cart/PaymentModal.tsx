"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
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
  X,
  XCircle,
} from "lucide-react";
import { PAYMENT } from "../../app/lib/payment/config";

function egp(n: number) {
  return `${n.toLocaleString()} EGP`;
}

type Step = "method" | "pay" | "upload";

export default function PaymentModal({
  open,
  onClose,
  accessToken,
  subtotal,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  accessToken: string | null;
  subtotal: number;
  onPaid?: () => void;
}) {
  const router = useRouter();

  /* ── State ── */
  const [step,      setStep]      = useState<Step>("method");
  const [method,    setMethod]    = useState<"vodafone" | "instapay" | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [qrError,   setQrError]   = useState(false);

  /* Proof upload */
  const fileRef                              = useRef<HTMLInputElement>(null);
  const [proofFile,    setProofFile]         = useState<File | null>(null);
  const [proofPreview, setProofPreview]      = useState<string | null>(null);
  const [isDragging,   setIsDragging]        = useState(false);
  const [uploadError,  setUploadError]       = useState<string | null>(null);

  /* Submission */
  const [uploading,  setUploading]  = useState(false);
  const [placing,    setPlacing]    = useState(false);

  /* ── Helpers ── */
  function reset() {
    setStep("method");
    setMethod(null);
    setCopied(false);
    setQrError(false);
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
  function pick(m: "vodafone" | "instapay") {
    setMethod(m);
    setStep("pay");
  }
  function copyNumber() {
    navigator.clipboard
      ?.writeText(PAYMENT.vodafone.number)
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
  function removeProof() { setProofFile(null); setProofPreview(null); }

  /* ── Drag & Drop ── */
  function onDragOver(e: React.DragEvent)  { e.preventDefault(); setIsDragging(true);  }
  function onDragLeave()                   { setIsDragging(false); }
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

    /* 2. Place the order */
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ method, payment_proof_url: proofUrl }),
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
    step === "pay"    ? (method === "vodafone" ? "فودافون كاش" : "إنستا باي") :
                        "ارفع صورة الإيصال";

  /* ── Step indicator (1→2→3) ── */
  const STEPS: { key: Step; label: string }[] = [
    { key: "method", label: "الطريقة" },
    { key: "pay",    label: "التحويل" },
    { key: "upload", label: "الإيصال" },
  ];
  const stepIdx = step === "method" ? 0 : step === "pay" ? 1 : 2;

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
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={placing || uploading}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <h3 className="text-base font-black text-white">{stepTitle}</h3>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={placing || uploading}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-white/30 hover:text-white disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ── Step indicator ── */}
              <div className="flex items-center gap-0" dir="ltr">
                {STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center">
                    {/* dot */}
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
                    {/* connector */}
                    {i < STEPS.length - 1 && (
                      <div className="relative mx-1.5 mb-3.5 h-px w-10 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-400"
                          style={{ width: i < stepIdx ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Amount chip ── */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-zinc-400">المبلغ المطلوب</span>
                <span className="text-lg font-black text-white" style={{ textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
                  {egp(subtotal)}
                </span>
              </div>

              {/* ════════════════════════════════
                  STEP CONTENT
              ════════════════════════════════ */}
              <AnimatePresence mode="wait" initial={false}>

                {/* ── STEP 1: Choose method ── */}
                {step === "method" && (
                  <motion.div
                    key="method"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => pick("vodafone")}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-right transition hover:bg-red-500/[0.12]"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-white">Vodafone Cash</p>
                        <p className="text-xs text-zinc-500">حوّل على رقم المحفظة</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                    </button>

                    <button
                      type="button"
                      onClick={() => pick("instapay")}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-4 text-right transition hover:bg-purple-500/[0.12]"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-white">InstaPay</p>
                        <p className="text-xs text-zinc-500">امسح كود الـ QR وحوّل</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: Payment instructions ── */}
                {step === "pay" && (
                  <motion.div
                    key="pay"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {method === "vodafone" ? (
                      <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4 text-center">
                        <p className="text-xs text-zinc-400">حوّل المبلغ على رقم فودافون كاش</p>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-2xl font-black tracking-wider text-white" dir="ltr">
                            {PAYMENT.vodafone.number}
                          </span>
                          <button
                            type="button"
                            onClick={copyNumber}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white"
                          >
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-zinc-950/50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400 text-right">
                          ١. افتح تطبيق فودافون كاش<br />
                          ٢. اضغط «تحويل أموال»<br />
                          ٣. حوّل <span className="font-bold text-white">{egp(subtotal)}</span> للرقم أعلاه<br />
                          ٤. خذ <span className="font-bold text-amber-300">سكرين شوت للإيصال</span> — ستحتاجه في الخطوة التالية
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.05] p-4 text-center">
                        <p className="mb-3 text-xs text-zinc-400">امسح الـ QR من تطبيق إنستا باي</p>
                        {qrError ? (
                          <div className="mx-auto grid h-44 w-44 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center text-[11px] leading-relaxed text-zinc-600">
                            ضع صورة الـ QR في<br /><span className="text-zinc-400">public/instapay-qr.png</span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={PAYMENT.instapay.qrImage}
                            alt="InstaPay QR"
                            onError={() => setQrError(true)}
                            className="mx-auto h-44 w-44 rounded-xl border border-white/10 bg-white object-contain p-1"
                          />
                        )}
                        {PAYMENT.instapay.handle && (
                          <p className="mt-2 text-sm font-bold text-purple-200" dir="ltr">
                            {PAYMENT.instapay.handle}
                          </p>
                        )}
                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-zinc-950/50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400 text-right">
                          بعد التحويل خذ <span className="font-bold text-amber-300">سكرين شوت للإيصال</span> — ستحتاجه في الخطوة التالية
                        </div>
                      </div>
                    )}

                    {/* Next → upload step */}
                    <button
                      type="button"
                      onClick={() => setStep("upload")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.55)]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      التالي — رفع الإيصال
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 3: Upload proof ── */}
                {step === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {uploadError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2.5 text-sm text-red-300"
                        >
                          <XCircle className="h-4 w-4 shrink-0" />
                          {uploadError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hidden file input */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) acceptFile(f);
                        e.target.value = "";
                      }}
                    />

                    {/* Upload zone / preview */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">صورة إيصال التحويل</p>
                        <span className="text-[10px] font-bold text-red-400">* مطلوبة</span>
                      </div>

                      <AnimatePresence mode="wait">
                        {proofPreview ? (
                          /* ── Preview ── */
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-950/70"
                          >
                            {/* Image */}
                            <div className="relative bg-zinc-950">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proofPreview}
                                alt="Payment proof"
                                className="w-full object-contain"
                                style={{ maxHeight: "220px" }}
                              />
                              <div className="absolute left-2 top-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 backdrop-blur-sm">
                                  <CheckCircle className="h-2.5 w-2.5" />
                                  الصورة جاهزة
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 border-t border-white/[0.05] px-3 py-2.5">
                              <p className="flex-1 truncate text-xs text-zinc-600">
                                {proofFile?.name ?? "صورة الإيصال"}
                              </p>
                              <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-400 transition hover:border-purple-500/30 hover:text-purple-300"
                              >
                                <RefreshCw className="h-3 w-3" />
                                استبدال
                              </button>
                              <button
                                type="button"
                                onClick={removeProof}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/15"
                              >
                                <Trash2 className="h-3 w-3" />
                                إزالة
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          /* ── Drop zone ── */
                          <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            role="button"
                            tabIndex={0}
                            onClick={() => fileRef.current?.click()}
                            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
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
                                : <Upload className="h-5 w-5" />
                              }
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-black">
                                {isDragging ? "أفلت الصورة هنا" : "اضغط أو اسحب صورة الإيصال"}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-600">PNG · JPG · WEBP · حتى 8MB</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── Done button ── */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={done}
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
                          <><Check className="h-4 w-4" /> إتمام الطلب</>
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
