"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = "h-[140px]", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className={`animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5 ${className}`}
        />
      ))}
    </>
  );
}
