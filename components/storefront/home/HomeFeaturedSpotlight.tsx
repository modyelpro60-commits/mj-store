"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ShoppingBag, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { normalizeProductFeatures } from "../../../app/lib/products/featureHelpers";

type Product = {
  id: number | string;
  name: string;
  full_description: string;
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


function Badge({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: "purple" | "blue" | "green";
}) {
  const cls =
    tone === "green"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "blue"
      ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
      : "border-purple-500/20 bg-purple-500/10 text-purple-200";

  return <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${cls}`}>{children}</div>;
}

export default function HomeFeaturedSpotlight({ product }: { product: Product | null }) {
  const prefersReducedMotion = useReducedMotion();

  if (!product) {
    return (
      <section className="mt-2">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <div className="rounded-[2.2rem] border border-white/10 bg-white/5 p-10 text-zinc-400">
            No featured product yet.
          </div>
        </div>
      </section>
    );
  }

  const price = toNumber(product.price);
  const features = normalizeProductFeatures(product);
  const buyHref = `/checkout?product=${product.id}`;

  const glowPurple = "0 0 55px rgba(168,85,247,0.22), 0 0 25px rgba(168,85,247,0.12)";
  const glowBlue = "0 0 55px rgba(59,130,246,0.20), 0 0 25px rgba(59,130,246,0.12)";

  return (
    <section className="relative pt-6 pb-8">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.4rem] border border-purple-500/20 bg-zinc-950/40 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.6)]"
        >
          {/* Depth layers */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-28 h-[520px] w-[520px] rounded-full bg-blue-500/5 blur-[180px]" />
            <div
              className="absolute inset-0 opacity-35"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(168,85,247,0.18) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(168,85,247,0.18) 1px, transparent 1px)
                `,
                backgroundSize: "62px 62px",
                transform: "perspective(900px) rotateX(62deg) translateY(150px)",
                transformOrigin: "center bottom",
              }}
            />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] items-center p-8 md:p-10">
            {/* Image */}
            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : { y: -4, boxShadow: `0 0 0 1px rgba(168,85,247,0.22), ${glowPurple}` }
              }
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-black/30"
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                initial={false}
              />
              <motion.img
                src={product.image}
                alt={product.name}
                className="h-[420px] w-full object-contain p-6 md:p-10"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
              />

              {/* Corner badge */}
              <div className="absolute top-5 left-5">
                <Badge tone="purple">
                  <Sparkles className="h-4 w-4" />
                  Spotlight
                </Badge>
              </div>
            </motion.div>

            {/* Content */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200">
                  <Zap className="h-4 w-4 text-purple-200" />
                  Instant unlock
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-bold text-sky-200">
                  <Sparkles className="h-4 w-4 text-sky-200" />
                  Premium access
                </div>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-black leading-[1.05]">
                  {product.name}
                </h2>
                <p className="mt-4 text-base md:text-lg text-zinc-300 leading-relaxed max-w-xl">
                  {product.full_description}
                </p>
              </div>

              {features.length ? (
                <div className="space-y-3">
                  <div className="text-sm font-bold tracking-wide text-zinc-200">Key features</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {features.slice(0, 6).map((f, idx) => (
                      <motion.div
                        key={`${f}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.35, delay: idx * 0.03, ease: "easeOut" }}
                        className="rounded-2xl border border-purple-500/10 bg-zinc-900/60 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-purple-200 font-bold">✓</span>
                          <span className="text-zinc-200 text-sm">{f}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-[0.26em] text-zinc-500">Price</div>
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { boxShadow: glowBlue, y: -2 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="mt-2 text-5xl font-black text-purple-300 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]"
                  >
                    {price} EGP
                  </motion.div>
                </div>

                <Link href={buyHref}>
                  <motion.button
                    whileHover={
                      prefersReducedMotion ? undefined : { boxShadow: glowPurple, y: -2 }
                    }
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 rounded-2xl bg-purple-600 px-8 py-4 font-black text-white border border-purple-500/20 hover:bg-purple-700 transition-all duration-300"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Buy now
                  </motion.button>
                </Link>
              </div>

              <div className="pt-2 text-sm text-zinc-400">
                Secure checkout • Instant delivery after payment
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
