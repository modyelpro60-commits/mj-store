"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../components/auth/AuthProvider";
import { supabase } from "../supabase";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { accessToken, profile } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef   = useRef(true);

  // ── Fetch from API ────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res  = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json() as { success: boolean; data: AppNotification[]; unreadCount: number };
      if (json.success && mountedRef.current) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch { /* silent */ }
  }, [accessToken]);

  // ── Mark one as read ──────────────────────────────────────────────
  const markRead = useCallback(async (id: number) => {
    if (!accessToken) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await fetch("/api/notifications/read", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ id }),
      });
    } catch { /* re-fetch will correct any inconsistency */ }
  }, [accessToken]);

  // ── Mark all as read ──────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!accessToken) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch { /* silent */ }
  }, [accessToken]);

  // ── Setup: realtime + polling ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!accessToken || !profile?.id) return;

    // Initial load
    setLoading(true);
    void loadNotifications().finally(() => {
      if (mountedRef.current) setLoading(false);
    });

    // Realtime subscription ─ uses anon client with auth header
    try {
      supabase.realtime.setAuth(accessToken);
      const channel = supabase
        .channel(`notifications-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            if (!mountedRef.current) return;
            const newN = payload.new as AppNotification;
            setNotifications((prev) => [newN, ...prev].slice(0, 30));
            setUnreadCount((c) => c + 1);
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch { /* realtime unavailable — polling covers it */ }

    // Fallback polling every 30 s
    pollRef.current = setInterval(() => { void loadNotifications(); }, 30_000);

    return () => {
      mountedRef.current = false;
      if (pollRef.current)    clearInterval(pollRef.current);
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
    };
  }, [accessToken, profile?.id, loadNotifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, reload: loadNotifications };
}
