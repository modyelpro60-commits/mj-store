"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const res = await fetch("/api/get-products");
    const data = await res.json();
    setProducts(data);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-[1700px] mx-auto p-10">

        {/* Content */}

        <div>

          <h1 className="text-5xl font-black mb-10">
            MJ STORE ADMIN
          </h1>

          {/* Stats */}

          <div className="grid grid-cols-4 gap-6 mb-10">

            <div className="bg-zinc-900 rounded-3xl p-6 border border-purple-500/10">
              <p className="text-zinc-500">Products</p>
              <h2 className="text-4xl font-black mt-3">
                {products.length}
              </h2>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-purple-500/10">
              <p className="text-zinc-500">Orders</p>
              <h2 className="text-4xl font-black mt-3">
                0
              </h2>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-purple-500/10">
              <p className="text-zinc-500">Revenue</p>
              <h2 className="text-4xl font-black mt-3">
                0 EGP
              </h2>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-purple-500/10">
              <p className="text-zinc-500">Active</p>
              <h2 className="text-4xl font-black mt-3">
                {products.length}
              </h2>
            </div>

          </div>

          {/* Placeholder */}

          <div className="bg-zinc-900 rounded-3xl border border-purple-500/10 p-10">

            <h2 className="text-3xl font-bold">
              Product Management
            </h2>

            <p className="text-zinc-500 mt-3">
              Dashboard Layout Ready
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}