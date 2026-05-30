"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  ShoppingBag,
} from "lucide-react";

export default function HomeV4() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch("/api/get-products");
      const data = await res.json();
      setProducts(data);
    }

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* Background */}

      <div className="fixed inset-0 -z-10">

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(rgba(168,85,247,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-purple-700/20 rounded-full blur-[250px]" />

      </div>

      {/* Navbar */}

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-purple-500/10">

        <div className="max-w-[1600px] mx-auto px-8 py-5 flex justify-between items-center">

          <h1 className="text-4xl font-black tracking-widest">
            MJ STORE
          </h1>

          <div className="flex gap-8 text-zinc-400">

            <Link href="/">Home</Link>

            <Link href="/admin">
              Admin
            </Link>

            <Link href="/admin/orders">
              Orders
            </Link>

          </div>

        </div>

      </nav>

     {/* Hero */}

<section className="relative h-[850px] overflow-hidden">

  {/* Background Image */}

  <img
    src="/hero.jpg"
    alt="Hero"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Overlay */}

  <div className="absolute inset-0 bg-black/70" />

  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

  {/* Content */}

  <div className="relative z-10 max-w-[1600px] mx-auto px-8 h-full flex items-center">

    <div className="max-w-4xl">

      <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 mb-8">

        <Star size={16} />

        Premium Digital Marketplace

      </div>

      <h1 className="text-7xl md:text-[130px] leading-none font-black">

        MJ

      </h1>

      <h2 className="text-7xl md:text-[130px] leading-none font-black text-purple-500">

        STORE

      </h2>

      <p className="text-zinc-300 text-2xl mt-8 max-w-2xl">

        Buy premium subscriptions, digital services,
        Discord Nitro, Spotify, Netflix and ChatGPT Plus
        with instant delivery.

      </p>

      <div className="flex gap-5 mt-10 flex-wrap">

        <a href="#products">

          <button className="bg-purple-600 hover:bg-purple-700 transition px-10 py-5 rounded-2xl font-bold text-lg">

            SHOP NOW

          </button>

        </a>

        <button className="border border-white/20 backdrop-blur-xl px-10 py-5 rounded-2xl font-bold text-lg">

          EXPLORE

        </button>

      </div>

    </div>

  </div>

</section>
            {/* Features */}

      <section className="max-w-[1600px] mx-auto px-8 pb-20">

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-zinc-900/60 border border-purple-500/20 rounded-3xl p-8">
            <Zap className="text-purple-400 mb-4" size={40} />

            <h3 className="text-2xl font-bold">
              Instant Delivery
            </h3>

            <p className="text-zinc-400 mt-4">
              Receive your products instantly after checkout.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-purple-500/20 rounded-3xl p-8">
            <ShieldCheck className="text-purple-400 mb-4" size={40} />

            <h3 className="text-2xl font-bold">
              Secure Payments
            </h3>

            <p className="text-zinc-400 mt-4">
              Safe and trusted digital transactions.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-purple-500/20 rounded-3xl p-8">
            <ShoppingBag className="text-purple-400 mb-4" size={40} />

            <h3 className="text-2xl font-bold">
              Premium Products
            </h3>

            <p className="text-zinc-400 mt-4">
              Carefully selected digital subscriptions.
            </p>
          </div>

        </div>

      </section>

      {/* Products */}

      <section
        id="products"
        className="max-w-[1600px] mx-auto px-8 pb-32"
      >

        <div className="flex items-center justify-between mb-12">

          <h2 className="text-5xl md:text-6xl font-black">
            Featured Products
          </h2>

          <span className="text-zinc-400">
            Premium Digital Services
          </span>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">

          {products.map((product) => (

            <Link
              href={`/product/${product.id}`}
              key={product.id}
            >

              <motion.div
                whileHover={{
                  y: -10,
                  scale: 1.02,
                }}
                className="bg-zinc-900/70 border border-zinc-800 hover:border-purple-500 rounded-3xl overflow-hidden"
              >

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-[340px] object-cover"
                />

                <div className="p-6">

                  <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                    BEST SELLER
                  </span>

                  <h3 className="text-2xl font-bold mt-4">
                    {product.name}
                  </h3>

                  <p className="text-zinc-400 mt-3 min-h-[50px]">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center mt-6">

                    <span className="text-3xl font-black">
                      {product.price} EGP
                    </span>

                    <div className="bg-purple-600 px-4 py-2 rounded-xl">
                      View
                    </div>

                  </div>

                </div>

              </motion.div>

            </Link>

          ))}

        </div>

      </section>

      {/* Footer */}

      <footer className="border-t border-purple-500/10">

        <div className="max-w-[1600px] mx-auto px-8 py-12 text-center">

          <h3 className="text-3xl font-black">
            MJ STORE
          </h3>

          <p className="text-zinc-500 mt-4">
            Premium Digital Marketplace
          </p>

          <p className="text-zinc-600 mt-8">
            © 2026 MJ STORE. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}