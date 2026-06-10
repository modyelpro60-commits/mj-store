"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Check, ChevronLeft, CornerDownLeft,
  Crown, LoaderCircle, MessageSquare, Share2,
  ShieldCheck, ShoppingBag, ShoppingCart, Star, Trash2, Wrench,
} from "lucide-react";
import { useLanguage }              from "../../lib/i18n/LanguageProvider";
import { useAuth }                  from "../auth/AuthProvider";
import { useCart }                  from "../cart/CartProvider";
import { useAnalytics }             from "../../lib/analytics/useAnalytics";

/* ── Types ──────────────────────────────────────────────────────────── */

type Product = {
  id: number | string;
  name: string;
  image: string;
  description?: string;
  price: number | string;
  original_price?: number | string | null;
  status?: string;
  sales_count: number | string;
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

type Tab = "details" | "reviews";

/* ── Availability config ─────────────────────────────────────────── */

const AVAILABILITY = {
  available: {
    label:  "متوفر",
    dot:    "bg-emerald-400 animate-pulse",
    pill:   "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
    buyable: true,
  },
  out_of_stock: {
    label:  "نفذت الكمية",
    dot:    "bg-red-400",
    pill:   "border-red-500/20 bg-red-500/[0.08] text-red-400",
    buyable: false,
  },
  coming_soon: {
    label:  "قريباً",
    dot:    "bg-amber-400 animate-pulse",
    pill:   "border-amber-500/20 bg-amber-500/[0.08] text-amber-400",
    buyable: false,
  },
} as const;

type AvailabilityKey = keyof typeof AVAILABILITY;

function getAvailability(status?: string) {
  const key = (status ?? "available") as AvailabilityKey;
  return AVAILABILITY[key] ?? AVAILABILITY.available;
}

/* ── Role badge ─────────────────────────────────────────────────────── */

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

/* ── Helpers ────────────────────────────────────────────────────────── */

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

/* ══════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════ */

export default function ProductDetailsViewV2({ product }: { product: Product }) {
  const { translate }                                    = useLanguage();
  const { accessToken, isLoading: authLoading, role }    = useAuth();
  const prefersReducedMotion                             = useReducedMotion();
  const { trackEvent }                                   = useAnalytics();
  const isStaff = role === "admin" || role === "moderator" || role === "helper";

  const price         = toNum(product.price);
  const originalPrice = toNum(product.original_price);
  const salesCount    = toNum(product.sales_count);
  const availability  = getAvailability(product.status);
  const discountPct   = originalPrice > price && price > 0
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  /* ── State ──────────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState<Tab>("details");
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [reviewsBusy,  setReviewsBusy]  = useState(true);
  const [writeRating,  setWriteRating]  = useState(5);
  const [hoverStar,    setHoverStar]    = useState(0);
  const [writeComment, setWriteComment] = useState("");
  const [posting,      setPosting]      = useState(false);
  const [postError,    setPostError]    = useState("");
  const [postOk,       setPostOk]       = useState(false);
  const [showSticky,   setShowSticky]   = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlisted,   setWishlisted]   = useState(false);

  // Reply state — keyed by review id
  const [replyOpen,    setReplyOpen]    = useState<Record<number, boolean>>({});
  const [replyText,    setReplyText]    = useState<Record<number, string>>({});
  const [replyBusy,    setReplyBusy]    = useState<Record<number, boolean>>({});
  const [replyError,   setReplyError]   = useState<Record<number, string>>({});

  // Delete state — keyed by review id
  const [deletingId,   setDeletingId]   = useState<number | null>(null);
  const [confirmId,    setConfirmId]    = useState<number | null>(null);

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

  /* ── Fetch reviews ───────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/product/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data); })
      .catch(() => {})
      .finally(() => setReviewsBusy(false));
  }, [product.id]);

  /* ── Sticky IntersectionObserver ─────────────────────────────────── */
  useEffect(() => {
    const el = heroBuyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { rootMargin: "0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── Submit review ───────────────────────────────────────────────── */
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

  /* ── Delete review ──────────────────────────────────────────────── */
  async function deleteReview(reviewId: number) {
    if (!accessToken) return;
    setDeletingId(reviewId);
    try {
      const r = await fetch(`/api/product/${product.id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      if (d.success) {
        setReviews((prev) => prev.filter((rv) => rv.id !== reviewId));
        setConfirmId(null);
      }
    } catch {}
    finally { setDeletingId(null); }
  }

  /* ── Submit reply ───────────────────────────────────────────────── */
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

  /* ── Cart actions ── */
  const router = useRouter();
  const { add } = useCart();
  const [addingCart, setAddingCart] = useState(false);

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

  /* ── RENDER ──────────────────────────────────────────────────────── */
  return (
    <div className="bg-[#07070D] text-white min-h-screen selection:bg-purple-500/25" dir="rtl">

      {/* ── BREADCRUMB ───────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.04] bg-[#09090F]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5">
          <ol className="flex items-center gap-1.5 text-xs text-white/25 flex-wrap">
            <li><Link href="/" className="hover:text-purple-300 transition-colors">الرئيسية</Link></li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li><Link href="/products" className="hover:text-purple-300 transition-colors">قسم المنتجات</Link></li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li className="text-white/50 font-medium truncate max-w-[220px]">{product.name}</li>
          </ol>
        </div>
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[45fr_55fr] lg:min-h-[calc(100vh-48px)]">

          {/* ╔════════════════════════════════════════╗
           * ║  RIGHT — image showcase                ║
           * ╚════════════════════════════════════════╝ */}
          <div className="order-first lg:order-last relative flex items-center justify-center min-h-[280px] sm:min-h-[360px] lg:min-h-0 overflow-hidden lg:sticky lg:top-[48px] lg:h-[calc(100vh-48px)]"
            style={{ background: "radial-gradient(ellipse at 60% 50%, #130a24 0%, #07070D 65%)" }}
          >
            {/* Ambient image blur */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <img
                src={product.image} alt=""
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-[100px] opacity-25 saturate-[2.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#07070D]/20 via-transparent to-[#07070D]/70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/60 via-transparent to-transparent" />
            </div>

            {/* Rings + image */}
            <div className="relative z-10 flex items-center justify-center w-full h-full p-10 sm:p-14 lg:p-16">

              {/* Outer ring */}
              <motion.div aria-hidden
                className="absolute rounded-full border border-purple-500/[0.12]"
                style={{ width: "min(400px,75vw)", height: "min(400px,75vw)" }}
                animate={prefersReducedMotion ? {} : { scale: [1, 1.04, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Mid glow */}
              <motion.div aria-hidden
                className="absolute rounded-full bg-purple-600/20 blur-[80px]"
                style={{ width: "min(280px,55vw)", height: "min(280px,55vw)" }}
                animate={prefersReducedMotion ? {} : { scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Product image */}
              <div className="relative overflow-hidden rounded-2xl">
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[320px] lg:h-[320px] object-contain drop-shadow-[0_24px_64px_rgba(0,0,0,0.95)]"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {!prefersReducedMotion && (
                  <motion.span aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1], delay: 1.8, repeat: Infinity, repeatDelay: 5 }}
                  />
                )}
              </div>

              {/* Discount badge */}
              {discountPct > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: "backOut" }}
                  className="absolute top-8 right-8 rounded-2xl border border-red-500/30 bg-red-500/20 backdrop-blur-xl px-3.5 py-2.5"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-0.5">خصم</p>
                  <p className="text-xl font-black text-red-300 leading-none">{discountPct}%</p>
                </motion.div>
              )}

              {/* Sales badge */}
              {salesCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4, ease: "backOut" }}
                  className="absolute bottom-8 left-8 rounded-2xl border border-purple-400/20 bg-black/50 backdrop-blur-xl px-4 py-3"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/50 mb-0.5">المبيعات</p>
                  <p className="text-xl font-black text-purple-200 leading-none">{salesCount.toLocaleString()}+</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* ╔════════════════════════════════════════╗
           * ║  LEFT — product info                   ║
           * ╚════════════════════════════════════════╝ */}
          <div className="order-last lg:order-first flex flex-col border-t lg:border-t-0 lg:border-l border-white/[0.04]"
            style={{ background: "linear-gradient(160deg,#0C0C18 0%,#07070D 60%)" }}
          >
            <div className="px-7 sm:px-10 py-8 sm:py-10 flex flex-col gap-7 flex-1">

              {/* ── Name + actions ─────────────────────────────────── */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black leading-[1.08] tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #ffffff 30%, #d8b4fe 70%, #e879f9 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {product.name}
                  </motion.h1>

                  <div className="flex gap-2 shrink-0 pt-1">
                    <button
                      type="button"
                      aria-label="مشاركة"
                      onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})}
                      className="h-9 w-9 grid place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-white/60 hover:border-purple-500/30 hover:bg-purple-500/[0.06] transition-all"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="إضافة للمفضلة"
                      onClick={() => setWishlisted((v) => !v)}
                      className={`h-9 w-9 grid place-items-center rounded-xl border transition-all ${
                        wishlisted
                          ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-400"
                          : "border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-fuchsia-400 hover:border-fuchsia-500/30"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Rating row */}
                {!reviewsBusy && reviews.length > 0 && avgRating && (
                  <motion.button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2.5 group"
                  >
                    <Stars rating={Number(avgRating)} size="md" />
                    <span className="text-sm font-black text-amber-400">{avgRating}</span>
                    <span className="text-xs text-white/20 group-hover:text-purple-400 transition-colors">
                      ({reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"})
                    </span>
                  </motion.button>
                )}
              </div>

              {/* ── Price + availability ────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-4 flex items-center justify-between gap-4"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1.5">السعر</p>
                  <div className="flex items-baseline gap-2.5">
                    <p
                      className="text-4xl sm:text-5xl font-black leading-none tracking-tight"
                      style={{
                        background: "linear-gradient(90deg,#f5f5f5 0%,#e2d9f3 50%,#c084fc 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      EGP {price.toLocaleString("en")}
                    </p>
                    {originalPrice > price && (
                      <p className="text-lg font-bold text-red-400/60 line-through leading-none">
                        {originalPrice.toLocaleString("en")}
                      </p>
                    )}
                  </div>
                  {discountPct > 0 && (
                    <span className="mt-2 inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-black text-red-300">
                      وفّر {discountPct}%
                    </span>
                  )}
                </div>
                {/* Availability pill */}
                <div className={`shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${availability.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                  <span className="text-xs font-bold">{availability.label}</span>
                </div>
              </motion.div>

              {/* ── Tabs ────────────────────────────────────────────── */}
              <div>
                {/* Tab pills */}
                <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit mb-5">
                  {(
                    [
                      { id: "details"  as const, label: "التفاصيل",  show: hasDescription },
                      {
                        id: "reviews" as const,
                        label: reviews.length > 0 ? `التقييمات (${reviews.length})` : "التقييمات",
                        show: true,
                      },
                    ] satisfies { id: Tab; label: string; show: boolean }[]
                  )
                    .filter((t) => t.show)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                          activeTab === t.id
                            ? "text-white shadow-sm"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        {activeTab === t.id && (
                          <motion.span
                            layoutId="tab-pill"
                            className="absolute inset-0 rounded-lg"
                            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                          />
                        )}
                        <span className="relative">{t.label}</span>
                      </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="min-h-[120px]"
                  >

                    {/* Details */}
                    {activeTab === "details" && (
                      <div className="space-y-3.5 text-[13.5px] text-white/45 leading-[1.9]">
                        {(descExpanded ? parts : parts.slice(0, 4)).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                        {parts.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setDescExpanded((v) => !v)}
                            className="flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors mt-1"
                          >
                            {descExpanded ? "عرض أقل" : "اقرأ المزيد"}
                            <ArrowRight className={`h-3.5 w-3.5 transition-transform ${descExpanded ? "-rotate-90" : "rotate-90"}`} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reviews */}
                    {activeTab === "reviews" && (
                      <div className="space-y-3">
                        {reviewsBusy ? (
                          <div className="flex items-center gap-2 text-white/20 py-8">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span className="text-sm">جاري التحميل…</span>
                          </div>
                        ) : reviews.length === 0 ? (
                          <div className="py-10 text-center">
                            <div className="h-14 w-14 rounded-2xl border border-white/[0.04] bg-white/[0.02] grid place-items-center mx-auto mb-3">
                              <Star className="h-6 w-6 text-white/[0.08]" />
                            </div>
                            <p className="text-white/20 text-sm">لا توجد تقييمات بعد</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
                            {reviews.map((rv) => (
                              <div key={rv.id} className="space-y-1.5">

                                {/* ── Review card ── */}
                                <article
                                  className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-4"
                                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                                >
                                  <div className="flex items-center justify-between gap-3 mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600/40 to-fuchsia-600/25 border border-purple-500/20 grid place-items-center text-xs font-black text-purple-200 shrink-0">
                                        {rv.authorName ? rv.authorName.charAt(0).toUpperCase() : "?"}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <p className="text-xs font-bold text-white/65 leading-none">{rv.authorName}</p>
                                          {rv.authorRole && <RoleBadge role={rv.authorRole} />}
                                        </div>
                                        <Stars rating={rv.rating} size="sm" />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <time className="text-[10px] text-white/15">
                                        {new Date(rv.createdAt).toLocaleDateString("ar-EG", {
                                          year: "numeric", month: "short", day: "numeric",
                                        })}
                                      </time>

                                      {isStaff && (
                                        <>
                                          {/* Reply button */}
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

                                          {/* Delete — two-step confirm */}
                                          {confirmId === rv.id ? (
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => setConfirmId(null)}
                                                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-white/30 hover:text-white/60 transition-all"
                                              >
                                                لا
                                              </button>
                                              <button
                                                type="button"
                                                disabled={deletingId === rv.id}
                                                onClick={() => deleteReview(rv.id)}
                                                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all"
                                              >
                                                {deletingId === rv.id
                                                  ? <LoaderCircle className="h-2.5 w-2.5 animate-spin" />
                                                  : <Trash2 className="h-2.5 w-2.5" />}
                                                تأكيد
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => setConfirmId(rv.id)}
                                              className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/25 hover:border-red-500/30 hover:text-red-400 transition-all"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-white/38 leading-relaxed">{rv.comment}</p>
                                </article>

                                {/* ── Replies ── */}
                                {rv.replies.length > 0 && (
                                  <div className="mr-5 space-y-1.5">
                                    {rv.replies.map((rep) => (
                                      <div key={rep.id}
                                        className="flex gap-2.5 rounded-xl border border-purple-500/[0.12] bg-purple-500/[0.04] px-4 py-3"
                                      >
                                        <CornerDownLeft className="h-3 w-3 text-purple-400/40 mt-0.5 shrink-0 rotate-180 scale-x-[-1]" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-xs font-bold text-purple-200/80">{rep.authorName}</span>
                                            <RoleBadge role={rep.role} />
                                            <time className="text-[10px] text-white/15 mr-auto">
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

                                {/* ── Reply form (staff only) ── */}
                                <AnimatePresence>
                                  {replyOpen[rv.id] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mr-5 overflow-hidden"
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
                                          <button
                                            type="button"
                                            onClick={() => setReplyOpen((p) => ({ ...p, [rv.id]: false }))}
                                            className="px-3 py-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors"
                                          >
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
                            ))}
                          </div>
                        )}

                        {/* Write review */}
                        {loggedIn ? (
                          <form onSubmit={handleSubmit}
                            className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 space-y-3 mt-2"
                          >
                            <p className="text-xs font-bold text-white/35">أكتب تقييمك</p>
                            <div className="flex gap-1">
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
                              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs text-white/65 placeholder:text-white/12 outline-none focus:border-purple-500/35 focus:bg-purple-500/[0.03] min-h-[72px] resize-none transition-all"
                            />
                            {postError && <p className="text-red-400/75 text-xs">{postError}</p>}
                            {postOk    && <p className="text-emerald-400/75 text-xs flex items-center gap-1.5"><Check className="h-3 w-3" />تم إرسال تقييمك!</p>}
                            <button type="submit" disabled={posting || !writeComment.trim()}
                              className="rounded-lg px-5 py-2 text-xs font-black text-white disabled:opacity-35 transition-all flex items-center gap-1.5"
                              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                            >
                              {posting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                              {posting ? "جاري الإرسال…" : "إرسال التقييم"}
                            </button>
                          </form>
                        ) : (
                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 text-center mt-2">
                            <p className="text-white/22 text-xs mb-3">سجل دخول لكتابة تقييم</p>
                            <Link href="/login">
                              <button type="button"
                                className="rounded-lg px-5 py-2 text-xs font-black text-white transition-all"
                                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                              >
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

              {/* ── Buy section ─────────────────────────────────────── */}
              <div ref={heroBuyRef} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 space-y-4"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(168,85,247,0.04)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">إتمام الشراء</p>
                  <span className="text-base font-black text-white/80">EGP {price.toLocaleString("en")}</span>
                </div>

                {/* Unavailable notice */}
                {!availability.buyable && (
                  <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${availability.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dot} flex-shrink-0`} />
                    {product.status === "out_of_stock"
                      ? "هذا المنتج نفذت كميته حالياً. تابعنا لمعرفة متى يعود."
                      : "هذا المنتج قريباً. سيتوفر للشراء قريباً."}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={handleBuyNow}
                    disabled={addingCart || !availability.buyable}
                    whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.02, boxShadow: "0 0 48px rgba(139,92,246,0.5)" }}
                    whileTap={availability.buyable ? { scale: 0.97 } : undefined}
                    className={[
                      "col-span-2 sm:col-span-1 relative overflow-hidden group w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-black text-white transition-all duration-300",
                      availability.buyable
                        ? "disabled:opacity-75"
                        : "opacity-40 cursor-not-allowed",
                    ].join(" ")}
                    style={availability.buyable ? {
                      background: "linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#d946ef 100%)",
                      boxShadow: "0 0 32px rgba(139,92,246,0.35)",
                    } : {
                      background: "linear-gradient(135deg,#3f3f46 0%,#52525b 100%)",
                    }}
                  >
                    {availability.buyable && (
                      <span aria-hidden className="absolute inset-0 translate-x-[110%] group-hover:translate-x-[-110%] bg-gradient-to-l from-transparent via-white/12 to-transparent transition-transform duration-600" />
                    )}
                    {addingCart ? <LoaderCircle className="h-4 w-4 relative shrink-0 animate-spin" /> : <ShoppingBag className="h-4 w-4 relative shrink-0" />}
                    <span className="relative">اشتري الآن</span>
                  </motion.button>

                  <motion.button
                    onClick={handleAddToCart}
                    disabled={addingCart || !availability.buyable}
                    whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.02 }}
                    whileTap={availability.buyable ? { scale: 0.97 } : undefined}
                    className={[
                      "col-span-2 sm:col-span-1 w-full flex items-center justify-center gap-2.5 rounded-xl border px-6 py-3.5 text-sm font-bold transition-all duration-200",
                      availability.buyable
                        ? "border-purple-500/25 bg-purple-500/[0.06] hover:border-purple-400/40 hover:bg-purple-500/10 text-white/60 hover:text-white/90 disabled:opacity-75"
                        : "border-white/[0.05] bg-white/[0.02] text-white/20 cursor-not-allowed opacity-40",
                    ].join(" ")}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    أضف للسلة
                  </motion.button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BAR ───────────────────────────────────────────────── */}
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
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl border border-white/[0.06] bg-white/[0.03] grid place-items-center shrink-0 overflow-hidden">
                    <img src={product.image} alt="" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/25 truncate leading-tight">{product.name}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-black leading-tight">EGP {price.toLocaleString("en")}</p>
                      {originalPrice > price && (
                        <p className="text-xs font-bold text-red-400/60 line-through">{originalPrice.toLocaleString("en")}</p>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={handleBuyNow}
                  disabled={addingCart || !availability.buyable}
                  whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.03 }}
                  whileTap={availability.buyable ? { scale: 0.97 } : undefined}
                  className={[
                    "shrink-0 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black text-white transition-all",
                    availability.buyable ? "disabled:opacity-75" : "opacity-40 cursor-not-allowed",
                  ].join(" ")}
                  style={availability.buyable ? {
                    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                    boxShadow: "0 0 28px rgba(139,92,246,0.4)",
                  } : {
                    background: "linear-gradient(135deg,#3f3f46,#52525b)",
                  }}
                >
                  {addingCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
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
