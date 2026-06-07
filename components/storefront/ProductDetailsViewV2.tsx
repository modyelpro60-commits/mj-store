"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronLeft, Gift,
  LoaderCircle, Share2,
  ShoppingBag, ShoppingCart, Star,
} from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";
import { useLanguage }              from "../../lib/i18n/LanguageProvider";
import { useAuth }                  from "../auth/AuthProvider";

/* ── Types ─────────────────────────────────────────────────────── */

type Product = {
  id: number | string;
  name: string;
  image: string;
  full_description: string;
  price: number | string;
  sales_count: number | string;
  features?: string | string[] | null;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

type Tab = "details" | "features" | "reviews";

/* ── Helpers ────────────────────────────────────────────────────── */

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
          className={`${cls} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
        />
      ))}
    </div>
  );
}

function PayBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-[10px] font-black tracking-wide ${color}`}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════ */

export default function ProductDetailsViewV2({ product }: { product: Product }) {
  const { translate }                           = useLanguage();
  const { accessToken, isLoading: authLoading } = useAuth();
  const prefersReducedMotion                    = useReducedMotion();

  const price      = toNum(product.price);
  const salesCount = toNum(product.sales_count);
  const features   = normalizeProductFeatures(product ?? ({} as Product));

  /* ── State ──────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState<Tab>("details");
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [reviewsBusy,  setReviewsBusy]  = useState(true);
  const [writeRating,  setWriteRating]  = useState(5);
  const [writeComment, setWriteComment] = useState("");
  const [posting,      setPosting]      = useState(false);
  const [postError,    setPostError]    = useState("");
  const [postOk,       setPostOk]       = useState(false);
  const [showSticky,   setShowSticky]   = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlisted,   setWishlisted]   = useState(false);

  const heroBuyRef = useRef<HTMLDivElement>(null);

  /* ── Description paragraphs ─────────────────────────────────── */
  const parts = useMemo(
    () =>
      (typeof product.full_description === "string" ? product.full_description : "")
        .split("\n").map((p) => p.trim()).filter(Boolean),
    [product.full_description],
  );
  const hasDescription = parts.length > 0;
  const hasFeatures    = features.length > 0;

  const loggedIn = !authLoading && !!accessToken;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  /* ── Auto-select best tab ───────────────────────────────────── */
  useEffect(() => {
    if (!hasDescription && hasFeatures) setActiveTab("features");
    else if (!hasDescription && !hasFeatures) setActiveTab("reviews");
  }, [hasDescription, hasFeatures]);

  /* ── Fetch reviews ──────────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/product/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data); })
      .catch(() => {})
      .finally(() => setReviewsBusy(false));
  }, [product.id]);

  /* ── Sticky bar IntersectionObserver ────────────────────────── */
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

  /* ── Submit review ──────────────────────────────────────────── */
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

  const checkoutHref = `/checkout?product=${product.id}`;

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="bg-[#08080E] text-white min-h-screen selection:bg-purple-500/25" dir="rtl">

      {/* ── BREADCRUMB ──────────────────────────────────────────── */}
      <div className="border-b border-white/[0.05] bg-[#0A0A14]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-xs text-white/30 flex-wrap">
            <li>
              <Link href="/" className="hover:text-purple-300 transition-colors">الرئيسية</Link>
            </li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li>
              <Link href="/products" className="hover:text-purple-300 transition-colors">قسم المنتجات</Link>
            </li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li className="text-white/60 font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[45fr_55fr] min-h-[calc(100vh-45px)]">

          {/* ╔══════════════════════════════════════════════════╗
           * ║  RIGHT — product showcase image                  ║
           * ╚══════════════════════════════════════════════════╝ */}
          <div className="order-first lg:order-last relative flex items-center justify-center min-h-[300px] sm:min-h-[420px] lg:min-h-0 overflow-hidden bg-[#06060C]">

            {/* Ambient blurred bg */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <img
                src={product.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-[90px] opacity-20 saturate-[2]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06060C]/30 via-transparent to-[#06060C]/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#08080E]/70 via-transparent to-transparent" />
            </div>

            {/* Product image */}
            <div className="relative z-10 flex items-center justify-center w-full h-full p-12 sm:p-16 lg:p-20">
              <motion.div
                aria-hidden
                className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full border border-purple-500/10"
                animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute w-[280px] h-[280px] rounded-full bg-purple-600/20 blur-[70px]"
                animate={prefersReducedMotion ? {} : { scale: [0.8, 1.15, 0.8], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.img
                src={product.image}
                alt={product.name}
                className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] lg:w-[340px] lg:h-[340px] object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
                animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              />
              {salesCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "backOut" }}
                  className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 rounded-2xl border border-purple-400/25 bg-purple-950/60 backdrop-blur-md px-5 py-3 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/60 mb-0.5">المبيعات</p>
                  <p className="text-2xl font-black text-purple-200">{salesCount.toLocaleString()}+</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* ╔══════════════════════════════════════════════════╗
           * ║  LEFT — product info panel                       ║
           * ╚══════════════════════════════════════════════════╝ */}
          <div className="order-last lg:order-first flex flex-col border-t lg:border-t-0 lg:border-l border-white/[0.05]">
            <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col gap-6 flex-1">

              {/* ── NAME + ACTIONS ──────────────────────────────── */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight text-white"
                  >
                    {product.name}
                  </motion.h1>

                  <div className="flex gap-2 shrink-0 mt-1">
                    <button
                      type="button"
                      aria-label="مشاركة"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                        }
                      }}
                      className="h-9 w-9 grid place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/70 hover:border-white/15 transition-all"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="إضافة للمفضلة"
                      onClick={() => setWishlisted((v) => !v)}
                      className={`h-9 w-9 grid place-items-center rounded-xl border transition-all ${
                        wishlisted
                          ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-400"
                          : "border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-fuchsia-400 hover:border-fuchsia-500/30"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {!reviewsBusy && reviews.length > 0 && avgRating && (
                  <motion.button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="mt-3 flex items-center gap-2.5 group"
                  >
                    <Stars rating={Number(avgRating)} size="md" />
                    <span className="text-sm font-black text-amber-400">{avgRating}</span>
                    <span className="text-xs text-white/25 group-hover:text-purple-300 transition-colors">
                      ({reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"})
                    </span>
                  </motion.button>
                )}
              </div>

              {/* ── PRICE + STATUS ──────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex items-center justify-between flex-wrap gap-4 py-5 border-y border-white/[0.06]"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">السعر</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white via-purple-100 to-fuchsia-200">
                      EGP {price.toLocaleString("en")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400">متوفر</span>
                </div>
              </motion.div>

              {/* ── TABS ─────────────────────────────────────────── */}
              <div>
                <div className="flex gap-0 border-b border-white/[0.06]">
                  {(
                    [
                      { id: "details"  as const, label: "التفاصيل",  show: hasDescription },
                      { id: "features" as const, label: "المميزات",  show: hasFeatures    },
                      {
                        id: "reviews"  as const,
                        label: reviews.length > 0 ? `التقييمات (${reviews.length})` : "التقييمات",
                        show: true,
                      },
                    ]
                  )
                    .filter((t) => t.show)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`relative px-5 py-3 text-sm font-bold transition-colors ${
                          activeTab === t.id
                            ? "text-white"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        {t.label}
                        {activeTab === t.id && (
                          <motion.div
                            layoutId="tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-l from-purple-500 to-fuchsia-500"
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="py-5 min-h-[120px]"
                  >
                    {activeTab === "details" && (
                      <div className="space-y-4 text-sm text-white/50 leading-[2]">
                        {(descExpanded ? parts : parts.slice(0, 4)).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                        {parts.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setDescExpanded((v) => !v)}
                            className="text-purple-400/70 hover:text-purple-300 text-sm font-bold transition-colors flex items-center gap-1"
                          >
                            {descExpanded ? "عرض أقل" : "اقرأ المزيد"}
                            <ArrowRight className={`h-3.5 w-3.5 transition-transform ${descExpanded ? "-rotate-90" : "rotate-90"}`} />
                          </button>
                        )}
                      </div>
                    )}

                    {activeTab === "features" && (
                      <ul className="grid sm:grid-cols-2 gap-2.5 list-none">
                        {features.map((f, i) => (
                          <li key={`${f}-${i}`}>
                            <motion.div
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.25 }}
                              className="flex items-center gap-3 text-sm text-white/60 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 h-full"
                            >
                              <span className="h-5 w-5 rounded-full bg-purple-500/15 border border-purple-500/20 grid place-items-center shrink-0">
                                <Check className="h-3 w-3 text-purple-400" />
                              </span>
                              {f}
                            </motion.div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeTab === "reviews" && (
                      <div className="space-y-4">
                        {reviewsBusy ? (
                          <div className="flex items-center gap-2 text-white/20 py-6">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span className="text-sm">جاري التحميل…</span>
                          </div>
                        ) : reviews.length === 0 ? (
                          <div className="py-8 text-center">
                            <Star className="h-8 w-8 text-white/8 mx-auto mb-2" />
                            <p className="text-white/25 text-sm">لا توجد تقييمات بعد</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[260px] overflow-y-auto pe-1">
                            {reviews.map((rv) => (
                              <article
                                key={rv.id}
                                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                              >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 border border-purple-500/20 grid place-items-center text-xs font-black text-purple-300/70">
                                      {rv.authorName ? rv.authorName.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-white/60 leading-none">{rv.authorName}</p>
                                      <div className="mt-0.5"><Stars rating={rv.rating} /></div>
                                    </div>
                                  </div>
                                  <time className="text-[10px] text-white/18 shrink-0">
                                    {new Date(rv.createdAt).toLocaleDateString("ar-EG", {
                                      year: "numeric", month: "short", day: "numeric",
                                    })}
                                  </time>
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed">{rv.comment}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        {loggedIn ? (
                          <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                            <p className="text-xs font-bold text-white/40">أكتب تقييمك</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" aria-label={`تقييم ${s} نجوم`} onClick={() => setWriteRating(s)}
                                  className="p-0.5 hover:scale-110 transition-transform">
                                  <Star className={`h-6 w-6 ${s <= writeRating ? "fill-amber-400 text-amber-400" : "text-white/10"}`} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={writeComment}
                              onChange={(e) => setWriteComment(e.target.value)}
                              placeholder="شارك تجربتك مع هذا المنتج…"
                              required
                              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-xs text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 min-h-[64px] resize-none transition-colors"
                            />
                            {postError && <p className="text-red-400/80 text-xs">{postError}</p>}
                            {postOk    && <p className="text-emerald-400/80 text-xs">تم إرسال تقييمك!</p>}
                            <div className="flex justify-start">
                              <button type="submit" disabled={posting || !writeComment.trim()}
                                className="rounded-lg bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-black text-white disabled:opacity-40 transition-colors flex items-center gap-1.5">
                                {posting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : "إرسال التقييم"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                            <p className="text-white/25 text-xs mb-3">سجل دخول لكتابة تقييم</p>
                            <Link href="/login">
                              <button type="button" className="rounded-lg bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-black text-white transition-colors">
                                {translate("nav.login")}
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── BUY SECTION ──────────────────────────────────── */}
              <div ref={heroBuyRef} className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-white/20">إتمام الشراء</p>
                  <span className="text-lg font-black text-white">EGP {price.toLocaleString("en")}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href={checkoutHref} className="col-span-2 sm:col-span-1">
                    <motion.button
                      whileHover={prefersReducedMotion ? undefined : {
                        scale: 1.02,
                        boxShadow: "0 0 60px rgba(168,85,247,0.45)",
                      }}
                      whileTap={{ scale: 0.97 }}
                      className="relative overflow-hidden group w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-6 py-4 text-sm font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.30)] transition-all duration-300"
                    >
                      <span aria-hidden className="absolute inset-0 translate-x-[100%] group-hover:translate-x-[-100%] bg-gradient-to-l from-transparent via-white/10 to-transparent transition-transform duration-700" />
                      <ShoppingBag className="h-4 w-4 relative" />
                      <span className="relative">اشتري الآن</span>
                    </motion.button>
                  </Link>

                  <Link href={checkoutHref} className="col-span-2 sm:col-span-1">
                    <motion.button
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-purple-500/30 bg-purple-500/[0.07] hover:border-purple-400/50 hover:bg-purple-500/12 px-6 py-4 text-sm font-bold text-white/70 hover:text-white transition-all duration-200"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      أضف للسلة
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* ── PAYMENT METHODS ──────────────────────────────── */}
              <div className="pt-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/15 mb-3">وسائل الدفع المتاحة</p>
                <div className="flex flex-wrap gap-2">
                  <PayBadge label="Visa"       color="border-blue-500/20 bg-blue-500/5 text-blue-400/60" />
                  <PayBadge label="Mastercard" color="border-orange-500/20 bg-orange-500/5 text-orange-400/60" />
                  <PayBadge label="Fawry"      color="border-orange-400/20 bg-orange-400/5 text-orange-300/60" />
                  <PayBadge label="InstaPay"   color="border-purple-500/20 bg-purple-500/5 text-purple-400/60" />
                  <PayBadge label="Meeza"      color="border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60" />
                </div>
              </div>

              {/* ── GIFT CARD ─────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-fuchsia-500/15 bg-gradient-to-l from-fuchsia-950/30 to-purple-950/20 p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-black text-base text-white/80">أهدي من تحب</p>
                  <p className="text-xs text-white/30 mt-0.5">يمكنك إهداء لمن تحب بتوالي</p>
                </div>
                <Link href={`/gift?product=${product.id}`}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-5 py-2.5 text-xs font-black text-fuchsia-300 transition-all"
                  >
                    <Gift className="h-4 w-4" />
                    أرسلها كهدية
                  </motion.button>
                </Link>
              </motion.div>

            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  STICKY BAR
       * ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="border-t border-white/[0.07] bg-[#08080E]/95 backdrop-blur-2xl px-5 py-3.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-contain bg-white/5 border border-white/[0.06] p-1" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/30 truncate">{product.name}</p>
                    <p className="text-lg font-black leading-none">EGP {price.toLocaleString("en")}</p>
                  </div>
                </div>
                <Link href={checkoutHref} className="shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-6 py-2.5 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.35)] transition-all"
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
