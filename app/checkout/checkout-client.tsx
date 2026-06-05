"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  LoaderCircle,
  Lock,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

const PHONE_REGEX = /^\+?\d{8,15}$/;

function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value.trim());
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("product");

  const { accessToken, status, isLoading, signOut } = useAuth();
  const { translate } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const res = await fetch("/api/get-products");
      const products = (await res.json()) as Product[];

      const selectedProduct = products.find((p) => String(p.id) === productId) || null;
      setProduct(selectedProduct);
    }

    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken) return;
    if (status === "Banned") {
      void (async () => {
        await signOut();
      })();
    }
  }, [accessToken, isLoading, signOut, status]);

  async function createOrder() {
    if (!product) return;
    if (!accessToken) return;

    setError(null);

    // --- Client-side validation ---
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          product_id: product.id,
          product_name: product.name,
          price: product.price,
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/account"), 1500);
      } else {
        setError(data.error ?? "Error Creating Order");
      }
    } catch {
      setError("Error Creating Order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-purple-300" />
              <p className="font-semibold">{translate("checkout.loading")}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isLoading && status && status !== "Active") {
    const message =
      status === "Suspended"
        ? translate("checkout.accountSuspended")
        : status === "Banned"
        ? translate("checkout.accountBanned")
        : translate("checkout.accessDenied");

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-10 overflow-hidden">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="text-2xl font-black">{message}</div>
            <p className="mt-3 text-zinc-400">
              {translate("checkout.statusBlocked")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white p-6 sm:p-10">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-emerald-500/20 bg-zinc-950/70 p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-black text-white">Order Placed!</h2>
            <p className="mt-2 text-zinc-400">Redirecting to your orders...</p>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-10 overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-[-200px] top-[200px] h-[500px] w-[500px] rounded-full bg-purple-700/20 blur-[200px]" />
      </div>

      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
            <Zap className="h-4 w-4" />
            {translate("checkout.title")}
          </div>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">{translate("checkout.title")}</h1>
          <p className="mt-2 text-zinc-400">
            {translate("checkout.subtitle")}
          </p>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black leading-tight">{product.name}</h2>
                <p className="mt-2 text-zinc-400">{product.description}</p>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{translate("checkout.total")}</p>
                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                  {product.price} EGP
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-200" />
                  <p className="font-semibold">{translate("checkout.securePayment")}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {translate("checkout.securePaymentDesc")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-200" />
                  <p className="font-semibold">{translate("checkout.instantDelivery")}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {translate("checkout.instantDeliveryDesc")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <p className="text-sm font-semibold text-purple-200">{translate("checkout.tip")}</p>
              <p className="mt-1 text-sm text-zinc-300">
                {translate("checkout.tipDesc")}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.32em] text-purple-300/80">{translate("checkout.yourDetails")}</p>
              <h2 className="mt-2 text-2xl font-black">{translate("checkout.yourDetails")}</h2>
              <p className="mt-2 text-zinc-400">{translate("checkout.yourDetailsDesc")}</p>
            </div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <label className="mb-2 block text-sm font-semibold text-zinc-200">{translate("checkout.name")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={translate("checkout.namePlaceholder")}
                  className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <label className="mb-2 block text-sm font-semibold text-zinc-200">{translate("checkout.phone")}</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={translate("checkout.phonePlaceholder")}
                  className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                />
              </motion.div>

              <motion.button
                onClick={createOrder}
                disabled={submitting}
                whileHover={
                  submitting ? {} : {
                    boxShadow: "0 0 60px rgba(168,85,247,0.28)",
                    y: -2,
                  }
                }
                whileTap={submitting ? {} : { scale: 0.99 }}
                className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-600 font-bold text-white transition-all duration-300 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  translate("checkout.placeOrder")
                )}
              </motion.button>

              <p className="text-xs text-zinc-500 leading-5">
                {translate("checkout.confirmText")}
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
