"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export type RecentOrder = {
  productName: string;
  status: string;
  price: number | string;
  createdAt: string | null;
};

export type MyOrdersData = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
};

export function useMyOrders(limit = 5) {
  const { accessToken, status } = useAuth();

  const [data, setData] = useState<MyOrdersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Status enforcement (client-side fast-fail; server APIs still enforce).
      if (status && status !== "Active") {
        if (!mounted) return;
        setData({
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          recentOrders: [],
        });
        setError(
          status === "Suspended"
            ? "Account Suspended"
            : status === "Banned"
            ? "Account Banned"
            : null
        );
        setIsLoading(false);
        return;
      }

      if (!accessToken) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/my-orders?limit=${encodeURIComponent(String(limit))}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const json = (await res.json()) as {
          success: boolean;
          data?: MyOrdersData;
          error?: string;
        };

        if (!mounted) return;

        if (!json.success || !json.data) {
          setData(null);
          setError(json.error || "Failed to load orders");
          return;
        }

        setData(json.data);
      } catch (e) {
        if (!mounted) return;
        setData(null);
        setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [accessToken, limit]);

  return { data, isLoading, error };
}
