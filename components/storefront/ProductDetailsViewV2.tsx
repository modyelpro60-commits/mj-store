"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  CornerDownLeft,
  Crown,
  FileText,
  LoaderCircle,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useLanguage }    from "../../lib/i18n/LanguageProvider";
import { useAuth }        from "../auth/AuthProvider";
import { useCart }        from "../cart/CartProvider";
import { useAnalytics }   from "../../lib/analytics/useAnalytics";

/* ── Types ──────────────────────────────────────────────────────── */

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

function getAvailability(isActive?: boolean) {
  return isActive === false
    ? {
        labelKey: "product.status.unavailable",
        dot:      "bg-zinc-600",
        pill:     "border-zinc-600/25 bg-zinc-600/10 text-zinc-400",
        buyable:  false,
      }
    : {
        labelKey: "product.status.available",
        dot:      "bg-emerald-400 animate-pulse",
        pill:     "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        buyable:  true,
      };
}

/* ── Role badge ───────────────────────────────────────────────── */

const ROLE_META: Record<string, { labelKey: string; style: string; icon: React.ElementType }> = {
  owner:     { labelKey: "admin.role.owner",     style: "border-amber-400/50  bg-amber-500/15  text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.18)]", icon: Crown       },
  admin:     { labelKey: "admin.role.admin",     style: "border-purple-500/30 bg-purple-500/10 text-purple-300",   icon: Crown       },
  moderator: { labelKey: "admin.role.moderator", style: "border-blue-500/30   bg-blue-500/10   text-blue-300",     icon: ShieldCheck },
  helper:    { labelKey: "admin.role.helper",    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: Wrench     },
};

function RoleBadge({ role }: { role: string }) {
  const { translate } = useLanguage();
  const meta = ROLE_META[role];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black tracking-wide ${meta.style}`}>
      <Icon className="h-2.5 w-2.5" />
      {translate(meta.labelKey)}
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
    <div className="flex items-center gap-2.5 mb-6">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

/* ── Description renderer ───────────────────────────────────── */
// Converts flat lines into paragraphs, headings, and bullet lists.
function renderDescription(parts: string[]): React.ReactNode[] {
  const output: React.ReactNode[] = [];
  let bullets: string[] = [];
  let idx = 0;

  const flushBullets = () => {
    if (!bullets.length) return;
    output.push(
      <ul key={`ul-${idx++}`} className="my-1 space-y-2">
        {bullets.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-[0.6em] h-1.5 w-1.5 rounded-full bg-purple-400/50 shrink-0" />
            <span className="text-white/70 text-[15px] leading-[1.85]">{text}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const part of parts) {
    if (/^#{1,2}\s/.test(part)) {
      flushBullets();
      const isH1 = part.startsWith("# ");
      const text = part.replace(/^#{1,2}\s+/, "");
      output.push(
        isH1
          ? <h3 key={`h1-${idx++}`} className="text-white/90 text-lg font-black tracking-tight pt-2">{text}</h3>
          : <h4 key={`h2-${idx++}`} className="text-white/70 text-sm font-black uppercase tracking-widest pt-1">{text}</h4>
      );
    } else if (/^[-•*]\s/.test(part)) {
      bullets.push(part.replace(/^[-•*]\s+/, ""));
    } else {
      flushBullets();
      output.push(
        <p key={`p-${idx++}`} className="text-white/70 text-[15px] leading-[1.85]">
          {part}
        </p>
      );
    }
  }
  flushBullets();
  return output;
}

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */

export default function ProductDetailsViewV2({ product }: { product: Product }) {
  const { translate, language }                        = useLanguage();
  const dir = language === "ar" ? "rtl" : "ltr";
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
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
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
      toast(translate("product.toast.loginToCart"), { description: translate("product.toast.loginToCartDesc") });
      router.push("/register");
      return false;
    }
    if (addingCart) return false;
    setAddingCart(true);
    const ok = await add(product.id);
    setAddingCart(false);
    if (ok) void trackEvent(product.id, "add_to_cart");
    else toast.error(translate("product.toast.addFailed"));
    return ok;
  }

  async function handleAddToCart() {
    const ok = await addToCart();
    if (ok) toast.success(translate("product.toast.addedToCart"));
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
      if (!d.success) { setPostError(d.error || translate("product.reviews.error")); return; }
      setPostOk(true); setWriteComment("");
      const rd = await (await fetch(`/api/product/${product.id}/reviews`)).json();
      if (rd.success) setReviews(rd.data);
    } catch { setPostError(translate("product.reviews.connectionError")); }
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
      if (!d.success) { setReplyError((p) => ({ ...p, [reviewId]: d.error ?? translate("product.reviews.error") })); return; }
      setReplyText((p) => ({ ...p, [reviewId]: "" }));
      setReplyOpen((p) => ({ ...p, [reviewId]: false }));
      const rd = await (await fetch(`/api/product/${product.id}/reviews`)).json();
      if (rd.success) setReviews(rd.data);
    } catch {
      setReplyError((p) => ({ ...p, [reviewId]: translate("product.reviews.connectionError") }));
    } finally {
      setReplyBusy((p) => ({ ...p, [reviewId]: false }));
    }
  }

  /* ── RENDER ──────────────────────────────────────────────────── */
  return (
    <div
      className="bg-[#07070D] text-white min-h-screen selection:bg-purple-500/25"
      dir={dir}
    >

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-700/[0.05] blur-[160px]" />
      </div>

      {/* ── BREADCRUMB ─────────────────────────────────────────── */}
      <div className="border-b border-white/[0.04] bg-[#09090F]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5">
          <ol className="flex items-center gap-1.5 text-xs text-white/25 flex-wrap">
            <li><Link href="/" className="hover:text-purple-300 transition-colors">{translate("product.breadcrumb.home")}</Link></li>
            <li><ChevronLeft className="h-3 w-3" /></li>
            <li className="text-white/50 font-medium truncate max-w-[240px]">{product.name}</li>
          </ol>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          HERO — image left / purchase panel right
         ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[58fr_42fr]">

          {/* ── Image Panel (LEFT) ── */}
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.05] flex items-center justify-center min-h-[320px] sm:min-h-[440px] lg:min-h-[560px]"
            style={{ background: "radial-gradient(ellipse at 55% 45%, #110820 0%, #07070D 65%)" }}
          >
            {/* Subtle image-tinted glow */}
            <div className="absolute inset-0 overflow-hidden opacity-[0.18]" aria-hidden>
              <img
                src={product.image} alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-[90px] saturate-150"
              />
            </div>

            {/* Product image with hover lift */}
            <motion.div
              className="relative z-10 p-8 sm:p-12 flex items-center justify-center"
              whileHover={prefersReducedMotion || !availability.buyable ? undefined : { scale: 1.04 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="relative overflow-hidden">
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className={[
                    "w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] lg:w-[420px] lg:h-[420px]",
                    "object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.85)]",
                    !availability.buyable ? "opacity-40 grayscale" : "",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: availability.buyable ? 1 : 0.4, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {/* Shine sweep */}
                {!prefersReducedMotion && availability.buyable && (
                  <motion.span aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 1.2, repeat: Infinity, repeatDelay: 6 }}
                  />
                )}
              </div>
            </motion.div>

            {/* Discount badge */}
            {discountPct > 0 && availability.buyable && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.35, ease: "backOut" }}
                className="absolute top-4 right-4 rounded-xl border border-red-500/30 bg-red-500/20 backdrop-blur-xl px-3 py-2 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-red-400/70 leading-none mb-0.5">OFF</p>
                <p className="text-lg font-black text-red-300 leading-none">{discountPct}%</p>
              </motion.div>
            )}

            {/* Out of stock overlay */}
            {!availability.buyable && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-black/55 backdrop-blur-[2px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                  className="rounded-2xl border border-red-500/35 bg-red-500/15 px-8 py-5 text-center backdrop-blur-xl"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-2 text-red-400/60">
                    {translate("product.status.unavailable")}
                  </p>
                  <p className="text-2xl font-black text-red-200">Not Available</p>
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Purchase Panel (RIGHT) ── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">

            {/* Availability pill */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${availability.pill}`}>
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${availability.dot}`} />
                {translate(availability.labelKey)}
              </span>
            </motion.div>

            {/* Product name + meta */}
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

              {product.short_description && (
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Rating + sales row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {!reviewsBusy && reviews.length > 0 && avgRating && (
                  <div className="flex items-center gap-2">
                    <Stars rating={Number(avgRating)} size="sm" />
                    <span className="text-sm font-bold text-amber-400">{avgRating}</span>
                    <span className="text-xs text-white/25">
                      ({reviews.length} {reviews.length === 1 ? translate("product.reviews.singular") : translate("product.reviews.plural")})
                    </span>
                  </div>
                )}
                {salesCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/45 font-medium">
                    <TrendingUp className="h-3 w-3 text-purple-400/70" />
                    🔥 {salesCount.toLocaleString()}+ {translate("product.sales.count")}
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
              {originalPrice > price && (
                <p className="text-sm font-semibold text-zinc-600 line-through leading-none mb-2 tabular-nums">
                  {originalPrice.toLocaleString("en")} EGP
                </p>
              )}

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

              {discountPct > 0 && (
                <p className="mt-2.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {translate("product.savings.prefix")} {(originalPrice - price).toLocaleString("en")} EGP {translate("product.savings.onThisOrder")}
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
                  <p className="text-sm font-black mb-0.5">{translate(availability.labelKey)}</p>
                  <p className="text-xs opacity-70 leading-relaxed">
                    {translate("product.unavailable.notice")}
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
                  {availability.buyable ? translate("product.buy.now") : translate(availability.labelKey)}
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
                {translate("product.cart.add")}
              </motion.button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          DESCRIPTION
         ════════════════════════════════════════════════════════ */}
      {hasDescription && (
        <>
          <Divider />
          <section className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
            <SectionLabel icon={FileText}>{translate("product.section.details")}</SectionLabel>
            <div className="space-y-4">
              {renderDescription(parts)}
            </div>
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          REVIEWS
         ════════════════════════════════════════════════════════ */}
      <Divider />
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-10 pb-28">
        <SectionLabel icon={Star}>{translate("product.section.reviews")}</SectionLabel>

        {/* Rating summary */}
        {!reviewsBusy && reviews.length > 0 && avgRating && (
          <div className="mb-6 rounded-3xl border border-white/[0.06] bg-zinc-900/30 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

              <div className="flex flex-col items-center sm:items-start gap-1 shrink-0">
                <p className="text-5xl font-black text-white leading-none">{avgRating}</p>
                <Stars rating={Number(avgRating)} size="md" />
                <p className="text-xs text-white/25 mt-1">
                  {reviews.length} {reviews.length === 1 ? translate("product.reviews.singular") : translate("product.reviews.plural")}
                </p>
              </div>

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
              <span className="text-sm">{translate("product.reviews.loading")}</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.05] bg-white/[0.015] py-14 text-center">
              <div className="h-14 w-14 rounded-2xl border border-white/[0.04] bg-white/[0.02] grid place-items-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white/[0.08]" />
              </div>
              <p className="text-white/25 text-sm">{translate("product.reviews.empty")}</p>
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
                            {translate("product.reviews.reply")}
                          </button>
                          {confirmId === rv.id ? (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setConfirmId(null)}
                                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-white/30 hover:text-white/60 transition-all">
                                {translate("product.reviews.no")}
                              </button>
                              <button type="button" disabled={deletingId === rv.id} onClick={() => deleteReview(rv.id)}
                                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all">
                                {deletingId === rv.id ? <LoaderCircle className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
                                {translate("product.reviews.confirm")}
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
                  <p className="text-sm text-white/55 leading-relaxed">{rv.comment}</p>
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
                          <span className="text-[10px] text-white/30">
                            {translate("product.reviews.replyAs")} {ROLE_META[role ?? ""] ? translate(ROLE_META[role ?? ""].labelKey) : translate("product.reviews.supportTeam")}
                          </span>
                        </div>
                        <textarea
                          value={replyText[rv.id] ?? ""}
                          onChange={(e) => setReplyText((p) => ({ ...p, [rv.id]: e.target.value }))}
                          placeholder={translate("product.reviews.replyPlaceholder")}
                          rows={2}
                          className="w-full rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/40 resize-none transition-all"
                        />
                        {replyError[rv.id] && (
                          <p className="text-red-400/70 text-[10px]">{replyError[rv.id]}</p>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <button type="button" onClick={() => setReplyOpen((p) => ({ ...p, [rv.id]: false }))}
                            className="px-3 py-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors">
                            {translate("product.reviews.cancel")}
                          </button>
                          <button
                            type="button"
                            disabled={replyBusy[rv.id] || !(replyText[rv.id] ?? "").trim()}
                            onClick={() => submitReply(rv.id)}
                            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[10px] font-black text-white disabled:opacity-40 transition-all"
                            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                          >
                            {replyBusy[rv.id] ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                            {replyBusy[rv.id] ? translate("product.reviews.sending") : translate("product.reviews.send")}
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
            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">{translate("product.reviews.writeTitle")}</p>

            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" aria-label={translate("product.reviews.ratingAria").replace("{n}", String(s))}
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
              placeholder={translate("product.reviews.placeholder")}
              required
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/65 placeholder:text-white/15 outline-none focus:border-purple-500/35 focus:bg-purple-500/[0.03] min-h-[80px] resize-none transition-all"
            />

            {postError && <p className="text-red-400/75 text-xs">{postError}</p>}
            {postOk    && (
              <p className="text-emerald-400/75 text-xs flex items-center gap-1.5">
                <Check className="h-3 w-3" /> {translate("product.reviews.submitted")}
              </p>
            )}

            <button type="submit" disabled={posting || !writeComment.trim()}
              className="rounded-xl px-6 py-2.5 text-sm font-black text-white disabled:opacity-35 transition-all flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              {posting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {posting ? translate("product.reviews.submitting") : translate("product.reviews.submit")}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
            <Star className="h-8 w-8 text-white/[0.08] mx-auto mb-3" />
            <p className="text-white/25 text-sm mb-4">{translate("product.reviews.loginRequired")}</p>
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
                  {availability.buyable ? translate("product.buy.now") : translate(availability.labelKey)}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
