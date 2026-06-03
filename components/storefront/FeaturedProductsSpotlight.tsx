"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ShoppingBag, Zap } from "lucide-react";
import { normalizeProductFeatures } from "../../app/lib/products/featureHelpers";

type Product = {
  id: number | string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  features?: string | string[] | null;
  sales_count?: number | string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}


export default function FeaturedProductsSpotlight({ product }: { product: Product }) {
  const prefersReducedMotion = useReducedMotion();
  const price = toNumber(product.price);
  const features = normalizeProductFeatures(product);

  // Avoid duplicate metadata: badges (top benefits) must not repeat in the Features grid.
  const badgeFeatures = features.slice(0, 2);
  const featureCards = features.slice(2, 8);

  const buyHref = `/checkout?product=${product.id}`;
  const salesCount = toNumber(product.sales_count);

  const glowPurple =
    "0 0 60px rgba(168,85,247,0.22), 0 0 26px rgba(168,85,247,0.12)";
  const imageFloat = prefersReducedMotion
    ? undefined
    : { y: [0, -8, 0], transition: { duration: 3.6, repeat: Infinity } };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <motion.div
        whileHover={
          prefersReducedMotion
            ? undefined
            : {
                y: -8,
                boxShadow: `0 0 0 1px rgba(168,85,247,0.22), 0 0 80px rgba(168,85,247,0.32), 0 50px 160px rgba(0,0,0,0.8)`,
              }
        }
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.6rem] border border-purple-500/25 bg-gradient-to-br from-zinc-900/50 to-black/60 backdrop-blur-xl shadow-[0 40px 140px rgba(0,0,0,0.7)]"
      >
        {/* Depth layers */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-28 h-[520px] w-[520px] rounded-full bg-purple-500/5 blur-[180px]" />
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

        {/* Content grid inside the spotlight (no page layout changes) */}
        <div className="relative grid gap-8 p-7 md:p-8 lg:gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Image */}
          <motion.div
            style={{ transformStyle: "preserve-3d" }}
            whileHover={prefersReducedMotion ? undefined : { rotateY: 6, rotateX: -3 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            <motion.div
              animate={imageFloat}
              transition={prefersReducedMotion ? undefined : imageFloat?.transition}
              className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-black/25"
            >
              <div aria-hidden className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_30%_0%,rgba(168,85,247,0.28),transparent_55%)]" />
              <motion.img
                src={product.image}
                alt={product.name}
                className="relative h-[260px] md:h-[330px] w-full object-contain p-6 md:p-10"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 px-5 py-2.5 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              >
                <Sparkles className="h-5 w-5 text-purple-200 animate-pulse" />
                <span className="text-sm font-black text-purple-100">FEATURED</span>
              </motion.div>
              
              {salesCount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "backOut" }}
                  className="absolute top-5 right-5 inline-flex flex-col items-end gap-1 rounded-full border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600/30 to-purple-600/20 px-5 py-2.5 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  <span className="text-xs font-black text-fuchsia-200 uppercase tracking-wider">Sales</span>
                  <span className="text-xl font-black text-fuchsia-100 leading-none">{salesCount}</span>
                </motion.div>
              )}
              
              <motion.div 
                aria-hidden
                className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/0 via-transparent to-fuchsia-500/0 opacity-0 hover:opacity-30 transition-opacity duration-500"
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </motion.div>

            {/* Product benefits come only from product.features (no hardcoded badges) */}
            {badgeFeatures.length ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {badgeFeatures.map((f, i) => (
                  <motion.span
                    key={`${f}-${i}`}
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

          {/* Text */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight">{product.name}</h2>
              <p className="mt-5 text-zinc-300 text-base md:text-lg leading-relaxed font-medium">
                {product.description}
              </p>

              {featureCards.length ? (
                <div className="mt-10">
                  <div className="text-sm font-black tracking-widest text-zinc-300 mb-5 uppercase">Features</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {featureCards.slice(0, 6).map((f, i) => (
                      <motion.div
                        key={`${f}-${i}`}
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

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] font-black text-zinc-400 mb-3">Investment</div>
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { y: -2, textShadow: "0 0 30px rgba(168,85,247,0.4)" }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                >
                  {price} EGP
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Keep the whole card clickable via wrapper Link in FeaturedProductsGrid */}
                <Link href={buyHref}>
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { y: -3, boxShadow: "0 0 60px rgba(168,85,247,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-9 py-5 text-lg font-black text-white border border-purple-400/40 shadow-[0_0_40px_rgba(168,85,247,0.28)] transition-all duration-300"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Buy now
                  </motion.button>
                </Link>

                <Link href={`/product/${product.id}`}>
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: "0 0 50px rgba(168,85,247,0.22)" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center rounded-2xl border border-purple-500/30 bg-black/30 backdrop-blur-sm px-8 py-5 text-base font-bold text-white hover:border-purple-500/50 hover:bg-black/40 transition-all"
                  >
                    View details
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
