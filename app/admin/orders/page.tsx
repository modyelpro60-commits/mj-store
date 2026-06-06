"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import {
  LoaderCircle,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import AnimatedNumber from "../animated-number";
import StatusDropdown from "../../../components/StatusDropdown";

const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

interface OrderRecord {
  id: number;
  customer_name: string;
  customer_phone?: string | null;
  product_name: string;
  price: number | string;
  status: string;
  created_at?: string | null;
  handled_by?: string | null;
  handled_by_name?: string | null;
  handled_at?: string | null;
}

interface OrdersApiResponse {
  success: boolean;
  data?: OrderRecord[];
  error?: string;
}

interface ActionApiResponse {
  success: boolean;
  error?: string;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45 },
  }),
};

function formatOrderTimestamp(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} - ${timePart}`;
}

const STATUS_SECTIONS = [
  { key: "active", label: "Active Orders", statuses: ["Pending", "Processing"] as OrderStatus[] },
  { key: "completed", label: "Completed Orders", statuses: ["Completed"] as OrderStatus[] },
  { key: "cancelled", label: "Cancelled Orders", statuses: ["Cancelled"] as OrderStatus[] },
] as const;

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "Pending":
      return "bg-purple-600/20 text-purple-200 border-purple-500/20";
    case "Processing":
      return "bg-fuchsia-600/20 text-purple-200 border-fuchsia-500/20";
    case "Completed":
      return "bg-emerald-600/20 text-emerald-200 border-emerald-500/20";
    case "Cancelled":
      return "bg-red-600/20 text-red-200 border-red-500/20";
  }
}

export default function OrdersPage() {
  const { accessToken, role } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    return params.toString();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [queryString]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/get-orders${queryString ? `?${queryString}` : ""}`, {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });
      const data = (await res.json()) as OrdersApiResponse;

      if (!data.success || !data.data) {
        setError(data.error || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders(data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: OrderStatus) {
    if (role !== "admin" && role !== "moderator") return;

    try {
      setSavingId(id);

      const res = await fetch("/api/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id, status }),
      });

      const data = (await res.json()) as ActionApiResponse;

      if (data.success) {
        loadOrders();
      } else {
        toast.error(data.error || "Update Failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteOrder(id: number) {
    if (role !== "admin") return;

    try {
      setSavingId(id);

      const res = await fetch("/api/delete-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      const data = (await res.json()) as ActionApiResponse;

      if (data.success) {
        setPendingDeleteId(null);
        loadOrders();
      } else {
        setPendingDeleteId(null);
        toast.error(data.error || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      setPendingDeleteId(null);
      toast.error("Error");
    } finally {
      setSavingId(null);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Pending: 0,
      Processing: 0,
      Completed: 0,
      Cancelled: 0,
    };

    for (const order of orders) {
      const s = ORDER_STATUSES.includes(order.status as OrderStatus)
        ? (order.status as OrderStatus)
        : "Pending";
      counts[s] += 1;
    }

    return counts;
  }, [orders]);

  const revenueEstimate = useMemo(() => {
    return orders.reduce((sum, order) => {
      const value = typeof order.price === "string" ? Number(order.price) : order.price;
      const safe = Number.isFinite(value) ? value : 0;
      return sum + safe;
    }, 0);
  }, [orders]);

  const sectionOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return STATUS_SECTIONS.map((section) => ({
      ...section,
      orders: sorted.filter((o) =>
        section.statuses.includes(o.status as OrderStatus)
      ),
    }));
  }, [orders]);

  const nonEmptySections = sectionOrders.filter((s) => s.orders.length > 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
                <ShoppingCart className="h-4 w-4" />
                Order Control
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Orders</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Track customer orders, update status instantly, and remove invalid records.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {loading ? <LoaderCircle className="h-6 w-6 animate-spin text-purple-300" /> : <AnimatedNumber value={orders.length} />}
                    </p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-200 transition-all duration-300 group-hover:border-purple-400/35">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={0.1}
                whileHover={{ y: -2, boxShadow: "0 0 40px rgba(168,85,247,0.18)" }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Revenue (loaded)</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {loading ? <LoaderCircle className="h-6 w-6 animate-spin text-purple-300" /> : <AnimatedNumber value={revenueEstimate} suffix=" EGP" />}
                    </p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-purple-200 transition-all duration-300 group-hover:border-purple-400/35">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ORDER_STATUSES.map((status, index) => {
              const border =
                status === "Pending" ? "border-purple-500/25"
                : status === "Processing" ? "border-fuchsia-500/25"
                : status === "Completed" ? "border-emerald-500/25"
                : "border-red-500/25";
              return (
                <motion.div
                  key={status}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.18 + index * 0.06}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/5 px-4 py-4 ${border}`}
                >
                  <div className="absolute inset-0 opacity-70 bg-gradient-to-br from-white/0 via-white/0 to-transparent" />
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{status}</p>
                    <div className="mt-2 text-3xl font-black text-white">
                      {loading ? <LoaderCircle className="h-7 w-7 animate-spin text-purple-300" /> : <AnimatedNumber value={statusCounts[status]} />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {error ? (
            <div className="mt-6 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
          ) : null}
        </motion.section>

        {loading ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mt-2 grid gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="h-[140px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
                />
              ))}
            </div>
          </motion.section>
        ) : nonEmptySections.length === 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mt-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-zinc-400">No orders found.</div>
          </motion.section>
        ) : (
          nonEmptySections.map((section, sectionIndex) => (
            <motion.section
              key={section.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 + sectionIndex * 0.08 }}
              className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="mb-6 flex items-center gap-3">
                <Search className="h-4 w-4 text-purple-300" />
                <h2 className="text-2xl font-black tracking-tight">
                  {section.label} ({section.orders.length})
                </h2>
              </div>
              <div className="grid gap-4">
                {section.orders.map((order, index) => {
                  const isSaving = savingId === order.id;
                  const parsedPrice = typeof order.price === "number" ? order.price : Number(order.price) || 0;
                  const statusValue = ORDER_STATUSES.includes(order.status as OrderStatus) ? (order.status as OrderStatus) : "Pending";
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.02 }}
                      whileHover={{ boxShadow: "0 0 45px rgba(168,85,247,0.18)", borderColor: "rgba(168,85,247,0.35)", scale: 1.003 }}
                      className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition-all duration-300"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-white">#{order.id} — {order.customer_name}</h2>
                            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${statusBadgeClass(statusValue)}`}>{statusValue}</span>
                          </div>
                          <p className="text-zinc-400">No email on file</p>
                          <p className="text-zinc-400">{order.customer_phone || "No phone provided"}</p>
                          <p className="text-zinc-200">{order.product_name}</p>
                          <p className="font-bold text-purple-300">{parsedPrice} EGP</p>
                          <p className="mt-1 text-sm text-zinc-400">Created At: {formatOrderTimestamp(order.created_at ?? null)}</p>
                        </div>
                        <div className="flex flex-col gap-4 xl:items-end">
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <label className="text-sm text-zinc-400">Order Status</label>
                            <StatusDropdown value={statusValue} onChange={(v) => updateStatus(order.id, v as OrderStatus)} options={ORDER_STATUSES} disabled={isSaving || (role !== "admin" && role !== "moderator")} />
                          </div>
                          {order.handled_by ? (
                            <div className="w-full rounded-[1.5rem] border border-purple-500/20 bg-purple-500/10 px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.22em] text-purple-200/90">Handled By</div>
                              <div className="mt-1 text-sm font-bold text-white">{order.handled_by_name ?? "Unknown"}</div>
                              <div className="mt-1 text-sm text-purple-100/80">{formatOrderTimestamp(order.handled_at ?? null)}</div>
                            </div>
                          ) : null}
                          <div className="flex gap-3 flex-wrap">
                            <span className="px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-200 text-sm font-semibold">#{order.id}</span>
                            {role === "admin" ? (
                              <button
                                onClick={() => setPendingDeleteId(order.id)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-red-700 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            ) : null}
                          </div>
                          {isSaving ? (
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                              <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
                              Working...
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          ))
        )}
      </motion.div>

      {/* Modal teleported to document.body via createPortal — bypasses parent transform contexts */}
      {typeof window !== "undefined" && pendingDeleteId !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setPendingDeleteId(null)}
            >
              <div
                className="w-full max-w-sm rounded-[2rem] border border-red-500/20 bg-zinc-950 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-white">Are you sure?</h3>
                <p className="mt-2 text-sm text-zinc-400">This action cannot be undone.</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => deleteOrder(pendingDeleteId)}
                    disabled={savingId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                  >
                    {savingId === pendingDeleteId ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    disabled={savingId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-zinc-700 px-4 py-2.5 font-bold text-zinc-300 transition-all duration-200 hover:bg-zinc-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
