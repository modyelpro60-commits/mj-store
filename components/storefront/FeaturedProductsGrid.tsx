"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import CipherCard from "./CipherCard";
import FeaturedProductsSpotlight from "./FeaturedProductsSpotlight";

type FeaturedProduct = {
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

type FeaturedProductsGridProps = {
  products: FeaturedProduct[] | null | undefined;
  variant?: "featured" | "all";
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, duration: 0.45, ease: "easeOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45, ease: "easeOut" },
  }),
};

export default function FeaturedProductsGrid({
  products,
  variant = "all",
}: FeaturedProductsGridProps) {
  const list = products ?? [];
  const isFeatured = variant === "featured";

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className={[
        "grid gap-10",
        isFeatured ? "grid-cols-1 lg:grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      ].join(" ")}
    >
      {list.map((product, index) => {
        // For featured variant, only render the first (and only) product as spotlight
        // For all variant, render products as grid cards
        if (isFeatured) {
          return (
            <motion.div
              key={product.id}
              variants={itemVariants}
              custom={index * 0.08}
            >
              <FeaturedProductsSpotlight product={product} />
            </motion.div>
          );
        }

        return (
          <motion.div
            key={product.id}
            variants={itemVariants}
            custom={index * 0.06}
          >
            <CipherCard product={product} size="support" />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
