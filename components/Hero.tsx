"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0">

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(rgba(168,85,247,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-700/30 rounded-full blur-[220px]" />

        <div className="absolute left-[-200px] top-[300px] w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[180px]" />

        <div className="absolute right-[-200px] top-[300px] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[180px]" />

      </div>

      {/* Floating Cards */}

      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="hidden lg:block absolute left-[10%] top-[25%]"
      >
        <div className="bg-zinc-900/80 border border-purple-500/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">
          <h3 className="font-bold text-xl">Spotify Premium</h3>
          <p className="text-purple-400 mt-2">Instant Delivery</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 6 }}
        className="hidden lg:block absolute right-[10%] top-[22%]"
      >
        <div className="bg-zinc-900/80 border border-purple-500/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">
          <h3 className="font-bold text-xl">Discord Nitro</h3>
          <p className="text-purple-400 mt-2">Best Seller</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="hidden lg:block absolute left-[15%] bottom-[20%]"
      >
        <div className="bg-zinc-900/80 border border-purple-500/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">
          <h3 className="font-bold text-xl">Netflix</h3>
          <p className="text-purple-400 mt-2">Premium Account</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [8, -8, 8] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="hidden lg:block absolute right-[15%] bottom-[20%]"
      >
        <div className="bg-zinc-900/80 border border-purple-500/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">
          <h3 className="font-bold text-xl">ChatGPT Plus</h3>
          <p className="text-purple-400 mt-2">Fast Access</p>
        </div>
      </motion.div>

      {/* Content */}

      <div className="relative z-10 text-center px-6">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="px-5 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
            PREMIUM DIGITAL MARKETPLACE
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 text-7xl md:text-9xl font-black leading-none"
        >
          LEVEL UP
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-6xl md:text-8xl font-black text-purple-500"
        >
          YOUR DIGITAL LIFE
        </motion.h2>

        <p className="max-w-2xl mx-auto mt-8 text-zinc-400 text-xl">
          Buy Spotify, Netflix, Discord Nitro, ChatGPT Plus
          and premium digital services instantly.
        </p>

        <div className="flex justify-center gap-4 mt-10 flex-wrap">

          <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
            Shop Now
            <ArrowRight size={20} />
          </button>

          <button className="border border-zinc-700 hover:border-purple-500 px-8 py-4 rounded-2xl font-bold">
            Explore
          </button>

        </div>

        <div className="flex justify-center gap-8 mt-16 flex-wrap text-zinc-300">

          <div className="flex items-center gap-2">
            <Zap size={18} />
            Instant Delivery
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck size={18} />
            Secure Payment
          </div>

        </div>

      </div>
    </section>
  );
}