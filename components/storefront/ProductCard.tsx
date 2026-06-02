"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

type ProductCardProps = {
  product: {
    id: number | string;
    name: string;
    description: string;
    price: number | string;
    image: string;
    features?: string | null;
    sales_count?: number | string | null;
  };
};

function parseFeatures(features: string | null | undefined): string[] {
  if (!features) return [];
  return features.split(",").map((s) => s.trim());
}

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductCard({ product }: ProductCardProps) {
  const features = parseFeatures(product.features);

  const salesCount = toNumber(product.sales_count);
  const hasImage = Boolean(product.image);

  const pillText = salesCount >= 500 ? "Best Seller" : salesCount >= 100 ? "Trending" : "";
  const showPill = Boolean(pillText);

  const priceNumber = toNumber(product.price);

  return (
    <motion.div
      layout
      whileHover={{
        y: -10,
        boxShadow: "0 0 70px rgba(168,85,247,0.22)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-[1.6rem] border border-purple-500/20 bg-zinc-900/70"
    >
      {/* Top neon frame */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.35)]" />

      {/* Glow layers */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-purple-500/5" />
      </div>

      {/* Image frame */}
      <div className="relative pt-10 pb-6 px-5">
        {/* Consistent visual height */}
        <div className="mx-auto w-full max-w-[260px] relative">
          <div className="absolute inset-0 -top-6 rounded-[1.2rem] bg-purple-500/5 blur-[16px] opacity-80" />

          {hasImage ? (
            <motion.img
              alt={product.name}
              src={product.image}
              className="relative mx-auto h-[190px] w-[190px] rounded-[1.2rem] object-contain border border-purple-500/15 bg-black/30 transition-transform duration-500 group-hover:scale-[1.08] group-hover:rotate-2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          ) : (
            <div className="relative mx-auto h-[190px] w-[190px] rounded-[1.2rem] border border-purple-500/15 bg-purple-500/5" />
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-6 top-6 flex items-center gap-2">
          {showPill ? (
            <div className="rounded-full border border-purple-500/30 bg-purple-600/20 px-3 py-1 text-xs font-bold text-white shadow-[0_0_25px_rgba(168,85,247,0.18)]">
              {pillText}
            </div>
          ) : null}

          <div className="rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200 inline-flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Instant
          </div>
        </div>

        {/* Hover CTA overlay */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute right-6 top-6"
        >
          <div className="rounded-2xl border border-purple-500/30 bg-purple-600/15 px-3 py-2 text-xs sm:text-sm font-bold text-white inline-flex items-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.18)]">
            <span className="opacity-90">View</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <div className="border-t border-purple-500/15 px-5 pb-6 pt-5">
        <h3 className="text-xl sm:text-2xl font-black leading-tight text-white line-clamp-2">
          {product.name}
        </h3>

        <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{product.description}</p>

        <div className="mt-5 space-y-2 text-sm text-zinc-300">
          {features.length ? (
            features.slice(0, 3).map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="leading-5">{feature}</span>
              </div>
            ))
          ) : (
            <p className="text-zinc-500">Included items will appear here.</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.5)]">
            {priceNumber} EGP
          </div>
        </div>
      </div>
    </motion.div>
  );
}
