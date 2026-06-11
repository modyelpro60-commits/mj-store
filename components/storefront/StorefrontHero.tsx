"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import MJHeroBrand from "./MJHeroBrand";

export default function StorefrontHero() {
  const prefersReducedMotion = useReducedMotion();
  const { translate } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  /*
   * All MotionValues declared unconditionally (React rules).
   * Mouse handler only attaches when reduced-motion is off.
   *
   * Parallax: blobs shift ≤18 px — premium depth, not a toy.
   * Image tilt: ≤2.5° — cinematic, not disorienting.
   * Spotlight: 5 % opacity radial gradient — felt, not seen.
   */
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 35, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 35, damping: 30 });

  // Aurora parallax (3 independent depth planes)
  const blob1X = useTransform(springX, [-1, 1], [-18,  18]);
  const blob1Y = useTransform(springY, [-1, 1], [-10,  10]);
  const blob2X = useTransform(springX, [-1, 1], [ 13, -13]);
  const blob2Y = useTransform(springY, [-1, 1], [  8,  -8]);
  const blob3X = useTransform(springX, [-1, 1], [ -7,   7]);
  const blob3Y = useTransform(springY, [-1, 1], [ -5,   5]);

  // Image subtle 3-D tilt
  const imageRotateY = useTransform(springX, [-1, 1], [-2.5,  2.5]);
  const imageRotateX = useTransform(springY, [-1, 1], [ 1.5, -1.5]);

  // Spotlight — radial gradient that follows cursor (no React re-renders)
  const spotX = useMotionValue(-200);
  const spotY = useMotionValue(-200);
  const spotBg = useMotionTemplate`radial-gradient(480px circle at ${spotX}% ${spotY}%, rgba(168,85,247,0.055) 0%, transparent 62%)`;

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      // Normalized [-1, 1] for parallax
      mouseX.set((e.clientX - r.left  - r.width  / 2) / (r.width  / 2));
      mouseY.set((e.clientY - r.top   - r.height / 2) / (r.height / 2));
      // Percentage [0, 100] for spotlight
      spotX.set(((e.clientX - r.left)  / r.width)  * 100);
      spotY.set(((e.clientY - r.top)   / r.height) * 100);
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY, spotX, spotY, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative py-14 md:py-24 overflow-hidden"
    >
      {/* ══════════════════════════════════════════════════════════
       *  AURORA — 4 planes (consolidating 5 → 4 for performance).
       *  Planes 1–3 move with mouse; plane 4 breathes independently.
       * ══════════════════════════════════════════════════════════ */}

      {/* Plane 1 — deep purple, top-left */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-600/[0.12] blur-[130px]"
        style={{ x: blob1X, y: blob1Y, willChange: "opacity" }}
        animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Plane 2 — fuchsia, bottom-center */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.08] blur-[110px]"
        style={{ x: blob2X, y: blob2Y, willChange: "opacity" }}
        animate={prefersReducedMotion ? {} : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Plane 3 — purple, right */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/4 right-[-110px] h-[440px] w-[440px] rounded-full bg-purple-500/[0.08] blur-[120px]"
        style={{ x: blob3X, y: blob3Y, willChange: "opacity" }}
        animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.76, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Plane 4 — indigo accent, breathes only (no mouse tracking) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-1/3 h-[340px] w-[340px] rounded-full bg-indigo-500/[0.06] blur-[100px]"
        style={{ willChange: "opacity" }}
        animate={prefersReducedMotion ? {} : { opacity: [0.32, 0.65, 0.32] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* ── Cursor spotlight — pure MotionValue, zero React re-renders ── */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: spotBg }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
       *  CONTENT
       * ══════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1600px] px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">

          {/* ── LEFT ── */}
          <div>

            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-purple-200 shadow-[0_0_55px_rgba(168,85,247,0.22)]"
            >
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-black tracking-wide">
                {translate("home.hero.pill")}
              </span>
            </motion.div>

            {/* MJ / STORE headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              className="mt-8 text-7xl leading-[0.85] font-black sm:text-8xl md:text-9xl lg:text-[120px] tracking-[-0.02em]"
            >
              MJ
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.65)]">
                STORE
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.28 }}
              className="mt-6 max-w-xl text-lg md:text-xl text-zinc-300 leading-relaxed line-clamp-3 font-medium"
            >
              {translate("home.hero.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.42 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              {/* Primary — Browse Catalog */}
              <Link href="#products" aria-label="Browse all products">
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : {
                    scale: 1.025,
                    y: -2,
                    boxShadow: "0 0 55px rgba(168,85,247,0.38), 0 0 25px rgba(168,85,247,0.20)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-12 py-6 font-black tracking-wide text-white text-lg border border-purple-400/30 shadow-[0_0_30px_rgba(168,85,247,0.30)] transition-shadow duration-500 group"
                >
                  {/* Hover shimmer sweep */}
                  <span
                    aria-hidden
                    className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 ease-in-out"
                  />
                  <span className="relative inline-flex items-center gap-2">
                    {translate("home.hero.browseCatalog")}
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </motion.button>
              </Link>

              {/* Secondary — Best Sellers */}
              <Link href="#best-sellers" aria-label="Browse best sellers">
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : {
                    scale: 1.025,
                    y: -2,
                    borderColor: "rgba(192,132,252,0.45)",
                    boxShadow: "0 0 40px rgba(168,85,247,0.20)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl border border-purple-500/30 bg-black/20 px-12 py-6 font-bold tracking-wide text-white text-lg backdrop-blur-sm transition-all duration-300 inline-flex items-center gap-2 group"
                >
                  {translate("home.hero.bestSellers")}
                  <ArrowRight className="h-5 w-5 text-purple-300 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust lines — staggered */}
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-zinc-100 font-medium">
              <motion.div
                className="flex items-center gap-3 text-base"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.56, duration: 0.35 }}
              >
                <motion.div
                  className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center"
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(168,85,247,0.30)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Clock className="h-4 w-4 text-purple-300" />
                </motion.div>
                <span>{translate("home.hero.featureInstantDelivery")}</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 text-base"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.68, duration: 0.35 }}
              >
                <motion.div
                  className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center"
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(168,85,247,0.30)" }}
                  transition={{ duration: 0.2 }}
                >
                  <ShieldCheck className="h-4 w-4 text-purple-300" />
                </motion.div>
                <span>{translate("home.hero.featureSecurePayments")}</span>
              </motion.div>
            </div>
          </div>

          {/* ── RIGHT: hero image ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {/* Perspective container for 3-D tilt */}
            <div className="relative [perspective:900px]">

              {/* Pulsing ambient glow ring */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-purple-500/[0.12] blur-[70px]"
                style={{ willChange: "opacity" }}
                animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.82, 0.4] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Image card: float + 3-D tilt */}
              <motion.div
                className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.50)]"
                animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                style={prefersReducedMotion ? {} : { rotateY: imageRotateY, rotateX: imageRotateX }}
              >
                {/* Purple inner tint */}
                <div aria-hidden className="absolute inset-0 pointer-events-none bg-purple-500/[0.04]" />

                {/* Glass reflection — static highlight simulating light on frame surface */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none rounded-[2rem] z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.038)_0%,rgba(255,255,255,0.010)_28%,transparent_48%)]"
                />

                {/* Hero brand panel (MJ STORE identity) */}
                <div className="relative">
                  <MJHeroBrand />
                </div>

                {/* Light sweep — slides across image every 8 s */}
                {!prefersReducedMotion && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-[40%] pointer-events-none z-20 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)]"
                    animate={{ x: ["-100%", "320%"] }}
                    transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
