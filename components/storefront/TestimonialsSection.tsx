"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    name: "Youssef A.",
    role: "Gamers • EU server",
    rating: 5,
    quote:
      "Instant delivery and the product works exactly as described. The UI is clean and the whole flow feels premium.",
  },
  {
    name: "Sara M.",
    role: "Developer • SaaS builder",
    rating: 5,
    quote:
      "Bought a digital service and got access immediately. Support was fast and respectful—no back and forth.",
  },
  {
    name: "Omar K.",
    role: "Creator • Content tools",
    rating: 5,
    quote:
      "Trusted store, secure checkout, and premium products. The neon theme is honestly part of the experience.",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-purple-300" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-current" : "opacity-30"}`} />
      ))}
    </div>
  );
}

export default function TestimonialsSection({ id }: { id?: string }) {
  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      <div className="text-center">
        <h2 className="text-5xl font-black tracking-tight">Reviews that feel real</h2>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          Premium service. Instant access. Secure checkout. That’s what customers keep coming back for.
        </p>
      </div>

      <motion.div
        className="mt-12 grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        {testimonials.map((t, index) => (
          <motion.article
            key={t.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/55 p-8 shadow-[0_0_70px_rgba(168,85,247,0.06)]"
          >
            <div className="flex items-center justify-between gap-6">
              <Stars rating={t.rating} />
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs font-bold text-purple-200">
                VERIFIED
              </div>
            </div>

            <p className="mt-6 text-zinc-200 text-lg leading-relaxed">“{t.quote}”</p>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xl font-black">{t.name}</div>
              <div className="mt-1 text-zinc-400">{t.role}</div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 px-5 py-3 text-zinc-200">
          <span className="h-10 w-10 rounded-2xl grid place-items-center border border-purple-500/30 bg-purple-600/15 text-purple-200">
            ⭐
          </span>
          <div>
            <div className="font-black">5.0 average rating</div>
            <div className="text-zinc-400 text-sm">From verified buyers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
