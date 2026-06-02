"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  suffix = "",
  duration = 1.1,
  className = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const spring = useSpring(0, {
    stiffness: 90,
    damping: 18,
    mass: 1,
  });
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}
