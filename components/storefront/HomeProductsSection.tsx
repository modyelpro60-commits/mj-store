"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Grid3x3, Tag } from "lucide-react";
import CipherCard from "./CipherCard";
import { sortCategories, KNOWN_CATEGORIES } from "../../app/lib/categories";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

type Product = {
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
  category?: string | null;
  badge?: string | null;
};

type Props = { products: Product[] };

/* ── Derive sorted unique categories from product list ──────── */
function useCategories(products: Product[]) {
  return useMemo(() => {
    const seen = new Set<string>();
    for (const p of products) {
      if (p.category && p.category.trim()) seen.add(p.category.trim());
    }
    return sortCategories(Array.from(seen));
  }, [products]);
}

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, duration: 0.35, ease: "easeOut" },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function HomeProductsSection({ products }: Props) {
  const [active, setActive] = useState<string>("all");
  const { translate } = useLanguage();

  /* Active products only — computed first so categories derive from this */
  const visible = useMemo(
    () => products.filter((p) => p.is_active !== false),
    [products],
  );

  /* Tabs come from active products only — no ghost tabs for inactive categories */
  const categories = useCategories(visible);

  const filtered = useMemo(() => {
    if (active !== "all") {
      return visible.filter(
        (p) => (p.category ?? "").toLowerCase() === active.toLowerCase(),
      );
    }
    /* "All" tab: group by category order so same categories stay together.
       JS sort is stable — relative order within a category is preserved. */
    return [...visible].sort((a, b) => {
      const catA = (a.category ?? "").trim();
      const catB = (b.category ?? "").trim();
      const orderA = KNOWN_CATEGORIES[catA]?.order ?? 50;
      const orderB = KNOWN_CATEGORIES[catB]?.order ?? 50;
      return orderA - orderB;
    });
  }, [visible, active]);

  const tabs = [
    { key: "all", label: translate("home.products.tabAll") },
    ...categories.map((c) => ({ key: c, label: KNOWN_CATEGORIES[c]?.label ?? c })),
  ];

  return (
    <section id="products" className="max-w-[1600px] mx-auto px-8 pb-28">

      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mb-10"
      >
        <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black leading-tight tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300">
            {translate("home.products.heading")}
          </span>
        </h2>
        <motion.div
          className="mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-500 origin-left shadow-[0_0_18px_rgba(168,85,247,0.45)]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Category tabs — only show when ≥2 categories exist */}
      {categories.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <motion.button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", duration: 0.2, bounce: 0 }}
                className={[
                  "relative inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-bold",
                  "transition-colors duration-200",
                  isActive
                    ? "border-purple-500/50 text-white shadow-[0_0_18px_rgba(168,85,247,0.22)]"
                    : "border-white/[0.08] bg-zinc-900/50 text-zinc-400 hover:border-purple-500/25 hover:text-zinc-200",
                ].join(" ")}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-cat-pill"
                    className="absolute inset-0 rounded-2xl bg-purple-500/15"
                    transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.key === "all"
                    ? <Grid3x3 className="h-3.5 w-3.5" />
                    : <Tag className="h-3.5 w-3.5" />}
                  {tab.label}
                  {tab.key !== "all" && (
                    <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${isActive ? "bg-purple-500/30 text-purple-200" : "bg-zinc-800 text-zinc-600"}`}>
                      {visible.filter((p) => (p.category ?? "").toLowerCase() === tab.key.toLowerCase()).length}
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Products grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          variants={gridVariants}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="col-span-full flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/[0.07] bg-zinc-900/60 mb-4">
                <Grid3x3 className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-lg font-black text-zinc-500">{translate("home.products.empty")}</p>
            </motion.div>
          ) : (
            filtered.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <CipherCard product={product} size="support" />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
