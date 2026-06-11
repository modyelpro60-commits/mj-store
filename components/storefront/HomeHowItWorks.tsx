"use client";

import { motion } from "framer-motion";
import { MessageCircle, Search, ShieldCheck, Upload } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const STEP_KEYS = ["01", "02", "03", "04"] as const;
const STEP_ICONS = [Search, ShieldCheck, Upload, MessageCircle] as const;

const STEP_STYLES = [
  {
    border:     "border-purple-500/25",
    bg:         "bg-purple-500/[0.07]",
    iconBorder: "border-purple-500/30",
    iconBg:     "bg-purple-500/15",
    iconColor:  "text-purple-300",
    numColor:   "text-purple-500/30",
    glow:       "rgba(168,85,247,0.18)",
  },
  {
    border:     "border-fuchsia-500/25",
    bg:         "bg-fuchsia-500/[0.07]",
    iconBorder: "border-fuchsia-500/30",
    iconBg:     "bg-fuchsia-500/15",
    iconColor:  "text-fuchsia-300",
    numColor:   "text-fuchsia-500/30",
    glow:       "rgba(217,70,239,0.18)",
  },
  {
    border:     "border-sky-500/25",
    bg:         "bg-sky-500/[0.07]",
    iconBorder: "border-sky-500/30",
    iconBg:     "bg-sky-500/15",
    iconColor:  "text-sky-300",
    numColor:   "text-sky-500/30",
    glow:       "rgba(14,165,233,0.18)",
  },
  {
    border:     "border-emerald-500/25",
    bg:         "bg-emerald-500/[0.07]",
    iconBorder: "border-emerald-500/30",
    iconBg:     "bg-emerald-500/15",
    iconColor:  "text-emerald-300",
    numColor:   "text-emerald-500/30",
    glow:       "rgba(16,185,129,0.18)",
  },
] as const;

export default function HomeHowItWorks() {
  const { translate } = useLanguage();

  return (
    <section className="relative max-w-[1600px] mx-auto px-8 py-16">

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mb-12"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-purple-300 mb-4">
          {translate("home.howItWorks.pill")}
        </span>

        <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black leading-tight tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300">
            {translate("home.howItWorks.title")}
          </span>
        </h2>
        <p className="mt-3 max-w-lg text-base text-zinc-400 leading-relaxed">
          {translate("home.howItWorks.subtitle")}
        </p>

        <motion.div
          className="mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-500 origin-left shadow-[0_0_18px_rgba(168,85,247,0.45)]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Steps grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEP_KEYS.map((key, i) => {
          const Icon  = STEP_ICONS[i];
          const style = STEP_STYLES[i];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: `0 0 40px ${style.glow}` }}
              className={`group relative flex flex-col rounded-3xl border ${style.border} ${style.bg} p-6 transition-all duration-300`}
            >
              {/* Big step number */}
              <span className={`absolute top-4 right-5 text-6xl font-black leading-none select-none pointer-events-none ${style.numColor}`}>
                {key}
              </span>

              {/* Icon */}
              <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl border ${style.iconBorder} ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${style.iconColor}`} strokeWidth={2} />
              </div>

              {/* Text */}
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1.5">
                {translate("home.howItWorks.step")} {key}
              </p>
              <h3 className="text-base font-black text-white leading-tight mb-2">
                {translate(`home.howItWorks.${key}.title`)}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">
                {translate(`home.howItWorks.${key}.desc`)}
              </p>

              {/* Connector arrow (hidden on last card) */}
              {i < STEP_KEYS.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 place-items-center">
                  <div className="h-full w-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
