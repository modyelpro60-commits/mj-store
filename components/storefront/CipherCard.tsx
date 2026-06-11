"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

/* ── Types ──────────────────────────────────────────── */

type CipherCardProps = {
  product: {
    id: number | string;
    name: string;
    description: string;
    short_description?: string | null;
    price: number | string;
    original_price?: number | string | null;
    image: string;
    features?: string | string[] | null;
    sales_count?: number | string | null;
    is_active?: boolean;
    category?: string | null;
  };
  size?: "dominant" | "support";
};

/* ── Helpers ────────────────────────────────────────── */

function toNumber(v: number | string | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function calcDiscount(price: number, orig: number): number {
  if (orig > price && price > 0) return Math.round((1 - price / orig) * 100);
  return 0;
}

/* ── CipherCard ─────────────────────────────────────── */

export default function CipherCard({ product, size = "support" }: CipherCardProps) {
  const [hovered, setHovered] = useState(false);

  const price       = useMemo(() => toNumber(product.price),          [product.price]);
  const origPrice   = useMemo(() => toNumber(product.original_price), [product.original_price]);
  const discountPct = useMemo(() => calcDiscount(price, origPrice),   [price, origPrice]);
  const sales       = useMemo(() => toNumber(product.sales_count),    [product.sales_count]);

  const router = useRouter();
  const { accessToken, isLoading } = useAuth();
  const { add } = useCart();
  const { translate } = useLanguage();
  const loggedIn = !isLoading && !!accessToken;
  const [adding, setAdding] = useState(false);
  const [added,  setAdded]  = useState(false);
  const [buying, setBuying] = useState(false);

  function requireLogin(): boolean {
    if (!loggedIn) {
      try { localStorage.setItem("mj_pending_product", String(product.id)); } catch {}
      toast(translate("product.toast.loginToCart"), { description: translate("product.toast.loginToCartDesc") });
      router.push("/register");
      return false;
    }
    return true;
  }

  async function handleAdd() {
    if (adding || buying) return;
    if (!requireLogin()) return;
    setAdding(true);
    const ok = await add(product.id);
    setAdding(false);
    if (ok) {
      setAdded(true);
      toast.success(translate("product.toast.addedToCart"));
      setTimeout(() => setAdded(false), 1600);
    } else {
      toast.error(translate("product.toast.addFailed"));
    }
  }

  async function handleBuyNow() {
    if (adding || buying) return;
    if (!requireLogin()) return;
    setBuying(true);
    const ok = await add(product.id);
    setBuying(false);
    if (ok) router.push("/cart");
    else toast.error(translate("product.toast.addFailed"));
  }

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
        y: hovered ? -8 : 0,
        boxShadow: hovered
          ? "0 0 52px rgba(168,85,247,0.34), 0 30px 70px rgba(0,0,0,0.78), 0 0 0 1px rgba(168,85,247,0.40)"
          : "0 6px 26px rgba(0,0,0,0.55), 0 0 0 1px rgba(168,85,247,0.12)",
      }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div
        className="group relative cut-corner flex flex-col h-full overflow-hidden"
        style={{ background: "linear-gradient(162deg, #0C0C22 0%, #08081A 60%, #060612 100%)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Top edge highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-[70%] bg-gradient-to-r from-white/25 via-purple-400/20 to-transparent z-10"
        />

        {/* Glass sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 20%, transparent 44%)",
          }}
        />

        {/* ══ PERIMETER CHARGE ══════════════════════════════════════ */}
        <motion.span aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-full bg-purple-400 z-20"
          style={{ transformOrigin: "left" }}
          initial={{ scaleX: 0, opacity: 0.28 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28 }}
        />
        <motion.span aria-hidden
          className="pointer-events-none absolute right-0 top-[24px] w-px bg-purple-400 z-20"
          style={{ height: "calc(100% - 24px)", transformOrigin: "top" }}
          initial={{ scaleY: 0, opacity: 0.28 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.22 : 0 }}
        />
        <motion.span aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-px w-full bg-fuchsia-400 z-20"
          style={{ transformOrigin: "right" }}
          initial={{ scaleX: 0, opacity: 0.28 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.44 : 0 }}
        />
        <motion.span aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 w-px h-full bg-fuchsia-400 z-20"
          style={{ transformOrigin: "bottom" }}
          initial={{ scaleY: 0, opacity: 0.28 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.66 : 0 }}
        />

        {/* Cut-corner accent glow */}
        <motion.div aria-hidden
          className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full z-10"
          style={{ background: "radial-gradient(circle, rgba(217,70,239,0.30) 0%, transparent 70%)" }}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: hovered ? 0.9 : 0.25 }}
          transition={{ duration: 0.35 }}
        />

        {/* Ambient purple glow */}
        <motion.div aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(circle at 30% 0%, rgba(168,85,247,0.10) 0%, transparent 60%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />

        {/* ══ CARD CONTENT (link) ════════════════════════════════════ */}
        <Link href={`/product/${product.id}`} className="relative flex flex-col flex-1">

          {/* ── Product image — edge-to-edge, large ── */}
          <div
            className="relative aspect-[4/3] w-full overflow-hidden border-b border-void-line transition-colors duration-300 group-hover:border-purple-500/30"
            style={{
              background:
                "radial-gradient(circle at 50% 38%, rgba(124,58,237,0.16) 0%, rgba(10,10,28,0) 68%), linear-gradient(180deg, #0B0B1E 0%, #070714 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 -22px 44px rgba(0,0,0,0.32)",
            }}
          >
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="mono-label text-text-muted">{translate("product.noImage")}</span>
              </div>
            )}

            {/* Bottom depth fade */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent"
            />

            {/* Discount badge — top-left overlay */}
            {discountPct > 0 && (
              <span
                className="absolute top-3 left-3 mono-label text-red-300 border border-red-500/35 bg-red-500/[0.15] backdrop-blur-sm px-2 py-[3px]"
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                -{discountPct}% OFF
              </span>
            )}

            {/* Sold badge — top-right overlay */}
            {sales > 0 && (
              <span
                className="absolute top-3 right-3 mono-label text-[10px] flex items-center gap-1 px-2 py-[3px] border backdrop-blur-sm"
                style={{
                  borderRadius: "var(--radius-badge)",
                  color: "#A3FF47",
                  borderColor: "rgba(163,255,71,0.30)",
                  background: "rgba(163,255,71,0.10)",
                }}
              >
                {sales} {translate("product.sold")}
              </span>
            )}

            {/* Scan line on hover */}
            {hovered && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent animate-scan-line pointer-events-none"
              />
            )}
          </div>

          {/* ── Content below image ── */}
          <div className="flex flex-col flex-1 px-4 pt-3.5 pb-2">

            {/* Status LED + category badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative shrink-0 grid place-items-center">
                <span className="h-[7px] w-[7px] rounded-full bg-state-success animate-signal-pulse" />
                <span
                  aria-hidden
                  className="absolute h-[7px] w-[7px] rounded-full bg-state-success blur-[4px] opacity-70"
                />
              </span>
              {product.category ? (
                <span
                  className="mono-label text-purple-200/90 border border-purple-500/25 bg-purple-500/[0.08] px-1.5 py-[3px] truncate max-w-[140px]"
                  style={{ borderRadius: "var(--radius-badge)" }}
                >
                  {product.category}
                </span>
              ) : null}
            </div>

            {/* Product name */}
            <h3
              className={[
                "mt-2.5 font-black tracking-tight text-text-primary leading-tight line-clamp-2",
                "transition-colors duration-200 group-hover:text-white",
                size === "dominant" ? "text-xl" : "text-lg",
              ].join(" ")}
            >
              {product.name}
            </h3>

            {/* Price block — pinned to bottom */}
            <div className="relative mt-auto pt-3">
              {/* Divider */}
              <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-void-line to-transparent"
              />

              {/* Original price (strikethrough) */}
              {discountPct > 0 && (
                <p className="text-xs font-bold text-zinc-600 line-through tabular-nums leading-none mb-1">
                  {origPrice.toLocaleString("en")} EGP
                </p>
              )}

              {/* Current price */}
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className="data-readout font-black leading-none bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent"
                  style={{
                    fontSize: size === "dominant" ? "2.1rem" : "1.85rem",
                    filter: "drop-shadow(0 0 16px rgba(168,85,247,0.40))",
                  }}
                >
                  {price.toLocaleString("en")}
                </span>
                <span className="mono-label text-purple-300">EGP</span>
              </div>
            </div>

          </div>
        </Link>

        {/* ══ ACQUIRE BUTTONS ══════════════════════════════════════ */}
        <div className="px-4 pb-4 pt-3 space-y-2">

          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={adding || buying}
            className="group/btn relative flex w-full h-11 items-center justify-center gap-2 overflow-hidden mono-label tracking-[0.18em] text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 transition-all duration-200 shadow-[0_0_20px_rgba(168,85,247,0.30)] hover:shadow-[0_0_38px_rgba(168,85,247,0.55)] disabled:opacity-75"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
            />
            {buying
              ? <Loader2 className="relative h-4 w-4 animate-spin" />
              : <span className="relative">{translate("product.buyNowBtn")}</span>
            }
            {!buying && (
              <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
            )}
          </button>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || buying}
            className="flex w-full h-10 items-center justify-center gap-2 mono-label tracking-[0.18em] border border-purple-500/25 bg-purple-500/[0.06] text-purple-200 hover:bg-purple-500/[0.12] hover:text-white hover:border-purple-400/40 transition-all duration-200 disabled:opacity-75"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {added  ? <><Check       className="h-4 w-4" />{translate("product.cart.added")}</> :
             adding ? <><Loader2     className="h-4 w-4 animate-spin" />{translate("product.cart.adding")}</> :
                      <><ShoppingBag className="h-3.5 w-3.5" />{translate("product.addToCart")}</>}
          </button>

        </div>
      </div>
    </motion.div>
  );
}
