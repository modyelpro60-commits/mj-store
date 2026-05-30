"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const productId = searchParams.get("product");

  const [product, setProduct] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function loadProduct() {
      const res = await fetch("/api/get-products");
      const products = await res.json();

      const selectedProduct = products.find(
        (p: any) => String(p.id) === productId
      );

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

    const data = await res.json();

    if (data.success) {
      alert("Order Created Successfully");
    } else {
      alert("Error Creating Order");
    }
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">
        Checkout
      </h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          {product.name}
        </h2>

        <p>{product.description}</p>

        <p className="mt-2 text-xl">
          {product.price} EGP
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className="w-full p-3 rounded bg-zinc-900"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="w-full p-3 rounded bg-zinc-900"
        />

        <button
          onClick={createOrder}
          className="bg-purple-600 px-6 py-3 rounded-xl"
        >
          Place Order
        </button>
      </div>
    </main>
  );
}