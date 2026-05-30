"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
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
    <main className="min-h-screen bg-[#050507] text-white overflow-hidden relative">

{/* Cyber Background */}

<div className="fixed inset-0 -z-10">

  {/* Grid */}
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

  {/* Main Glow */}
  <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-700/30 rounded-full blur-[220px]" />

  {/* Left Glow */}
  <div className="absolute left-[-200px] top-[300px] w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[180px]" />

  {/* Right Glow */}
  <div className="absolute right-[-200px] top-[400px] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[180px]" />

</div>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-widest">
          MJ STORE
        </h1>

        <div className="flex gap-6 text-zinc-400">
          <Link href="/">Home</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/orders">Orders</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">

        {/* Floating Cards */}
        <div className="hidden md:block">

          <div className="absolute left-20 top-24 bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl rotate-[-12deg] shadow-2xl">
            <h3 className="font-bold text-xl">Spotify</h3>
            <p className="text-purple-400">Premium</p>
          </div>

          <div className="absolute right-24 top-28 bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl rotate-[12deg] shadow-2xl">
            <h3 className="font-bold text-xl">Netflix</h3>
            <p className="text-purple-400">Premium</p>
          </div>

          <div className="absolute left-32 bottom-16 bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl rotate-[8deg] shadow-2xl">
            <h3 className="font-bold text-xl">Discord</h3>
            <p className="text-purple-400">Nitro</p>
          </div>

          <div className="absolute right-32 bottom-12 bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl rotate-[-8deg] shadow-2xl">
            <h3 className="font-bold text-xl">ChatGPT</h3>
            <p className="text-purple-400">Plus</p>
          </div>

        </div>

        <div className="text-center">

          <p className="text-purple-400 uppercase tracking-[6px] mb-6">
            Premium Digital Products
          </p>

          <h1 className="text-6xl md:text-8xl font-black leading-none">
            LEVEL UP
          </h1>

          <h2 className="text-6xl md:text-8xl font-black text-purple-500">
            YOUR DIGITAL LIFE
          </h2>

          <p className="max-w-2xl mx-auto mt-8 text-zinc-400 text-xl">
            Buy Spotify, Netflix, Discord Nitro and premium
            digital products with a modern shopping experience.
          </p>

          <div className="flex justify-center gap-4 mt-10">
            <a href="#products">
              <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-2xl font-bold">
                Shop Now
              </button>
            </a>

            <button className="border border-zinc-700 px-8 py-4 rounded-2xl font-bold">
              Explore
            </button>
          </div>

        </div>
      </section>
<section className="max-w-7xl mx-auto px-6 pb-24">

  <h2 className="text-5xl font-black text-center mb-12">
    WHY MJ STORE?
  </h2>

  <div className="grid md:grid-cols-4 gap-6">

    <div className="bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-4">⚡</div>

      <h3 className="text-xl font-bold">
        Instant Delivery
      </h3>

      <p className="text-zinc-400 mt-3">
        Receive your digital products quickly and safely.
      </p>
    </div>

    <div className="bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>

      <h3 className="text-xl font-bold">
        Secure Payment
      </h3>

      <p className="text-zinc-400 mt-3">
        Safe checkout and trusted transactions.
      </p>
    </div>

    <div className="bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-4">🎮</div>

      <h3 className="text-xl font-bold">
        Premium Services
      </h3>

      <p className="text-zinc-400 mt-3">
        High quality subscriptions and accounts.
      </p>
    </div>

    <div className="bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 text-center">
      <div className="text-5xl mb-4">⭐</div>

      <h3 className="text-xl font-bold">
        Trusted Store
      </h3>

      <p className="text-zinc-400 mt-3">
        Hundreds of satisfied customers.
      </p>
    </div>

  </div>

</section>

      {/* Products */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-6 pb-24"
      >
        <h2 className="text-5xl font-black text-center mb-12">
          Products
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {products.map((product) => (
            <Link
              href={`/product/${product.id}`}
              key={product.id}
            >
              <div className="group bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2">

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover"
                />

                <div className="p-6">

                  <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                    BEST SELLER
                  </span>

                  <h3 className="text-2xl font-bold mt-4">
                    {product.name}
                  </h3>

                  <p className="text-zinc-400 mt-3">
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

              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 text-center text-zinc-500">
        MJ STORE © 2026
      </footer>

    </main>