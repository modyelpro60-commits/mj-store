"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  HeadphonesIcon,
  LoaderCircle,
  Lock,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  Upload,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useAnalytics } from "../../lib/analytics/useAnalytics";
import { PAYMENT, PAYMENT_METHODS } from "../lib/payment/config";

/* ─────────────────────────── Types ─────────────────────────── */
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  features?: string[] | string | null;
}
type PaymentMethodId = "vodafone" | "instapay";
type Step = 1 | 2;

/* ─────────────────────────── Helpers ───────────────────────── */
function normalizeFeatures(f: Product["features"]): string[] {
  if (!f) return [];
  if (Array.isArray(f)) return f.filter(Boolean) as string[];
  try {
    const p = JSON.parse(f as string);
    if (Array.isArray(p)) return p.filter(Boolean);
  } catch {}
  return (f as string).split(",").map((s) => s.trim()).filter(Boolean);
}

/* ─────────────────────────── Step Indicator ────────────────── */
function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-7" dir="ltr">
      {/* Step 1 */}
      <div className="flex flex-col items-center gap-1.5">
        <div className={[
          "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300",
          step === 1
            ? "border-purple-500 bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]"
            : "border-emerald-500 bg-emerald-600/20 text-emerald-400",
        ].join(" ")}>
          {step > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
        </div>
        <span className={`text-[10px] font-bold transition-colors ${step === 1 ? "text-white" : "text-emerald-400"}`}>
          الدفع
        </span>
      </div>

      {/* Connector */}
      <div className="relative mx-2 mb-4 h-0.5 w-16 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-purple-500"
          initial={{ width: step > 1 ? "100%" : "0%" }}
          animate={{ width: step > 1 ? "100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Step 2 */}
      <div className="flex flex-col items-center gap-1.5">
        <div className={[
          "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300",
          step === 2
            ? "border-purple-500 bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]"
            : "border-zinc-700 bg-zinc-800/60 text-zinc-600",
        ].join(" ")}>
          2
        </div>
        <span className={`text-[10px] font-bold transition-colors ${step === 2 ? "text-white" : "text-zinc-600"}`}>
          إثبات الدفع
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Success Screen ─────────────────── */
function SuccessScreen({ orderId, roomId }: { orderId: number | null; roomId: string | null }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push(roomId ? `/chat?room=${roomId}` : "/chat");
    }, 3000);
    return () => clearTimeout(t);
  }, [roomId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.09),transparent_60%)]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md text-center"
      >
        {/* Animated check */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            className="absolute inset-0 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="absolute inset-3 rounded-full border border-emerald-500/40 bg-emerald-500/15 flex items-center justify-center"
          >
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
            className="absolute inset-0 rounded-full border border-emerald-500/25"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
        >
          <h2 className="text-3xl font-black text-white">تم إنشاء الطلب! ✅</h2>
          {orderId && (
            <p className="mt-1 text-zinc-400 text-sm">
              رقم الطلب: <span className="text-white font-bold">#{orderId}</span>
            </p>
          )}
          <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
            تم إرسال صورة الدفع للأدمن — سيراجعها ويتواصل معك قريباً.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <motion.button
              onClick={() => router.push(roomId ? `/chat?room=${roomId}` : "/chat")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-7 py-3.5 text-base font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.35)]"
            >
              <MessageCircle className="h-4 w-4" />
              فتح محادثة الطلب
            </motion.button>
            <p className="text-xs text-zinc-700">
              سيتم التحويل تلقائياً…
            </p>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN CHECKOUT CLIENT
═══════════════════════════════════════════════════ */
export default function CheckoutClient() {
  const searchParams              = useSearchParams();
  const router                    = useRouter();
  const productId                 = searchParams.get("product");
  const { accessToken, status, isLoading, signOut, profile } = useAuth();
  const { translate }             = useLanguage();
  const { trackEvent }            = useAnalytics();

  /* ── Wizard step ── */
  const [step, setStep] = useState<Step>(1);

  /* ── Product ── */
  const [product,        setProduct]        = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  /* ── Step 1 form ── */
  const [name,      setName]      = useState("");
  const [nameError, setNameError] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethodId>("vodafone");

  /* ── Step 2 proof upload ── */
  const fileRef                                   = useRef<HTMLInputElement>(null);
  const [proofFile,    setProofFile]              = useState<File | null>(null);
  const [proofPreview, setProofPreview]           = useState<string | null>(null);
  const [isDragging,   setIsDragging]             = useState(false);

  /* ── Submission ── */
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);
  const [orderId,    setOrderId]    = useState<number | null>(null);
  const [roomId,     setRoomId]     = useState<string | null>(null);

  /* ── Prefill name from profile ── */
  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.full_name]);

  /* ── Load product ── */
  useEffect(() => {
    async function load() {
      try {
        const res      = await fetch("/api/get-products");
        const products = (await res.json()) as Product[];
        setProduct(products.find((p) => String(p.id) === productId) || null);
      } finally { setProductLoading(false); }
    }
    load();
  }, [productId]);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    if (status === "Banned") void signOut();
  }, [accessToken, isLoading, signOut, status]);

  useEffect(() => {
    if (product) void trackEvent(product.id, "checkout_start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  /* ── Proof file handling ── */
  function acceptFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("يرجى اختيار صورة فقط"); return; }
    if (file.size > 8 * 1024 * 1024)    { setError("حجم الصورة يجب أن يكون أقل من 8MB"); return; }
    setProofFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setProofPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeProof() {
    setProofFile(null);
    setProofPreview(null);
  }

  /* ── Drag & Drop ── */
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true);  }
  function onDragLeave()                  { setIsDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  /* ── Step navigation ── */
  function goToStep2() {
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    setStep(2);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackToStep1() {
    setStep(1);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!proofFile || !product || !accessToken) return;
    setError(null);
    setSubmitting(true);

    try {
      /* 1 ── Upload proof image */
      setUploading(true);
      const fd = new FormData();
      fd.append("file", proofFile);
      const upRes  = await fetch("/api/chat/upload", {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body:    fd,
      });
      const upData = await upRes.json() as { success?: boolean; url?: string; error?: string };
      setUploading(false);

      if (!upData.success || !upData.url) {
        setError(upData.error ?? "فشل رفع الصورة. حاول مرة أخرى.");
        return;
      }

      /* 2 ── Create order (proof URL already in hand) */
      const res  = await fetch("/api/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customer_name:     name.trim() || profile?.full_name || "العميل",
          product_id:        product.id,
          product_name:      product.name,
          price:             product.price,
          payment_method:    payMethod,
          payment_proof_url: upData.url,
        }),
      });
      const data = await res.json() as { success?: boolean; orderId?: number; roomId?: string; error?: string };

      if (data.success) {
        setOrderId(data.orderId ?? null);
        setRoomId(data.roomId ?? null);
        setSuccess(true);
        void trackEvent(product.id, "add_to_cart");
      } else {
        setError(data.error ?? "حدث خطأ أثناء إنشاء الطلب");
      }
    } catch {
      setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  /* ── Early returns ── */
  if (productLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
          <p className="text-sm text-zinc-600 font-semibold">{translate("checkout.loading")}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-white/[0.07] bg-zinc-900/60 p-10 text-center">
          <Package className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl font-black">Product not found</p>
          <button
            onClick={() => router.push("/#products")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </button>
        </div>
      </main>
    );
  }

  if (!isLoading && status && status !== "Active") {
    const msg = status === "Suspended" ? translate("checkout.accountSuspended")
      : status === "Banned"     ? translate("checkout.accountBanned")
      : translate("checkout.accessDenied");
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-900/60 p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black">{msg}</h2>
        </div>
      </main>
    );
  }

  if (success) return <SuccessScreen orderId={orderId} roomId={roomId} />;

  const features = normalizeFeatures(product.features);

  /* ═══════════════ MAIN LAYOUT ═══════════════ */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-700/[0.09] blur-[180px]" />
        <div className="absolute bottom-0 right-[-10%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.06] blur-[150px]" />
      </div>

      {/* Sticky navbar */}
      <div className="sticky top-0 z-20 border-b border-white/[0.05] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <button
            onClick={() => step === 2 ? goBackToStep1() : router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3.5 py-2 text-sm font-semibold text-zinc-400 transition hover:border-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 2 ? "الخطوة السابقة" : "Back"}
          </button>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[44fr_56fr] lg:items-start">

          {/* ════════════════════════════════════
              LEFT — Product summary (sticky)
          ════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 lg:sticky lg:top-24"
          >
            {/* Product card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/60">
              {product.image ? (
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  {product.category && (
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-black/60 px-3 py-1 text-xs font-bold text-purple-200 backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5" /> {product.category}
                      </span>
                    </div>
                  )}
                  <div className="absolute right-4 top-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/60 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-sm">
                      <Zap className="h-2.5 w-2.5" /> Instant Delivery
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border-b border-white/[0.06] bg-gradient-to-br from-purple-900/40 to-fuchsia-900/20" style={{ aspectRatio: "16/9" }}>
                  <Package className="h-16 w-16 text-purple-400/30" />
                </div>
              )}

              <div className="-mt-2 px-6 pb-6">
                <h1 className="text-2xl font-black leading-tight text-white">{product.name}</h1>
                {product.description && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{product.description}</p>
                )}
                {features.length > 0 && (
                  <div className="mt-5 space-y-2.5">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/15">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                        </div>
                        <span className="text-sm text-zinc-300">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-purple-500/15 bg-purple-500/[0.07] px-5 py-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Total Price</p>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-3xl font-black tabular-nums text-white">
                        {Number(product.price).toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-purple-300">EGP</span>
                    </div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="space-y-3.5 rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Why MJ Store</p>
              {[
                { icon: Zap,            color: "border-amber-500/20 bg-amber-500/10 text-amber-300",   title: "Instant Delivery",  desc: "Get access immediately after payment confirmation." },
                { icon: ShieldCheck,    color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300", title: "Secure Purchase", desc: "Every order is reviewed by staff before delivery." },
                { icon: HeadphonesIcon, color: "border-purple-500/20 bg-purple-500/10 text-purple-300",  title: "Support Available", desc: "Dedicated chat room created for every order." },
              ].map(({ icon: Icon, color, title, desc }, i) => (
                <div key={i}>
                  {i > 0 && <div className="border-t border-white/[0.04]" />}
                  <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                    <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ════════════════════════════════════
              RIGHT — Step wizard
          ════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">

              {/* Card header */}
              <div className="border-b border-white/[0.06] bg-gradient-to-r from-purple-900/30 to-fuchsia-900/20 px-7 py-6">
                <StepIndicator step={step} />
                <h2 className="text-center text-xl font-black text-white">
                  {step === 1 ? "اختر طريقة الدفع" : "ارفع صورة الإيصال"}
                </h2>
                <p className="mt-1 text-center text-xs text-zinc-500">
                  {step === 1
                    ? "اختر الطريقة المناسبة وأجرِ التحويل"
                    : "الخطوة الأخيرة — أرفق سكرين شوت التحويل لتأكيد طلبك"}
                </p>
              </div>

              {/* Animated step content */}
              <AnimatePresence mode="wait" initial={false}>
                {step === 1 ? (
                  /* ══════════ STEP 1 ══════════ */
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="px-7 py-7 space-y-6"
                  >
                    {/* Payment Method */}
                    <section>
                      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        طريقة الدفع
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPayMethod(m.id as PaymentMethodId)}
                            className={[
                              "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-bold transition-all duration-200",
                              payMethod === m.id
                                ? "border-purple-500/50 bg-purple-500/15 text-white ring-1 ring-purple-500/20"
                                : "border-white/[0.07] bg-zinc-900/60 text-zinc-400 hover:border-purple-500/25 hover:text-zinc-200",
                            ].join(" ")}
                          >
                            <Smartphone className="h-4 w-4" />
                            {m.labelAr}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Payment Instructions */}
                    <AnimatePresence mode="wait">
                      <motion.section
                        key={payMethod}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          تعليمات التحويل
                        </p>
                        <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                          {payMethod === "vodafone" ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300">
                                  <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                                    Vodafone Cash
                                  </p>
                                  <p className="text-xl font-black tabular-nums tracking-wider text-white">
                                    {PAYMENT.vodafone.number}
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                                <span className="font-bold text-amber-300">خطوات الدفع:</span><br />
                                ١. افتح تطبيق فودافون كاش<br />
                                ٢. اضغط "تحويل أموال"<br />
                                ٣. حوّل{" "}
                                <span className="font-bold text-white">
                                  {Number(product.price).toLocaleString()} EGP
                                </span>{" "}
                                للرقم أعلاه<br />
                                ٤. خذ سكرين شوت للإيصال ← ثم اضغط التالي
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                                  <Camera className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
                                    InstaPay
                                  </p>
                                  {PAYMENT.instapay.handle && (
                                    <p className="text-lg font-black text-white">
                                      @{PAYMENT.instapay.handle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {PAYMENT.instapay.qrImage && (
                                <div className="flex justify-center">
                                  <img
                                    src={PAYMENT.instapay.qrImage}
                                    alt="InstaPay QR"
                                    className="h-40 w-40 rounded-2xl border border-white/[0.08] bg-white object-contain p-2"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                </div>
                              )}
                              <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                                <span className="font-bold text-amber-300">خطوات الدفع:</span><br />
                                ١. افتح تطبيق InstaPay أو بنكك<br />
                                ٢. حوّل{" "}
                                <span className="font-bold text-white">
                                  {Number(product.price).toLocaleString()} EGP
                                </span><br />
                                ٣. خذ سكرين شوت للإيصال ← ثم اضغط التالي
                              </div>
                            </>
                          )}
                        </div>
                      </motion.section>
                    </AnimatePresence>

                    {/* Customer Name */}
                    <section>
                      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        اسمك
                      </p>
                      <div>
                        <div className="group relative">
                          <div className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${nameError ? "text-red-400" : "text-zinc-500 group-focus-within:text-purple-400"}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                            placeholder="الاسم بالكامل"
                            className={[
                              "h-14 w-full rounded-2xl border pl-12 pr-4 text-sm font-semibold text-white outline-none transition-all duration-200 placeholder:text-zinc-600",
                              nameError
                                ? "border-red-500/40 bg-red-500/[0.05]"
                                : "border-white/[0.08] bg-zinc-900/60 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/15",
                            ].join(" ")}
                          />
                        </div>
                        {nameError && (
                          <p className="mt-1.5 text-xs text-red-400">يرجى إدخال اسمك.</p>
                        )}
                      </div>
                    </section>

                    {/* CTA → Step 2 */}
                    <motion.button
                      type="button"
                      onClick={goToStep2}
                      whileHover={{ y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.35)" }}
                      whileTap={{ scale: 0.99 }}
                      className="relative w-full overflow-hidden rounded-2xl border border-purple-400/25 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.22)] transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      <span aria-hidden className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-[100%] pointer-events-none" />
                      <span>التالي — رفع الإيصال</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </motion.button>

                    <p className="text-center text-xs leading-relaxed text-zinc-700">
                      في الخطوة التالية ستقوم برفع سكرين شوت إيصال التحويل.
                    </p>
                  </motion.div>

                ) : (
                  /* ══════════ STEP 2 ══════════ */
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="px-7 py-7 space-y-6"
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300"
                        >
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Payment reminder chip */}
                    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/50 px-4 py-3">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600">طريقة الدفع المختارة</p>
                        <p className="text-sm font-bold text-white">
                          {payMethod === "vodafone" ? "فودافون كاش" : "InstaPay"}
                          {" — "}
                          <span className="tabular-nums text-purple-300">{Number(product.price).toLocaleString()} EGP</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={goBackToStep1}
                        className="text-[10px] font-bold text-zinc-600 hover:text-purple-400 transition-colors"
                      >
                        تغيير
                      </button>
                    </div>

                    {/* Proof upload / preview */}
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          صورة إيصال التحويل
                        </p>
                        <span className="text-[10px] font-bold text-red-400">* مطلوبة</span>
                      </div>

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

                      <AnimatePresence mode="wait">
                        {proofPreview ? (
                          /* ── Image preview ── */
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-950/50"
                          >
                            {/* Image */}
                            <div className="relative overflow-hidden bg-zinc-950">
                              <img
                                src={proofPreview}
                                alt="Payment proof"
                                className="w-full object-contain"
                                style={{ maxHeight: "300px" }}
                              />
                              {/* Ready badge */}
                              <div className="absolute left-3 top-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/25 px-3 py-1 text-xs font-black text-emerald-300 backdrop-blur-sm">
                                  <CheckCircle className="h-3 w-3" />
                                  الصورة جاهزة
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 py-3">
                              <p className="flex-1 truncate text-xs text-zinc-600">
                                {proofFile?.name ?? "صورة الإيصال"}
                              </p>
                              <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3.5 py-2 text-xs font-bold text-zinc-400 transition hover:border-purple-500/30 hover:text-purple-300"
                              >
                                <RefreshCw className="h-3 w-3" />
                                استبدال
                              </button>
                              <button
                                type="button"
                                onClick={removeProof}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/15"
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
                            transition={{ duration: 0.2 }}
                            role="button"
                            tabIndex={0}
                            onClick={() => fileRef.current?.click()}
                            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={[
                              "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-12 px-6 transition-all duration-200",
                              isDragging
                                ? "border-purple-500/60 bg-purple-500/[0.08] text-purple-300"
                                : "border-white/[0.1] bg-zinc-900/30 text-zinc-500 hover:border-purple-500/40 hover:bg-purple-500/[0.04] hover:text-purple-300",
                            ].join(" ")}
                          >
                            <div className={`grid h-14 w-14 place-items-center rounded-2xl border transition-colors ${isDragging ? "border-purple-500/30 bg-purple-500/15" : "border-white/[0.08] bg-zinc-800/60"}`}>
                              {isDragging ? (
                                <Upload className="h-6 w-6 text-purple-400 animate-bounce" />
                              ) : (
                                <Upload className="h-6 w-6" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-black">
                                {isDragging ? "أفلت الصورة هنا" : "اضغط أو اسحب صورة الإيصال"}
                              </p>
                              <p className="mt-1 text-xs text-zinc-600">
                                PNG · JPG · WEBP · حتى 8MB
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    {/* Order summary */}
                    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-4 space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">ملخص الطلب</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="mr-4 truncate text-zinc-400">{product.name}</span>
                        <span className="flex-shrink-0 font-bold tabular-nums text-white">
                          {Number(product.price).toLocaleString()} EGP
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                        <span className="text-sm font-black text-white">الإجمالي</span>
                        <span className="text-lg font-black tabular-nums text-white">
                          {Number(product.price).toLocaleString()}
                          <span className="ml-1 text-xs font-bold text-purple-300">EGP</span>
                        </span>
                      </div>
                    </div>

                    {/* ── Done Button ── */}
                    <div className="space-y-2">
                      <motion.button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!proofFile || submitting}
                        whileHover={proofFile && !submitting ? { y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.35)" } : {}}
                        whileTap={proofFile && !submitting ? { scale: 0.99 } : {}}
                        className={[
                          "relative w-full overflow-hidden rounded-2xl border py-4 text-base font-black transition-all duration-300 flex items-center justify-center gap-3 group",
                          proofFile && !submitting
                            ? "border-purple-400/25 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.22)] cursor-pointer"
                            : submitting
                            ? "border-purple-400/15 bg-purple-500/10 text-purple-400 cursor-not-allowed"
                            : "border-white/[0.06] bg-zinc-800/60 text-zinc-500 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {/* Shimmer on hover */}
                        {proofFile && !submitting && (
                          <span aria-hidden className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-[100%] pointer-events-none" />
                        )}

                        {submitting ? (
                          <>
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            {uploading ? "جاري رفع الصورة…" : "جاري إنشاء الطلب…"}
                          </>
                        ) : proofFile ? (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>إتمام الطلب</span>
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span>ارفع صورة الإيصال أولاً</span>
                          </>
                        )}
                      </motion.button>

                      <p className="text-center text-xs leading-relaxed text-zinc-700">
                        بالضغط على الزر فإنك تؤكد أن عملية التحويل تمت بالفعل.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
