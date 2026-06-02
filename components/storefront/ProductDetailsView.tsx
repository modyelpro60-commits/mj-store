"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

type Product = {
  id: number | string;
  name: string;
  image: string;
  full_description: string;
  price: number | string;
  sales_count: number | string;
  features: string | null;
};

type ProductDetailsViewProps = {
  product: Product;
};

function MotionWrap({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function IncludedFeatures({ features }: { features: string | null }) {
  const list =
    features
      ?.replace("[", "")
      .replace("]", "")
      .replaceAll('"', "")
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean) ?? [];

  return (
    <div className="space-y-3">
      {list.map((feature, index) => (
        <motion.div
          key={`${feature}-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
          className="rounded-2xl border border-purple-500/10 bg-zinc-900/60 px-4 py-3"
        >
          <span className="text-purple-300 font-bold">✓</span>{" "}
          <span className="text-zinc-200">{feature}</span>
        </motion.div>
      ))}
      {!list.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-400">
          No included features.
        </div>
      ) : null}
    </div>
  );
}

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const salesCount = Number(product.sales_count) || 0;

  const badge =
    salesCount >= 500
      ? { label: "👑 TOP SELLER", className: "bg-yellow-500 text-black" }
      : salesCount >= 100
      ? { label: "🔥 TRENDING", className: "bg-purple-600 text-white" }
      : null;

  return (
    <div className="max-w-[1600px] mx-auto px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        {/* Product Image */}
        <MotionWrap delay={0.05} className="relative">
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 0 60px rgba(168,85,247,0.25)" }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-3xl border border-purple-500/15 bg-zinc-900 shadow-2xl"
          >
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-[650px] object-contain p-12"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_45%)]" />
          </motion.div>

          {badge ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`inline-flex mt-6 px-5 py-2 rounded-full ${badge.className} font-bold`}
            >
              {badge.label}
            </motion.div>
          ) : null}
        </MotionWrap>

        {/* Product Info */}
        <div className="space-y-8">
          <MotionWrap delay={0.12}>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-6xl font-black leading-[1.05]"
            >
              {product.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="flex gap-1 mt-6 text-2xl text-yellow-400"
            >
              ⭐⭐⭐⭐⭐
            </motion.div>

            <p className="text-zinc-500 mt-2">Trusted by hundreds of customers</p>
          </MotionWrap>

          <MotionWrap delay={0.18}>
            <div>
              <h2 className="text-2xl font-bold mb-4">Product Description</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {product.full_description}
              </p>
            </div>

            <div className="mt-8">
              <p className="text-zinc-500">Sold {salesCount} times</p>
            </div>
          </MotionWrap>

          {/* Features */}
          <MotionWrap delay={0.24}>
            <div>
              <h2 className="text-2xl font-bold mb-5">What's Included</h2>
              <IncludedFeatures features={product.features} />
            </div>
          </MotionWrap>

          {/* Price + Actions */}
          <MotionWrap delay={0.32}>
            <div className="mt-12">
              <p className="text-zinc-500 mb-2">Price</p>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="text-6xl font-black text-purple-300 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]"
              >
                {product.price} EGP
              </motion.h2>

              <div className="flex gap-4 mt-6 flex-wrap">
                <div className="bg-zinc-900/70 border border-purple-500/10 px-4 py-3 rounded-xl">
                  Sold {salesCount}
                </div>
                <div className="bg-zinc-900/70 border border-purple-500/10 px-4 py-3 rounded-xl">
                  Instant Delivery
                </div>
              </div>

              <Link href={`/checkout?product=${product.id}`}>
                <motion.button
                  whileHover={{ boxShadow: "0 0 55px rgba(168,85,247,0.32)", y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-10 w-full rounded-2xl bg-purple-600 px-10 py-5 text-2xl font-bold text-white transition-all duration-300 hover:bg-purple-700 border border-purple-500/20"
                >
                  Buy Now →
                </motion.button>
              </Link>
            </div>
          </MotionWrap>
        </div>
      </div>

      {/* Trust Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="grid md:grid-cols-3 gap-6 mt-24"
      >
        <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8 hover:border-purple-500/20 transition-colors">
          <h3 className="text-2xl font-bold mb-4">⚡ Fast Delivery</h3>
          <p className="text-zinc-400">Receive your product instantly after payment.</p>
        </div>

        <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8 hover:border-purple-500/20 transition-colors">
          <h3 className="text-2xl font-bold mb-4">🔒 Safe Payments</h3>
          <p className="text-zinc-400">Secure and trusted payment experience.</p>
        </div>

        <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8 hover:border-purple-500/20 transition-colors">
          <h3 className="text-2xl font-bold mb-4">⭐ Premium Service</h3>
          <p className="text-zinc-400">High quality digital products and support.</p>
        </div>
      </motion.div>
    </div>
  );
}
