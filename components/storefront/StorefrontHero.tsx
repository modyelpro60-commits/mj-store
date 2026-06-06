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
    <section className="relative py-14 md:py-24 overflow-hidden">
      {/* Animated gradient blobs — very slow, premium feel */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]"
        animate={prefersReducedMotion ? {} : { x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]"
        animate={prefersReducedMotion ? {} : { x: [0, -40, 0], y: [0, 25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/4 right-[-120px] h-[350px] w-[350px] rounded-full bg-purple-500/8 blur-[120px]"
        animate={prefersReducedMotion ? {} : { x: [0, 20, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="mx-auto max-w-[1600px] px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
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

              <Link href="#best-sellers" aria-label="Browse best sellers">
                <motion.button
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: 1.03,
                          y: -2,
                          borderColor: "#c084fc",
                          boxShadow: "0 0 45px rgba(168,85,247,0.22)",
                        }
                  }
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl border border-purple-500/30 bg-black/20 px-12 py-6 font-bold tracking-wide text-white text-lg backdrop-blur-sm transition-all duration-300 inline-flex items-center gap-2"
                >
                  {translate("home.hero.bestSellers")}
                  <ArrowRight className="h-5 w-5 text-purple-300 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </Link>
            </div>

            {/* Trust lines */}
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-zinc-100 font-medium">
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

          {/* Right: image with floating animation */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          >
            {/* Purple glow behind image */}
            <div className="relative">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2rem] bg-purple-500/15 blur-[80px]"
                animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.50)]"
                animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 pointer-events-none bg-purple-500/5" />
                <img
                  src="/Hero.jpg"
                  alt="MJ Store Premium Digital Products"
                  className="relative w-full h-[280px] md:h-[360px] object-cover rounded-[1.5rem] border border-purple-500/10 bg-black/40 drop-shadow-[0_0_80px_rgba(168,85,247,0.25)]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
