"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Package } from "lucide-react";

/* ─── Viewport-triggered animated counter ─────────────────────────────────── */
function FastCount({ value, triggered }: { value: number; triggered: boolean }) {
  const [display, setDisplay] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (!triggered || animated.current) return;
    animated.current = true;
    const STEPS = 30;
    const inc = value / STEPS;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(cur));
    }, 900 / STEPS);
    return () => clearInterval(id);
  }, [value, triggered]);

  return <>{display.toLocaleString()}</>;
}

/* ─── Props ────────────────────────────────────────────────────────────────── */
type Props = {
  activeCustomers: number;
  totalCustomers: number;
  totalProducts?: number;
};

export default function HomeLiveStats({
  activeCustomers,
  totalCustomers,
  totalProducts,
}: Props) {
  const [triggered, setTriggered] = useState(false);

  const active   = Number.isFinite(activeCustomers) ? activeCustomers : 0;
  const total    = Number.isFinite(totalCustomers)  ? totalCustomers  : 0;
  const products = Number.isFinite(totalProducts)   ? (totalProducts as number) : 0;

  const items = [
    {
      icon: Users,
      label: "Active Customers",
      value: active,
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.06]",
      iconBorder: "border-emerald-500/20",
      iconBg: "bg-emerald-500/[0.10]",
      iconColor: "text-emerald-400",
      glow: "rgba(16,185,129,0.25)",
    },
    {
      icon: TrendingUp,
      label: "Total Customers",
      value: total,
      border: "border-sky-500/20",
      bg: "bg-sky-500/[0.06]",
      iconBorder: "border-sky-500/20",
      iconBg: "bg-sky-500/[0.10]",
      iconColor: "text-sky-400",
      glow: "rgba(14,165,233,0.25)",
    },
    {
      icon: Package,
      label: "Total Products",
      value: products,
      border: "border-purple-500/20",
      bg: "bg-purple-500/[0.06]",
      iconBorder: "border-purple-500/20",
      iconBg: "bg-purple-500/[0.10]",
      iconColor: "text-purple-400",
      glow: "rgba(168,85,247,0.25)",
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
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 0 35px ${item.glow}`,
                }}
                className={`inline-flex items-center gap-3 rounded-2xl border ${item.border} ${item.bg} px-5 py-3.5 backdrop-blur-xl shadow-sm cursor-default`}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl border ${item.iconBorder} ${item.iconBg}`}
                >
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
