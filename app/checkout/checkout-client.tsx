"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LoaderCircle, Lock, ShieldCheck, Zap } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function loadProduct() {
      const res = await fetch("/api/get-products");
      const products = (await res.json()) as Product[];

      const selectedProduct = products.find((p) => String(p.id) === productId) || null;
      setProduct(selectedProduct);
    }

    loadProduct();
  }, [productId]);

  async function createOrder() {
    if (!product) return;

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
      }),
    });

    const data = (await res.json()) as { success?: boolean };

    if (data.success) {
      alert("Order Created Successfully");
    } else {
      alert("Error Creating Order");
    }
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-purple-300" />
              <p className="font-semibold">Loading product…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 sm:p-10 overflow-hidden">
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
            Checkout
          </div>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">Place your order</h1>
          <p className="mt-2 text-zinc-400">
            Secure, instant delivery checkout—premium, fast, and clean.
          </p>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: Product summary */}
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
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Total</p>
                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                  {product.price} EGP
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-200" />
                  <p className="font-semibold">Secure payment</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Your order is processed safely.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-200" />
                  <p className="font-semibold">Instant delivery</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Premium digital access after payment.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <p className="text-sm font-semibold text-purple-200">Tip</p>
              <p className="mt-1 text-sm text-zinc-300">
                Use your real phone number so we can deliver without delays.
              </p>
            </div>
          </motion.section>

          {/* Right: Form */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.32em] text-purple-300/80">Customer</p>
              <h2 className="mt-2 text-2xl font-black">Your details</h2>
              <p className="mt-2 text-zinc-400">We use these to create your order.</p>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <label className="mb-2 block text-sm font-semibold text-zinc-200">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <label className="mb-2 block text-sm font-semibold text-zinc-200">
                  Phone number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40 focus:bg-purple-500/10"
                />
              </motion.div>

              <motion.button
                onClick={createOrder}
                whileHover={{
                  boxShadow: "0 0 60px rgba(168,85,247,0.28)",
                  y: -2,
                }}
                whileTap={{ scale: 0.99 }}
                className="mt-2 flex h-[52px] w-full items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600 font-bold text-white transition-all duration-300 hover:bg-purple-700"
              >
                Place Order →
              </motion.button>

              <p className="text-xs text-zinc-500 leading-5">
                By placing the order, you confirm the details are correct.
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
