"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useMemo } from "react";

function useMouseParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 120, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 18, mass: 0.6 });

  const parallaxX = useTransform(springX, [-0.5, 0.5], [-16, 16]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  return { x, y, parallaxX, parallaxY };
}

export default function StorefrontHero() {
  const { x, y, parallaxX, parallaxY } = useMouseParallax();
  const prefersReducedMotion = useReducedMotion();

  const easeLinear = "linear" as const;
  const easeInOut = "easeInOut" as const;

  const ctaGlow = useMemo(
    () => ({
      boxShadow: "0 0 55px rgba(168,85,247,0.35), 0 0 25px rgba(168,85,247,0.18)",
    }),
    []
  );

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Animated neon background */}
      <div className="absolute inset-0 -z-10">
        {/* Vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.20),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.12),transparent_55%)] opacity-90" />

        {/* Neon scanlines */}
        <motion.div
          className="absolute inset-0 opacity-[0.26]"
          initial={{ y: "-25%" }}
          animate={
            prefersReducedMotion
              ? { y: 0 }
              : {
                  y: ["-25%", "25%"],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { repeat: Infinity, duration: 8.5, ease: easeLinear }
          }
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(168,85,247,0.48) 0px, rgba(168,85,247,0.0) 2px, rgba(168,85,247,0.0) 7px)",
          }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168,85,247,0.22) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168,85,247,0.22) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
          }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute left-[-190px] top-[-150px] h-[440px] w-[440px] rounded-full bg-purple-600/25 blur-[150px]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.7 }
              : { opacity: [0.5, 0.95, 0.6] }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { repeat: Infinity, duration: 7.2, ease: easeInOut }
          }
        />
        <motion.div
          className="absolute right-[-230px] top-[110px] h-[540px] w-[540px] rounded-full bg-fuchsia-500/10 blur-[175px]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.75 }
              : { opacity: [0.4, 0.9, 0.55] }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { repeat: Infinity, duration: 8.2, ease: easeInOut }
          }
        />
        <motion.div
          className="absolute left-[10%] bottom-[-260px] h-[540px] w-[540px] rounded-full bg-violet-500/10 blur-[195px]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.6 }
              : { opacity: [0.32, 0.78, 0.42] }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { repeat: Infinity, duration: 9.4, ease: easeInOut }
          }
        />

        {/* Orbit ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[610px] w-[610px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: prefersReducedMotion ? 0 : 360,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0.4 }
              : { duration: 14, repeat: Infinity, ease: easeLinear }
          }
          style={{
            transformOrigin: "center",
          }}
        >
          <div className="absolute inset-0 border border-purple-500/20 rounded-full shadow-[0_0_55px_rgba(168,85,247,0.18)]" />
          <div className="absolute inset-0 rounded-full border-t border-purple-500/20 border-dashed opacity-60" />
        </motion.div>

        {/* Floating product elements (WOW) */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute left-[8%] top-[18%]"
            initial={{ opacity: 0, y: 12, rotate: -3 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1, y: 0, rotate: -3 }
                : { opacity: 1, y: [0, -8, 0], rotate: [-3, 2, -3] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.35 }
                : {
                    repeat: Infinity,
                    duration: 4.6,
                    ease: easeInOut,
                  }
            }
          >
            <div className="rounded-[1.6rem] border border-purple-500/20 bg-zinc-950/70 backdrop-blur-xl px-5 py-4 shadow-[0_0_60px_rgba(168,85,247,0.10)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <Zap className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-purple-200">
                    INSTANT
                  </div>
                  <div className="text-lg font-black">Discord Nitro</div>
                </div>
              </div>
              <div className="mt-3 text-zinc-400 text-sm">
                Instant access after payment
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-[8%] top-[28%]"
            initial={{ opacity: 0, y: 14, rotate: 4 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1, y: 0, rotate: 4 }
                : { opacity: 1, y: [0, -10, 0], rotate: [4, -2, 4] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.35, delay: 0.05 }
                : {
                    repeat: Infinity,
                    duration: 5.2,
                    ease: easeInOut,
                    delay: 0.05,
                  }
            }
          >
            <div className="rounded-[1.6rem] border border-purple-500/20 bg-zinc-950/70 backdrop-blur-xl px-5 py-4 shadow-[0_0_60px_rgba(168,85,247,0.10)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <ShieldCheck className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-purple-200">
                    SECURE
                  </div>
                  <div className="text-lg font-black">Secure Checkout</div>
                </div>
              </div>
              <div className="mt-3 text-zinc-400 text-sm">
                Protected payments & verified delivery
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div
        className="mx-auto max-w-[1600px] px-8"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          x.set(nx);
          y.set(ny);
        }}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            className="relative"
            style={{ x: parallaxX, y: parallaxY }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/12 px-4 py-2 text-purple-200 shadow-[0_0_45px_rgba(168,85,247,0.20)]"
            >
              <Sparkles className="h-4 w-4 text-purple-300" />
              PREMIUM DIGITAL PRODUCTS
            </motion.div>

            <h1 className="mt-8 text-5xl leading-[0.95] font-black sm:text-6xl md:text-7xl lg:text-8xl">
              MJ
              <br />
              <span className="text-purple-400 drop-shadow-[0_0_22px_rgba(168,85,247,0.45)]">
                STORE
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg md:text-xl text-zinc-400">
              Instant delivery for premium subscriptions, digital services, and gaming perks — delivered fast after payment. Built for customers who want quality, not waiting.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="#products" aria-label="Browse catalog">
                <motion.button
                  whileHover={{ scale: 1.02, ...ctaGlow }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-purple-600 px-8 py-4 font-black tracking-wide text-white border border-purple-400/25"
                >
                  Browse Catalog
                  <span className="inline-flex items-center gap-2 ml-2">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </motion.button>
              </Link>

              <Link href="#best-sellers" aria-label="View best sellers">
                <motion.button
                  whileHover={{
                    y: -2,
                    borderColor: "#c084fc",
                    boxShadow: "0 0 45px rgba(168,85,247,0.26)",
                  }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-2xl border border-zinc-700 bg-black/20 px-8 py-4 font-bold tracking-wide text-white"
                >
                  Best Sellers
                </motion.button>
              </Link>

              <Link href="#reviews" aria-label="See reviews">
                <motion.button
                  whileHover={{ y: -2, boxShadow: "0 0 34px rgba(168,85,247,0.20)" }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-8 py-4 font-bold tracking-wide text-purple-200"
                >
                  View Reviews
                </motion.button>
              </Link>
            </div>

            <div className="mt-14 flex flex-wrap gap-6 text-zinc-200">
              <div className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-purple-300" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-purple-300" />
                <span>Secure Payments</span>
              </div>
            </div>
          </motion.div>

          {/* Right showcase */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          >
            {/* Decorative neon frame */}
            <div className="absolute -inset-1 rounded-[2rem] border border-purple-500/20 shadow-[0_0_66px_rgba(168,85,247,0.20)]" />

            <div className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.50)]">
              {/* Animated light sweep */}
              <motion.div
                aria-hidden
                className="absolute inset-0 opacity-70 pointer-events-none"
                initial={{ x: "-140%" }}
                animate={prefersReducedMotion ? { x: "-140%" } : { x: "140%" }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.1 }
                    : { repeat: Infinity, duration: 6.2, ease: easeLinear }
                }
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent, rgba(168,85,247,0.22), transparent)",
                }}
              />

              <div className="relative p-6 md:p-8">
                {/* Hero image */}
                <motion.img
                  src="/Hero.jpg"
                  alt="MJ Store Premium Digital Products"
                  className="w-full h-[340px] md:h-[420px] object-cover rounded-[1.5rem] border border-purple-500/10 bg-black/40 drop-shadow-[0_0_80px_rgba(168,85,247,0.30)]"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, filter: "saturate(1.12)" }}
                />

                {/* Feature chips */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 }}
                    whileHover={{ y: -2, boxShadow: "0 0 38px rgba(168,85,247,0.20)" }}
                    className="rounded-2xl border border-purple-500/25 bg-purple-500/10 px-5 py-4"
                  >
                    <div className="text-sm font-bold uppercase tracking-[0.22em] text-purple-200">
                      DELIVERY
                    </div>
                    <div className="mt-1 text-xl font-black">Instant Access</div>
                    <div className="mt-2 text-zinc-400 text-sm">Get your product immediately.</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.13 }}
                    whileHover={{ y: -2, boxShadow: "0 0 38px rgba(168,85,247,0.18)" }}
                    className="rounded-2xl border border-purple-500/20 bg-zinc-900/40 px-5 py-4"
                  >
                    <div className="text-sm font-bold uppercase tracking-[0.22em] text-purple-200">
                      TRUST
                    </div>
                    <div className="mt-1 text-xl font-black">Verified Experience</div>
                    <div className="mt-2 text-zinc-400 text-sm">Secure checkout & premium support.</div>
                  </motion.div>
                </div>

                {/* Floating mini-cards */}
                <div className="pointer-events-none hidden xl:block absolute -left-10 top-10">
                  <motion.div
                    animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.1 }
                        : { repeat: Infinity, duration: 4.8, ease: easeInOut }
                    }
                    className="w-[240px] rounded-2xl border border-purple-500/20 bg-zinc-950/70 px-5 py-4 shadow-[0_0_55px_rgba(168,85,247,0.12)]"
                  >
                    <div className="text-xs uppercase tracking-[0.28em] text-zinc-400 font-bold">
                      POPULAR
                    </div>
                    <div className="mt-2 font-black text-2xl drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                      Top Picks
                    </div>
                    <div className="mt-2 text-purple-200 text-sm">Trending right now in MJ Store.</div>
                  </motion.div>
                </div>

                <div className="pointer-events-none hidden xl:block absolute -right-10 bottom-10">
                  <motion.div
                    animate={prefersReducedMotion ? { y: 0 } : { y: [0, 12, 0] }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.1 }
                        : { repeat: Infinity, duration: 5.6, ease: easeInOut }
                    }
                    className="w-[240px] rounded-2xl border border-purple-500/20 bg-zinc-950/70 px-5 py-4 shadow-[0_0_55px_rgba(168,85,247,0.12)]"
                  >
                    <div className="text-xs uppercase tracking-[0.28em] text-zinc-400 font-bold">
                      SUPPORT
                    </div>
                    <div className="mt-2 font-black text-2xl drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                      Premium Help
                    </div>
                    <div className="mt-2 text-purple-200 text-sm">Fast responses when you need us.</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Small bottom CTA line */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-zinc-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-sm">
            <Zap className="h-4 w-4 text-purple-300" />
            Instant delivery after payment
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-purple-300" />
            Secure payments & trusted products
          </span>
        </div>
      </div>
    </section>
  );
}
