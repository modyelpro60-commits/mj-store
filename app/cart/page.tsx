"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  LogIn,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import CommandBar from "../../components/nav/CommandBar";
import { useAuth } from "../../components/auth/AuthProvider";
import { useCart } from "../../components/cart/CartProvider";
import PaymentModal from "../../components/cart/PaymentModal";

function egp(n: number) {
  return `${n.toLocaleString()} EGP`;
}

export default function CartPage() {
  const { accessToken, isLoading } = useAuth();
  const { items, subtotal, count, loading, setQty, remove, clear, refresh } = useCart();
  const loggedIn = !isLoading && !!accessToken;
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <>
      <CommandBar />
      <main className="relative min-h-screen bg-void-base text-white px-5 pt-28 pb-24 md:px-8">
        {/* ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
          style={{ background: "radial-gradient(circle at 50% -10%, rgba(124,58,237,0.18), transparent 60%)" }}
        />

        <div className="relative mx-auto max-w-[1100px]">
          {/* ── Header ── */}
          <div className="mb-8 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Your Cart</h1>
              <p className="text-sm text-zinc-500">
                {loggedIn && count > 0 ? `${count} item${count > 1 ? "s" : ""} in your cart` : "Review your items before checkout"}
              </p>
            </div>
          </div>

          {/* ── Not logged in ── */}
          {!loggedIn ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.07] bg-zinc-950/60 py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
                <LogIn className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-bold text-zinc-300">Sign in to view your cart</p>
              <p className="mt-1 text-sm text-zinc-500">Your cart is saved to your account.</p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]"
              >
                <LogIn className="h-4 w-4" /> Log in
              </Link>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-3 py-24 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading your cart…
            </div>
          ) : items.length === 0 ? (
            /* ── Empty ── */
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.07] bg-zinc-950/60 py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-600">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-bold text-zinc-300">Your cart is empty</p>
              <p className="mt-1 text-sm text-zinc-500">Browse the catalog and add some products.</p>
              <Link
                href="/#products"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-6 py-3 text-sm font-bold text-purple-200 transition hover:bg-purple-500/20"
              >
                <Package className="h-4 w-4" /> Browse Products
              </Link>
            </div>
          ) : (
            /* ── Cart content ── */
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Items */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.div
                      key={it.productId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-3 sm:p-4"
                    >
                      {/* Thumb */}
                      <Link
                        href={`/product/${it.productId}`}
                        className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900"
                      >
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt={it.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <Package className="h-5 w-5 text-zinc-600" />
                        )}
                      </Link>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${it.productId}`} className="block truncate font-bold text-white hover:text-purple-200">
                          {it.name}
                        </Link>
                        {it.category && <p className="text-xs text-zinc-600">{it.category}</p>}
                        <p className="mt-1 text-sm font-bold text-purple-300">{egp(it.price)}</p>
                      </div>

                      {/* Qty */}
                      <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                        <button
                          onClick={() => setQty(it.productId, it.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{it.quantity}</span>
                        <button
                          onClick={() => setQty(it.productId, it.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line total + remove */}
                      <div className="hidden w-28 shrink-0 text-right sm:block">
                        <p className="font-black tabular-nums text-white">{egp(it.lineTotal)}</p>
                      </div>
                      <button
                        onClick={() => remove(it.productId)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-500/15 bg-red-500/[0.06] text-red-400/80 transition hover:bg-red-500/15 hover:text-red-300"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => clear()}
                    className="text-xs font-semibold text-zinc-600 transition hover:text-red-400"
                  >
                    Clear cart
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:sticky lg:top-28 h-fit rounded-[1.5rem] border border-white/[0.08] bg-zinc-950/70 p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Order Summary</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Subtotal ({count})</span>
                    <span className="font-bold tabular-nums text-white">{egp(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Delivery</span>
                    <span className="font-semibold text-emerald-400">Instant</span>
                  </div>
                </div>

                <div className="my-5 h-px bg-white/[0.07]" />

                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-zinc-300">Total</span>
                  <span
                    className="text-2xl font-black tabular-nums text-white"
                    style={{ textShadow: "0 0 22px rgba(168,85,247,0.4)" }}
                  >
                    {egp(subtotal)}
                  </span>
                </div>

                <button
                  onClick={() => setPaymentOpen(true)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-black tracking-wide text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition hover:shadow-[0_0_44px_rgba(168,85,247,0.55)] active:scale-[0.99]"
                >
                  <CreditCard className="h-4 w-4" />
                  ادفع الآن
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/#products"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 text-xs font-semibold text-zinc-400 transition hover:text-white"
                >
                  Continue shopping
                </Link>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
                  🔒 الدفع عبر Vodafone Cash أو InstaPay
                </p>
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
