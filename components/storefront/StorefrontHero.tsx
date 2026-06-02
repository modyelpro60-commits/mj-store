"use client";

import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, ShieldCheck, Zap } from "lucide-react";

export default function StorefrontHero() {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-8 py-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-purple-300"
          >
            Premium Digital Marketplace
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-8xl leading-none font-black md:text-9xl"
          >
            MJ
            <br />
            <motion.span
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-purple-500"
            >
              STORE
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="mt-8 max-w-2xl text-xl text-zinc-400"
          >
            Buy premium subscriptions, digital services, Discord Nitro, Spotify, Netflix and
            ChatGPT Plus with instant delivery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a href="#products">
              <motion.button
                whileHover={{ boxShadow: "0 0 45px rgba(168,85,247,0.28)", y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-purple-600 px-8 py-4 font-bold"
              >
                SHOP NOW
              </motion.button>
            </a>

            <motion.button
              whileHover={{ borderColor: "#a855f7", boxShadow: "0 0 30px rgba(168,85,247,0.18)" }}
              whileTap={{ scale: 0.99 }}
              className="rounded-2xl border border-zinc-700 bg-transparent px-8 py-4 font-bold transition"
            >
              EXPLORE
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-zinc-300"
          >
            <div className="flex items-center gap-2">
              <Zap size={18} />
              Instant Delivery
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} />
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} />
              Premium Services
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="relative hidden items-center justify-center lg:flex"
        >
          <motion.img
            src="/hero.jpg"
            alt="MJ Store Hero"
            className="w-full max-w-[850px] object-contain drop-shadow-[0_0_80px_rgba(168,85,247,0.5)]"
            whileHover={{ scale: 1.02, filter: "saturate(1.1)" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />

          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]"
              style={{ originX: "50%", originY: "50%" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
