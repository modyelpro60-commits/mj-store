"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect } from "react";

export default function MouseGlow() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const glowX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouse = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [handleMouse]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[1]"
      style={{
        left: glowX,
        top: glowY,
        width: 600,
        height: 600,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 60%)",
        borderRadius: "50%",
      }}
    />
  );
}
