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
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <nav className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-black">
            MJ STORE
          </h1>

          <div className="flex gap-6">
            <Link href="/">
              Home
            </Link>

            <Link href="/admin">
              Admin
            </Link>

            <Link href="/admin/orders">
              Orders
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-black">
          Digital Products
        </h1>

        <p className="text-zinc-400 mt-6 text-xl">
          Buy premium subscriptions, accounts and digital services instantly.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold mb-8">
          Products
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              href={`/product/${product.id}`}
              key={product.id}
            >
              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500 transition-all cursor-pointer">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover"
                />

                <div className="p-5">
                  <h3 className="text-xl font-bold">
                    {product.name}
                  </h3>

                  <p className="text-zinc-400 mt-2">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center mt-5">
                    <span className="text-2xl font-black">
                      {product.price} EGP
                    </span>

                    <button className="bg-purple-600 px-4 py-2 rounded-lg">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}