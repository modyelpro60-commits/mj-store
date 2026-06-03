"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export default function HomeProductsHeading() {
  const { translate } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-16"
    >
      <h2 className="text-6xl md:text-7xl font-black text-center mb-6 tracking-tight drop-shadow-[0_0_35px_rgba(168,85,247,0.25)]">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300">
          {translate("home.productsHeading")}
        </span>
      </h2>
      <motion.div 
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        className="h-1 w-24 bg-gradient-to-r from-purple-500 to-fuchsia-500 mx-auto rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)]"
      />
    </motion.div>
  );
}
