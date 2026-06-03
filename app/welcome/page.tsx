"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

function clampMode(mode: string | null) {
  if (mode === "register") return "register";
  if (mode === "login") return "login";
  return "register";
}

export default function WelcomePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [debugStay, setDebugStay] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Parse query params without useSearchParams() (prevents Suspense/prerender bailout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = clampMode(params.get("mode"));
    setMode(m);
    setDebugStay(params.get("debugStay") === "1" || params.get("debug") === "1");
  }, []);

  const title = mode === "login" ? "Welcome Back" : "Welcome to MJ Store";
  const subtitle =
    mode === "login"
      ? "Great to see you again."
      : "Your account has been created successfully.";
  const statusText = mode === "login" ? "Loading your experience…" : "Entering your experience…";

  // Progress fill must complete in exactly 2 seconds.
  const progressStartDelaySec = 0.9;
  const progressDurationMs = 2000;

  // Fade out entire screen shortly before redirect.
  const redirectDelayMs = progressStartDelaySec * 1000 + progressDurationMs;
  const exitDelayMs = redirectDelayMs - 280;

  useEffect(() => {
    if (debugStay) return;

    const exitAt = window.setTimeout(() => setIsExiting(true), Math.round(exitDelayMs));
    const redirectAt = window.setTimeout(() => router.replace("/"), Math.round(redirectDelayMs));

    return () => {
      window.clearTimeout(exitAt);
      window.clearTimeout(redirectAt);
    };
  }, [router, exitDelayMs, redirectDelayMs, debugStay]);

  return (
    <motion.main
      className="relative min-h-screen overflow-hidden bg-black text-white"
      initial={{ opacity: 1 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.18) 0%, rgba(0,0,0,0.98) 72%)",
        }}
      />

      {/* Keep the existing dark neon background */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-24 rounded-full bg-purple-500/10 blur-[52px]"
        style={{ width: "clamp(520px, 58vw, 980px)", height: "clamp(520px, 58vw, 980px)" }}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.35, scale: 1 }
            : { opacity: [0.22, 0.48, 0.22], y: [0, -14, 0], scale: [0.98, 1.02, 0.98] }
        }
        transition={
          reducedMotion ? { duration: 1 } : { duration: 6.5, ease: "easeInOut", repeat: Infinity }
        }
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-[12%] left-[-10%] rounded-full bg-purple-500/10 blur-[56px]"
        style={{ width: "clamp(420px, 50vw, 820px)", height: "clamp(420px, 50vw, 820px)" }}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.28, scale: 1 }
            : { opacity: [0.12, 0.36, 0.12], x: [0, 22, 0], y: [0, -10, 0] }
        }
        transition={
          reducedMotion ? { duration: 1 } : { duration: 7.8, ease: "easeInOut", repeat: Infinity }
        }
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-18%] right-[-12%] rounded-full bg-fuchsia-500/10 blur-[62px]"
        style={{ width: "clamp(480px, 55vw, 860px)", height: "clamp(480px, 55vw, 860px)" }}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.22, scale: 1 }
            : { opacity: [0.12, 0.34, 0.12], x: [0, -28, 0], y: [0, 12, 0] }
        }
        transition={
          reducedMotion ? { duration: 1 } : { duration: 9.2, ease: "easeInOut", repeat: Infinity }
        }
      />

      {/* Centered layout */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-5xl text-center">
          <div className="flex flex-col items-center">
            {/* Text-based brand lockup (MJ / STORE) */}
            <div className="leading-none text-center">
              <div className="font-black text-[64px] lg:text-[96px] text-white">MJ</div>
              <div className="font-black text-[64px] lg:text-[96px] bg-gradient-to-b from-purple-300 via-purple-400 to-purple-500 text-transparent bg-clip-text drop-shadow-[0_0_14px_rgba(168,85,247,0.28)]">
                STORE
              </div>
            </div>

            <h1 className="mt-6 font-black tracking-tight text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl">
              {title}
            </h1>

            <p className="mt-3 text-zinc-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              {subtitle}
            </p>

            {/* Progress */}
            <div className="mt-10 flex flex-col items-center">
              <div
                className={`w-[280px] sm:w-[380px] lg:w-[550px] 2xl:w-[650px] rounded-full border border-purple-400/25 bg-white/5 p-1`}
                aria-label="Progress"
              >
                <div className="relative h-[14px] overflow-hidden rounded-full">
                  <motion.div
                    aria-hidden="true"
                    className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-purple-500/90 via-purple-400/80 to-purple-300/80 shadow-[0_0_24px_rgba(168,85,247,0.55)]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 2,
                      ease: "linear",
                      delay: reducedMotion ? 0 : progressStartDelaySec,
                    }}
                  />

                  {!reducedMotion ? (
                    <motion.div
                      aria-hidden="true"
                      className="absolute top-0 bottom-0 w-[46%] rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0"
                      initial={{ x: "-120%", opacity: 0 }}
                      animate={{ opacity: 1, x: "220%" }}
                      transition={{
                        duration: 2,
                        ease: "linear",
                        delay: reducedMotion ? 0 : progressStartDelaySec,
                      }}
                      style={{ mixBlendMode: "screen" }}
                    />
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-sm sm:text-base font-semibold text-purple-200">{statusText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen fade out is handled by main opacity + isExiting */}
      <div className="sr-only" aria-live="polite">
        {statusText}
      </div>
    </motion.main>
  );
}
