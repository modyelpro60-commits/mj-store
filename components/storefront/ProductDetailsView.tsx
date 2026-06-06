"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  ShoppingBag,
  Star,
} from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useAuth } from "../auth/AuthProvider";
import AuroraBackground from "./effects/AuroraBackground";
import FloatingParticles from "./effects/FloatingParticles";
import MouseGlow from "./effects/MouseGlow";

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

export default function ProductDetailsView({ product }: { product: Product }) {
  const { translate } = useLanguage();
  const { accessToken, isLoading: authLoading } = useAuth();
  const salesCount = Number(product.sales_count) || 0;
  const price = Number(product.price) || 0;
  const features = normalizeProductFeatures(product ?? ({} as Product));
  const imgRef = useRef<HTMLDivElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitDone, setSubmitDone] = useState(false);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const b = imgRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - b.left) / b.width - 0.5) * 10,
      y: ((e.clientY - b.top) / b.height - 0.5) * -10,
    });
  }, []);
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  useEffect(() => {
    fetch(`/api/product/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data); })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [product.id]);

  async function postReview(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !accessToken) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitDone(false);
    try {
      const r = await fetch(`/api/product/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ rating: newRating, comment: newComment.trim() }),
      });
      const d = await r.json();
      if (!d.success) { setSubmitError(d.error || "Error"); return; }
      setSubmitDone(true);
      setNewComment("");
      const reload = await fetch(`/api/product/${product.id}/reviews`);
      const rd = await reload.json();
      if (rd.success) setReviews(rd.data);
    } catch { setSubmitError("Error"); }
    finally { setSubmitting(false); }
  }

  const isUser = !authLoading && !!accessToken;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const descParagraphs = (typeof product.full_description === "string" ? product.full_description : "")
    .split("\n")
    .filter((p) => p.trim().length > 0);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <AuroraBackground />
      <FloatingParticles />
      <MouseGlow />

      {/* ═══════════════════════════════════════
             HERO — product-centered, full viewport
             ═══════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center px-5 sm:px-8">
        <div className="mx-auto w-full max-w-[900px]">
          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-purple-300 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
          </motion.div>

          {/* ─── PRODUCT IMAGE — centered, dominant ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            ref={imgRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className="relative flex justify-center mb-6"
          >
            {/* Aura */}
            <motion.div
              className="absolute w-[130%] h-[130%] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(217,70,239,0.06) 40%, transparent 65%)",
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Frame */}
            <motion.div
              className="relative w-full max-w-[500px] aspect-square rounded-[2.5rem] border border-purple-500/10 bg-gradient-to-br from-zinc-900 to-black shadow-[0_60px_200px_rgba(0,0,0,0.7)] overflow-hidden"
              style={{ rotateX: tilt.y, rotateY: tilt.x, transformStyle: "preserve-3d" }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
            >
              <motion.div
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="w-full h-full flex items-center justify-center p-8 sm:p-12 md:p-16">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 50px rgba(168,85,247,0.1))" }}
                />
                {salesCount >= 50 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                  >
                    {salesCount >= 500 ? "Top Seller" : "Trending"}
                  </motion.div>
                )}
                {avgRating && reviews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-lg border border-amber-500/8 text-amber-400/60 text-[10px] font-bold"
                  >
                    <Star className="h-3 w-3 fill-amber-400/60" /> {avgRating}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* ─── TITLE ─── */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl sm:text-7xl md:text-8xl font-black leading-[0.92] tracking-[-0.02em] text-center mb-4"
          >
            <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(168,85,247,0.15)]">
              {product.name}
            </span>
          </motion.h1>

          {/* ─── RATING + SALES ─── */}
          {(avgRating || salesCount > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex items-center justify-center gap-5 mb-5"
            >
              {avgRating && reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-amber-400/70 text-amber-400/70" : "text-zinc-700"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-400/70">{avgRating}</span>
                  <span className="text-xs text-zinc-600">({reviews.length})</span>
                </div>
              )}
              {salesCount > 0 && (
                <span className="text-xs text-zinc-500 font-medium">{salesCount.toLocaleString()}+ sold</span>
              )}
            </motion.div>
          )}

          {/* ─── DESCRIPTION EXCERPT ─── */}
          {descParagraphs.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-sm text-zinc-500 text-center max-w-lg mx-auto mb-6 leading-relaxed"
            >
              {descParagraphs[0]}
            </motion.p>
          )}

          {/* ─── PRICE ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="text-center mb-6"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold block mb-1">Price</span>
            <div className="flex items-baseline justify-center gap-3">
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-black leading-none"
                style={{
                  background: "linear-gradient(135deg, #fff 0%, #a78bfa 40%, #e879f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 30px rgba(168,85,247,0.2))",
                }}
              >
                {price.toLocaleString()}
              </span>
              <span className="text-xl font-bold text-zinc-500">EGP</span>
            </div>
          </motion.div>

          {/* ─── CTA — full width, massive ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center"
          >
            <Link href={`/checkout?product=${product.id}`}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 80px rgba(168,85,247,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-16 py-6 text-xl font-black text-white border border-purple-400/15 shadow-[0_0_50px_rgba(168,85,247,0.15)] hover:from-purple-700 hover:to-fuchsia-700 transition-all w-full sm:w-auto min-w-[320px]"
              >
                <ShoppingBag className="h-6 w-6" />
                {translate("nav.buyNow")}
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
             FULL DESCRIPTION
             ═══════════════════════════════════════ */}
      {descParagraphs.length > 1 && (
        <section className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/[0.03] bg-zinc-950/25 p-8 md:p-10 backdrop-blur-xl"
          >
            <h2 className="text-xl md:text-2xl font-black mb-5 tracking-tight">{translate("product.description")}</h2>
            <div className="text-zinc-400 leading-[1.8] space-y-4 text-sm md:text-base max-w-3xl">
              {descParagraphs.slice(1).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </motion.div>
        </section>
      )}

      {/* ═══════════════════════════════════════
             FEATURES
             ═══════════════════════════════════════ */}
      {features.length > 0 && (
        <section className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/[0.03] bg-zinc-950/25 p-8 md:p-10 backdrop-blur-xl"
          >
            <h2 className="text-xl md:text-2xl font-black mb-5 tracking-tight">{translate("product.whatsIncluded")}</h2>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {features.map((f, i) => (
                <motion.div
                  key={`${f}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  whileHover={{ y: -2, borderColor: "rgba(168,85,247,0.2)" }}
                  className="flex items-center gap-3 rounded-xl border border-purple-500/5 bg-white/[0.015] px-4 py-3 transition-all"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-purple-500/8 text-purple-300/50">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-zinc-300 text-sm font-medium">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ═══════════════════════════════════════
             REVIEWS
             ═══════════════════════════════════════ */}
      <section className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/[0.03] bg-zinc-950/25 p-8 md:p-10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Reviews</h2>
            {avgRating && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/6 border border-amber-500/6">
                <Star className="h-3 w-3 fill-amber-400/50 text-amber-400/50" />
                <span className="text-[11px] font-bold text-amber-400/60">{avgRating}</span>
                <span className="text-[11px] text-zinc-600">({reviews.length})</span>
              </div>
            )}
          </div>

          {isUser ? (
            <form onSubmit={postReview} className="mb-8 p-5 rounded-xl border border-purple-500/5 bg-purple-500/[0.02]">
              <h3 className="text-sm font-bold mb-3 text-zinc-200">Write a review</h3>
              <div className="mb-3">
                <label className="block text-[11px] text-zinc-600 mb-1.5 font-medium">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setNewRating(s)} className="p-0.5 hover:scale-110 transition">
                      <Star className={`h-5 w-5 ${s <= newRating ? "fill-amber-400/60 text-amber-400/60" : "text-zinc-700"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-[11px] text-zinc-600 mb-1.5 font-medium">Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full rounded-xl border border-white/5 bg-white/[0.015] px-4 py-3 text-white outline-none placeholder:text-zinc-700 focus:border-purple-500/20 text-sm min-h-[90px] resize-y leading-relaxed"
                  required
                />
              </div>
              {submitError && <p className="text-red-400 text-xs mb-2">{submitError}</p>}
              {submitDone && <p className="text-emerald-400 text-xs mb-2">Submitted!</p>}
              <button type="submit" disabled={submitting || !newComment.trim()}
                className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white text-xs hover:bg-purple-700 disabled:opacity-50 transition">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-5 rounded-xl border border-white/[0.03] bg-white/[0.01] text-center">
              <Star className="h-7 w-7 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 mb-3 text-xs font-medium">Login to write a review</p>
              <Link href="/login">
                <button className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white text-xs hover:bg-purple-700 transition">{translate("nav.login")}</button>
              </Link>
            </div>
          )}

          {loadingReviews ? (
            <div className="flex items-center justify-center gap-2 text-zinc-600 py-6">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-10 text-center">
              <Star className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
              <p className="text-zinc-500 text-xs font-medium">No reviews yet.</p>
              <p className="text-zinc-700 text-[11px] mt-1">Be the first to leave one.</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <AnimatePresence>
                {reviews.map((rv) => (
                  <motion.div
                    key={rv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} layout
                    className="rounded-xl border border-white/[0.03] bg-white/[0.015] p-4 transition-all hover:border-purple-500/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-600/12 to-fuchsia-600/12 text-purple-200/50 text-[10px] font-bold border border-purple-500/5">
                          {rv.authorName ? rv.authorName.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <span className="font-bold text-white text-[11px]">{rv.authorName}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: rv.rating }).map((_, j) => (
                              <Star key={j} className="h-2 w-2 fill-purple-400/40 text-purple-400/40" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(rv.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed text-[12px]">{rv.comment}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
