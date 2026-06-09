"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  HeadphonesIcon,
  LoaderCircle,
  Lock,
  Package,
  Phone,
  ShieldCheck,
  Star,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useAnalytics } from "../../lib/analytics/useAnalytics";

/* ─────────────────── Types ─────────────────── */
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  features?: string[] | string | null;
}

/* ─────────────────── Helpers ─────────────────── */
const PHONE_REGEX = /^\+?\d{8,15}$/;
function isValidPhone(v: string) { return PHONE_REGEX.test(v.trim()); }

function normalizeFeatures(f: Product["features"]): string[] {
  if (!f) return [];
  if (Array.isArray(f)) return f.filter(Boolean) as string[];
  try { const p = JSON.parse(f as string); if (Array.isArray(p)) return p.filter(Boolean); } catch {}
  return (f as string).split(",").map((s) => s.trim()).filter(Boolean);
}

/* ─────────────────── Input field ─────────────────── */
function FormInput({
  icon: Icon, value, onChange, placeholder, type = "text", error,
}: {
  icon: React.ElementType; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; error?: boolean;
}) {
  return (
    <div className="group relative">
      <div className={[
        "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
        error ? "text-red-400" : "text-zinc-500 group-focus-within:text-purple-400",
      ].join(" ")}>
        <Icon className="h-4 w-4" />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "h-14 w-full rounded-2xl border pl-12 pr-4 text-sm font-semibold text-white outline-none transition-all duration-200 placeholder:text-zinc-600",
          error
            ? "border-red-500/40 bg-red-500/[0.05] focus:border-red-500/60"
            : "border-white/[0.08] bg-zinc-900/60 focus:border-purple-500/50 focus:bg-purple-500/[0.06] focus:ring-1 focus:ring-purple-500/15",
        ].join(" ")}
      />
    </div>
  );
}

/* ─────────────────── Trust badge ─────────────────── */
function TrustBadge({ icon: Icon, title, desc, accent }: {
  icon: React.ElementType; title: string; desc: string; accent?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border ${accent ?? "border-purple-500/20 bg-purple-500/10 text-purple-300"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white leading-none">{title}</p>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────── Success screen ─────────────────── */
function SuccessScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_60%)]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md text-center"
      >
        {/* Animated ring */}
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
          {/* Pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
            className="absolute inset-0 rounded-full border border-emerald-500/25"
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
          <h2 className="text-3xl font-black text-white">Order Placed!</h2>
          <p className="mt-2 text-zinc-400">Your order has been confirmed successfully.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <Zap className="h-4 w-4" /> Redirecting to your account…
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}

/* ═══════════════════════════════════════════
   MAIN
═══════════════════════════════════════════ */
export default function CheckoutClient() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const productId     = searchParams.get("product");
  const { accessToken, status, isLoading, signOut } = useAuth();
  const { translate } = useLanguage();
  const { trackEvent } = useAnalytics();

  const [product, setProduct]           = useState<Product | null>(null);
  const [name, setName]                 = useState("");
  const [phone, setPhone]               = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [nameError, setNameError]       = useState(false);
  const [phoneError, setPhoneError]     = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/get-products");
        const products = (await res.json()) as Product[];
        setProduct(products.find((p) => String(p.id) === productId) || null);
      } finally { setProductLoading(false); }
    }
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    if (status === "Banned") void signOut();
  }, [accessToken, isLoading, signOut, status]);

  // Track checkout_start once the product is known
  useEffect(() => {
    if (product) void trackEvent(product.id, "checkout_start");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  async function createOrder() {
    setError(null);
    let hasError = false;
    if (!name.trim()) { setNameError(true); hasError = true; } else setNameError(false);
    if (!phone.trim() || !isValidPhone(phone)) { setPhoneError(true); hasError = true; } else setPhoneError(false);
    if (hasError || !product || !accessToken) {
      if (!name.trim() || (!phone.trim() || !isValidPhone(phone))) setError("Please fill in all fields correctly.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customer_name:  name.trim(),
          customer_phone: phone.trim(),
          product_id:     product.id,
          product_name:   product.name,
          price:          product.price,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) { setSuccess(true); setTimeout(() => router.push("/account"), 2200); }
      else setError(data.error ?? "Error creating order");
    } catch { setError("Error creating order"); }
    finally { setSubmitting(false); }
  }

  /* ── States ── */
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
          <p className="mt-2 text-sm text-zinc-500">The requested product does not exist.</p>
          <button onClick={() => router.push("/#products")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </button>
        </div>
      </main>
    );
  }

  if (!isLoading && status && status !== "Active") {
    const msg = status === "Suspended" ? translate("checkout.accountSuspended")
      : status === "Banned" ? translate("checkout.accountBanned")
      : translate("checkout.accessDenied");
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-900/60 p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black">{msg}</h2>
          <p className="mt-2 text-sm text-zinc-500">{translate("checkout.statusBlocked")}</p>
        </div>
      </main>
    );
  }

  if (success) return <SuccessScreen />;

  const features = normalizeFeatures(product.features);

  /* ══ MAIN CHECKOUT ══ */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-700/[0.09] blur-[180px]" />
        <div className="absolute bottom-0 right-[-10%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.06] blur-[150px]" />
      </div>

      {/* Top nav */}
      <div className="border-b border-white/[0.05] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-5 py-3.5 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3.5 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white hover:border-white/10">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[45fr_55fr] lg:items-start">

          {/* ══════════════════════════════════════
              LEFT — Product Spotlight
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 lg:sticky lg:top-24"
          >
            {/* Product card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/60">
              {/* Product image */}
              <div className="relative">
                {product.image ? (
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    {/* Category badge */}
                    {product.category && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-bold text-purple-200">
                          <Star className="h-2.5 w-2.5" />
                          {product.category}
                        </span>
                      </div>
                    )}
                    {/* Instant delivery badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-bold text-emerald-300">
                        <Zap className="h-2.5 w-2.5" />
                        Instant Delivery
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-fuchsia-900/20 border-b border-white/[0.06]" style={{ aspectRatio: "16/9" }}>
                    <Package className="h-16 w-16 text-purple-400/30" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="px-6 pb-6 -mt-2">
                <h1 className="text-2xl font-black leading-tight text-white">{product.name}</h1>
                {product.description && (
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{product.description}</p>
                )}

                {/* Features */}
                {features.length > 0 && (
                  <div className="mt-5 space-y-2.5">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="h-5 w-5 flex-shrink-0 grid place-items-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                        </div>
                        <span className="text-sm text-zinc-300">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price row */}
                <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-purple-500/15 bg-purple-500/[0.07] px-5 py-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Total Price</p>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white tabular-nums">{Number(product.price).toLocaleString()}</span>
                      <span className="text-sm font-bold text-purple-300">EGP</span>
                    </div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Why MJ Store */}
            <div className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Why MJ Store</p>
              <TrustBadge icon={Zap}            title="Instant Delivery"      desc="Get access to your product immediately after placing your order." accent="border-amber-500/20 bg-amber-500/10 text-amber-300" />
              <div className="border-t border-white/[0.04]" />
              <TrustBadge icon={ShieldCheck}    title="Secure Purchase"       desc="Your information is protected and your order is 100% safe." accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-300" />
              <div className="border-t border-white/[0.04]" />
              <TrustBadge icon={Star}           title="Trusted Digital Store" desc="Hundreds of satisfied customers across Egypt and beyond." />
              <div className="border-t border-white/[0.04]" />
              <TrustBadge icon={HeadphonesIcon} title="Support Available"     desc="We're here to help with any questions about your order." />
            </div>
          </motion.div>

          {/* ══════════════════════════════════════
              RIGHT — Checkout Form
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">

              {/* Form header */}
              <div className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/20 border-b border-white/[0.06] px-7 py-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/15 text-purple-300">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Complete Your Order</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Fill in your details to place the order</p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-7 space-y-6">

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300"
                    >
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                      {translate("checkout.name")}
                    </label>
                    <FormInput
                      icon={User}
                      value={name}
                      onChange={(v) => { setName(v); if (v.trim()) setNameError(false); }}
                      placeholder={translate("checkout.namePlaceholder")}
                      error={nameError}
                    />
                    {nameError && <p className="mt-1.5 text-xs text-red-400">Please enter your full name.</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                      {translate("checkout.phone")}
                    </label>
                    <FormInput
                      icon={Phone}
                      value={phone}
                      onChange={(v) => { setPhone(v); if (isValidPhone(v)) setPhoneError(false); }}
                      placeholder={translate("checkout.phonePlaceholder")}
                      type="tel"
                      error={phoneError}
                    />
                    {phoneError && <p className="mt-1.5 text-xs text-red-400">Please enter a valid phone number.</p>}
                  </div>
                </div>

                {/* Tip */}
                <div className="flex items-start gap-3 rounded-2xl border border-purple-500/15 bg-purple-500/[0.05] px-4 py-3.5">
                  <Clock className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-purple-200">{translate("checkout.tip")}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{translate("checkout.tipDesc")}</p>
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-4 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Order Summary</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400 truncate mr-4">{product.name}</span>
                    <span className="font-bold text-white flex-shrink-0 tabular-nums">
                      {Number(product.price).toLocaleString()} EGP
                    </span>
                  </div>
                  <div className="border-t border-white/[0.05] pt-2.5 flex items-center justify-between">
                    <span className="text-sm font-black text-white">Total</span>
                    <span className="text-lg font-black text-white tabular-nums">
                      {Number(product.price).toLocaleString()}
                      <span className="text-xs font-bold text-purple-300 ml-1">EGP</span>
                    </span>
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Zap className="h-3 w-3 text-emerald-500" />
                    <span>Instant</span>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  type="button"
                  onClick={createOrder}
                  disabled={submitting}
                  whileHover={submitting ? {} : { y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.35), 0 0 20px rgba(168,85,247,0.20)" }}
                  whileTap={submitting ? {} : { scale: 0.99 }}
                  className="relative w-full overflow-hidden rounded-2xl border border-purple-400/25 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.22)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3 group"
                >
                  {/* Shimmer */}
                  {!submitting && (
                    <span
                      aria-hidden
                      className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 ease-in-out pointer-events-none"
                    />
                  )}
                  {submitting ? (
                    <><LoaderCircle className="h-5 w-5 animate-spin" /> Processing Order…</>
                  ) : (
                    <><span>{translate("checkout.placeOrder")}</span><ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </motion.button>

                <p className="text-center text-xs text-zinc-600 leading-relaxed">
                  {translate("checkout.confirmText")}
                </p>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
