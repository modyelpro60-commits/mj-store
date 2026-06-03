"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { StoreProduct } from "./ProductNeonCard";
import ProductNeonCard from "./ProductNeonCard";

export default function HomeAllProductsGrid({
  products,
}: {
  products: StoreProduct[];
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-10"
    >
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : index * 0.02,
            }}
          >
            <ProductNeonCard product={product} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
