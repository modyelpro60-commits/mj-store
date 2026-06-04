"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Music2, Clapperboard, Gamepad2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";
import MJLogo from "../../../components/branding/MJLogo";

type SocialIcon = {
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  accent: "purple" | "blue";
};

function floatKeyframes() {
  return [
    { y: 0, rotate: 0 },
    { y: -12, rotate: -1.5 },
    { y: 0, rotate: 0 },
  ];
}

export default function NeonHero() {
  const prefersReducedMotion = useReducedMotion();
  const { language } = useLanguage();

  const isArabic = language === "ar";

  const social: SocialIcon[] = useMemo(
    () => [
      { label: "ChatGPT", Icon: MessageCircle as any, accent: "purple" },
      { label: "Spotify", Icon: Music2 as any, accent: "blue" },
      { label: "Netflix", Icon: Clapperboard as any, accent: "purple" },
      { label: "Discord", Icon: Gamepad2 as any, accent: "blue" },
    ],
    []
  );

  const ctaGlowPurple =
    "0 0 55px rgba(168,85,247,0.25), 0 0 25px rgba(168,85,247,0.15)";
  const ctaGlowBlue = "0 0 55px rgba(59,130,246,0.20), 0 0 25px rgba(59,130,246,0.12)";

  return (
    <section className="relative pt-8 md:pt-20 pb-6 md:pb-10 overflow-hidden">
      {/* Background depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -top-10 right-[-90px] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-500/5 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10 relative">
        <div className="grid items-center gap-6 md:gap-10 lg:grid-cols-[1.05fr_0.85fr]">
          {/* LEFT: floating subscription icons (hidden on mobile — too much clutter) */}
          <div className="relative">
            <div className="hidden sm:block">
              {/* Subscription icons (unchanged from original) */}
              <div
                className={[
                  "absolute inset-y-0 left-[-10px] w-[250px]",
                  isArabic ? "rtl" : "",
                ].join(" ")}
              >
                <div className="relative h-full">
                  {social.map((s, i) => {
                    const delay = i * 0.18;
                    const color =
                      s.accent === "purple"
                        ? { border: "border-purple-500/30", bg: "bg-purple-500/10", fg: "text-purple-200", glow: ctaGlowPurple }
                        : { border: "border-blue-500/30", bg: "bg-blue-500/10", fg: "text-blue-200", glow: ctaGlowBlue };

                    const IconEl = s.Icon;

                    return (
                      <motion.div
                        key={s.label}
                        className={[
                          "absolute left-0 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.35)]",
                          color.border,
                          color.bg,
                        ].join(" ")}
                        style={{ top: `${(i * 78) + 10}px` }}
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: "easeOut", delay: delay * 0.35 }}
                        whileHover={
                          prefersReducedMotion
                            ? undefined
                            : { boxShadow: `0 0 0 1px rgba(168,85,247,0.20), ${color.glow}` }
                        }
                      >
                        <motion.div
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : {
                                  y: floatKeyframes().map((k) => k.y),
                                }
                          }
                          transition={
                            prefersReducedMotion
                              ? undefined
                              : { duration: 5.8 + i * 0.35, repeat: Infinity, ease: "easeInOut", delay }
                          }
                          style={{ display: "flex", alignItems: "center", gap: 10 }}
                        >
                          <div
                            className={[
                              "grid h-9 w-9 place-items-center rounded-2xl border",
                              color.border.replace("border-", "bg-").replace("/30", "/15"),
                              "border-purple-500/15",
                            ].join(" ")}
                          >
                            <IconEl className={["h-5 w-5", color.fg].join(" ")} />
                          </div>

                          <div className="min-w-0">
                            <div className={["text-sm font-black tracking-wide", color.fg].join(" ")}>
                              {s.label}
                            </div>
                            <div className="text-xs text-zinc-300">Premium access</div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Badge visible on all screen sizes */}
            <div className="sm:hidden mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1.5 text-purple-200 shadow-[0_0_45px_rgba(168,85,247,0.18)]">
                <Sparkles className="h-3 w-3 text-purple-300" />
                <span className="text-xs font-bold tracking-wide">PREMIUM DIGITAL PRODUCTS</span>
              </div>
            </div>
          </div>

          {/* CENTER */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-4 py-2 text-purple-200 shadow-[0_0_45px_rgba(168,85,247,0.18)]">
                <Sparkles className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-bold tracking-wide">PREMIUM DIGITAL PRODUCTS</span>
              </div>

              <h1 className="mt-7 text-[58px] leading-[0.9] font-black tracking-[8px] sm:text-[72px]">
                <span className="block text-white">MJ</span>
                <span className="block text-purple-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]">
                  STORE
                </span>
              </h1>

              <div className={["mt-4", isArabic ? "text-right" : "text-left"].join(" ")}>
                <div className="text-[22px] font-black text-white/95">
                  {isArabic ? "متجرك للخدمات الرقمية" : "Your digital services store"}
                </div>

                <p className={["mt-3 text-base md:text-lg text-zinc-300 leading-relaxed", isArabic ? "text-right" : ""].join(" ")}>
                  {isArabic
                    ? "اشتراكات أصلية • تسليم فوري • أسهل تجربة شراء"
                    : "Original subscriptions • Instant delivery • Easy purchase experience"}
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
                <Link href="#products">
                  <motion.button
                    whileHover={
                      prefersReducedMotion ? undefined : { boxShadow: ctaGlowPurple, y: -2 }
                    }
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl border border-purple-400/25 bg-purple-600 px-8 py-4 font-black tracking-wide text-white transition-all hover:bg-purple-700"
                  >
                    {isArabic ? "تصفح المنتجات" : "Browse Products"}
                  </motion.button>
                </Link>

                <Link href="#catalog">
                  <motion.button
                    whileHover={
                      prefersReducedMotion ? undefined : { boxShadow: ctaGlowBlue, y: -2 }
                    }
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-black/30 border border-white/15 px-8 py-4 font-black tracking-wide text-white transition-all hover:bg-white/5"
                  >
                    {isArabic ? "استكشف المتجر" : "Explore Store"}
                  </motion.button>
                </Link>
              </div>

              {/* Minimal trust line */}
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-x-10 gap-y-3 text-zinc-200 justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 text-base">
                  <span className="grid h-7 w-7 place-items-center rounded-xl border border-purple-500/25 bg-purple-500/10">
                    <Sparkles className="h-4 w-4 text-purple-200" />
                  </span>
                  <span>{isArabic ? "تسليم فوري" : "Instant delivery"}</span>
                </div>

                <div className="inline-flex items-center gap-2 text-base">
                  <span className="grid h-7 w-7 place-items-center rounded-xl border border-blue-500/25 bg-blue-500/10">
                    <Sparkles className="h-4 w-4 text-blue-200" />
                  </span>
                  <span>{isArabic ? "مدفوعات آمنة" : "Secure payments"}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: 3D showcase */}
          <div className="hidden md:block lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[2.2rem] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                {/* Platform */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <div className="absolute -bottom-16 left-[-10%] h-80 w-[70%] rounded-[3rem] bg-purple-500/10 blur-2xl" />
                  <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

                  {/* Neon grid */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(168,85,247,0.18) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(168,85,247,0.18) 1px, transparent 1px)
                      `,
                      backgroundSize: "60px 60px",
                      transform: "perspective(900px) rotateX(62deg) translateY(120px)",
                      transformOrigin: "center bottom",
                    }}
                  />
                </div>

                {/* 3D MJ logo card */}
                <motion.div
                  className="relative flex items-center justify-center p-10"
                  whileHover={prefersReducedMotion ? undefined : { rotateY: 10, rotateX: -4 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Particles */}
                  <div aria-hidden className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 22 }).map((_, i) => {
                      const left = (i * 37) % 100;
                      const top = (i * 61) % 100;
                      const size = 3 + (i % 4);
                      const duration = 2.6 + (i % 5) * 0.35;

                      return (
                        <motion.span
                          key={i}
                          className="absolute rounded-full bg-purple-200/80"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: size,
                            height: size,
                            boxShadow: "0 0 18px rgba(168,85,247,0.35)",
                          }}
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : {
                                  y: [-8, 16, -8],
                                  opacity: [0.65, 1, 0.65],
                                }
                          }
                          transition={
                            prefersReducedMotion
                              ? undefined
                              : { duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }
                          }
                        />
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className="absolute -inset-10 rounded-[3rem] bg-purple-500/5 blur-2xl" />
                    <div className="rounded-[2.2rem] border border-purple-500/15 bg-black/25 backdrop-blur-xl px-10 py-8 shadow-[0_0_70px_rgba(168,85,247,0.15)]">
                      <MJLogo size="lg" glow />
                    </div>
                  </motion.div>

                  {/* Glow accents */}
                  <div aria-hidden className="absolute -bottom-10 left-1/2 w-[320px] h-[120px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-2xl" />
                  <div aria-hidden className="absolute -top-12 right-10 w-[180px] h-[180px] rounded-full bg-blue-500/10 blur-2xl" />
                </motion.div>
              </div>

              {/* Tiny label */}
              <div className="mt-4 flex items-center justify-center gap-2 text-purple-200/90">
                <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]" />
                <span className="text-sm font-bold tracking-wide">Neon platform • real delivery</span>
              </div>
            </motion.div>
          </div>

          {/* Mobile particles accent */}
          <div className="md:hidden absolute inset-x-0 -bottom-10 h-36 pointer-events-none">
            <div className="mx-auto h-36 w-full rounded-full bg-purple-500/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
