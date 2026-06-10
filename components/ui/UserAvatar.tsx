"use client";

/* ═══════════════════════════════════════════════════════════════════
 *  UserAvatar — MJ Store Gaming Rank Avatar System
 *
 *  IMAGE MODE  (when /public/avatars/<type>.webp exists)
 *    → Renders the AI-generated character artwork
 *    → Glow ring applied via box-shadow on the outer wrapper
 *
 *  FALLBACK MODE  (when image is missing / errors)
 *    → Renders the geometric rank badge SVG
 *    → Same glow ring
 *
 *  Drop files into /public/avatars/ and the component auto-upgrades.
 *  No code change needed.
 *
 *  Priority: admin > moderator > helper > verified > user
 * ═══════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import { useState } from "react";

export type AvatarType = "user" | "verified" | "helper" | "moderator" | "admin";

export interface UserAvatarProps {
  role?: string | null;
  verified?: boolean | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

/* ── Rank resolution ────────────────────────────────────────────── */
export function resolveAvatarType(
  role?: string | null,
  verified?: boolean | null
): AvatarType {
  if (role === "admin")     return "admin";
  if (role === "moderator") return "moderator";
  if (role === "helper")    return "helper";
  if (verified)             return "verified";
  return "user";
}

/* ── Size presets ────────────────────────────────────────────────── */
const SZ_CLS: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs:  "h-5 w-5",     //  20 px — notification dots, tiny chips
  sm:  "h-7 w-7",     //  28 px — navbar button, chat bubbles
  md:  "h-9 w-9",     //  36 px — chat room list, order rows
  lg:  "h-11 w-11",   //  44 px — dropdown header, admin sidebar, user cards
  xl:  "h-16 w-16",   //  64 px — (kept for back-compat)
  "2xl": "h-20 w-20", //  80 px — account hero mobile baseline
};

/* Numeric px — used for next/image (2× retina) */
const SZ_PX: Record<NonNullable<UserAvatarProps["size"]>, number> = {
  xs:   40,
  sm:   56,
  md:   72,
  lg:   88,
  xl:  128,
  "2xl": 224, // 112px × 2 — covers the largest rendered desktop size
};

/* ── Image paths ─────────────────────────────────────────────────── */
const AVATAR_SRC: Record<AvatarType, string> = {
  user:      "/avatars/user.webp",
  verified:  "/avatars/verified.webp",
  helper:    "/avatars/helper.webp",
  moderator: "/avatars/moderator.webp",
  admin:     "/avatars/admin.webp",
};

/* ── Fallback gradients (SVG mode) ──────────────────────────────── */
const GRAD: Record<AvatarType, string> = {
  user:      "linear-gradient(145deg, #3f3f46 0%, #18181b 100%)",
  verified:  "linear-gradient(145deg, #0f766e 0%, #042f2e 100%)",
  helper:    "linear-gradient(145deg, #9333ea 0%, #4c1d95 100%)",
  moderator: "linear-gradient(145deg, #2563eb 0%, #1e1b4b 100%)",
  admin:     "linear-gradient(145deg, #d97706 0%, #451a03 100%)",
};

/* ── Glow ring — adapts to both image & SVG mode ────────────────── */
const GLOW: Record<AvatarType, string> = {
  user:      "0 0 0 2px rgba(161,161,170,0.28)",
  verified:  "0 0 0 2px rgba(13,148,136,0.55),  0 0 14px rgba(13,148,136,0.28)",
  helper:    "0 0 0 2px rgba(147,51,234,0.55),  0 0 14px rgba(147,51,234,0.28)",
  moderator: "0 0 0 2px rgba(37,99,235,0.55),   0 0 14px rgba(37,99,235,0.28)",
  admin:     "0 0 0 2px rgba(217,119,6,0.70),   0 0 18px rgba(217,119,6,0.38)",
};

/* ══════════════════════════════════════════════════════════════════
 *  FALLBACK RANK ICONS — only shown when image is missing
 * ══════════════════════════════════════════════════════════════════ */

function IconUser() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M20 5L33.5 12.5V27.5L20 35L6.5 27.5V12.5Z"
        fill="white" fillOpacity="0.06"
        stroke="white" strokeOpacity="0.40" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M20 13L27 20L20 27L13 20Z" fill="white" fillOpacity="0.72"/>
      <line x1="20" y1="13" x2="27" y2="20" stroke="white" strokeOpacity="0.20" strokeWidth="0.5"/>
      <line x1="20" y1="13" x2="13" y2="20" stroke="white" strokeOpacity="0.12" strokeWidth="0.5"/>
    </svg>
  );
}

function IconVerified() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M20 4L36 20L20 36L4 20Z"
        fill="white" fillOpacity="0.07"
        stroke="white" strokeOpacity="0.42" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M20 11L28 20L20 29L12 20Z" fill="white" fillOpacity="0.12"/>
      <path
        d="M12 21L17.5 27L28 14"
        stroke="white" strokeOpacity="0.92" strokeWidth="3.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHelper() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <line x1="8" y1="32" x2="23" y2="17"
        stroke="white" strokeOpacity="0.82" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="28" cy="12" r="9" fill="white" fillOpacity="0.82"/>
      <ellipse cx="28" cy="11" rx="3.5" ry="5" fill="white" fillOpacity="0.15"/>
      <path
        d="M22 8 C24 6 30 6 33 9"
        stroke="white" strokeOpacity="0.30" strokeWidth="1.5"
        strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function IconModerator() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M20 4L34 9V22C34 30 20 37 20 37C20 37 6 30 6 22V9Z"
        fill="white" fillOpacity="0.08"
        stroke="white" strokeOpacity="0.42" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M23 11L15 23H21L17 31L26 19H20Z" fill="white" fillOpacity="0.88"/>
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M5 30V19L13.5 24.5L20 7L26.5 24.5L35 19V30Z"
        fill="white" fillOpacity="0.88" strokeLinejoin="round"
      />
      <rect x="5" y="30" width="30" height="5" rx="1.5" fill="white" fillOpacity="0.88"/>
      <circle cx="13" cy="26.5" r="2.8" fill="white" fillOpacity="0.40"/>
      <circle cx="20" cy="13"   r="2.8" fill="white" fillOpacity="0.40"/>
      <circle cx="27" cy="26.5" r="2.8" fill="white" fillOpacity="0.40"/>
      <path
        d="M17 9 C18.5 7 21.5 7 23 9"
        stroke="white" strokeOpacity="0.25" strokeWidth="1"
        strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function RankIcon({ type }: { type: AvatarType }) {
  switch (type) {
    case "user":      return <IconUser />;
    case "verified":  return <IconVerified />;
    case "helper":    return <IconHelper />;
    case "moderator": return <IconModerator />;
    case "admin":     return <IconAdmin />;
  }
}

/* ══════════════════════════════════════════════════════════════════
 *  UserAvatar — main export
 *
 *  Renders the character image when available; falls back to the
 *  geometric rank badge if the file is missing or fails to load.
 * ══════════════════════════════════════════════════════════════════ */
export default function UserAvatar({
  role,
  verified,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const type   = resolveAvatarType(role, verified);
  const px     = SZ_PX[size];
  const [imgErr, setImgErr] = useState(false);

  return (
    /*
     * Outer div  — layout only (size + any extra className like ring / shadow).
     *              No inline style here so Tailwind ring/shadow classes work freely.
     * Inner div  — visual circle: gradient bg, overflow-hidden clip, rank GLOW ring.
     *              box-shadow is NOT clipped by overflow-hidden (CSS spec), so the
     *              rank glow shows outside the circle even with overflow:hidden.
     */
    <div
      className={`relative shrink-0 ${SZ_CLS[size]} ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ boxShadow: GLOW[type] }}
      >
        {imgErr ? (
          /* ── SVG fallback ── */
          <div className="w-full h-full" style={{ background: GRAD[type] }}>
            <RankIcon type={type} />
          </div>
        ) : (
          /* ── Character artwork ── */
          <Image
            src={AVATAR_SRC[type]}
            alt={type}
            width={px}
            height={px}
            className="w-full h-full object-cover object-top"
            onError={() => setImgErr(true)}
            priority={false}
            unoptimized={false}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  VerifiedBadge — inline "✓ Verified" chip
 * ══════════════════════════════════════════════════════════════════ */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 ${className}`}
    >
      <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5 shrink-0">
        <path
          d="M1.5 5.5L4 8L8.5 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  );
}
