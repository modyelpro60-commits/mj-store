"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

function FastCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 600;
    const steps = 15;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return <>{display}</>;
}

export default function HomeLiveStats({
  activeCustomers,
  totalCustomers,
  totalProducts,
}: {
  activeCustomers: number;
  totalCustomers: number;
  totalProducts?: number;
}) {
  const { translate } = useLanguage();

  const activeValue = Number.isFinite(activeCustomers) ? activeCustomers : 0;
  const totalValue = Number.isFinite(totalCustomers) ? totalCustomers : 0;
  const productValue = Number.isFinite(totalProducts) ? (totalProducts as number) : 0;

  const pillClass =
    "inline-flex items-center gap-2.5 rounded-2xl border px-4 py-2 backdrop-blur-xl transition-all duration-300";

  const items = [
    {
      icon: Users,
      label: translate("home.hero.status.activeCustomersLabel"),
      value: activeValue,
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      hoverBorder: "hover:border-emerald-500/30",
      iconBorder: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
      glowColor: "rgba(52,211,153,0.18)",
    },
    {
      icon: TrendingUp,
      label: translate("home.hero.status.totalCustomersLabel"),
      value: totalValue,
      border: "border-sky-500/20",
      bg: "bg-sky-500/5",
      hoverBorder: "hover:border-sky-500/30",
      iconBorder: "border-sky-500/20",
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-300",
      glowColor: "rgba(96,165,250,0.18)",
    },
    {
      icon: Package,
      label: translate("home.hero.status.totalProductsLabel") || "Products",
      value: productValue,
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      hoverBorder: "hover:border-purple-500/30",
      iconBorder: "border-purple-500/20",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-300",
      glowColor: "rgba(168,85,247,0.18)",
    },
  ];

  return (
    <section className="relative -mt-4 mb-4">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${item.glowColor}` }}
                transition={{ duration: 0.2 }}
                className={`${pillClass} ${item.border} ${item.bg} ${item.hoverBorder}`}
              >
                <div className={`grid h-7 w-7 place-items-center rounded-xl border ${item.iconBorder} ${item.iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    {item.label}
                  </span>
                  <span className="text-base font-black text-white tabular-nums leading-tight">
                    <FastCount value={item.value} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
