"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gamepad2, Headphones, BrainCircuit, Tv } from "lucide-react";

type Category = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const categories: Category[] = [
  {
    title: "Music",
    description: "Premium audio subscriptions & instant access",
    icon: Headphones,
  },
  {
    title: "Streaming",
    description: "Streaming perks that unlock instantly",
    icon: Tv,
  },
  {
    title: "AI Tools",
    description: "Boost productivity with premium AI subscriptions",
    icon: BrainCircuit,
  },
  {
    title: "Gaming",
    description: "Gaming-grade digital services & perks",
    icon: Gamepad2,
  },
];

export default function TopCategoriesSection({ id }: { id?: string }) {
  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-5xl font-black tracking-tight">Top Categories</h2>
          <p className="mt-3 text-zinc-400 max-w-xl">
            Pick your lane—everything delivers instantly after payment.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-purple-200">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2">
            Curated for premium buyers
          </span>
        </div>
      </div>

      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
              className="group"
            >
              <Link href="#products" className="block">
                <div className="h-full rounded-[2rem] border border-purple-500/20 bg-zinc-900/60 p-8 shadow-[0_0_60px_rgba(168,85,247,0.06)] transition-all duration-300 group-hover:border-purple-500/35 group-hover:shadow-[0_0_90px_rgba(168,85,247,0.14)]">
                  <div className="flex items-start justify-between gap-6">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                      <Icon className="h-7 w-7 text-purple-300" />
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs font-bold text-purple-200">
                      Browse
                    </div>
                  </div>

                  <h3 className="mt-6 text-3xl font-black tracking-tight">{cat.title}</h3>
                  <p className="mt-3 text-zinc-400 leading-relaxed">{cat.description}</p>

                  <div className="mt-7 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-60" />
                  <div className="mt-4 text-purple-200 font-bold">Scroll to best picks</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
