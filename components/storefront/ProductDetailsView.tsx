"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, LoaderCircle, ShoppingBag, Star, Zap } from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useAuth } from "../auth/AuthProvider";

type Product = {
  id: number | string;
  name: string;
  image: string;
  full_description: string;
  price: number | string;
  sales_count: number | string;
  features?: string | string[] | null;
};

type ProductDetailsViewProps = {
  product: Product;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const { translate } = useLanguage();
  const { accessToken, isLoading: authLoading } = useAuth();
  const salesCount = Number(product.sales_count) || 0;
  const features = normalizeProductFeatures(product ?? ({} as Product));

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(`/api/product/${product.id}/reviews`);
        const data = await res.json();
        if (data.success) setReviews(data.data);
      } catch {
        // ignore
      } finally {
        setReviewsLoading(false);
      }
    }
    loadReviews();
  }, [product.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !accessToken) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/product/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rating: newRating, comment: newComment.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || "Failed to submit review");
        return;
      }

      setSubmitSuccess(true);
      setNewComment("");

      const reloadRes = await fetch(`/api/product/${product.id}/reviews`);
      const reloadData = await reloadRes.json();
      if (reloadData.success) setReviews(reloadData.data);
    } catch {
      setSubmitError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const isAuthenticated = !authLoading && !!accessToken;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="bg-[#050507] min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-purple-700/20 rounded-full blur-[250px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
          <Link href="/" className="hover:text-purple-300 transition">{translate("nav.quickLinks")}</Link>
          <span>/</span>
          <span className="text-zinc-300">{product.name}</span>
        </motion.div>

        {/* ─── HERO SECTION ─── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start mb-20 lg:mb-28">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-zinc-900/80 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
          >
            <div className="aspect-[4/3] md:aspect-[16/10] relative flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-8 md:p-16 transition-transform duration-700 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_50%)]" />
            </div>
            {salesCount >= 100 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-4 left-4 px-4 py-2 rounded-full bg-yellow-500 text-black text-sm font-bold shadow-lg shadow-yellow-500/30"
              >
                {salesCount >= 500 ? "👑 TOP SELLER" : "🔥 TRENDING"}
              </motion.div>
            )}
            {/* Review badge on image */}
            {avgRating && reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-yellow-500/25 text-yellow-400 text-xs font-bold"
              >
                <Star className="h-3.5 w-3.5 fill-yellow-400" />
                {avgRating}
              </motion.div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] break-words">
              {product.name}
            </h1>

            <div className="space-y-4">
              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  {product.price}
                </span>
                <span className="text-xl font-bold text-purple-200/70">EGP</span>
              </div>

              {/* 🔥 Sold Count */}
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <Flame className="h-6 w-6 text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]" />
                </motion.span>
                <span className="text-lg font-bold text-orange-300">
                  {salesCount} {translate("product.sold")}
                </span>
              </div>
            </div>

            {/* Buy Now */}
            <Link href={`/checkout?product=${product.id}`}>
              <motion.button
                whileHover={{ boxShadow: "0 0 80px rgba(168,85,247,0.4)", y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-12 py-6 text-xl font-black text-white border border-purple-400/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all duration-300 hover:from-purple-700 hover:to-fuchsia-700 flex items-center justify-center gap-3"
              >
                <ShoppingBag className="h-6 w-6" />
                {translate("nav.buyNow")}
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* ─── DESCRIPTION SECTION ─── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-20 lg:mb-28"
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 md:p-12 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-8 tracking-tight">
              {translate("product.description")}
            </h2>
            <div className="prose prose-invert prose-lg max-w-5xl text-zinc-300 leading-[1.8] space-y-4">
              {(typeof product.full_description === "string" ? product.full_description : "").split("\n").map((paragraph, i) => (
                <p key={i}>{paragraph || "\u00A0"}</p>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
              <span className="text-sm text-zinc-500">
                {translate("product.sold")} {salesCount} {translate("product.times")}
              </span>
            </div>
          </div>
        </motion.section>

        {/* ─── FEATURES SECTION ─── */}
        {features.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-20 lg:mb-28"
          >
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 md:p-12 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-10 tracking-tight">
                {translate("product.whatsIncluded")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={`${feature}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.04 }}
                    whileHover={{ y: -4, borderColor: "rgba(168,85,247,0.4)", boxShadow: "0 0 40px rgba(168,85,247,0.12)" }}
                    className="flex items-start gap-4 rounded-xl border border-purple-500/15 bg-white/[0.03] p-5 min-h-[80px] transition-all duration-300"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-500/20 text-purple-300 flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                      <Zap className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-zinc-200 font-medium leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── REVIEWS SECTION ─── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-20 lg:mb-28"
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 md:p-12 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-10 flex items-center gap-4 tracking-tight">
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              Reviews
              {avgRating && (
                <span className="text-lg font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  {avgRating}
                </span>
              )}
              <span className="text-base font-normal text-zinc-500">({reviews.length})</span>
            </h2>

            {/* Submit Review (auth only) */}
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="mb-10 p-6 rounded-xl border border-purple-500/20 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.06)]">
                <h3 className="text-lg font-bold mb-5">Write a review</h3>
                <div className="mb-5">
                  <label className="block text-sm text-zinc-400 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 transition-all hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= newRating ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]" : "text-zinc-600"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm text-zinc-400 mb-2">Comment</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/[0.04] min-h-[110px] resize-y"
                    required
                  />
                </div>
                {submitError && <p className="text-red-400 text-sm mb-3">{submitError}</p>}
                {submitSuccess && <p className="text-emerald-400 text-sm mb-3">Review submitted successfully!</p>}
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="rounded-xl bg-purple-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mb-10 p-6 rounded-xl border border-white/10 bg-white/5 text-center">
                <Star className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 mb-4">Login to write a review</p>
                <Link href="/login">
                  <button className="rounded-xl bg-purple-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                    {translate("nav.login")}
                  </button>
                </Link>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center gap-3 text-zinc-400 py-8">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
                <Star className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg font-medium">No reviews yet.</p>
                <p className="text-zinc-500 text-sm mt-2">Be the first customer to leave a review.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-purple-500/15 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 text-purple-200 text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                          {review.authorName ? review.authorName.charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className="font-bold text-white">{review.authorName}</span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-purple-400 text-purple-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
