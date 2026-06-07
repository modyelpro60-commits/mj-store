"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Gift,
  Headphones,
  LoaderCircle,
  Package,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useAuth } from "../auth/AuthProvider";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type Product = {
  id: number | string;
  name: string;
  image: string;
  full_description: string;
  price: number | string;
  sales_count: number | string;
  category?: string;
  features?: string | string[] | null;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/* ─── Stars ────────────────────────────────────────────────────────────────── */

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sz = { xl: "h-6 w-6", lg: "h-5 w-5", md: "h-4 w-4", sm: "h-3.5 w-3.5" }[size];
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-white/5 text-white/10"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Trust config ─────────────────────────────────────────────────────────── */

const TRUST = [
  { icon: Zap, label: "تسليم فوري", sub: "في ثوانٍ" },
  { icon: Shield, label: "دفع آمن", sub: "100% مضمون" },
  { icon: Award, label: "وصول مميز", sub: "حصري" },
  { icon: Headphones, label: "دعم مستمر", sub: "24/7" },
];

/* ─── Feature icon picker ──────────────────────────────────────────────────── */

function pickIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("أمان") || t.includes("سري") || t.includes("حماية")) return Shield;
  if (t.includes("سريع") || t.includes("فوري") || t.includes("آني")) return Zap;
  if (t.includes("مستخدم") || t.includes("مشترك") || t.includes("فريق")) return Users;
  if (t.includes("وقت") || t.includes("ساعة") || t.includes("دائم")) return Clock;
  if (t.includes("جائزة") || t.includes("مميز") || t.includes("حصري") || t.includes("بريميوم")) return Award;
  if (t.includes("باقة") || t.includes("محتوى") || t.includes("اشتراك")) return Package;
  if (t.includes("تحديث") || t.includes("جديد") || t.includes("نمو")) return TrendingUp;
  if (t.includes("تقييم") || t.includes("تحقق") || t.includes("موثق")) return BadgeCheck;
  return Sparkles;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════ */

export default function ProductDetailsViewV2({ product }: { product: Product }) {
  const { translate } = useLanguage();
  const { accessToken, isLoading: authLoading } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const price = toNum(product.price);
  const salesCount = toNum(product.sales_count);
  const features = normalizeProductFeatures(product ?? ({} as Product));

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsBusy, setReviewsBusy] = useState(true);
  const [writeRating, setWriteRating] = useState(5);
  const [hoverStar, setHoverStar] = useState(0);
  const [writeComment, setWriteComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postOk, setPostOk] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const heroBuyRef = useRef<HTMLDivElement>(null);

  /* ── Computed ──────────────────────────────────────────────────────────── */
  const parts = useMemo(
    () =>
      (typeof product.full_description === "string" ? product.full_description : "")
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
    [product.full_description],
  );

  const loggedIn = !authLoading && !!accessToken;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDist = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
      })),
    [reviews],
  );

  const hasDescription = parts.length > 0;
  const hasFeatures = features.length > 0;
  const checkoutHref = `/checkout?product=${product.id}`;
  const PREVIEW = 3;

  /* ── Effects ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/product/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReviews(d.data);
      })
      .catch(() => {})
      .finally(() => setReviewsBusy(false));
  }, [product.id]);

  useEffect(() => {
    const el = heroBuyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), {
      rootMargin: "0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── Submit review ─────────────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !accessToken) return;
    setPosting(true);
    setPostError("");
    setPostOk(false);
    try {
      const r = await fetch(`/api/product/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rating: writeRating, comment: writeComment.trim() }),
      });
      const d = await r.json();
      if (!d.success) {
        setPostError(d.error || "خطأ");
        return;
      }
      setPostOk(true);
      setWriteComment("");
      const rd = await (await fetch(`/api/product/${product.id}/reviews`)).json();
      if (rd.success) setReviews(rd.data);
    } catch {
      setPostError("خطأ في الاتصال");
    } finally {
      setPosting(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  RENDER
   * ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-[#08080E] text-white min-h-screen selection:bg-purple-500/25" dir="rtl">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.05] bg-[#0A0A14]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-xs text-white/30 flex-wrap">
            <li>
              <Link href="/" className="hover:text-purple-300 transition-colors">
                الرئيسية
              </Link>
            </li>
            <li>
              <ChevronLeft className="h-3 w-3" />
            </li>
            <li>
              <Link href="/products" className="hover:text-purple-300 transition-colors">
                المنتجات
              </Link>
            </li>
            <li>
              <ChevronLeft className="h-3 w-3" />
            </li>
            <li className="text-white/60 font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
       *  HERO — SPLIT LAYOUT
       * ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto min-h-[calc(100vh-45px)] grid lg:grid-cols-[55fr_45fr]">

        {/* ╔══════════════════════════════╗
         * ║  LEFT — image showcase       ║
         * ╚══════════════════════════════╝ */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#060610] min-h-[320px] sm:min-h-[420px] lg:min-h-0 order-first border-b lg:border-b-0 lg:border-l border-white/[0.05]">

          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <img
              src={product.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-150 blur-[110px] opacity-30 saturate-[3]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#060610]/60 via-transparent to-[#060610]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060610]/70 via-transparent to-transparent" />
            {/* subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(168,85,247,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.6) 1px,transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
          </div>

          {/* Image + rings */}
          <div className="relative z-10 flex items-center justify-center w-full h-full p-14 sm:p-20 lg:p-24">

            {/* Outer pulsing ring */}
            <motion.div
              aria-hidden
              className="absolute rounded-full border border-purple-500/[0.13]"
              style={{ width: "min(460px,78vw)", height: "min(460px,78vw)" }}
              animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1], opacity: [0.25, 0.65, 0.25] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Mid ring */}
            <motion.div
              aria-hidden
              className="absolute rounded-full border border-fuchsia-500/[0.08]"
              style={{ width: "min(340px,60vw)", height: "min(340px,60vw)" }}
              animate={prefersReducedMotion ? {} : { scale: [1.05, 1, 1.05], opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Core glow */}
            <motion.div
              aria-hidden
              className="absolute rounded-full bg-purple-600/25 blur-[90px]"
              style={{ width: "min(240px,45vw)", height: "min(240px,45vw)" }}
              animate={prefersReducedMotion ? {} : { scale: [0.85, 1.15, 0.85], opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Product image with premium frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Gradient border glow */}
              <div
                className="absolute inset-[-3px] rounded-3xl opacity-70 blur-sm pointer-events-none"
                style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.5),rgba(217,70,239,0.25),transparent 60%)" }}
                aria-hidden
              />
              {/* Frame */}
              <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3 backdrop-blur-sm shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="w-[170px] h-[170px] sm:w-[230px] sm:h-[230px] lg:w-[290px] lg:h-[290px] object-contain rounded-2xl"
                  style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.9))" }}
                  animate={prefersReducedMotion ? {} : { y: [0, -9, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>

            {/* Sales float badge */}
            {salesCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.78, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.45, ease: "backOut" }}
                className="absolute bottom-8 left-8 sm:bottom-10 sm:left-10 rounded-2xl border border-purple-400/20 bg-[#0D0D1C]/85 backdrop-blur-xl px-4 py-3"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/50 mb-0.5">
                  المبيعات
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-purple-200">
                    {salesCount.toLocaleString()}
                  </span>
                  <span className="text-sm font-black text-purple-400/50">+</span>
                </div>
              </motion.div>
            )}

            {/* Premium stamp */}
            <motion.div
              initial={{ opacity: 0, scale: 0.78, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.7, duration: 0.4, ease: "backOut" }}
              className="absolute top-8 right-8 sm:top-10 sm:right-10 rounded-xl border border-fuchsia-500/25 bg-fuchsia-950/70 backdrop-blur-xl px-3 py-2 flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-fuchsia-400" />
              <span className="text-[10px] font-black text-fuchsia-300 tracking-wide">Premium</span>
            </motion.div>
          </div>
        </div>

        {/* ╔══════════════════════════════╗
         * ║  RIGHT — product info        ║
         * ╚══════════════════════════════╝ */}
        <div className="order-last flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 lg:py-14 gap-6">

          {/* Category + actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-300 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              {product.category || "منتج رقمي"}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label="مشاركة"
                onClick={() =>
                  navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})
                }
                className="h-8 w-8 grid place-items-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/30 hover:text-white/70 hover:border-white/15 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="إضافة للمفضلة"
                onClick={() => setWishlisted((v) => !v)}
                className={`h-8 w-8 grid place-items-center rounded-lg border transition-all ${
                  wishlisted
                    ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-400"
                    : "border-white/[0.07] bg-white/[0.02] text-white/30 hover:text-fuchsia-400 hover:border-fuchsia-500/30"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Product name + rating */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black leading-[1.08] tracking-tight text-white">
              {product.name}
            </h1>

            {!reviewsBusy && reviews.length > 0 && (
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                <Stars rating={avgRating} size="md" />
                <span className="text-sm font-black text-amber-400">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-white/25">
                  ({reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"})
                </span>
                {salesCount > 0 && (
                  <>
                    <span className="text-white/10">·</span>
                    <span className="text-xs text-white/25">{salesCount.toLocaleString()}+ مبيعة</span>
                  </>
                )}
              </div>
            )}
            {!reviewsBusy && reviews.length === 0 && salesCount > 0 && (
              <p className="mt-2 text-xs text-white/25">{salesCount.toLocaleString()}+ مبيعة</p>
            )}
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="py-5 border-y border-white/[0.06]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1.5">
              السعر
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-200">
                {price.toLocaleString("en")}
              </span>
              <span className="text-xl font-black text-white/30">EGP</span>
            </div>
          </motion.div>

          {/* CTA buttons — observed by IntersectionObserver */}
          <motion.div
            ref={heroBuyRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4 }}
            className="space-y-3"
          >
            <Link href={checkoutHref} className="block">
              <motion.button
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : { scale: 1.02, boxShadow: "0 0 64px rgba(168,85,247,0.55)" }
                }
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-8 py-[18px] text-lg font-black text-white shadow-[0_0_44px_rgba(168,85,247,0.38)] transition-all duration-300"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 translate-x-[110%] group-hover:translate-x-[-110%] bg-gradient-to-l from-transparent via-white/15 to-transparent transition-transform duration-700"
                />
                <ShoppingBag className="h-5 w-5 relative shrink-0" />
                <span className="relative">اشتري الآن</span>
              </motion.button>
            </Link>

            <Link href={`/gift?product=${product.id}`} className="block">
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/[0.05] hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 px-8 py-3.5 text-sm font-bold text-fuchsia-300/80 hover:text-fuchsia-200 transition-all duration-200"
              >
                <Gift className="h-4 w-4" />
                أرسلها كهدية
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            className="grid grid-cols-4 gap-2"
          >
            {TRUST.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2 py-3 text-center hover:border-purple-500/15 hover:bg-purple-500/[0.03] transition-all"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/15 grid place-items-center">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-[10px] font-black text-white/60 leading-tight">{label}</p>
                <p className="text-[9px] text-white/25 leading-tight">{sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">متوفر الآن</span>
            <span className="text-white/15 text-xs mx-0.5">·</span>
            <span className="text-xs text-white/25">وصول فوري بعد الشراء</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
       *  PRODUCT STORY
       * ════════════════════════════════════════════════════════════════════ */}
      {hasDescription && (
        <section className="border-t border-white/[0.05] bg-[#0A0A14]/50">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/50 mb-3">
                عن المنتج
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-8 leading-tight">
                لماذا{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
                  {product.name}
                </span>
                ؟
              </h2>

              <div className="relative">
                <div
                  className={`space-y-5 text-[15px] text-white/55 leading-[2.1] overflow-hidden transition-all duration-500 ${
                    !descExpanded && parts.length > PREVIEW ? "max-h-[240px]" : ""
                  }`}
                >
                  {parts.map((p, i) => (
                    <p key={i} className="text-right">
                      {p}
                    </p>
                  ))}
                </div>

                {parts.length > PREVIEW && !descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A14] to-transparent pointer-events-none" />
                )}
              </div>

              {parts.length > PREVIEW && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-6 flex items-center gap-1.5 text-sm font-black text-purple-400 hover:text-purple-300 transition-colors group"
                >
                  {descExpanded ? "عرض أقل" : "اقرأ المزيد"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      descExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
                    }`}
                  />
                </button>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
       *  FEATURES
       * ════════════════════════════════════════════════════════════════════ */}
      {hasFeatures && (
        <section className="border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/50 mb-3">
                ما الذي تحصل عليه
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                المميزات الحصرية
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => {
                const Icon = pickIcon(f);
                return (
                  <motion.div
                    key={`${f}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.055, duration: 0.4 }}
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-purple-500/25 hover:bg-purple-500/[0.04] p-5 transition-all duration-300"
                  >
                    {/* hover glow layer */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-fuchsia-500/0 group-hover:from-purple-500/[0.06] group-hover:to-fuchsia-500/[0.03] transition-all duration-300 pointer-events-none" />

                    <div className="flex items-start gap-4">
                      <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/20 grid place-items-center">
                        <Icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <p className="text-sm font-bold text-white/75 leading-snug pt-1.5 flex-1 min-w-0">
                        {f}
                      </p>
                    </div>

                    {/* check tick appears on hover */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Check className="h-3 w-3 text-purple-400/50" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
       *  SOCIAL PROOF STRIP
       * ════════════════════════════════════════════════════════════════════ */}
      {(reviews.length > 0 || salesCount > 0) && (
        <section className="border-t border-white/[0.05] bg-gradient-to-r from-purple-950/20 via-[#0A0A14]/60 to-fuchsia-950/20">
          <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              {avgRating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 leading-none mb-2">
                    {avgRating.toFixed(1)}
                  </p>
                  <div className="flex justify-center mb-1.5">
                    <Stars rating={avgRating} size="md" />
                  </div>
                  <p className="text-xs text-white/30">متوسط التقييم</p>
                </motion.div>
              )}

              {reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                >
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-500 leading-none mb-2">
                    {reviews.length}
                  </p>
                  <div className="flex justify-center mb-1.5">
                    <Star className="h-4 w-4 text-purple-400 fill-purple-400" />
                  </div>
                  <p className="text-xs text-white/30">تقييم موثق</p>
                </motion.div>
              )}

              {salesCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.16, duration: 0.4 }}
                  className={reviews.length > 0 && avgRating > 0 ? "" : "col-span-2 sm:col-span-1"}
                >
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 to-fuchsia-500 leading-none mb-2">
                    {salesCount.toLocaleString()}+
                  </p>
                  <div className="flex justify-center mb-1.5">
                    <Users className="h-4 w-4 text-fuchsia-400" />
                  </div>
                  <p className="text-xs text-white/30">عميل راضٍ</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
       *  REVIEWS
       * ════════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-20">

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/50 mb-3">
              تجارب العملاء
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ما يقوله المستخدمون
              {reviews.length > 0 && (
                <span className="mr-3 text-lg font-bold text-white/20">({reviews.length})</span>
              )}
            </h2>
          </motion.div>

          {reviewsBusy ? (
            <div className="flex items-center justify-center gap-3 py-16 text-white/20">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span className="text-sm">جاري تحميل التقييمات…</span>
            </div>
          ) : (
            <>
              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] py-14 text-center mb-10">
                  <Star className="h-10 w-10 text-white/[0.05] mx-auto mb-3" />
                  <p className="text-white/30 text-sm font-bold">لا توجد تقييمات بعد</p>
                  <p className="text-white/15 text-xs mt-1">كن أول من يقيّم هذا المنتج</p>
                </div>
              ) : (
                <>
                  {/* Rating summary card */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8 grid sm:grid-cols-[auto_1fr] gap-6 items-center"
                  >
                    <div className="text-center sm:border-l sm:border-white/[0.06] sm:pl-6">
                      <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 leading-none">
                        {avgRating.toFixed(1)}
                      </p>
                      <div className="flex justify-center mt-2 mb-1.5">
                        <Stars rating={avgRating} size="lg" />
                      </div>
                      <p className="text-xs text-white/30">{reviews.length} تقييم</p>
                    </div>

                    <div className="space-y-2.5">
                      {ratingDist.map(({ star, count }) => {
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-xs text-white/30 w-4 text-right leading-none">
                              {star}
                            </span>
                            <Star className="h-3 w-3 text-amber-400/50 fill-amber-400/50 shrink-0" />
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/60"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.75, delay: (5 - star) * 0.07 }}
                              />
                            </div>
                            <span className="text-xs text-white/20 w-5 text-left">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Review cards */}
                  <div className="space-y-4 mb-12">
                    {reviews.map((rv, i) => (
                      <motion.article
                        key={rv.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.35 }}
                        className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 border border-purple-500/20 grid place-items-center text-sm font-black text-purple-300/80 shrink-0">
                              {rv.authorName ? rv.authorName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white/70 leading-tight">
                                {rv.authorName}
                              </p>
                              <div className="mt-0.5">
                                <Stars rating={rv.rating} size="sm" />
                              </div>
                            </div>
                          </div>
                          <time className="text-[11px] text-white/20 shrink-0 mt-0.5">
                            {new Date(rv.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                        <p className="text-sm text-white/45 leading-relaxed">{rv.comment}</p>
                      </motion.article>
                    ))}
                  </div>
                </>
              )}

              {/* Write review */}
              <div className="border-t border-white/[0.05] pt-10">
                <h3 className="text-lg font-black text-white mb-6">أضف تقييمك</h3>

                {loggedIn ? (
                  <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5"
                  >
                    {/* Star picker */}
                    <div>
                      <p className="text-xs font-bold text-white/30 mb-3">تقييمك</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-label={`تقييم ${s} نجوم`}
                            onClick={() => setWriteRating(s)}
                            onMouseEnter={() => setHoverStar(s)}
                            onMouseLeave={() => setHoverStar(0)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                s <= (hoverStar || writeRating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-white/10 fill-white/5"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <p className="text-xs font-bold text-white/30 mb-2">تعليقك</p>
                      <textarea
                        value={writeComment}
                        onChange={(e) => setWriteComment(e.target.value)}
                        placeholder="شارك تجربتك مع هذا المنتج…"
                        required
                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/40 focus:bg-purple-500/[0.03] min-h-[100px] resize-none transition-all"
                      />
                    </div>

                    {postError && <p className="text-red-400/80 text-sm">{postError}</p>}
                    {postOk && (
                      <p className="text-emerald-400/80 text-sm flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        تم إرسال تقييمك بنجاح!
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={posting || !writeComment.trim()}
                      className="rounded-xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-7 py-2.5 text-sm font-black text-white disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      {posting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      {posting ? "جاري الإرسال…" : "إرسال التقييم"}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center"
                  >
                    <Star className="h-8 w-8 text-white/[0.05] mx-auto mb-3" />
                    <p className="text-white/40 text-sm font-bold mb-1">
                      سجل دخول لكتابة تقييم
                    </p>
                    <p className="text-white/20 text-xs mb-5">
                      تجربتك تساعد الآخرين على اتخاذ قرارهم
                    </p>
                    <Link href="/login">
                      <button
                        type="button"
                        className="rounded-xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-7 py-2.5 text-sm font-black text-white transition-all"
                      >
                        {translate("nav.login")}
                      </button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
       *  STICKY BUY BAR
       * ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="border-t border-white/[0.07] bg-[#08080E]/96 backdrop-blur-2xl px-5 py-3.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={product.image}
                    alt=""
                    className="h-10 w-10 rounded-xl object-contain bg-white/[0.04] border border-white/[0.06] p-1.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-white/30 truncate leading-tight">{product.name}</p>
                    <p className="text-xl font-black leading-tight">
                      EGP {price.toLocaleString("en")}
                    </p>
                  </div>
                </div>

                <Link href={checkoutHref} className="shrink-0">
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.38)] transition-all"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    اشتري الآن
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
