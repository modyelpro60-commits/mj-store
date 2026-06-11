"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  LoaderCircle,
  LogIn,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import CommandBar from "../../components/nav/CommandBar";
import { useAuth } from "../../components/auth/AuthProvider";
import { useCart } from "../../components/cart/CartProvider";
import PaymentModal from "../../components/cart/PaymentModal";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

/* ── helpers ─────────────────────────────────────────────────── */
function egp(n: number) {
  return `${n.toLocaleString("en")} EGP`;
}
function discountPct(price: number, orig: number) {
  if (orig > price && price > 0) return Math.round((1 - price / orig) * 100);
  return 0;
}

/* ── static data ─────────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { icon: Smartphone, label: "VF Cash",  cls: "text-red-400   border-red-500/20   bg-red-500/[0.07]"   },
  { icon: CreditCard, label: "InstaPay", cls: "text-blue-400  border-blue-500/20  bg-blue-500/[0.07]"  },
  { icon: Wallet,     label: "USDT",     cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.07]" },
] as const;

const TRUST = [
  { icon: ShieldCheck,   labelKey: "cart.trust.securePayment"    },
  { icon: BadgeCheck,    labelKey: "cart.trust.verifiedStore"     },
  { icon: CheckCircle2,  labelKey: "cart.trust.manualReview"      },
  { icon: MessageCircle, labelKey: "cart.trust.supportAvailable"  },
] as const;

/* ═══════════════════════════════════════════════════════════════
   CART PAGE
═══════════════════════════════════════════════════════════════ */
export default function CartPage() {
  const { accessToken, isLoading } = useAuth();
  const { items, subtotal, count, loading, setQty, remove, clear, refresh } = useCart();
  const { language, translate } = useLanguage();
  const loggedIn     = !isLoading && !!accessToken;
  const [paymentOpen, setPaymentOpen] = useState(false);
  const dir = language === "ar" ? "rtl" : "ltr";

  /* ── discount totals ── */
  const originalTotal = items.reduce((s, it) => {
    const orig = it.original_price && it.original_price > it.price
      ? it.original_price : it.price;
    return s + orig * it.quantity;
  }, 0);
  const totalDiscount = originalTotal - subtotal;
  const hasDiscount   = totalDiscount > 0;

  return (
    <>
      <CommandBar />

      <main
        dir={dir}
        className="relative min-h-screen text-white pb-24"
        style={{ background: "radial-gradient(ellipse at 50% -8%, rgba(88,28,235,0.12) 0%, #07070D 55%)" }}
      >
        {/* ambient orb */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-purple-700/[0.07] blur-[180px]" />
        </div>

        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 pt-28">

          {/* ── Page header ── */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{translate("cart.title")}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {loggedIn && count > 0
                    ? `${count} ${translate(count === 1 ? "cart.itemCount.one" : "cart.itemCount.other")}`
                    : translate("cart.reviewOrder")}
                </p>
              </div>
            </div>

            {/* Clear cart — only when items exist */}
            {loggedIn && items.length > 0 && (
              <button
                onClick={() => void clear()}
                className="text-xs font-semibold text-zinc-600 transition hover:text-red-400 flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {translate("cart.clearAll")}
              </button>
            )}
          </div>

          {/* ════════════════════════════════════════════
              NOT LOGGED IN
          ════════════════════════════════════════════ */}
          {!loggedIn ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.07] bg-zinc-950/60 py-24 px-8 text-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.09] bg-white/[0.03] text-zinc-600 mb-5">
                <LogIn className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-black text-zinc-200">{translate("cart.notLoggedIn.title")}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">{translate("cart.notLoggedIn.desc")}</p>
              <Link
                href="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:scale-[1.02]"
              >
                <LogIn className="h-4 w-4" />
                {translate("cart.notLoggedIn.btn")}
              </Link>
            </motion.div>

          ) : loading && items.length === 0 ? (
            /* ─ Loading skeleton ─ */
            <div className="flex items-center justify-center gap-3 py-32 text-zinc-600">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span className="text-sm font-semibold">{translate("cart.loading")}</span>
            </div>

          ) : items.length === 0 ? (
            /* ════════════════════════════════════════════
                EMPTY STATE
            ════════════════════════════════════════════ */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.06] bg-zinc-950/50 py-24 px-8 text-center"
            >
              <div className="relative mb-7">
                <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] border border-purple-500/15 bg-purple-500/[0.06] text-purple-500/40 shadow-[0_0_48px_rgba(168,85,247,0.1)]">
                  <ShoppingBag className="h-9 w-9" />
                </div>
                <div className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-xl border border-white/[0.07] bg-zinc-950 text-zinc-700">
                  <Plus className="h-3.5 w-3.5" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white">{translate("cart.empty.title")}</h2>
              <p className="mt-2 text-sm text-zinc-500 max-w-xs leading-relaxed">
                {translate("cart.empty.desc")}
              </p>
              <Link
                href="/#products"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.25)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.45)] hover:scale-[1.02] active:scale-[0.99]"
              >
                <Package className="h-4 w-4" />
                {translate("cart.empty.browse")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </motion.div>

          ) : (
            /* ════════════════════════════════════════════
                CART — items + summary
            ════════════════════════════════════════════ */
            <div className="grid gap-6 lg:grid-cols-[1fr_370px] items-start">

              {/* ── LEFT: item rows ── */}
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {items.map((it) => {
                    const hasItemDiscount = !!(it.original_price && it.original_price > it.price);
                    const pct = hasItemDiscount
                      ? discountPct(it.price, it.original_price!)
                      : 0;

                    return (
                      <motion.div
                        key={it.productId}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.22 }}
                        className="group relative flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-3 sm:p-4 transition-all duration-200 hover:border-purple-500/25 hover:bg-[rgba(88,28,235,0.04)] hover:shadow-[0_0_24px_rgba(139,92,246,0.07)]"
                      >
                        {/* ── Thumbnail ── */}
                        <Link
                          href={`/product/${it.productId}`}
                          className="block h-[66px] w-[66px] sm:h-[72px] sm:w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900 transition-all duration-200 group-hover:border-purple-500/20"
                        >
                          {it.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.image}
                              alt={it.name}
                              className="h-full w-full object-contain p-1.5"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center">
                              <Package className="h-5 w-5 text-zinc-700" />
                            </div>
                          )}
                        </Link>

                        {/* ── Product info ── */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${it.productId}`}
                            className="block text-sm sm:text-[15px] font-bold text-white hover:text-purple-200 transition-colors leading-snug line-clamp-2"
                          >
                            {it.name}
                          </Link>

                          {it.category && (
                            <span className="mt-0.5 inline-block text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              {it.category}
                            </span>
                          )}

                          {/* Price row */}
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-purple-300 tabular-nums">
                              {egp(it.price)}
                            </span>
                            {hasItemDiscount && (
                              <>
                                <span className="text-xs text-zinc-600 line-through tabular-nums">
                                  {egp(it.original_price!)}
                                </span>
                                <span className="text-[10px] font-black text-red-400 rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-px leading-none">
                                  -{pct}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ── Right controls ── */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

                          {/* Qty controls */}
                          <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                            <button
                              onClick={() => void setQty(it.productId, it.quantity - 1)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
                              aria-label={translate("cart.item.decrease")}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-black tabular-nums text-white">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() => void setQty(it.productId, it.quantity + 1)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
                              aria-label={translate("cart.item.increase")}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Line total — desktop only */}
                          <div className="hidden sm:block w-[88px] text-end">
                            <p className="font-black tabular-nums text-white text-sm">{egp(it.lineTotal)}</p>
                            {it.quantity > 1 && (
                              <p className="text-[10px] text-zinc-700 tabular-nums mt-0.5">
                                {it.quantity} × {egp(it.price)}
                              </p>
                            )}
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => void remove(it.productId)}
                            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl border border-red-500/15 bg-red-500/[0.06] text-red-500/60 transition hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25"
                            aria-label={translate("cart.item.remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ── RIGHT: order summary ── */}
              <div
                className="lg:sticky lg:top-28 rounded-[1.5rem] border border-white/[0.08] bg-zinc-950/80 backdrop-blur-xl overflow-hidden"
                style={{ boxShadow: "0 0 60px rgba(88,28,235,0.06)" }}
              >
                {/* Header bar */}
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      {translate("cart.summary.title")}
                    </h2>
                    <span className="text-xs font-bold text-zinc-600 tabular-nums">
                      {count} {translate(count === 1 ? "cart.summary.itemCount.one" : "cart.summary.itemCount.other")}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-5 space-y-5">

                  {/* ── Discount breakdown (only if discounts exist) ── */}
                  {hasDiscount && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{translate("cart.summary.originalTotal")}</span>
                        <span className="font-semibold text-zinc-600 line-through tabular-nums">
                          {egp(originalTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {translate("cart.summary.discount")}
                        </span>
                        <span className="font-black text-emerald-400 tabular-nums">
                          -{egp(totalDiscount)}
                        </span>
                      </div>
                      <div className="h-px bg-white/[0.05]" />
                    </div>
                  )}

                  {/* ── Final total ── */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-zinc-400">{translate("cart.summary.finalTotal")}</span>
                    <span
                      className="text-[2rem] font-black tabular-nums text-white leading-none"
                      style={{ textShadow: "0 0 28px rgba(168,85,247,0.4)" }}
                    >
                      {egp(subtotal)}
                    </span>
                  </div>

                  {/* ── CTA buttons ── */}
                  <div className="space-y-2.5 pt-1">
                    <motion.button
                      onClick={() => setPaymentOpen(true)}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 44px rgba(139,92,246,0.55)" }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-black tracking-wide text-white shadow-[0_0_24px_rgba(168,85,247,0.30)] transition-shadow"
                    >
                      <CreditCard className="h-4 w-4" />
                      {translate("cart.summary.payNow")}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </motion.button>

                    <Link
                      href="/#products"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] py-2.5 text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
                    >
                      {translate("cart.summary.browseMore")}
                    </Link>
                  </div>

                  {/* ── Payment methods preview ── */}
                  <div className="pt-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-700 mb-2.5">
                      {translate("cart.summary.paymentMethods")}
                    </p>
                    <div className="flex gap-2">
                      {PAYMENT_METHODS.map(({ icon: Icon, label, cls }) => (
                        <div
                          key={label}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 ${cls}`}
                        >
                          <Icon className="h-3 w-3 flex-shrink-0" />
                          <span className="text-[9px] font-black">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Trust badges ── */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 border-t border-white/[0.04]">
                    {TRUST.map(({ icon: Icon, labelKey }) => (
                      <div
                        key={labelKey}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-600"
                      >
                        <Icon className="h-3 w-3 text-emerald-500/60 flex-shrink-0" />
                        {translate(labelKey)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        accessToken={accessToken}
        subtotal={subtotal}
        onPaid={refresh}
      />
    </>
  );
}
