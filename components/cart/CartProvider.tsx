"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";

export type CartItem = {
  id: number;
  productId: number;
  name: string;
  image: string | null;
  category: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: number | string, quantity?: number) => Promise<boolean>;
  setQty: (productId: number, quantity: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken, isLoading } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const hdrs = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setSubtotal(0);
      setCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (d.success) {
        setItems(d.items ?? []);
        setSubtotal(d.subtotal ?? 0);
        setCount(d.count ?? 0);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [accessToken]);

  // Load the cart once auth is resolved and whenever the token changes.
  // Also restore a product the user tried to buy before registering.
  useEffect(() => {
    if (isLoading) return;
    if (!accessToken) {
      refresh();
      return;
    }
    (async () => {
      try {
        const pending =
          typeof window !== "undefined" ? localStorage.getItem("mj_pending_product") : null;
        if (pending) {
          localStorage.removeItem("mj_pending_product");
          await fetch("/api/cart", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ productId: pending, quantity: 1 }),
          }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, accessToken]);

  const add = useCallback(
    async (productId: number | string, quantity = 1): Promise<boolean> => {
      if (!accessToken) return false;
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: hdrs(),
          body: JSON.stringify({ productId, quantity }),
        });
        const d = await res.json();
        if (d.success) {
          await refresh();
          return true;
        }
      } catch {
        /* ignore */
      }
      return false;
    },
    [accessToken, hdrs, refresh]
  );

  const setQty = useCallback(
    async (productId: number, quantity: number) => {
      if (!accessToken) return;
      // optimistic
      setItems((prev) =>
        prev
          .map((it) => (it.productId === productId ? { ...it, quantity, lineTotal: it.price * quantity } : it))
          .filter((it) => it.quantity > 0)
      );
      try {
        await fetch("/api/cart", { method: "PATCH", headers: hdrs(), body: JSON.stringify({ productId, quantity }) });
      } catch {
        /* ignore */
      }
      await refresh();
    },
    [accessToken, hdrs, refresh]
  );

  const remove = useCallback(
    async (productId: number) => {
      if (!accessToken) return;
      setItems((prev) => prev.filter((it) => it.productId !== productId));
      try {
        await fetch("/api/cart", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ productId }) });
      } catch {
        /* ignore */
      }
      await refresh();
    },
    [accessToken, hdrs, refresh]
  );

  const clear = useCallback(async () => {
    if (!accessToken) return;
    setItems([]);
    setSubtotal(0);
    setCount(0);
    try {
      await fetch("/api/cart", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ clear: true }) });
    } catch {
      /* ignore */
    }
    await refresh();
  }, [accessToken, hdrs, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotal, loading, refresh, add, setQty, remove, clear }),
    [items, count, subtotal, loading, refresh, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
