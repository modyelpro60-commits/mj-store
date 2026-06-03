"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

type ProductCardSize = "dominant" | "support";

type ProductCardProps = {
  product: {
    id: number | string;
    name: string;
    description: string;
    price: number | string;
    image: string;
    features?: string | string[] | null;
    sales_count?: number | string | null;
  };
  size?: ProductCardSize;
};

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductCard({
  product,
  size = "support",
}: ProductCardProps) {
  const { translate } = useLanguage();
  const priceNumber = useMemo(() => toNumber(product.price), [product.price]);

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
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0 opacity-0 transition-all duration-400 group-hover:opacity-100",
          isDominant
            ? "bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.35),transparent_50%)]"
            : "bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.28),transparent_50%)]",
        ].join(" ")}
      />

      {/* Secondary glow layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_80%_100%,rgba(168,85,247,0.15),transparent_60%)]"
      />

      {/* Top shimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
      />

      <div className="relative p-5 sm:p-6 flex flex-col flex-1">
        {/* Image focus */}
        <div className="relative mx-auto w-full">
          <div
            aria-hidden
            className={[
              "absolute inset-0 -top-6 rounded-[1.8rem] blur-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              isDominant ? "bg-purple-500/15" : "bg-purple-500/10",
            ].join(" ")}
          />
          <motion.div
            whileHover={isDominant ? { scale: 1.15 } : { scale: 1.12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] border border-purple-500/20 bg-black/50 flex items-center justify-center shadow-[inset_0_0_60px_rgba(168,85,247,0.12),0_0_40px_rgba(168,85,247,0.1)] transition-all duration-300 group-hover:border-purple-500/40 group-hover:shadow-[inset_0_0_60px_rgba(168,85,247,0.2),0_0_60px_rgba(168,85,247,0.15)]"
          >
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={product.name}
                src={product.image}
                className="h-full w-full object-contain transition-all duration-700 group-hover:scale-[1.22]"
              />
            ) : null}
          </motion.div>
        </div>

        {/* Content */}
        <div className="mt-5 flex flex-col flex-1">
          <h3
            className={[
              "font-black text-white leading-tight line-clamp-2",
              isDominant ? "text-2xl" : "text-xl",
            ].join(" ")}
          >
            {product.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-400 line-clamp-2 font-medium flex-1">
            {product.description}
          </p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Price</div>
              <div className="flex items-baseline gap-1">
                <div className={[
                  "font-black tabular-nums tracking-tight bg-gradient-to-r from-purple-200 via-white to-purple-100 bg-clip-text text-transparent",
                  isDominant ? "text-4xl" : "text-3xl sm:text-[2rem]"
                ].join(" ")}>
                  {priceNumber}
                </div>
                <div className="text-[10px] sm:text-xs text-purple-200/70 font-bold">EGP</div>
              </div>
            </div>

            {/* Animated purchase reveal (hover) */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              whileHover={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="hidden sm:block"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
                className={[
                  "rounded-full border px-5 py-3 text-sm font-bold backdrop-blur-md transition-all duration-300",
                  isDominant
                    ? "border-purple-400/50 bg-gradient-to-r from-purple-600/40 to-purple-600/20 text-white shadow-[0_0_40px_rgba(168,85,247,0.35)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] hover:border-purple-400/70"
                    : "border-purple-500/40 bg-gradient-to-r from-purple-600/30 to-purple-600/15 text-white shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:shadow-[0_0_45px_rgba(168,85,247,0.4)] hover:border-purple-400/60",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  <motion.div whileHover={{ rotate: 20 }}>
                    <ShoppingBag className="h-4 w-4" />
                  </motion.div>
                  {translate("nav.buyNow")}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Mobile purchase reveal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="sm:hidden mt-6"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-full border border-purple-500/40 bg-gradient-to-r from-purple-600/30 to-purple-600/15 px-5 py-3 text-sm font-bold text-white inline-flex items-center gap-2 w-full justify-center backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(168,85,247,0.4)]"
          >
            <ShoppingBag className="h-4 w-4" />
            {translate("nav.buyNow")}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
