"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

type ProductCardSize = "dominant" | "support";

type ProductCardProps = {
  product: {
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
  size?: ProductCardSize;
};

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function calcDiscount(price: number, orig: number): number {
  if (orig > price && price > 0) return Math.round((1 - price / orig) * 100);
  return 0;
}

export default function ProductCard({
  product,
  size = "support",
}: ProductCardProps) {
  const { translate } = useLanguage();
  const priceNum    = useMemo(() => toNumber(product.price),          [product.price]);
  const origNum     = useMemo(() => toNumber(product.original_price), [product.original_price]);
  const discountPct = useMemo(() => calcDiscount(priceNum, origNum),  [priceNum, origNum]);
  const savings     = origNum - priceNum;

  const isDominant = size === "dominant";

  return (
    <motion.div
      layout
      whileHover={{
        y: isDominant ? -20 : -12,
        boxShadow: isDominant
          ? "0 0 0 1px rgba(168,85,247,0.45), 0 0 120px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.25), 0 60px 180px rgba(0,0,0,0.85)"
          : "0 0 0 1px rgba(168,85,247,0.4), 0 0 100px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.2), 0 45px 150px rgba(0,0,0,0.8)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={[
        "group relative overflow-hidden rounded-[2rem] border bg-zinc-950/60 backdrop-blur-xl transition-colors duration-300 flex flex-col h-full",
        isDominant ? "border-purple-400/20 hover:border-purple-400/40" : "border-purple-500/15 hover:border-purple-400/30",
      ].join(" ")}
    >
      {/* Enhanced glow layers */}
      <div aria-hidden className={[
        "pointer-events-none absolute inset-0 opacity-0 transition-all duration-400 group-hover:opacity-100",
        isDominant
          ? "bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.35),transparent_50%)]"
          : "bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.28),transparent_50%)]",
      ].join(" ")} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_80%_100%,rgba(168,85,247,0.15),transparent_60%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />

      {/* Discount badge — top-right corner */}
      {discountPct > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center rounded-xl border border-red-500/35 bg-red-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-black text-red-300">
            -{discountPct}% OFF
          </span>
        </div>
      )}

      {/* Entire card is clickable → product details */}
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1">
        <div className="relative p-5 sm:p-6 flex flex-col flex-1">

          {/* Image */}
          <div className="relative mx-auto w-full">
            <div aria-hidden className={[
              "absolute inset-0 -top-6 rounded-[1.8rem] blur-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              isDominant ? "bg-purple-500/15" : "bg-purple-500/10",
            ].join(" ")} />
            <motion.div
              whileHover={isDominant ? { scale: 1.15 } : { scale: 1.12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] border border-purple-500/20 bg-black/50 flex items-center justify-center shadow-[inset_0_0_60px_rgba(168,85,247,0.12),0_0_40px_rgba(168,85,247,0.1)] transition-all duration-300 group-hover:border-purple-500/40 group-hover:shadow-[inset_0_0_60px_rgba(168,85,247,0.2),0_0_60px_rgba(168,85,247,0.15)]"
            >
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={product.name} src={product.image}
                  className="h-full w-full object-contain transition-all duration-700 group-hover:scale-[1.22]" />
              ) : null}
            </motion.div>
          </div>

          {/* Content */}
          <div className="mt-5 flex flex-col flex-1">
            <h3 className={[
              "font-black text-white leading-tight line-clamp-2",
              isDominant ? "text-2xl" : "text-xl",
            ].join(" ")}>
              {product.name}
            </h3>

            {/* Short description or fallback to main description */}
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2 font-medium flex-1">
              {product.short_description || product.description}
            </p>

            {/* Price block */}
            <div className="mt-5">
              <div className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                {translate("product.price")}
              </div>

              {/* Original price (strikethrough) */}
              {discountPct > 0 && (
                <p className="text-sm font-bold text-zinc-600 line-through tabular-nums leading-none mb-1">
                  {origNum.toLocaleString("en")} EGP
                </p>
              )}

              {/* Current price */}
              <div className="flex items-baseline gap-1">
                <div className={[
                  "font-black tabular-nums tracking-tight bg-gradient-to-r from-purple-200 via-white to-purple-100 bg-clip-text text-transparent",
                  isDominant ? "text-4xl" : "text-3xl sm:text-[2rem]"
                ].join(" ")}>
                  {priceNum.toLocaleString("en")}
                </div>
                <div className="text-[10px] sm:text-xs text-purple-200/70 font-bold">EGP</div>
              </div>

              {/* Savings */}
              {discountPct > 0 && savings > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />
                  {translate("product.savings.prefix")} {savings.toLocaleString("en")} EGP
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Buy Now button */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <Link href={`/product/${product.id}`}>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]"
          >
            <ShoppingBag className="h-4 w-4" />
            {translate("nav.buyNow")}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
