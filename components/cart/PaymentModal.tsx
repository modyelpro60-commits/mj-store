"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  Copy,
  Loader2,
  QrCode,
  Smartphone,
  X,
} from "lucide-react";
import { PAYMENT } from "../../app/lib/payment/config";

function egp(n: number) {
  return `${n.toLocaleString()} EGP`;
}

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
  const [step, setStep] = useState<"method" | "pay">("method");
  const [method, setMethod] = useState<"vodafone" | "instapay" | null>(null);
  const [placing, setPlacing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  function reset() {
    setStep("method");
    setMethod(null);
    setCopied(false);
    setQrError(false);
  }
  function close() {
    if (placing) return;
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
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  async function done() {
    if (placing || !method) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const d = await res.json();
      if (d.success) {
        try {
          localStorage.setItem("mj_payment_chat", "1");
        } catch {}
        onPaid?.();
        reset();
        onClose();
        router.push("/");
      } else {
        toast.error(d.error ?? "تعذّر إنشاء الطلب");
        setPlacing(false);
      }
    } catch {
      toast.error("تعذّر إنشاء الطلب");
      setPlacing(false);
    }
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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center gap-2">
                {step === "pay" && (
                  <button onClick={() => setStep("method")} className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white">
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <h3 className="text-base font-black text-white">
                  {step === "method" ? "اختر طريقة الدفع" : method === "vodafone" ? "فودافون كاش" : "إنستا باي"}
                </h3>
              </div>
              <button onClick={close} className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-white/30 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Total */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-zinc-400">المبلغ المطلوب</span>
                <span className="text-lg font-black text-white" style={{ textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
                  {egp(subtotal)}
                </span>
              </div>

              {step === "method" ? (
                <div className="space-y-3">
                  {/* Vodafone Cash */}
                  <button onClick={() => pick("vodafone")}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-right transition hover:bg-red-500/[0.12]">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">Vodafone Cash</p>
                      <p className="text-xs text-zinc-500">حوّل على رقم المحفظة</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                  </button>

                  {/* InstaPay */}
                  <button onClick={() => pick("instapay")}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-4 text-right transition hover:bg-purple-500/[0.12]">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">InstaPay</p>
                      <p className="text-xs text-zinc-500">امسح كود الـ QR وحوّل</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {method === "vodafone" ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4 text-center">
                      <p className="text-xs text-zinc-400">حوّل المبلغ على رقم فودافون كاش</p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="text-2xl font-black tracking-wider text-white" dir="ltr">{PAYMENT.vodafone.number}</span>
                        <button onClick={copyNumber} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white">
                          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
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
                        <img src={PAYMENT.instapay.qrImage} alt="InstaPay QR" onError={() => setQrError(true)}
                          className="mx-auto h-44 w-44 rounded-xl border border-white/10 bg-white object-contain p-1" />
                      )}
                      {PAYMENT.instapay.handle && (
                        <p className="mt-2 text-sm font-bold text-purple-200" dir="ltr">{PAYMENT.instapay.handle}</p>
                      )}
                    </div>
                  )}

                  {/* BIG screenshot warning */}
                  <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/[0.10] p-4">
                    <div className="flex items-center gap-2 text-amber-300">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <p className="text-base font-black">مهم جداً</p>
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold leading-relaxed text-amber-100">
                      <Camera className="h-4 w-4 shrink-0" />
                      خُد <span className="underline">سكرين شوت</span> لإثبات التحويل قبل ما تضغط Done — هتحتاج ترفعه في الشات.
                    </p>
                  </div>

                  <button onClick={done} disabled={placing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.55)] disabled:opacity-60">
                    {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {placing ? "جاري..." : "حوّلت — Done"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
