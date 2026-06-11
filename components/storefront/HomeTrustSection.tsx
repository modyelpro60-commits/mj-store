"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Check, HeadphonesIcon, MessageCircle, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const TRUST_CARD_CONFIGS = [
  {
    icon:       ShieldCheck,
    titleKey:   "home.trust.card.securePayments.title",
    descKey:    "home.trust.card.securePayments.desc",
    border:     "border-emerald-500/20",
    bg:         "bg-emerald-500/[0.05]",
    iconBorder: "border-emerald-500/25",
    iconBg:     "bg-emerald-500/10",
    iconColor:  "text-emerald-400",
    glow:       "rgba(16,185,129,0.15)",
  },
  {
    icon:       BadgeCheck,
    titleKey:   "home.trust.card.verifiedStore.title",
    descKey:    "home.trust.card.verifiedStore.desc",
    border:     "border-purple-500/20",
    bg:         "bg-purple-500/[0.05]",
    iconBorder: "border-purple-500/25",
    iconBg:     "bg-purple-500/10",
    iconColor:  "text-purple-400",
    glow:       "rgba(168,85,247,0.15)",
  },
  {
    icon:       HeadphonesIcon,
    titleKey:   "home.trust.card.liveSupport.title",
    descKey:    "home.trust.card.liveSupport.desc",
    border:     "border-sky-500/20",
    bg:         "bg-sky-500/[0.05]",
    iconBorder: "border-sky-500/25",
    iconBg:     "bg-sky-500/10",
    iconColor:  "text-sky-400",
    glow:       "rgba(14,165,233,0.15)",
  },
  {
    icon:       MessageCircle,
    titleKey:   "home.trust.card.chatDelivery.title",
    descKey:    "home.trust.card.chatDelivery.desc",
    border:     "border-fuchsia-500/20",
    bg:         "bg-fuchsia-500/[0.05]",
    iconBorder: "border-fuchsia-500/25",
    iconBg:     "bg-fuchsia-500/10",
    iconColor:  "text-fuchsia-400",
    glow:       "rgba(217,70,239,0.15)",
  },
] as const;

const CONFIDENCE_KEYS = [
  "home.trust.confidence.securePayments",
  "home.trust.confidence.fastProcessing",
  "home.trust.confidence.verifiedStore",
  "home.trust.confidence.activeSupportTeam",
] as const;

export default function HomeTrustSection() {
  const { translate } = useLanguage();

  return (
    <section className="relative max-w-[1600px] mx-auto px-8 pb-20">

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mb-12"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-purple-300 mb-4">
          {translate("home.trust.pill")}
        </span>
        <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-black leading-tight tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300">
            {translate("home.trust.title")}
          </span>
        </h2>
        <motion.div
          className="mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-500 origin-left shadow-[0_0_18px_rgba(168,85,247,0.45)]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Trust cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {TRUST_CARD_CONFIGS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: `0 0 40px ${card.glow}` }}
              className={`flex flex-col rounded-3xl border ${card.border} ${card.bg} p-6 transition-all duration-300`}
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl border ${card.iconBorder} ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} strokeWidth={2} />
              </div>
              <h3 className="text-base font-black text-white mb-2">
                {translate(card.titleKey)}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">
                {translate(card.descKey)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Confidence strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-3xl border border-white/[0.06] bg-white/[0.02] px-8 py-5"
      >
        {CONFIDENCE_KEYS.map((key) => (
          <span key={key} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <Check className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
            </span>
            {translate(key)}
          </span>
        ))}
      </motion.div>

    </section>
  );
}
