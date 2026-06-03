"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useMemo } from "react";

export type StoreProduct = {
  id: number | string;
  name: string;
  description: string;
  full_description?: string | null;
  price: number | string;
  image: string;
  features?: string | string[] | null;
  sales_count?: number | string | null;
  category?: string | null;
  badge?: string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatPriceEGP(value: unknown) {
  const n = toNumber(value);
  return `${n} EGP`;
}

export default function ProductNeonCard({
  product,
}: {
  product: StoreProduct;
}) {
  const prefersReducedMotion = useReducedMotion();
  const priceText = useMemo(() => formatPriceEGP(product.price), [product.price]);

  const salesCount = toNumber(product.sales_count);
  const badgeText =
    salesCount >= 200
      ? "🔥 Popular"
      : salesCount >= 80
      ? "✨ Trending"
      : product.badge
      ? String(product.badge)
      : null;

  const glowPurple =
    "0 0 55px rgba(168,85,247,0.22), 0 0 25px rgba(168,85,247,0.12)";

  return (
    <motion.div
      layout
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -10,
              boxShadow: "0 0 0 1px rgba(168,85,247,0.22), 0 28px 95px rgba(0,0,0,0.65)",
            }
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/45 backdrop-blur-xl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: `radial-gradient(600px circle at 25% 0%, rgba(168,85,247,0.22), transparent 55%)`,
        }}
      />

      <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-400/70" />

      <div className="relative p-6">
        <div className="relative">
          {badgeText ? (
            <div className="absolute -top-2 left-0 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-200">
              <Sparkles className="h-4 w-4" />
              {badgeText}
            </div>
          ) : null}

          <motion.div
            whileHover={
              prefersReducedMotion
                ? undefined
                : {
                    scale: 1.05,
                  }
            }
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative aspect-[16/11] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/25"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                boxShadow: glowPurple,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={product.name}
              src={product.image}
              className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.10]"
            />
          </motion.div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-black text-white text-xl leading-tight line-clamp-2 hover:text-purple-200 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                {product.description}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                Price
              </div>
              <div className="mt-1 text-3xl font-black text-purple-200 drop-shadow-[0_0_18px_rgba(168,85,247,0.25)]">
                {priceText.split(" ")[0]}
                <span className="text-base font-black text-white/90"> EGP</span>
              </div>
            </div>

            <Link href={`/checkout?product=${product.id}`}>
              <motion.button
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        boxShadow: glowPurple,
                        y: -2,
                      }
                }
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-600/30 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-purple-600/45"
              >
                <ShoppingBag className="h-4 w-4" />
                Buy
              </motion.button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
              Instant delivery
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
              Secure checkout
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
