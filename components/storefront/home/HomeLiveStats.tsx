"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

function FastCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    hasAnimated.current = true;
    const duration = 800;
    const steps = 24;
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

  return <>{display.toLocaleString()}</>;
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

  const items = [
    {
      icon: Users,
      label: translate("home.hero.status.activeCustomersLabel"),
      value: activeValue,
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      hoverBorder: "hover:border-emerald-500/35",
      iconBorder: "border-emerald-500/25",
      iconBg: "bg-emerald-500/15",
      iconSvg: "text-emerald-300",
      glowColor: "rgba(52,211,153,0.22)",
      shadow: "shadow-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: translate("home.hero.status.totalCustomersLabel"),
      value: totalValue,
      border: "border-sky-500/20",
      bg: "bg-sky-500/5",
      hoverBorder: "hover:border-sky-500/35",
      iconBorder: "border-sky-500/25",
      iconBg: "bg-sky-500/15",
      iconSvg: "text-sky-300",
      glowColor: "rgba(96,165,250,0.22)",
      shadow: "shadow-sky-500/10",
    },
    {
      icon: Package,
      label: translate("home.hero.status.totalProductsLabel") || "Total Products",
      value: productValue,
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      hoverBorder: "hover:border-purple-500/35",
      iconBorder: "border-purple-500/25",
      iconBg: "bg-purple-500/15",
      iconSvg: "text-purple-300",
      glowColor: "rgba(168,85,247,0.22)",
      shadow: "shadow-purple-500/10",
    },
  ];

  return (
    <section className="relative -mt-3 mb-2">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 0 35px ${item.glowColor}`,
                  borderColor: item.border.includes("emerald")
                    ? "rgba(52,211,153,0.45)"
                    : item.border.includes("sky")
                    ? "rgba(96,165,250,0.45)"
                    : "rgba(168,85,247,0.45)",
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`inline-flex items-center gap-3 rounded-2xl border ${item.border} ${item.bg} ${item.hoverBorder} px-5 py-3.5 backdrop-blur-xl shadow-sm ${item.shadow} transition-all duration-300`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl border ${item.iconBorder} ${item.iconBg}`}>
                  <Icon className={`h-4.5 w-4.5 ${item.iconSvg}`} strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 leading-tight">
                    {item.label}
                  </span>
                  <span className="text-lg font-black text-white tabular-nums leading-none">
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
