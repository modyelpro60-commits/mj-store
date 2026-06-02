"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
  accent: "purple" | "fuchsia" | "violet";
};

const testimonials: Testimonial[] = [
  {
    name: "Youssef A.",
    role: "Gamers • EU server",
    rating: 5,
    initials: "YA",
    accent: "violet",
    quote:
      "Instant delivery and the product works exactly as described. The UI is clean and the whole flow feels premium.",
  },
  {
    name: "Sara M.",
    role: "Developer • SaaS builder",
    rating: 5,
    initials: "SM",
    accent: "purple",
    quote:
      "Bought a digital service and got access immediately. Support was fast and respectful—no back and forth.",
  },
  {
    name: "Omar K.",
    role: "Creator • Content tools",
    rating: 5,
    initials: "OK",
    accent: "fuchsia",
    quote:
      "Trusted store, secure checkout, and premium products. The neon theme is honestly part of the experience.",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 text-purple-300"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-current" : "opacity-30"}`}
        />
      ))}
    </div>
  );
}

function Avatar({ initials, accent }: { initials: string; accent: Testimonial["accent"] }) {
  const accentClass =
    accent === "purple"
      ? "border-purple-500/25 bg-purple-500/10"
      : accent === "fuchsia"
      ? "border-fuchsia-500/25 bg-fuchsia-500/10"
      : "border-violet-500/25 bg-violet-500/10";

  const glowClass =
    accent === "purple"
      ? "shadow-[0_0_40px_rgba(168,85,247,0.22)]"
      : accent === "fuchsia"
      ? "shadow-[0_0_40px_rgba(217,70,239,0.18)]"
      : "shadow-[0_0_40px_rgba(139,92,246,0.20)]";

  return (
    <div
      className={`h-14 w-14 rounded-3xl border ${accentClass} ${glowClass} grid place-items-center`}
      aria-hidden="true"
    >
      <span className="text-purple-200 font-black tracking-wide">{initials}</span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs font-black tracking-[0.16em] text-purple-200">
      <CheckCircle2 className="h-4 w-4 text-purple-300" />
      VERIFIED
    </div>
  );
}

export default function TestimonialsSection({ id }: { id?: string }) {
  const prefersReducedMotion = useReducedMotion();

  const avgRating = 5.0;

  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center">
          <VerifiedBadge />
        </div>

        <h2 className="mt-4 text-5xl font-black tracking-tight">
          Reviews that feel real
        </h2>

        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 rounded-[2rem] border border-purple-500/20 bg-zinc-950/50 px-6 py-3 shadow-[0_0_60px_rgba(168,85,247,0.08)]">
            <div className="text-4xl font-black text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
              {avgRating.toFixed(1)}
            </div>
            <div>
              <Stars rating={5} />
              <div className="mt-1 text-zinc-400 text-sm">average rating</div>
            </div>
          </div>

          <div className="text-zinc-400 text-sm max-w-xl">
            Premium service. Instant access. Secure checkout. That’s what customers keep coming back for.
          </div>
        </div>
      </div>

      {/* Cards */}
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
            whileHover={
              prefersReducedMotion
                ? undefined
                : { y: -6, boxShadow: "0 0 70px rgba(168,85,247,0.16)" }
            }
            className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/55 p-8 shadow-[0_0_70px_rgba(168,85,247,0.05)] transition-all"
          >
            {/* Top row */}
            <div className="flex items-center justify-between gap-6">
              <Avatar initials={t.initials} accent={t.accent} />
              <Stars rating={t.rating} />
            </div>

            <p className="mt-6 text-zinc-200 text-lg leading-relaxed">
              “{t.quote}”
            </p>

            {/* Bottom row */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-black truncate">{t.name}</div>
                <div className="mt-1 text-zinc-400 truncate">{t.role}</div>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs font-bold text-purple-200">
                <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
                Verified
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      {/* Footer strip */}
      <div className="mt-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 rounded-[2rem] border border-purple-500/20 bg-purple-500/5 px-8 py-4 text-zinc-200"
        >
          <span className="grid h-10 w-10 place-items-center rounded-3xl border border-purple-500/25 bg-purple-600/15 shadow-[0_0_45px_rgba(168,85,247,0.18)]">
            ⭐
          </span>
          <div>
            <div className="font-black text-lg">Trusted by verified customers</div>
            <div className="text-zinc-400 text-sm">Fast access, secure payments, premium support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
