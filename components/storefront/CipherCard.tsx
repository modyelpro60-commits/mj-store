"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── Types ──────────────────────────────────────────── */

type CipherCardProps = {
  product: {
    id: number | string;
    name: string;
    description: string;
    price: number | string;
    image: string;
    features?: string | string[] | null;
    sales_count?: number | string | null;
  };
  size?: "dominant" | "support";
};

/* ── Helpers ────────────────────────────────────────── */

function toNumber(v: number | string | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseFeatures(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ── CipherCard ─────────────────────────────────────── */

export default function CipherCard({ product, size = "support" }: CipherCardProps) {
  const [hovered, setHovered] = useState(false);
  const price = useMemo(() => toNumber(product.price), [product.price]);
  const tags  = useMemo(() => parseFeatures(product.features).slice(0, 2), [product.features]);

  return (
    /*
     * Two-layer structure:
     *   outer motion.div  — no clip-path, owns the lift + glow shadow
     *   inner div         — cut-corner clip-path, owns charge spans + content
     * This keeps box-shadow visible (clip-path would clip it away).
     */
    <motion.div
      className="relative h-full"
      animate={{
        y: hovered ? -6 : 0,
        boxShadow: hovered
          ? "0 0 40px rgba(168,85,247,0.28), 0 24px 60px rgba(0,0,0,0.72)"
          : "0 4px 24px rgba(0,0,0,0.50), 0 0 0 1px rgba(168,85,247,0.07)",
      }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div
        className="group relative cut-corner bg-void-surface flex flex-col h-full overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ══ PERIMETER CHARGE ═══════════════════════════════════
         *  Four spans trace the cut-corner perimeter clockwise.
         *  Each span starts at scaleX/Y 0 and expands to 1 with
         *  a 0.22s stagger, creating a "charge running around
         *  the edge" effect. clip-path naturally clips the top
         *  and right spans at the cut corner.
         * ════════════════════════════════════════════════════════ */}

        {/* Top — left to right */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-full bg-purple-400"
          style={{ transformOrigin: "left" }}
          initial={{ scaleX: 0, opacity: 0.18 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.18 }}
          transition={{ duration: 0.28, delay: hovered ? 0 : 0 }}
        />

        {/* Right — top to bottom (starts at 24px to clear the cut) */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-0 top-[24px] w-px bg-purple-400"
          style={{ height: "calc(100% - 24px)", transformOrigin: "top" }}
          initial={{ scaleY: 0, opacity: 0.18 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.18 }}
          transition={{ duration: 0.28, delay: hovered ? 0.22 : 0 }}
        />

        {/* Bottom — right to left */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-px w-full bg-fuchsia-400"
          style={{ transformOrigin: "right" }}
          initial={{ scaleX: 0, opacity: 0.18 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.18 }}
          transition={{ duration: 0.28, delay: hovered ? 0.44 : 0 }}
        />

        {/* Left — bottom to top */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 w-px h-full bg-fuchsia-400"
          style={{ transformOrigin: "bottom" }}
          initial={{ scaleY: 0, opacity: 0.18 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.18 }}
          transition={{ duration: 0.28, delay: hovered ? 0.66 : 0 }}
        />

        {/* Ambient purple glow — fades in on hover */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 0%, rgba(168,85,247,0.07) 0%, transparent 65%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />

        {/* ══ CARD CONTENT (link) ═════════════════════════════════ */}
        <Link href={`/product/${product.id}`} className="flex flex-col flex-1 p-5 gap-4">

          {/* ── Status LED + Category tags ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status LED: pulsing green dot — availability signal */}
            <span
              aria-label="Available"
              className="h-[7px] w-[7px] rounded-full bg-state-success animate-signal-pulse shrink-0"
            />

            {tags.length > 0 ? (
              tags.map((tag, i) => (
                <span
                  key={i}
                  className="mono-label text-text-muted border border-void-line px-1.5 py-[3px] truncate max-w-[130px]"
                  style={{ borderRadius: "var(--radius-badge)" }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span
                className="mono-label text-text-muted border border-void-line px-1.5 py-[3px]"
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                DIGITAL
              </span>
            )}
          </div>

          {/* ── Product image ── */}
          <div
            className="relative aspect-video w-full overflow-hidden bg-void-elevated border border-void-line"
            style={{ borderRadius: "var(--radius-panel)" }}
          >
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-600 group-hover:scale-[1.06]"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="mono-label text-text-muted">NO IMAGE</span>
              </div>
            )}

            {/* Scan line — sweeps top-to-bottom on hover */}
            {hovered && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-scan-line pointer-events-none"
              />
            )}
          </div>

          {/* ── Name ── */}
          <h3
            className={`font-bold text-text-primary leading-tight line-clamp-2 ${
              size === "dominant" ? "text-xl" : "text-lg"
            }`}
          >
            {product.name}
          </h3>

          {/* ── Description ── */}
          <p className="text-sm text-text-secondary line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* ── Price ── */}
          <div>
            <p className="mono-label text-text-muted mb-1">UNIT COST</p>
            <div className="flex items-baseline gap-1.5">
              <span className="data-readout text-[1.6rem] font-bold text-text-primary leading-none">
                {price}
              </span>
              <span className="mono-label text-purple-300">EGP</span>
            </div>
          </div>
        </Link>

        {/* ══ ACQUIRE BUTTON ══════════════════════════════════════
         *  Separate link so it renders as <a>, not nested inside
         *  the content <a> above — keeps the HTML valid.
         * ════════════════════════════════════════════════════════ */}
        <div className="px-5 pb-5">
          <Link
            href={`/product/${product.id}`}
            className="
              flex w-full h-10 items-center justify-center
              mono-label tracking-[0.22em] text-white
              bg-gradient-to-r from-purple-600 to-fuchsia-600
              hover:from-purple-700 hover:to-fuchsia-700
              transition-all duration-200
              shadow-[0_0_20px_rgba(168,85,247,0.25)]
              hover:shadow-[0_0_35px_rgba(168,85,247,0.40)]
              group-hover:shadow-[0_0_30px_rgba(168,85,247,0.45)]
            "
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            ACQUIRE
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
