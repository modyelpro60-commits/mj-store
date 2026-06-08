"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";

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
  const sales = useMemo(() => toNumber(product.sales_count), [product.sales_count]);
  const tags  = useMemo(() => parseFeatures(product.features).slice(0, 2), [product.features]);

  const router = useRouter();
  const { accessToken, isLoading } = useAuth();
  const { add } = useCart();
  const loggedIn = !isLoading && !!accessToken;
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  function requireLogin(): boolean {
    if (!loggedIn) {
      // Remember the product so it's waiting in the cart after they register
      try { localStorage.setItem("mj_pending_product", String(product.id)); } catch {}
      toast("سجّل عشان تكمّل الشراء 🛍️", { description: "المنتج هيتحط في سلتك بعد التسجيل." });
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
      toast.success("تمت الإضافة إلى السلة 🛒");
      setTimeout(() => setAdded(false), 1600);
    } else {
      toast.error("تعذّر الإضافة، حاول مجدداً");
    }
  }

  async function handleBuyNow() {
    if (adding || buying) return;
    if (!requireLogin()) return;
    setBuying(true);
    const ok = await add(product.id);
    setBuying(false);
    if (ok) router.push("/cart");
    else toast.error("تعذّر الإضافة، حاول مجدداً");
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
        {/* Top edge highlight — always-on definition line */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-[70%] bg-gradient-to-r from-white/25 via-purple-400/20 to-transparent"
        />

        {/* Glass sheen — static premium reflection (cheap, no animation) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 20%, transparent 44%)",
          }}
        />

        {/* ══ PERIMETER CHARGE ═══════════════════════════════════
         *  Four spans trace the cut-corner perimeter clockwise.
         * ════════════════════════════════════════════════════════ */}

        {/* Top — left to right */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-full bg-purple-400"
          style={{ transformOrigin: "left" }}
          initial={{ scaleX: 0, opacity: 0.28 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28 }}
        />

        {/* Right — top to bottom (starts at 24px to clear the cut) */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-0 top-[24px] w-px bg-purple-400"
          style={{ height: "calc(100% - 24px)", transformOrigin: "top" }}
          initial={{ scaleY: 0, opacity: 0.28 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.22 : 0 }}
        />

        {/* Bottom — right to left */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-px w-full bg-fuchsia-400"
          style={{ transformOrigin: "right" }}
          initial={{ scaleX: 0, opacity: 0.28 }}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.44 : 0 }}
        />

        {/* Left — bottom to top */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 w-px h-full bg-fuchsia-400"
          style={{ transformOrigin: "bottom" }}
          initial={{ scaleY: 0, opacity: 0.28 }}
          animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0.28 }}
          transition={{ duration: 0.28, delay: hovered ? 0.66 : 0 }}
        />

        {/* Cut-corner accent glow (top-right) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(217,70,239,0.30) 0%, transparent 70%)" }}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: hovered ? 0.9 : 0.25 }}
          transition={{ duration: 0.35 }}
        />

        {/* Ambient purple glow — fades in on hover */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 0%, rgba(168,85,247,0.10) 0%, transparent 60%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />

        {/* ══ CARD CONTENT (link) ═════════════════════════════════ */}
        <Link href={`/product/${product.id}`} className="relative flex flex-col flex-1 p-5 gap-4">

          {/* ── Status LED + Category tags ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status LED: pulsing green dot with halo — availability signal */}
            <span className="relative shrink-0 grid place-items-center">
              <span className="h-[7px] w-[7px] rounded-full bg-state-success animate-signal-pulse" />
              <span
                aria-hidden
                className="absolute h-[7px] w-[7px] rounded-full bg-state-success blur-[4px] opacity-70"
              />
            </span>

            {(tags.length > 0 ? tags : ["DIGITAL"]).map((tag, i) => (
              <span
                key={i}
                className="mono-label text-purple-200/90 border border-purple-500/25 bg-purple-500/[0.08] px-1.5 py-[3px] truncate max-w-[130px]"
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* ── Product image ── */}
          <div
            className="relative aspect-video w-full overflow-hidden border border-void-line transition-colors duration-300 group-hover:border-purple-500/40"
            style={{
              borderRadius: "var(--radius-panel)",
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
                className="h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="mono-label text-text-muted">NO IMAGE</span>
              </div>
            )}

            {/* Bottom depth fade */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent"
            />

            {/* Sold badge — social proof */}
            {sales > 0 && (
              <span
                className="absolute top-2 right-2 mono-label text-[10px] flex items-center gap-1 px-1.5 py-[3px] border backdrop-blur-sm"
                style={{
                  borderRadius: "var(--radius-badge)",
                  color: "#A3FF47",
                  borderColor: "rgba(163,255,71,0.30)",
                  background: "rgba(163,255,71,0.10)",
                }}
              >
                {sales} SOLD
              </span>
            )}

            {/* Scan line — sweeps top-to-bottom on hover */}
            {hovered && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent animate-scan-line pointer-events-none"
              />
            )}
          </div>

          {/* ── Name ── */}
          <h3
            className={`font-black tracking-tight text-text-primary leading-tight line-clamp-2 transition-colors duration-200 group-hover:text-white ${
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
          <div className="relative mt-auto pt-4">
            {/* Divider */}
            <span
              aria-hidden
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-void-line to-transparent"
            />
            <p className="mono-label text-text-muted mb-1.5">UNIT COST</p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="data-readout font-black leading-none bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent"
                style={{
                  fontSize: size === "dominant" ? "2.1rem" : "1.85rem",
                  filter: "drop-shadow(0 0 16px rgba(168,85,247,0.40))",
                }}
              >
                {price.toLocaleString()}
              </span>
              <span className="mono-label text-purple-300">EGP</span>
            </div>
          </div>
        </Link>

        {/* ══ ACQUIRE BUTTON ══════════════════════════════════════ */}
        <div className="px-5 pb-5 pt-1 space-y-2">
          {/* Buy Now — primary, goes straight to the cart */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={adding || buying}
            className="
              group/btn relative flex w-full h-11 items-center justify-center gap-2 overflow-hidden
              mono-label tracking-[0.18em] text-white
              bg-gradient-to-r from-purple-600 to-fuchsia-600
              hover:from-purple-500 hover:to-fuchsia-500
              transition-all duration-200
              shadow-[0_0_20px_rgba(168,85,247,0.30)]
              hover:shadow-[0_0_38px_rgba(168,85,247,0.55)]
              disabled:opacity-75
            "
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
            />
            {buying ? (
              <Loader2 className="relative h-4 w-4 animate-spin" />
            ) : (
              <span className="relative">BUY NOW</span>
            )}
            {!buying && <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />}
          </button>

          {/* Add to Cart — secondary */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || buying}
            className="
              flex w-full h-10 items-center justify-center gap-2
              mono-label tracking-[0.18em]
              border border-purple-500/25 bg-purple-500/[0.06] text-purple-200
              hover:bg-purple-500/[0.12] hover:text-white hover:border-purple-400/40
              transition-all duration-200 disabled:opacity-75
            "
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                ADDED
              </>
            ) : adding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ADDING
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                ADD TO CART
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
