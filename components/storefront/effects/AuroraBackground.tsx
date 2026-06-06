"use client";

import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[60%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)" }}
        animate={{ x: [0, 60, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168,85,247,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
