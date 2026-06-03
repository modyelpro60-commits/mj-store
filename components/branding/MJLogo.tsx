"use client";

import type { CSSProperties } from "react";

export type MJLogoSize = "sm" | "md" | "lg";

const SIZE_TO_PX: Record<MJLogoSize, { width: number; height: number; mjFont: number; storeFont: number }> = {
  sm: { width: 180, height: 72, mjFont: 56, storeFont: 18 },
  md: { width: 260, height: 98, mjFont: 76, storeFont: 22 },
  lg: { width: 360, height: 132, mjFont: 98, storeFont: 26 },
};

export default function MJLogo({
  size = "md",
  glow = true,
}: {
  size?: MJLogoSize;
  glow?: boolean;
}) {
  const cfg = SIZE_TO_PX[size];

  const neonPurple = "#a855f7";
  const white = "#ffffff";

  // IDs must be stable across renders for correct filter referencing.
  const filterId = glow ? "mjjGlow" : "none";

  const svgStyle: CSSProperties = {
    width: cfg.width,
    height: cfg.height,
    display: "block",
  };

  return (
    <svg
      viewBox="0 0 360 132"
      xmlns="http://www.w3.org/2000/svg"
      style={svgStyle}
      role="img"
      aria-label="MJ Store"
    >
      <defs>
        {glow ? (
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -7
              "
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}
      </defs>

      {/* MJ mark */}
      <g transform="translate(0,0)">
        {/* M (white) */}
        <path
          d="M38 110
             V34
             L74 110
             L110 34
             V110"
          fill="none"
          stroke={white}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* J (neon purple) */}
        <g filter={glow ? `url(#${filterId})` : undefined}>
          <path
            d="M212 34
               V94
               C212 116 238 124 255 110
               C265 102 268 88 268 72"
            fill="none"
            stroke={neonPurple}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Neon tail flare (subtle, still J-only) */}
          <path
            d="M212 34 V94"
            fill="none"
            stroke={neonPurple}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      </g>

      {/* STORE under it */}
      <text
        x="180"
        y="128"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        fontWeight="800"
        fontSize={cfg.storeFont}
        letterSpacing="4"
        fill="#E9D5FF"
      >
        STORE
      </text>
    </svg>
  );
}
