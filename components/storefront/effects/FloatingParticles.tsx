"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: (i * 17.371) % 100,
      y: (i * 53.543) % 100,
      size: 2 + ((i * 0.15) % 4),
      delay: (i * 0.3) % 5,
      duration: 4 + ((i * 0.25) % 4),
      driftY: -((i * 9) % 25) - 8,
      driftX: ((i * 13) % 35) - 17,
      color: i % 3 === 0 ? "rgba(168,85,247," : i % 3 === 1 ? "rgba(217,70,239," : "rgba(192,132,252,",
    })), []);

  if (!mounted) return <div className="fixed inset-0 pointer-events-none overflow-hidden" />;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `${p.color}0.18)`,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}0.12)`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX * 0.5, 0],
            opacity: [0.06, 0.18, 0.06],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
