"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1.2;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, (duration * 1000) / steps);

    return () => clearInterval(interval);
  }, [value]);

  return <>{displayValue}</>;
}

export default function HomeLiveStats({
  activeCustomers,
  totalCustomers,
}: {
  activeCustomers: number;
  totalCustomers: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  const activeValue = Number.isFinite(activeCustomers) ? activeCustomers : 0;
  const totalValue = Number.isFinite(totalCustomers) ? totalCustomers : 0;

  const pulse = prefersReducedMotion
    ? {}
    : {
        y: [0, -2, 0],
        boxShadow: [
          "0 0 0 rgba(0,0,0,0)",
          "0 0 55px rgba(34,197,94,0.18)",
          "0 0 0 rgba(0,0,0,0)",
        ],
      };

  const dotPulse = prefersReducedMotion
    ? {}
    : {
        scale: [1, 1.3, 1],
        boxShadow: [
          "0 0 8px rgba(0,0,0,0)",
          "0 0 28px rgba(52,211,153,0.7)",
          "0 0 8px rgba(0,0,0,0)",
        ],
      };

  return (
    <section className="relative py-8 md:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2"
        >
          <motion.div
            className="group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-5 sm:p-8 transition-all duration-300"
            whileHover={
              prefersReducedMotion
                ? undefined
                : {
                    y: -6,
                    boxShadow: "0 0 100px rgba(34,197,94,0.35), 0 0 60px rgba(34,197,94,0.2)",
                  }
            }
          >
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-16 h-60 w-60 rounded-full bg-emerald-500/15 blur-3xl" />
              <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl" />
            </div>

            <div className="relative flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 mb-2">
                  <motion.span
                    className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.55)]"
                    animate={dotPulse}
                    transition={{
                      duration: 1.8,
                      repeat: prefersReducedMotion ? 0 : Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-sm font-bold tracking-wide text-emerald-200">
                    Active Customers
                  </span>
                </div>

                <motion.div
                  animate={pulse}
                  transition={{
                    duration: 2.2,
                    repeat: prefersReducedMotion ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                  className="mt-4 text-8xl font-black text-white tabular-nums leading-none tracking-tighter"
                >
                  <AnimatedNumber value={activeValue} />
                </motion.div>
              </div>

              <motion.div
                className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-3xl border border-emerald-500/25 bg-black/20 text-emerald-200 transition-colors duration-300 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-sky-500/20 bg-sky-500/5 backdrop-blur-xl p-5 sm:p-8 transition-all duration-300"
            whileHover={
              prefersReducedMotion
                ? undefined
                : {
                    y: -6,
                    boxShadow: "0 0 100px rgba(59,130,246,0.35), 0 0 60px rgba(59,130,246,0.2)",
                  }
            }
          >
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-16 h-60 w-60 rounded-full bg-sky-500/15 blur-3xl" />
              <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-sky-500/8 blur-3xl" />
            </div>

            <div className="relative flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-2 mb-2">
                  <motion.span
                    className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.55)]"
                    animate={{
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        "0 0 8px rgba(0,0,0,0)",
                        "0 0 28px rgba(56,189,248,0.7)",
                        "0 0 8px rgba(0,0,0,0)",
                      ],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: prefersReducedMotion ? 0 : Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-sm font-bold tracking-wide text-sky-200">
                    Total Customers
                  </span>
                </div>

                <motion.div
                  animate={pulse}
                  transition={{
                    duration: 2.2,
                    repeat: prefersReducedMotion ? 0 : Infinity,
                    ease: "easeInOut",
                    delay: 0.12,
                  }}
                  className="mt-4 text-8xl font-black text-white tabular-nums leading-none tracking-tighter"
                >
                  <AnimatedNumber value={totalValue} />
                </motion.div>
              </div>

              <motion.div
                className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-3xl border border-sky-500/25 bg-black/20 text-sky-200 transition-colors duration-300 group-hover:border-sky-500/50 group-hover:bg-sky-500/5"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
