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
 *  Priority: owner > admin > moderator > helper > verified > user
 * ═══════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import { useState } from "react";

export type AvatarType = "user" | "verified" | "helper" | "moderator" | "admin" | "owner";

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
  if (role === "owner")     return "owner";
  if (role === "admin")     return "admin";
  if (role === "moderator") return "moderator";
  if (role === "helper")    return "helper";
  if (verified)             return "verified";
  return "user";
}

/* ── Size presets ────────────────────────────────────────────────── */
const SZ_CLS: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs:  "h-5 w-5",
  sm:  "h-7 w-7",
  md:  "h-9 w-9",
  lg:  "h-11 w-11",
  xl:  "h-16 w-16",
  "2xl": "h-20 w-20",
};

const SZ_PX: Record<NonNullable<UserAvatarProps["size"]>, number> = {
  xs:   40,
  sm:   56,
  md:   72,
  lg:   88,
  xl:  128,
  "2xl": 224,
};

/* ── Image paths ─────────────────────────────────────────────────── */
const AVATAR_SRC: Record<AvatarType, string> = {
  owner:     "/avatars/owner.webp",
  user:      "/avatars/user.webp",
  verified:  "/avatars/verified.webp",
  helper:    "/avatars/helper.webp",
  moderator: "/avatars/moderator.webp",
  admin:     "/avatars/admin.webp",
};

/* ── Fallback gradients (SVG mode) ──────────────────────────────── */
const GRAD: Record<AvatarType, string> = {
  owner:     "linear-gradient(145deg, #fbbf24 0%, #d97706 50%, #92400e 100%)",
  user:      "linear-gradient(145deg, #3f3f46 0%, #18181b 100%)",
  verified:  "linear-gradient(145deg, #0f766e 0%, #042f2e 100%)",
  helper:    "linear-gradient(145deg, #10b981 0%, #064e3b 100%)",
  moderator: "linear-gradient(145deg, #2563eb 0%, #1e1b4b 100%)",
  admin:     "linear-gradient(145deg, #7c3aed 0%, #4c1d95 100%)",
};

/* ── Shimmer gradient for owner (sweeps across on animation) ─── */
const OWNER_SHIMMER =
  "linear-gradient(90deg, #f59e0b 0%, #fbbf24 25%, #fef3c7 50%, #fbbf24 75%, #f59e0b 100%)";

/* ── Glow ring ──────────────────────────────────────────────────── */
// Owner ring is handled by CSS animation (animate-owner-glow) — static fallback below
const GLOW: Record<AvatarType, string> = {
  owner:     "0 0 0 2.5px rgba(245,158,11,0.90), 0 0 24px rgba(245,158,11,0.60), 0 0 48px rgba(245,158,11,0.25)",
  user:      "0 0 0 2px rgba(161,161,170,0.28)",
  verified:  "0 0 0 2px rgba(13,148,136,0.55),  0 0 14px rgba(13,148,136,0.28)",
  helper:    "0 0 0 2px rgba(16,185,129,0.55),  0 0 14px rgba(16,185,129,0.28)",
  moderator: "0 0 0 2px rgba(37,99,235,0.55),   0 0 14px rgba(37,99,235,0.28)",
  admin:     "0 0 0 2px rgba(124,58,237,0.70),   0 0 18px rgba(124,58,237,0.38)",
};

/* ══════════════════════════════════════════════════════════════════
 *  FALLBACK RANK ICONS — only shown when image is missing
 * ══════════════════════════════════════════════════════════════════ */

function IconOwner() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      {/* Crown body */}
      <path
        d="M6 30V26L11 14L20 22L29 14L34 26V30Z"
        fill="white" fillOpacity="0.92" strokeLinejoin="round"
      />
      {/* Base bar */}
      <rect x="6" y="30" width="28" height="4.5" rx="1.5" fill="white" fillOpacity="0.88"/>
      {/* Gems */}
      <circle cx="11" cy="27.5" r="2.5" fill="white" fillOpacity="0.35"/>
      <circle cx="20" cy="23"   r="2.8" fill="white" fillOpacity="0.55"/>
      <circle cx="29" cy="27.5" r="2.5" fill="white" fillOpacity="0.35"/>
      {/* Sparkle left */}
      <path d="M4 11 L5.2 14 L8 13" stroke="white" strokeOpacity="0.60" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Sparkle right */}
      <path d="M36 11 L34.8 14 L32 13" stroke="white" strokeOpacity="0.60" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Top star */}
      <path d="M20 4 L21 8 L25 8 L22 11 L23 15 L20 12 L17 15 L18 11 L15 8 L19 8 Z"
        fill="white" fillOpacity="0.80"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M20 5L33.5 12.5V27.5L20 35L6.5 27.5V12.5Z" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.40" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 13L27 20L20 27L13 20Z" fill="white" fillOpacity="0.72"/>
      <line x1="20" y1="13" x2="27" y2="20" stroke="white" strokeOpacity="0.20" strokeWidth="0.5"/>
      <line x1="20" y1="13" x2="13" y2="20" stroke="white" strokeOpacity="0.12" strokeWidth="0.5"/>
    </svg>
  );
}

function IconVerified() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M20 4L36 20L20 36L4 20Z" fill="white" fillOpacity="0.07" stroke="white" strokeOpacity="0.42" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 11L28 20L20 29L12 20Z" fill="white" fillOpacity="0.12"/>
      <path d="M12 21L17.5 27L28 14" stroke="white" strokeOpacity="0.92" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHelper() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <line x1="8" y1="32" x2="23" y2="17" stroke="white" strokeOpacity="0.82" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="28" cy="12" r="9" fill="white" fillOpacity="0.82"/>
      <ellipse cx="28" cy="11" rx="3.5" ry="5" fill="white" fillOpacity="0.15"/>
      <path d="M22 8 C24 6 30 6 33 9" stroke="white" strokeOpacity="0.30" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function IconModerator() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M20 4L34 9V22C34 30 20 37 20 37C20 37 6 30 6 22V9Z" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.42" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M23 11L15 23H21L17 31L26 19H20Z" fill="white" fillOpacity="0.88"/>
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M5 30V19L13.5 24.5L20 7L26.5 24.5L35 19V30Z" fill="white" fillOpacity="0.88" strokeLinejoin="round"/>
      <rect x="5" y="30" width="30" height="5" rx="1.5" fill="white" fillOpacity="0.88"/>
      <circle cx="13" cy="26.5" r="2.8" fill="white" fillOpacity="0.40"/>
      <circle cx="20" cy="13"   r="2.8" fill="white" fillOpacity="0.40"/>
      <circle cx="27" cy="26.5" r="2.8" fill="white" fillOpacity="0.40"/>
      <path d="M17 9 C18.5 7 21.5 7 23 9" stroke="white" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function RankIcon({ type }: { type: AvatarType }) {
  switch (type) {
    case "owner":     return <IconOwner />;
    case "user":      return <IconUser />;
    case "verified":  return <IconVerified />;
    case "helper":    return <IconHelper />;
    case "moderator": return <IconModerator />;
    case "admin":     return <IconAdmin />;
  }
}

/* ══════════════════════════════════════════════════════════════════
 *  UserAvatar — main export
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
  const isOwner = type === "owner";

  // Crown badge offset scales with avatar size
  const crownSz: Record<NonNullable<UserAvatarProps["size"]>, string> = {
    xs:  "h-3 w-3 -top-1   -right-1",
    sm:  "h-3.5 w-3.5 -top-1   -right-1",
    md:  "h-4 w-4 -top-1.5 -right-1.5",
    lg:  "h-5 w-5 -top-1.5 -right-1.5",
    xl:  "h-6 w-6 -top-2   -right-2",
    "2xl": "h-7 w-7 -top-2   -right-2",
  };

  return (
    <div className={`relative shrink-0 ${SZ_CLS[size]} ${className}`} aria-hidden>

      {/* Outer animated gold ring for Owner */}
      {isOwner && (
        <div
          className="absolute inset-[-3px] rounded-full"
          style={{
            background: OWNER_SHIMMER,
            backgroundSize: "200% auto",
            animation: "mj-owner-shimmer 3.5s linear infinite, mj-owner-glow-pulse 2.8s ease-in-out infinite",
            borderRadius: "50%",
          }}
        />
      )}

      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          boxShadow: isOwner ? undefined : GLOW[type],
          zIndex: 1,
        }}
      >
        {imgErr ? (
          <div className="w-full h-full" style={{ background: GRAD[type] }}>
            <RankIcon type={type} />
          </div>
        ) : (
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

      {/* Owner premium crown overlay badge */}
      {isOwner && (
        <div
          className={`pointer-events-none absolute flex items-center justify-center rounded-full ${crownSz[size]}`}
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            border: "1.5px solid rgba(251,191,36,0.8)",
            boxShadow: "0 0 10px rgba(245,158,11,0.7), 0 0 20px rgba(245,158,11,0.3)",
            zIndex: 2,
            animation: "mj-crown-float 3s ease-in-out infinite",
          }}
        >
          <svg viewBox="0 0 10 10" fill="none" className="h-[60%] w-[60%]">
            <path d="M1.5 7.5V6L3 3L5 5L7 3L8.5 6V7.5Z" fill="white" fillOpacity="0.97"/>
            <rect x="1.5" y="7.5" width="7" height="1.2" rx="0.4" fill="white" fillOpacity="0.97"/>
          </svg>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  RoleBadgeChip — premium role badge, used inline in any context
 *
 *  Owner:     animated gold shimmer ring + crown icon
 *  Admin:     purple solid
 *  Moderator: blue
 *  Helper:    green
 *  User:      neutral (hidden by default)
 * ══════════════════════════════════════════════════════════════════ */
export function RoleBadgeChip({
  role,
  className = "",
  showUser = false,
}: {
  role: string | null;
  className?: string;
  showUser?: boolean;
}) {
  if (!role) return null;
  if (role === "user" && !showUser) return null;

  const config: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
    owner: {
      label: "Owner",
      cls: "border-amber-400/50 text-amber-100 font-black",
      icon: (
        <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5 shrink-0">
          <path d="M1.5 7.5V6L3 3L5 5L7 3L8.5 6V7.5Z" fill="currentColor" fillOpacity="0.97"/>
          <rect x="1.5" y="7.5" width="7" height="1.3" rx="0.4" fill="currentColor" fillOpacity="0.97"/>
        </svg>
      ),
    },
    admin:     { label: "Admin",     cls: "border-purple-400/30 bg-purple-500/15 text-purple-200" },
    moderator: { label: "Mod",       cls: "border-blue-400/25   bg-blue-500/10   text-blue-200" },
    helper:    { label: "Helper",    cls: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" },
    user:      { label: "User",      cls: "border-white/10      bg-white/5        text-zinc-400" },
  };

  const cfg = config[role];
  if (!cfg) return null;

  // Owner gets the special shimmer treatment
  if (role === "owner") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${cfg.cls} ${className}`}
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.22) 0%, rgba(251,191,36,0.32) 50%, rgba(245,158,11,0.22) 100%)",
          backgroundSize: "200% auto",
          animation: "mj-owner-shimmer 3.5s linear infinite",
        }}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.cls} ${className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  RoleBadgeFull — bigger role badge with emoji icon prefix
 *  Used in admin pages for prominent role display
 * ══════════════════════════════════════════════════════════════════ */
export function RoleBadgeFull({
  role,
  className = "",
}: {
  role: string | null;
  className?: string;
}) {
  const config: Record<string, { label: string; icon: string; cls: string }> = {
    owner:     { label: "Owner",     icon: "👑", cls: "border-amber-400/40  bg-amber-500/10  text-amber-200" },
    admin:     { label: "Admin",     icon: "🛡",  cls: "border-purple-400/30 bg-purple-500/10 text-purple-200" },
    moderator: { label: "Moderator", icon: "🔷",  cls: "border-blue-400/25   bg-blue-500/10   text-blue-200" },
    helper:    { label: "Helper",    icon: "🟢",  cls: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" },
    user:      { label: "User",      icon: "⚪",  cls: "border-white/10      bg-white/5        text-zinc-400" },
  };

  const cfg = config[role ?? "user"] ?? config["user"];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.cls} ${className}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  VerifiedBadge — inline "✓ Verified" chip
 * ══════════════════════════════════════════════════════════════════ */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 ${className}`}>
      <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5 shrink-0">
        <path d="M1.5 5.5L4 8L8.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Verified
    </span>
  );
}
