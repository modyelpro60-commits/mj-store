"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function PremiumCTASection() {
  return (
    <section className="max-w-[1600px] mx-auto px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-purple-500/20 bg-zinc-950/55 shadow-[0_0_90px_rgba(168,85,247,0.10)]"
      >
        {/* Background sweep */}
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-70 pointer-events-none"
          initial={{ x: "-120%" }}
          whileInView={{ x: "120%" }}
          viewport={{ once: true }}
          transition={{ repeat: 0, duration: 1.1, ease: "easeOut" }}
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(168,85,247,0.22), transparent)",
          }}
        />

        {/* Neon frame */}
        <div className="absolute inset-0 pointer-events-none border border-purple-500/10 rounded-[2.5rem]" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center p-10 md:p-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-purple-200 text-sm font-bold tracking-wide">
              <Sparkles className="h-4 w-4" />
              PREMIUM DIGITAL ACCESS
            </div>

            <h2 className="mt-6 text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
              Get instant delivery—
              <span className="text-purple-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                {" "}
                powered by neon trust
              </span>
              .
            </h2>

            <p className="mt-6 text-zinc-400 max-w-xl text-lg">
              Shop best sellers or browse the full catalog. After payment, everything unlocks fast.
              Dark mode, clean UX, and purple neon vibes included.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <Zap className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <div className="font-black">Instant delivery</div>
                  <div className="text-zinc-400 text-sm">No waiting after checkout</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <ShieldCheck className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <div className="font-black">Secure payments</div>
                  <div className="text-zinc-400 text-sm">Trusted, protected flow</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link href="#products">
              <motion.button
                whileHover={{
                  y: -2,
                  boxShadow: "0 0 70px rgba(168,85,247,0.28), 0 0 30px rgba(168,85,247,0.18)",
                }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-2xl bg-purple-600 px-8 py-5 text-2xl font-black text-white border border-purple-400/25 hover:bg-purple-700 transition"
              >
                Browse Catalog
                <span className="inline-flex items-center gap-2 ml-3">
                  <ArrowRight className="h-6 w-6" />
                </span>
              </motion.button>
            </Link>

            <Link href="#best-sellers">
              <motion.button
                whileHover={{
                  y: -2,
                  borderColor: "#a855f7",
                  boxShadow: "0 0 50px rgba(168,85,247,0.22)",
                }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-2xl border border-zinc-700 bg-black/25 px-8 py-5 text-2xl font-black text-white transition"
              >
                Shop Best Sellers
              </motion.button>
            </Link>

            <div className="mt-1 rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <div className="text-sm font-bold uppercase tracking-[0.22em] text-zinc-400">
                Quick promise
              </div>
              <div className="mt-3 text-zinc-200 text-lg">
                You’ll get access instantly after payment—clean, simple, premium.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
