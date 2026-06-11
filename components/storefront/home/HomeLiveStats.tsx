"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Package, Users } from "lucide-react";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

/* ── Animated counter ──────────────────────────────────────────── */
function FastCount({ value, triggered }: { value: number; triggered: boolean }) {
  const [display, setDisplay] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (!triggered || animated.current || value === 0) return;
    animated.current = true;
    const STEPS = 32;
    const inc   = value / STEPS;
    let cur     = 0;
    const id    = setInterval(() => {
      cur += inc;
      if (cur >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(cur));
    }, 900 / STEPS);
    return () => clearInterval(id);
  }, [value, triggered]);

  return <>{display.toLocaleString()}</>;
}

/* ── Props ─────────────────────────────────────────────────────── */
type Props = {
  registeredUsers:  number;
  completedOrders:  number;
  totalProducts?:   number;
  /* backward compat */
  activeCustomers?: number;
  totalCustomers?:  number;
};

export default function HomeLiveStats({
  registeredUsers,
  completedOrders,
  totalProducts = 0,
}: Props) {
  const [triggered, setTriggered] = useState(false);
  const { translate } = useLanguage();

  const users    = Number.isFinite(registeredUsers) ? registeredUsers : 0;
  const orders   = Number.isFinite(completedOrders) ? completedOrders : 0;
  const products = Number.isFinite(totalProducts)   ? totalProducts   : 0;

  const items = [
    {
      icon:       Users,
      label:      translate("home.stats.registeredUsers"),
      value:      users,
      border:     "border-emerald-500/20",
      bg:         "bg-emerald-500/[0.06]",
      iconBorder: "border-emerald-500/20",
      iconBg:     "bg-emerald-500/[0.10]",
      iconColor:  "text-emerald-400",
      glow:       "rgba(16,185,129,0.25)",
    },
    {
      icon:       CheckCircle,
      label:      translate("home.stats.completedOrders"),
      value:      orders,
      border:     "border-sky-500/20",
      bg:         "bg-sky-500/[0.06]",
      iconBorder: "border-sky-500/20",
      iconBg:     "bg-sky-500/[0.10]",
      iconColor:  "text-sky-400",
      glow:       "rgba(14,165,233,0.25)",
    },
    {
      icon:       Package,
      label:      translate("home.stats.productsAvailable"),
      value:      products,
      border:     "border-purple-500/20",
      bg:         "bg-purple-500/[0.06]",
      iconBorder: "border-purple-500/20",
      iconBg:     "bg-purple-500/[0.10]",
      iconColor:  "text-purple-400",
      glow:       "rgba(168,85,247,0.25)",
    },
  ];

  return (
    <section className="relative -mt-3 mb-2">
      <div className="max-w-[1600px] mx-auto px-8">
        <motion.div
          onViewportEnter={() => setTriggered(true)}
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-wrap gap-4"
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.1 }}
                whileHover={{ scale: 1.03, boxShadow: `0 0 35px ${item.glow}` }}
                className={`inline-flex items-center gap-3 rounded-2xl border ${item.border} ${item.bg} px-5 py-3.5 backdrop-blur-xl shadow-sm cursor-default`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl border ${item.iconBorder} ${item.iconBg}`}>
                  <Icon className={`h-[18px] w-[18px] ${item.iconColor}`} strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 leading-tight">
                    {item.label}
                  </span>
                  <span className="text-lg font-black text-white tabular-nums leading-none">
                    <FastCount value={item.value} triggered={triggered} />
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
