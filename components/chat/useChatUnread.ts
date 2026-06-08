"use client";

import { useEffect, useState } from "react";

/**
 * Polls /api/chat/unread and returns the current unread count for the
 * logged-in user (staff → open customer rooms; user → unread staff replies).
 */
export function useChatUnread(
  accessToken: string | null,
  enabled: boolean,
  intervalMs = 5000
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setCount(0);
      return;
    }

    let alive = true;

    async function tick() {
      // Skip while the tab is hidden — saves background CPU/network
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/chat/unread", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const d = await res.json();
        if (alive && d.success) setCount(d.count ?? 0);
      } catch {
        /* ignore transient errors */
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [accessToken, enabled, intervalMs]);

  return count;
}
