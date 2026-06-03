"use client";

import { motion } from "framer-motion";
import { Headphones, Lock, PackageCheck, Zap } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const items = [
  {
    titleKey: "home.why.item.instantTitle",
    descKey: "home.why.item.instantDesc",
    icon: Zap,
  },
  {
    titleKey: "home.why.item.secureTitle",
    descKey: "home.why.item.secureDesc",
    icon: Lock,
  },
  {
    titleKey: "home.why.item.premiumTitle",
    descKey: "home.why.item.premiumDesc",
    icon: Headphones,
  },
  {
    titleKey: "home.why.item.trustedTitle",
    descKey: "home.why.item.trustedDesc",
    icon: PackageCheck,
  },
] as const;

export default function WhyChooseSection({ id }: { id?: string }) {
  const { translate } = useLanguage();

  return (
    <section id={id} className="max-w-[1600px] mx-auto px-8 py-16">
      <div className="text-center">
        <h2 className="text-5xl font-black tracking-tight">
          {translate("home.why.title")}
        </h2>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          {translate("home.why.subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.article
              key={item.titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="rounded-[2rem] border border-purple-500/20 bg-zinc-950/55 p-8 shadow-[0_0_60px_rgba(168,85,247,0.08)] hover:border-purple-500/35 transition-colors"
            >
              <div className="flex items-start gap-5">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-[0_0_35px_rgba(168,85,247,0.18)]">
                  <Icon className="h-7 w-7 text-purple-300" />
                </div>

                <div>
                  <h3 className="text-3xl font-black">
                    {translate(item.titleKey)}
                  </h3>
                  <p className="mt-3 text-zinc-400">
                    {translate(item.descKey)}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-purple-200 text-sm font-bold">
                    <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
                    {translate("home.why.pill")}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
