"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import ProductCard from "./ProductCard";

type FeaturedProduct = {
  id: number | string;
  name: string;
  description: string;
  price: number;
  image: string;
  features?: string | null;
  sales_count?: number | null;
};

type FeaturedProductsGridProps = {
  products: FeaturedProduct[] | null | undefined;
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

export default function FeaturedProductsGrid({
  products,
}: FeaturedProductsGridProps) {
  const list = products ?? [];

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
    >
      {list.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants} custom={index * 0.06}>
          <Link href={`/product/${product.id}`} className="block">
            <ProductCard product={product} />
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
