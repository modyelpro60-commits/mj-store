"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type ProductCardProps = {
  product: {
    id: number | string;
    name: string;
    description: string;
    price: number;
    image: string;
    features?: string | null;
    sales_count?: number | null;
  };
};

function parseFeatures(features: string | null | undefined): string[] {
  if (!features) return [];
  // Match Home page behavior: direct comma split for display text.
  return features.split(",");
}

export default function ProductCard({ product }: ProductCardProps) {
  const features = parseFeatures(product.features);

  const salesCount = typeof product.sales_count === "number" ? product.sales_count : 0;
  const showPill = salesCount >= 100;
  const pillText = salesCount >= 500 ? "Top Seller" : "Trending";

  const hasImage = Boolean(product.image);

  return (
    <motion.div
      layout
      whileHover={{ y: -6, boxShadow: "0 0 50px rgba(168,85,247,0.22)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-zinc-900"
    >
      {/* Glow layers */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-500/5" />
      </div>

      {/* Image frame */}
      <div className="relative flex items-center justify-center bg-gradient-to-b from-purple-500/5 to-transparent pt-8">
        {hasImage ? (
          <motion.img
            alt={product.name}
            src={product.image}
            className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        ) : (
          <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl border border-purple-500/20 bg-purple-500/5" />
        )}

        {showPill ? (
          <div className="absolute left-4 top-4 z-10">
            <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">
              {pillText}
            </span>
          </div>
        ) : null}

        {/* subtle orb */}
        <div className="pointer-events-none absolute h-24 w-24 rounded-full bg-purple-500/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Body */}
      <div className="border-t border-purple-500/20 p-5 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-black leading-tight text-white">{product.name}</h3>

        <p className="mt-2 text-sm text-zinc-400">{product.description}</p>

        <div className="mt-5 space-y-2 text-sm text-zinc-300">
          {features.length ? (
            features.map((feature) => (
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
        <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          {product.price} EGP
        </div>

          {/* Parent page wraps the whole card in <Link> for navigation */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/15 px-3 py-2 sm:px-4 sm:py-3 font-bold text-white transition-all duration-300 group-hover:border-purple-500/60 group-hover:bg-purple-600/25">
            <span className="text-sm">View</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
