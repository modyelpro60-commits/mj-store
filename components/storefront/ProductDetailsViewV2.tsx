"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CornerDownLeft,
  CreditCard,
  Crown,
  FileText,
  LoaderCircle,
  MessageCircle,
  MessageSquare,
  Package,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Trash2,
  TrendingUp,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { useLanguage }    from "../../lib/i18n/LanguageProvider";
import { useAuth }        from "../auth/AuthProvider";
import { useCart }        from "../cart/CartProvider";
import { useAnalytics }   from "../../lib/analytics/useAnalytics";

/* ── Types ──────────────────────────────────────────────────────── */

// Actual DB columns: id, name, description, image, price, sales_count, category,
//   badge, features, full_description, is_active, created_at
// Migrations added: original_price NUMERIC NULL, short_description TEXT NULL
// is_active = true (or undefined) → purchasable; false → hidden
type Product = {
  id: number | string;
  name: string;
  image: string;
  description?: string;
  short_description?: string;
  price: number | string;
  original_price?: number | string | null;
  is_active?: boolean;
  sales_count: number | string;
  features?: string[];
  category?: string | null;
  badge?: string | null;
};

type Reply = {
  id: number;
  body: string;
  authorName: string;
  role: string;
  createdAt: string;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  authorRole?: string | null;
  createdAt: string;
  replies: Reply[];
};

/* ── Availability ────────────────────────────────────────────── */

// Derives display + buyable flag solely from is_active.
// undefined is treated as true (backward compat with old data).
function getAvailability(isActive?: boolean) {
  return isActive === false
    ? {
        label:   "غير متاح",
        dot:     "bg-zinc-600",
        pill:    "border-zinc-600/25 bg-zinc-600/10 text-zinc-400",
        buyable: false,
      }
    : {
        label:   "متوفر",
        dot:     "bg-emerald-400 animate-pulse",
        pill:    "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        buyable: true,
      };
}

/* ── Role badge ───────────────────────────────────────────────── */

const ROLE_META: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  admin:     { label: "أدمن",  style: "border-amber-500/30  bg-amber-500/10  text-amber-300",    icon: Crown       },
  moderator: { label: "مشرف",  style: "border-blue-500/30   bg-blue-500/10   text-blue-300",     icon: ShieldCheck },
  helper:    { label: "مساعد", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: Wrench      },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black tracking-wide ${meta.style}`}>
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-white/[0.06] text-white/[0.06]"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────── */

function SectionLabel({
  icon: Icon, children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="grid h-8 w-8 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/[0.08] text-purple-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {children}
      </h2>
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────────── */
function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */

export default function ProductDetailsViewV2({ product }: { product: Product }) {
  const { translate }                                 = useLanguage();
  const { accessToken, isLoading: authLoading, role } = useAuth();
  const prefersReducedMotion                          = useReducedMotion();
  const { trackEvent }                                = useAnalytics();
  const isStaff = role === "admin" || role === "moderator" || role === "helper";

  const price         = toNum(product.price);
  const originalPrice = toNum(product.original_price);
  const salesCount    = toNum(product.sales_count);
  const availability  = getAvailability(product.is_active);
  const discountPct   = originalPrice > price && price > 0
    ? Math.round((1 - price / originalPrice) * 100) : 0;

  /* ── State ─────────────────────────────────────────────────── */
  const [reviews,       setReviews]       = useState<Review[]>([]);
  const [reviewsBusy,   setReviewsBusy]   = useState(true);
  const [writeRating,   setWriteRating]   = useState(5);
  const [hoverStar,     setHoverStar]     = useState(0);
  const [writeComment,  setWriteComment]  = useState("");
  const [posting,       setPosting]       = useState(false);
  const [postError,     setPostError]     = useState("");
  const [postOk,        setPostOk]        = useState(false);
  const [showSticky,    setShowSticky]    = useState(false);
  const [descExpanded,  setDescExpanded]  = useState(false);
  const [wishlisted,    setWishlisted]    = useState(false);
  const [addingCart,    setAddingCart]    = useState(false);

  const [replyOpen,     setReplyOpen]     = useState<Record<number, boolean>>({});
  const [replyText,     setReplyText]     = useState<Record<number, string>>({});
  const [replyBusy,     setReplyBusy]     = useState<Record<number, boolean>>({});
  const [replyError,    setReplyError]    = useState<Record<number, string>>({});
  const [deletingId,    setDeletingId]    = useState<number | null>(null);
  const [confirmId,     setConfirmId]     = useState<number | null>(null);

  const heroBuyRef = useRef<HTMLDivElement>(null);

  const parts = useMemo(
    () =>
      (typeof product.description === "string" ? product.description : "")
        .split("\n").map((p) => p.trim()).filter(Boolean),
    [product.description],
  );
  const hasDescription = parts.length > 0;
  const loggedIn       = !authLoading && !!accessToken;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingDist = useMemo(() => {
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return dist;
  }, [reviews]);

  /* ── Fetch reviews ─────────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/product/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data); })
      .catch(() => {})
      .finally(() => setReviewsBusy(false));
  }, [product.id]);

  /* ── Sticky observer ──────────────────────────────────────── */
  useEffect(() => {
    const el = heroBuyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setShowSticky(!e.isIntersecting),
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── Handlers ─────────────────────────────────────────────── */
  const router = useRouter();
  const { add } = useCart();

  async function addToCart(): Promise<boolean> {
    if (!availability.buyable) return false;
    if (!loggedIn) {
      try { localStorage.setItem("mj_pending_product", String(product.id)); } catch {}
      toast("سجّل عشان تكمّل الشراء 🛍️", { description: "المنتج هيتحط في سلتك بعد التسجيل." });
      router.push("/register");
      return false;
    }
    if (addingCart) return false;
    setAddingCart(true);
    const ok = await add(product.id);
    setAddingCart(false);
    if (ok) void trackEvent(product.id, "add_to_cart");
    else toast.error("تعذّر الإضافة، حاول مجدداً");
    return ok;
  }

  async function handleAddToCart() {
    const ok = await addToCart();
    if (ok) toast.success("تمت الإضافة إلى السلة 🛒");
  }

  async function handleBuyNow() {
    const ok = await addToCart();
    if (ok) router.push("/cart");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !accessToken) return;
    setPosting(true); setPostError(""); setPostOk(false);
    try {
      const r = await fetch(`/api/product/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ rating: writeRating, comment: writeComment.trim() }),
      });
      const d = await r.json();
      if (!d.success) { setPostError(d.error || "خطأ"); return; }
      setPostOk(true); setWriteComment("");
      const rd = await (await fetch(`/api/product/${product.id}/reviews`)).json();
      if (rd.success) setReviews(rd.data);
    } catch { setPostError("خطأ في الاتصال"); }
    finally { setPosting(false); }
  }

  async function deleteReview(reviewId: number) {
    if (!accessToken) return;
    setDeletingId(reviewId);
    try {
      const r = await fetch(`/api/product/${product.id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      if (d.success) { setReviews((prev) => prev.filter((rv) => rv.id !== reviewId)); setConfirmId(null); }
    } catch {}
    finally { setDeletingId(null); }
  }

  async function submitReply(reviewId: number) {
    const body = (replyText[reviewId] ?? "").trim();
    if (!body || !accessToken) return;
    setReplyBusy((p) => ({ ...p, [reviewId]: true }));
    setReplyError((p) => ({ ...p, [reviewId]: "" }));
    try {
      const r = await fetch(`/api/product/${product.id}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body }),
      });
      const d = await r.json();
      if (!d.success) { setReplyError((p) => ({ ...p, [reviewId]: d.error ?? "خطأ" })); return; }
      setReplyText((p) => ({ ...p, [reviewId]: "" }));
      setReplyOpen((p) => ({ ...p, [reviewId]: false }));
      const rd = await (await fetch(`/api/product/${product.id}/reviews`)).json();
      if (rd.success) setReviews(rd.data);
    } catch {
      setReplyError((p) => ({ ...p, [reviewId]: "خطأ في الاتصال" }));
    } finally {
      setReplyBusy((p) => ({ ...p, [reviewId]: false }));
    }
  }

  /* ── RENDER ──────────────────────────────────────────────────── */
  return (
    <div
      className="bg-[#07070D] text-white min-h-screen selection:bg-purple-500/25"
      dir="rtl"
    >

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-purple-700/[0.06] blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.04] blur-[140px]" />
      </div>

      {/* ── BREADCRUMB ─────────────────────────────────────────── */}
      <div className="border-b border-white/[0.04] bg-[#09090F]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5">
          <ol className="flex items-center gap-1.5 text-xs text-white/25 flex-wrap">
            <li><Link href="/" className="hover:text-purple-300 transition-colors">الرئيسية</Link></li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li className="text-white/50 font-medium truncate max-w-[240px]">{product.name}</li>
          </ol>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          1. HERO — image left / purchase panel right
         ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[55fr_45fr]">

          {/* ── Image Panel (LEFT via RTL order trick) ── */}
          <div
            className="order-first lg:order-last relative overflow-hidden rounded-3xl min-h-[280px] sm:min-h-[380px] lg:min-h-[500px] flex items-center justify-center"
            style={{ background: "radial-gradient(ellipse at 55% 50%, #120921 0%, #07070D 70%)" }}
          >

            {/* Ambient image blur */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <img
                src={product.image} alt=""
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-[100px] opacity-20 saturate-[2.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#07070D]/10 via-transparent to-[#07070D]/60" />
            </div>

            {/* Rings */}
            <motion.div aria-hidden
              className="absolute rounded-full border border-purple-500/[0.10]"
              style={{ width: "min(420px,75vw)", height: "min(420px,75vw)" }}
              animate={prefersReducedMotion ? {} : { scale: [1, 1.04, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div aria-hidden
              className="absolute rounded-full bg-purple-600/15 blur-[80px]"
              style={{ width: "min(280px,55vw)", height: "min(280px,55vw)" }}
              animate={prefersReducedMotion ? {} : { scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Product image */}
            <div className="relative z-10 flex items-center justify-center p-12 sm:p-16">
              <div className="relative overflow-hidden rounded-2xl">
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className={[
                    "w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[320px] lg:h-[320px]",
                    "object-contain drop-shadow-[0_24px_64px_rgba(0,0,0,0.9)]",
                    !availability.buyable ? "opacity-40 grayscale" : "",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: availability.buyable ? 1 : 0.4, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {!prefersReducedMotion && availability.buyable && (
                  <motion.span aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.10) 50%,transparent 70%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1], delay: 1.6, repeat: Infinity, repeatDelay: 5 }}
                  />
                )}
              </div>
            </div>

            {/* ── Discount badge ── */}
            {discountPct > 0 && availability.buyable && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: "backOut" }}
                className="absolute top-5 right-5 rounded-2xl border border-red-500/30 bg-red-500/20 backdrop-blur-xl px-3.5 py-2.5 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-0.5">خصم</p>
                <p className="text-xl font-black text-red-300 leading-none">{discountPct}%</p>
              </motion.div>
            )}

            {/* ── Sales count badge ── */}
            {salesCount > 0 && availability.buyable && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4, ease: "backOut" }}
                className="absolute bottom-5 left-5 rounded-2xl border border-purple-400/20 bg-black/50 backdrop-blur-xl px-4 py-2.5 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/50 mb-0.5">المبيعات</p>
                <p className="text-xl font-black text-purple-200 leading-none">{salesCount.toLocaleString()}+</p>
              </motion.div>
            )}

            {/* ── Out of stock overlay ── */}
            {!availability.buyable && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-black/55 backdrop-blur-[2px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                  className="rounded-3xl border border-red-500/35 bg-red-500/15 px-8 py-5 text-center backdrop-blur-xl"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-2 text-red-400/60">
                    غير متاح
                  </p>
                  <p className="text-2xl font-black text-red-200">
                    Not Available
                  </p>
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Purchase Panel (RIGHT via RTL order trick) ── */}
          <div className="order-last lg:order-first flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">

            {/* Availability pill */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${availability.pill}`}>
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${availability.dot}`} />
                {availability.label}
              </span>
            </motion.div>

            {/* Product name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
            >
              <h1
                className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #ffffff 25%, #d8b4fe 60%, #e879f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {product.name}
              </h1>

              {/* Short description (tagline) */}
              {product.short_description && (
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Rating + sales row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {!reviewsBusy && reviews.length > 0 && avgRating && (
                  <div className="flex items-center gap-2">
                    <Stars rating={Number(avgRating)} size="md" />
                    <span className="text-sm font-black text-amber-400">{avgRating}</span>
                    <span className="text-xs text-white/25">
                      ({reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"})
                    </span>
                  </div>
                )}
                {salesCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
                    <TrendingUp className="h-3 w-3 text-purple-400" />
                    {salesCount.toLocaleString()}+ عملية شراء
                  </span>
                )}
              </div>
            </motion.div>

            {/* Price block */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">السعر</p>

              {/* Original price (strikethrough) — shown ABOVE current price when discount exists */}
              {originalPrice > price && (
                <p className="text-base font-bold text-zinc-600 line-through leading-none mb-2 tabular-nums">
                  {originalPrice.toLocaleString("en")} EGP
                </p>
              )}

              {/* Current price + OFF badge on same row */}
              <div className="flex items-center gap-3 flex-wrap">
                <p
                  className="text-4xl sm:text-5xl font-black leading-none tracking-tight tabular-nums"
                  style={{
                    background: "linear-gradient(90deg,#f5f5f5 0%,#e2d9f3 50%,#c084fc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {price.toLocaleString("en")}
                  <span className="text-lg font-bold ms-1.5 opacity-60">EGP</span>
                </p>
                {discountPct > 0 && (
                  <span className="inline-flex items-center rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-1.5 text-sm font-black text-red-300 leading-none">
                    -{discountPct}% OFF
                  </span>
                )}
              </div>

              {/* Savings summary */}
              {discountPct > 0 && (
                <p className="mt-2.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  وفّر {(originalPrice - price).toLocaleString("en")} EGP على هذا الطلب
                </p>
              )}
            </motion.div>

            {/* Out of stock notice */}
            {!availability.buyable && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 }}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${availability.pill}`}
              >
                <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${availability.dot}`} />
                <div>
                  <p className="text-sm font-black mb-0.5">{availability.label}</p>
                  <p className="text-xs opacity-70 leading-relaxed">
                    هذا المنتج غير متاح للشراء حالياً.
                  </p>
                </div>
              </motion.div>
            )}

            {/* CTA buttons */}
            <motion.div
              ref={heroBuyRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="space-y-3"
            >
              {/* Buy Now */}
              <motion.button
                onClick={handleBuyNow}
                disabled={addingCart || !availability.buyable}
                whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.02, boxShadow: "0 0 48px rgba(139,92,246,0.55)" }}
                whileTap={availability.buyable ? { scale: 0.97 } : undefined}
                className={[
                  "relative w-full overflow-hidden group flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-[15px] font-black text-white transition-all duration-300",
                  availability.buyable ? "disabled:opacity-75" : "opacity-35 cursor-not-allowed",
                ].join(" ")}
                style={availability.buyable ? {
                  background: "linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#d946ef 100%)",
                  boxShadow: "0 0 36px rgba(139,92,246,0.40)",
                } : {
                  background: "linear-gradient(135deg,#3f3f46 0%,#52525b 100%)",
                }}
              >
                {availability.buyable && (
                  <span aria-hidden className="absolute inset-0 translate-x-[110%] group-hover:translate-x-[-110%] bg-gradient-to-l from-transparent via-white/10 to-transparent transition-transform duration-700" />
                )}
                {addingCart
                  ? <LoaderCircle className="relative h-5 w-5 animate-spin shrink-0" />
                  : <ShoppingBag className="relative h-5 w-5 shrink-0" />}
                <span className="relative">
                  {availability.buyable ? "اشتري الآن" : availability.label}
                </span>
              </motion.button>

              {/* Add to Cart */}
              <motion.button
                onClick={handleAddToCart}
                disabled={addingCart || !availability.buyable}
                whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.01 }}
                whileTap={availability.buyable ? { scale: 0.98 } : undefined}
                className={[
                  "w-full flex items-center justify-center gap-2.5 rounded-2xl border px-6 py-3.5 text-sm font-bold transition-all duration-200",
                  availability.buyable
                    ? "border-purple-500/25 bg-purple-500/[0.06] hover:border-purple-400/40 hover:bg-purple-500/10 text-white/55 hover:text-white/90 disabled:opacity-75"
                    : "border-white/[0.05] bg-white/[0.02] text-white/18 cursor-not-allowed opacity-35",
                ].join(" ")}
              >
                <ShoppingCart className="h-4 w-4" />
                أضف للسلة
              </motion.button>
            </motion.div>

            {/* Share + Wishlist */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                aria-label="مشاركة"
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})}
                className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/30 hover:text-white/60 hover:border-purple-500/25 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                مشاركة
              </button>
              <button
                type="button"
                aria-label="إضافة للمفضلة"
                onClick={() => setWishlisted((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  wishlisted
                    ? "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-400"
                    : "border-white/[0.07] bg-white/[0.03] text-white/30 hover:text-fuchsia-400 hover:border-fuchsia-500/25"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlisted ? "في المفضلة" : "المفضلة"}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. FEATURES
         ════════════════════════════════════════════════════════ */}
      <Divider />
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <SectionLabel icon={BadgeCheck}>مميزات الخدمة</SectionLabel>

        {/* Custom product features (if defined in admin) */}
        {product.features && product.features.length > 0 ? (
          <div className={`grid gap-3 ${
            product.features.length <= 2
              ? "grid-cols-1 sm:grid-cols-2"
              : product.features.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4"
          }`}>
            {product.features.map((feat, i) => {
              const accents = [
                "text-purple-400 border-purple-500/20 bg-purple-500/[0.06]",
                "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]",
                "text-blue-400 border-blue-500/20 bg-blue-500/[0.06]",
                "text-amber-400 border-amber-500/20 bg-amber-500/[0.06]",
                "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/[0.06]",
                "text-cyan-400 border-cyan-500/20 bg-cyan-500/[0.06]",
              ];
              const glows = [
                "bg-purple-500/[0.04]",
                "bg-emerald-500/[0.03]",
                "bg-blue-500/[0.03]",
                "bg-amber-500/[0.03]",
                "bg-fuchsia-500/[0.03]",
                "bg-cyan-500/[0.03]",
              ];
              const accent = accents[i % accents.length] ?? accents[0];
              const glow   = glows[i % glows.length] ?? glows[0];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 sm:p-5"
                >
                  <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl border ${accent}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-black text-white leading-snug">{feat}</p>
                  <div className={`pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full blur-2xl ${glow}`} />
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Default generic features when none defined */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Zap,          title: "تسليم فوري",   desc: "يصلك المنتج خلال دقائق من تأكيد الدفع",       accent: "text-purple-400 border-purple-500/20 bg-purple-500/[0.06]",  glow: "bg-purple-500/[0.04]"  },
              { icon: ShieldCheck,  title: "دفع آمن 100%", desc: "جميع المعاملات مشفرة ومحمية بالكامل",         accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]", glow: "bg-emerald-500/[0.03]" },
              { icon: MessageCircle,title: "دعم مباشر",    desc: "فريق الدعم جاهز لمساعدتك في أي وقت",         accent: "text-blue-400 border-blue-500/20 bg-blue-500/[0.06]",         glow: "bg-blue-500/[0.03]"    },
              { icon: CheckCircle2, title: "جودة مضمونة",  desc: "منتجات أصلية وموثقة 100%",                   accent: "text-amber-400 border-amber-500/20 bg-amber-500/[0.06]",      glow: "bg-amber-500/[0.03]"   },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 sm:p-5"
              >
                <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl border ${f.accent}`}>
                  <f.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-black text-white leading-none mb-1.5">{f.title}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{f.desc}</p>
                <div className={`pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full blur-2xl ${f.glow}`} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════
          3. PRODUCT DESCRIPTION
         ════════════════════════════════════════════════════════ */}
      {hasDescription && (
        <>
          <Divider />
          <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
            <SectionLabel icon={FileText}>تفاصيل المنتج</SectionLabel>
            <div className="rounded-3xl border border-white/[0.06] bg-zinc-900/30 p-6 sm:p-8">
              <div className="space-y-3.5">
                {(descExpanded ? parts : parts.slice(0, 5)).map((p, i) => (
                  <p key={i} className="text-[13.5px] text-white/50 leading-[1.9]">{p}</p>
                ))}
              </div>
              {parts.length > 5 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {descExpanded ? "عرض أقل" : "اقرأ المزيد"}
                  <ArrowRight className={`h-3.5 w-3.5 transition-transform ${descExpanded ? "-rotate-90" : "rotate-90"}`} />
                </button>
              )}
            </div>
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          4. DELIVERY INFORMATION
         ════════════════════════════════════════════════════════ */}
      <Divider />
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <SectionLabel icon={Package}>معلومات التسليم</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Delivery Time */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/15 bg-purple-500/[0.04] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/60 mb-1.5">وقت التسليم</p>
                <p className="text-base font-black text-white mb-1">فوري بعد التأكيد</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  يُسلَّم منتجك فور التحقق من الدفع —<br />
                  لا تتجاوز العملية 5–15 دقيقة في أغلب الحالات.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-purple-500/[0.06] blur-2xl" />
          </div>

          {/* Delivery Method */}
          <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/15 bg-fuchsia-500/[0.04] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400/60 mb-1.5">طريقة التسليم</p>
                <p className="text-base font-black text-white mb-1">عبر المحادثة المباشرة</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  يتم إرسال المنتج مباشرةً عبر نظام المحادثة<br />
                  الموجود داخل التطبيق بعد تأكيد الطلب.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-fuchsia-500/[0.06] blur-2xl" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          5. PAYMENT METHODS
         ════════════════════════════════════════════════════════ */}
      <Divider />
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <SectionLabel icon={CreditCard}>طرق الدفع المقبولة</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Vodafone Cash */}
          <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400 flex-shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Vodafone Cash</p>
                <p className="text-[10px] text-red-400/70 font-semibold">فودافون كاش</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              ادفع فوراً عبر محفظتك في فودافون كاش بكل سهولة وأمان.
            </p>
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-red-500/[0.06] blur-2xl" />
          </div>

          {/* InstaPay */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-400 flex-shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">InstaPay</p>
                <p className="text-[10px] text-blue-400/70 font-semibold">إنستاباي</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              تحويل بنكي فوري عبر تطبيق InstaPay من أي بنك مصري.
            </p>
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-blue-500/[0.06] blur-2xl" />
          </div>

          {/* USDT */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">USDT</p>
                <p className="text-[10px] text-emerald-400/70 font-semibold">تيثر · شبكة BEP20</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              دفع بعملة USDT المستقرة عبر شبكة BNB Smart Chain.
            </p>
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-emerald-500/[0.06] blur-2xl" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          6. REVIEWS
         ════════════════════════════════════════════════════════ */}
      <Divider />
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10 pb-28">
        <SectionLabel icon={Star}>التقييمات</SectionLabel>

        {/* Rating summary */}
        {!reviewsBusy && reviews.length > 0 && avgRating && (
          <div className="mb-6 rounded-3xl border border-white/[0.06] bg-zinc-900/30 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

              {/* Big avg number */}
              <div className="flex flex-col items-center sm:items-start gap-1 shrink-0">
                <p className="text-5xl font-black text-white leading-none">{avgRating}</p>
                <Stars rating={Number(avgRating)} size="md" />
                <p className="text-xs text-white/25 mt-1">{reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"}</p>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 w-full space-y-2">
                {ratingDist.map(({ star, count }) => {
                  const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/30 w-3 shrink-0">{star}</span>
                      <Star className="h-3 w-3 fill-amber-400/50 text-amber-400/50 shrink-0" />
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + star * 0.05, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white/25 w-6 shrink-0 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        <div className="space-y-3 mb-6">
          {reviewsBusy ? (
            <div className="flex items-center gap-2 text-white/20 py-8">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span className="text-sm">جاري التحميل…</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.05] bg-white/[0.015] py-14 text-center">
              <div className="h-14 w-14 rounded-2xl border border-white/[0.04] bg-white/[0.02] grid place-items-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white/[0.08]" />
              </div>
              <p className="text-white/25 text-sm">لا توجد تقييمات بعد — كن أول من يقيّم!</p>
            </div>
          ) : (
            reviews.map((rv) => (
              <div key={rv.id} className="space-y-1.5">

                {/* Review card */}
                <article className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600/40 to-fuchsia-600/25 border border-purple-500/20 grid place-items-center text-xs font-black text-purple-200 shrink-0">
                        {rv.authorName ? rv.authorName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-white/65 leading-none">{rv.authorName}</p>
                          {rv.authorRole && <RoleBadge role={rv.authorRole} />}
                        </div>
                        <Stars rating={rv.rating} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <time className="text-[10px] text-white/18">
                        {new Date(rv.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </time>

                      {isStaff && (
                        <>
                          <button
                            type="button"
                            onClick={() => setReplyOpen((p) => ({ ...p, [rv.id]: !p[rv.id] }))}
                            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                              replyOpen[rv.id]
                                ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                                : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:border-purple-500/30 hover:text-purple-300"
                            }`}
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            رد
                          </button>
                          {confirmId === rv.id ? (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setConfirmId(null)}
                                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-white/30 hover:text-white/60 transition-all">
                                لا
                              </button>
                              <button type="button" disabled={deletingId === rv.id} onClick={() => deleteReview(rv.id)}
                                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all">
                                {deletingId === rv.id ? <LoaderCircle className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
                                تأكيد
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setConfirmId(rv.id)}
                              className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/25 hover:border-red-500/30 hover:text-red-400 transition-all">
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{rv.comment}</p>
                </article>

                {/* Replies */}
                {rv.replies.length > 0 && (
                  <div className="ms-5 space-y-1.5">
                    {rv.replies.map((rep) => (
                      <div key={rep.id}
                        className="flex gap-2.5 rounded-xl border border-purple-500/[0.12] bg-purple-500/[0.04] px-4 py-3"
                      >
                        <CornerDownLeft className="h-3 w-3 text-purple-400/40 mt-0.5 shrink-0 rotate-180 scale-x-[-1]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold text-purple-200/80">{rep.authorName}</span>
                            <RoleBadge role={rep.role} />
                            <time className="text-[10px] text-white/15 ms-auto">
                              {new Date(rep.createdAt).toLocaleDateString("ar-EG", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </time>
                          </div>
                          <p className="text-xs text-white/45 leading-relaxed">{rep.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form (staff only) */}
                <AnimatePresence>
                  {replyOpen[rv.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ms-5 overflow-hidden"
                    >
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-3 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <RoleBadge role={role ?? "helper"} />
                          <span className="text-[10px] text-white/30">ردك كـ {ROLE_META[role ?? ""]?.label ?? "فريق الدعم"}</span>
                        </div>
                        <textarea
                          value={replyText[rv.id] ?? ""}
                          onChange={(e) => setReplyText((p) => ({ ...p, [rv.id]: e.target.value }))}
                          placeholder="اكتب ردك هنا…"
                          rows={2}
                          className="w-full rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/40 resize-none transition-all"
                        />
                        {replyError[rv.id] && (
                          <p className="text-red-400/70 text-[10px]">{replyError[rv.id]}</p>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <button type="button" onClick={() => setReplyOpen((p) => ({ ...p, [rv.id]: false }))}
                            className="px-3 py-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors">
                            إلغاء
                          </button>
                          <button
                            type="button"
                            disabled={replyBusy[rv.id] || !(replyText[rv.id] ?? "").trim()}
                            onClick={() => submitReply(rv.id)}
                            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[10px] font-black text-white disabled:opacity-40 transition-all"
                            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                          >
                            {replyBusy[rv.id] ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                            {replyBusy[rv.id] ? "جاري الإرسال…" : "إرسال الرد"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ))
          )}
        </div>

        {/* Write review / login prompt */}
        {loggedIn ? (
          <form onSubmit={handleSubmit}
            className="rounded-3xl border border-white/[0.06] bg-zinc-900/30 p-5 sm:p-6 space-y-4"
          >
            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">أكتب تقييمك</p>

            {/* Star picker */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" aria-label={`تقييم ${s} نجوم`}
                  onClick={() => setWriteRating(s)}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star className={`h-6 w-6 transition-colors ${
                    s <= (hoverStar || writeRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-white/[0.06] text-white/[0.06]"
                  }`} />
                </button>
              ))}
            </div>

            <textarea
              value={writeComment}
              onChange={(e) => setWriteComment(e.target.value)}
              placeholder="شارك تجربتك مع هذا المنتج…"
              required
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/65 placeholder:text-white/15 outline-none focus:border-purple-500/35 focus:bg-purple-500/[0.03] min-h-[80px] resize-none transition-all"
            />

            {postError && <p className="text-red-400/75 text-xs">{postError}</p>}
            {postOk    && (
              <p className="text-emerald-400/75 text-xs flex items-center gap-1.5">
                <Check className="h-3 w-3" /> تم إرسال تقييمك بنجاح!
              </p>
            )}

            <button type="submit" disabled={posting || !writeComment.trim()}
              className="rounded-xl px-6 py-2.5 text-sm font-black text-white disabled:opacity-35 transition-all flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              {posting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {posting ? "جاري الإرسال…" : "إرسال التقييم"}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
            <Star className="h-8 w-8 text-white/[0.08] mx-auto mb-3" />
            <p className="text-white/25 text-sm mb-4">سجل دخولك لكتابة تقييم على هذا المنتج</p>
            <Link href="/login">
              <button type="button"
                className="rounded-xl px-6 py-2.5 text-sm font-black text-white transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
              >
                {translate("nav.login")}
              </button>
            </Link>
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════
          STICKY BUY BAR
         ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="border-t border-white/[0.06] bg-[#09090F]/96 backdrop-blur-2xl px-5 py-3.5">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

                {/* Product info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl border border-white/[0.06] bg-white/[0.03] grid place-items-center shrink-0 overflow-hidden">
                    <img src={product.image} alt="" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/25 truncate leading-tight">{product.name}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-black leading-tight">
                        {price.toLocaleString("en")} <span className="text-xs text-white/40">EGP</span>
                      </p>
                      {originalPrice > price && (
                        <p className="text-xs font-bold text-red-400/55 line-through">
                          {originalPrice.toLocaleString("en")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky buy button */}
                <motion.button
                  onClick={handleBuyNow}
                  disabled={addingCart || !availability.buyable}
                  whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.03 }}
                  whileTap={availability.buyable ? { scale: 0.97 } : undefined}
                  className={[
                    "shrink-0 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black text-white transition-all",
                    availability.buyable ? "disabled:opacity-75" : "opacity-35 cursor-not-allowed",
                  ].join(" ")}
                  style={availability.buyable ? {
                    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                    boxShadow: "0 0 28px rgba(139,92,246,0.4)",
                  } : {
                    background: "linear-gradient(135deg,#3f3f46,#52525b)",
                  }}
                >
                  {addingCart
                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                    : <ShoppingBag className="h-4 w-4" />}
                  {availability.buyable ? "اشتري الآن" : availability.label}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
