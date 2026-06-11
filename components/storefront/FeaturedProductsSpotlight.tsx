"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ShoppingBag, Zap } from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

type Product = {
  id: number | string;
  name: string;
  description: string;
  short_description?: string | null;
  price: number | string;
  original_price?: number | string | null;
  image: string;
  features?: string | string[] | null;
  sales_count?: number | string | null;
  is_active?: boolean;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function calcDiscount(price: number, orig: number): number {
  if (orig > price && price > 0) return Math.round((1 - price / orig) * 100);
  return 0;
}

export default function FeaturedProductsSpotlight({ product }: { product: Product }) {
  const prefersReducedMotion = useReducedMotion();
  const { translate } = useLanguage();

  const price       = toNumber(product.price);
  const origPrice   = toNumber(product.original_price);
  const discountPct = calcDiscount(price, origPrice);
  const savings     = origPrice - price;
  const features    = normalizeProductFeatures(product);
  const salesCount  = toNumber(product.sales_count);

  // Avoid duplicate metadata: badges (top benefits) must not repeat in the Features grid.
  const badgeFeatures = features.slice(0, 2);
  const featureCards  = features.slice(2, 8);

  const buyHref = `/checkout?product=${product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full relative"
    >
      {/* Ambient glow — breathes continuously */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-purple-600/[0.08] blur-[60px]"
        animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.85, 0.4], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        whileHover={prefersReducedMotion ? undefined : {
          y: -8,
          boxShadow: `0 0 0 1px rgba(168,85,247,0.22), 0 0 80px rgba(168,85,247,0.32), 0 50px 160px rgba(0,0,0,0.8)`,
        }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.6rem] border border-purple-500/25 bg-gradient-to-br from-zinc-900/50 to-black/60 backdrop-blur-xl shadow-[0 40px 140px rgba(0,0,0,0.7)]"
      >
        {/* Depth layers */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-purple-500/[0.07] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(rgba(168,85,247,0.22) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168,85,247,0.22) 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
              transform: "perspective(900px) rotateX(62deg) translateY(140px)",
              transformOrigin: "center bottom",
            }}
          />
        </div>

        {/* Content grid */}
        <div className="relative grid gap-8 p-7 md:p-8 lg:gap-10 lg:grid-cols-[0.9fr_1.1fr]">

          {/* ── Image column ── */}
          <motion.div
            style={{ transformStyle: "preserve-3d" }}
            whileHover={prefersReducedMotion ? undefined : { rotateY: 6, rotateX: -3 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            <motion.div
              animate={prefersReducedMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-black/25"
            >
              <div aria-hidden className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_30%_0%,rgba(168,85,247,0.28),transparent_55%)]" />
              <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[2.1rem] z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_25%,transparent_45%)]" />

              <motion.img
                src={product.image}
                alt={product.name}
                className="relative h-[260px] md:h-[330px] w-full object-contain p-6 md:p-10"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
              />

              {/* FEATURED badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 px-5 py-2.5 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              >
                <Sparkles className="h-5 w-5 text-purple-200 animate-pulse" />
                <span className="text-sm font-black text-purple-100">{translate("home.featured.title").toUpperCase()}</span>
              </motion.div>

              {/* Sales badge */}
              {salesCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "backOut" }}
                  className="absolute top-5 right-5 inline-flex flex-col items-end gap-1 rounded-full border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600/30 to-purple-600/20 px-5 py-2.5 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  <span className="text-xs font-black text-fuchsia-200 uppercase tracking-wider">{translate('product.sales.label')}</span>
                  <span className="text-xl font-black text-fuchsia-100 leading-none">{salesCount}</span>
                </motion.div>
              )}

              {/* Discount badge on image (bottom right) */}
              {discountPct > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: "backOut" }}
                  className="absolute bottom-5 right-5 rounded-2xl border border-red-500/35 bg-red-500/20 backdrop-blur-xl px-4 py-2.5 text-center"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-0.5">{translate("product.discount.label")}</p>
                  <p className="text-xl font-black text-red-300 leading-none">{discountPct}%</p>
                </motion.div>
              )}

              <motion.div
                aria-hidden
                className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/0 via-transparent to-fuchsia-500/0 opacity-0 hover:opacity-30 transition-opacity duration-500"
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </motion.div>

            {/* Feature badges */}
            {badgeFeatures.length ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {badgeFeatures.map((f, i) => (
                  <motion.span key={`${f}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.08 }}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-5 py-2.5 text-xs font-black text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                  >
                    <Zap className="h-4 w-4" />
                    {f}
                  </motion.span>
                ))}
              </div>
            ) : null}
          </motion.div>

          {/* ── Text column ── */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight">{product.name}</h2>

              {/* Short description (tagline) — shown first if available */}
              {product.short_description && (
                <p className="mt-3 text-purple-300/80 text-base font-semibold leading-snug line-clamp-2">
                  {product.short_description}
                </p>
              )}

              <p className="mt-4 text-zinc-300 text-base md:text-lg leading-relaxed font-medium line-clamp-3">
                {product.description}
              </p>

              {featureCards.length ? (
                <div className="mt-10">
                  <div className="text-sm font-black tracking-widest text-zinc-300 mb-5 uppercase">{translate('home.featured.features')}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {featureCards.slice(0, 6).map((f, i) => (
                      <motion.div key={`${f}-${i}`}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
                        className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-zinc-900/40 to-black/40 px-5 py-4 shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                      >
                        <span className="text-purple-300 font-black text-lg">✓</span>{" "}
                        <span className="text-zinc-100 font-semibold">{f}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Price + CTA row ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">

              {/* Price block */}
              <div>
                <div className="text-xs uppercase tracking-[0.3em] font-black text-zinc-400 mb-3">{translate('home.featured.investment')}</div>

                {/* Original price (strikethrough) */}
                {discountPct > 0 && (
                  <p className="text-base font-bold text-zinc-600 line-through tabular-nums leading-none mb-1.5">
                    {origPrice.toLocaleString("en")} EGP
                  </p>
                )}

                {/* Current price + OFF badge */}
                <div className="flex items-center gap-3 flex-wrap">
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { y: -2, textShadow: "0 0 30px rgba(168,85,247,0.4)" }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                  >
                    {price.toLocaleString("en")} EGP
                  </motion.div>
                  {discountPct > 0 && (
                    <span className="inline-flex items-center rounded-2xl border border-red-500/35 bg-red-500/15 px-4 py-2 text-base font-black text-red-300 leading-none">
                      -{discountPct}% {translate('product.discountOff')}
                    </span>
                  )}
                </div>

                {/* Savings */}
                {discountPct > 0 && savings > 0 && (
                  <p className="mt-2 text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {translate("product.savings.prefix")} {savings.toLocaleString("en")} EGP
                  </p>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <Link href={buyHref}>
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { y: -3, boxShadow: "0 0 60px rgba(168,85,247,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-9 py-5 text-lg font-black text-white border border-purple-400/40 shadow-[0_0_40px_rgba(168,85,247,0.28)] transition-all duration-300"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {translate('home.featured.buyNow')}
                  </motion.button>
                </Link>

                <Link href={`/product/${product.id}`}>
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.22)" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center rounded-2xl border border-purple-500/30 bg-black/30 backdrop-blur-sm px-8 py-5 text-base font-bold text-white hover:border-purple-500/50 hover:bg-black/40 transition-all"
                  >
                    {translate('home.featured.viewDetails')}
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
