"use client";

import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export type SocialProofStats = {
  totalCustomers: number;
  totalSalesEGP: number;
  totalDelivered: number;
};

export default function SocialProofSection({
  id,
  stats,
}: {
  id?: string;
  stats: SocialProofStats;
}) {
  const { translate } = useLanguage();

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
      Number.isFinite(n) ? Math.round(n) : 0
    );

  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      <div className="text-center">
        <h2 className="text-5xl font-black tracking-tight">
          {translate("home.social.trustedTitle")}
        </h2>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          {translate("home.social.trustedSubtitle")}
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 p-8 shadow-[0_0_60px_rgba(168,85,247,0.08)]"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
                {translate("home.social.totalCustomersLabel")}
              </p>
              <p className="mt-4 text-5xl font-black drop-shadow-[0_0_18px_rgba(168,85,247,0.25)]">
                {fmt(stats.totalCustomers)}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <Users className="h-7 w-7 text-purple-300" />
            </div>
          </div>

          <div className="mt-6 text-zinc-400">
            {translate("home.social.totalCustomersDesc")}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 p-8 shadow-[0_0_60px_rgba(168,85,247,0.08)]"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
                {translate("home.social.totalSalesLabel")}
              </p>
              <p className="mt-4 text-5xl font-black drop-shadow-[0_0_18px_rgba(168,85,247,0.25)]">
                {fmt(stats.totalSalesEGP)} EGP
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <Sparkles className="h-7 w-7 text-purple-300" />
            </div>
          </div>

          <div className="mt-6 text-zinc-400">
            {translate("home.social.totalSalesDesc")}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/60 p-8 shadow-[0_0_60px_rgba(168,85,247,0.08)]"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
                {translate("home.social.totalDeliveredLabel")}
              </p>
              <p className="mt-4 text-5xl font-black drop-shadow-[0_0_18px_rgba(168,85,247,0.25)]">
                {fmt(stats.totalDelivered)}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <CreditCard className="h-7 w-7 text-purple-300" />
            </div>
          </div>

          <div className="mt-6 text-zinc-400">
            {translate("home.social.totalDeliveredDesc")}
          </div>
        </motion.article>
      </div>

      {/* Trust indicators */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.12 }}
        className="mt-10 rounded-[2rem] border border-white/10 bg-zinc-950/40 p-6 md:p-8"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <ShieldCheck className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <div className="font-bold">
                {translate("home.social.trust.instantTitle")}
              </div>
              <div className="text-zinc-400 text-sm">
                {translate("home.social.trust.instantDesc")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <CreditCard className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <div className="font-bold">
                {translate("home.social.trust.secureTitle")}
              </div>
              <div className="text-zinc-400 text-sm">
                {translate("home.social.trust.secureDesc")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <div className="font-bold">
                {translate("home.social.trust.premiumTitle")}
              </div>
              <div className="text-zinc-400 text-sm">
                {translate("home.social.trust.premiumDesc")}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
