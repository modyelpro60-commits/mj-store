"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export default function StorefrontHero() {
  const prefersReducedMotion = useReducedMotion();
  const { translate } = useLanguage();

  const ctaGlow = useMemo(
    () => ({
      boxShadow: "0 0 55px rgba(168,85,247,0.25), 0 0 25px rgba(168,85,247,0.15)",
    }),
    []
  );

  return (
    <section className="relative py-20 md:py-36 overflow-hidden">
      {/* Subtle glow blobs (no scanlines / no floating promo clutter) */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-12 right-[-90px] h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/5 blur-3xl" />

      <div className="mx-auto max-w-[1600px] px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-purple-200 shadow-[0_0_55px_rgba(168,85,247,0.22)]">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-black tracking-wide">
                {translate("home.hero.pill")}
              </span>
            </div>

            <h1 className="mt-8 text-7xl leading-[0.85] font-black sm:text-8xl md:text-9xl lg:text-[120px] tracking-[-0.02em]">
              MJ
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.65)]">
                STORE
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg md:text-xl text-zinc-300 leading-relaxed line-clamp-3 font-medium">
              {translate("home.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#products" aria-label="Browse all products">
                <motion.button
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : { scale: 1.03, y: -2, ...ctaGlow }
                  }
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-12 py-6 font-black tracking-wide text-white text-lg border border-purple-400/30 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-shadow duration-300"
                >
                  {translate("home.hero.browseCatalog")}
                  <span className="inline-flex items-center gap-2 ml-2">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </motion.button>
              </Link>

              <Link href="#best-sellers" aria-label="Browse featured products">
                <motion.button
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: -2,
                          borderColor: "#c084fc",
                          boxShadow: "0 0 45px rgba(168,85,247,0.22)",
                          backgroundColor: "rgba(0,0,0,0.3)"
                        }
                  }
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl border border-purple-500/30 bg-black/20 px-12 py-6 font-bold tracking-wide text-white text-lg backdrop-blur-sm transition-all duration-300"
                >
                  {translate("home.hero.bestSellers")}
                </motion.button>
              </Link>
            </div>

            {/* Minimal trust lines */}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-zinc-100 font-medium">
              <motion.div 
                className="flex items-center gap-3 text-base"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
              >
                <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-300" />
                </div>
                <span>{translate("home.hero.featureInstantDelivery")}</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 text-base"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
              >
                <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-purple-300" />
                </div>
                <span>{translate("home.hero.featureSecurePayments")}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: image only */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.50)]">
              <div className="absolute inset-0 pointer-events-none bg-purple-500/5" />
              <motion.img
                src="/Hero.jpg"
                alt="MJ Store Premium Digital Products"
                className="relative w-full h-[360px] md:h-[460px] object-cover rounded-[1.5rem] border border-purple-500/10 bg-black/40 drop-shadow-[0_0_80px_rgba(168,85,247,0.25)]"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={
                  prefersReducedMotion ? undefined : { scale: 1.02, filter: "saturate(1.08)" }
                }
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
