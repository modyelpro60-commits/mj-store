"use client";

import { motion, useReducedMotion } from "framer-motion";

/*
 * PageAmbient — full-page atmospheric depth layer.
 * Three ultra-slow blobs (35–52 s cycles) at 3–4 % opacity.
 * Positioned in the product-section zone so they do not
 * compound with the hero's own aurora.
 * The user should FEEL depth without NOTICING blobs.
 */
export default function PageAmbient() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Blob A — purple, upper-product zone */}
      <motion.div
        className="absolute top-[55%] right-[-8%] h-[65vh] w-[65vh] rounded-full bg-purple-700/[0.04] blur-[100px]"
        animate={{ x: [0, 45, -25, 0], y: [0, 25, -18, 0] }}
        transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob B — fuchsia, lower-product / footer zone */}
      <motion.div
        className="absolute top-[78%] left-[-6%] h-[50vh] w-[50vh] rounded-full bg-fuchsia-700/[0.03] blur-[90px]"
        animate={{ x: [0, -28, 18, 0], y: [0, -22, 14, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      {/* Blob C — indigo, mid-page — nearly imperceptible */}
      <motion.div
        className="absolute top-[42%] left-[28%] h-[40vh] w-[40vh] rounded-full bg-indigo-800/[0.03] blur-[110px]"
        animate={{ x: [0, 22, -35, 12, 0], y: [0, -28, 18, -12, 0] }}
        transition={{ duration: 52, repeat: Infinity, ease: "easeInOut", delay: 15 }}
      />
    </div>
  );
}
