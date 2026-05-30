"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);

  async function loadProducts() {
    const res = await fetch("/api/get-products");
    const data = await res.json();
    setProducts(data);
  }

  async function deleteProduct(id: number) {
    await fetch("/api/delete-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">
        MJ STORE ADMIN
      </h1>

      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-zinc-900 p-5 rounded-xl border border-zinc-800"
          >
            <h2 className="text-2xl font-bold">
              {product.name}
            </h2>

            <p className="text-zinc-400 mt-2">
              {product.description}
            </p>

            <p className="mt-2">
              Price: {product.price} EGP
            </p>

            <p>
              Sold: {product.sales_count}
            </p>

            <button
              onClick={() => deleteProduct(product.id)}
              className="mt-4 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg"
            >
              Delete Product
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}