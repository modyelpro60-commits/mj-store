"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  async function loadOrders() {
    const res = await fetch("/api/get-orders");
    const data = await res.json();
    setOrders(data);
  }

  async function updateStatus(id: number, status: string) {
    try {
      const res = await fetch("/api/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Status Updated");
        loadOrders();
      } else {
        alert(data.error || "Update Failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">
        Orders
      </h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 p-5 rounded-xl border border-zinc-800"
          >
            <h2 className="text-xl font-bold">
              {order.customer_name}
            </h2>

            <p>{order.customer_phone}</p>

            <p>{order.product_name}</p>

            <p>{order.price} EGP</p>

            <p className="mt-2">
              Status: {order.status}
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() =>
                  updateStatus(order.id, "Paid")
                }
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                Paid
              </button>

              <button
                onClick={() =>
                  updateStatus(order.id, "Delivered")
                }
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                Delivered
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}