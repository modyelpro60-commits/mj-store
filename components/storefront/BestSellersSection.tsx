"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import ProductCard from "./ProductCard";

type BestSellerProduct = {
  id: number | string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  features?: string | null;
  sales_count?: number | string | null;
};

type BestSellersSectionProps = {
  id?: string;
  products: BestSellerProduct[];
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, duration: 0.35, ease: "easeOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.35, ease: "easeOut" },
  }),
};

export default function BestSellersSection({
  id,
  products,
}: BestSellersSectionProps) {
  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-5xl font-black tracking-tight">Best Sellers</h2>
          <p className="mt-3 text-zinc-400 max-w-xl">
            The most delivered digital products—chosen for speed, quality, and instant access.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-purple-200">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2">
            Neon picks, real customers
          </span>
        </div>
      </div>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {products.map((product, index) => (
          <motion.div key={product.id} variants={itemVariants} custom={index * 0.06}>
            <Link href={`/product/${product.id}`} className="block">
              <ProductCard product={product} />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
