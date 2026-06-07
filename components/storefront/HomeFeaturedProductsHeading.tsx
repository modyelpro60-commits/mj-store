"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export default function HomeFeaturedProductsHeading() {
  const { translate } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-12"
    >
      <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black leading-tight tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300">
          {translate("home.featured.title")}
        </span>
      </h2>

      {/* Animated underline — purple glow bar */}
      <motion.div
        className="mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-500 origin-left shadow-[0_0_18px_rgba(168,85,247,0.45)]"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
