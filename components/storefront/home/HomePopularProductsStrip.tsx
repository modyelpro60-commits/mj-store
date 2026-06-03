"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { StoreProduct } from "./ProductNeonCard";
import { Sparkles, Grid2X2 } from "lucide-react";

export type PopularStripItem = {
  key: string;
  label: string;
  accent: "purple" | "blue";
};

function iconForAccent(accent: PopularStripItem["accent"]) {
  return accent === "blue" ? <Grid2X2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
}

export default function HomePopularProductsStrip({
  items,
}: {
  items: PopularStripItem[];
}) {
  const prefersReducedMotion = useReducedMotion();

  const getPillClasses = (accent: PopularStripItem["accent"]) => {
    if (accent === "blue") {
      return {
        border: "border-sky-500/25",
        bg: "bg-sky-500/10",
        text: "text-sky-200",
        glow: "0 0 55px rgba(59,130,246,0.22)",
      };
    }
    return {
      border: "border-purple-500/25",
      bg: "bg-purple-500/10",
      text: "text-purple-200",
      glow: "0 0 55px rgba(168,85,247,0.22)",
    };
  };

  return (
    <section className="mt-8">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Popular categories</h3>
              <p className="mt-1 text-sm text-zinc-400">Jump to your next digital service.</p>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-6 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {items.map((it) => {
            const c = getPillClasses(it.accent);
            return (
              <motion.div
                key={it.key}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -4,
                        boxShadow: c.glow,
                      }
                }
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={[
                  "group shrink-0 rounded-[2rem] border px-5 py-3 backdrop-blur-xl bg-black/20",
                  c.border,
                  c.bg,
                  "text-sm font-bold transition-all",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className={["grid h-9 w-9 place-items-center rounded-2xl border", c.border].join(" ")}>
                    {iconForAccent(it.accent)}
                  </div>
                  <span className={c.text}>{it.label}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-4 text-xs text-zinc-500">
          Tip: hover for glow • scroll horizontally on mobile
        </div>
      </div>
    </section>
  );
}
