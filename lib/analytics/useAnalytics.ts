"use client";

import { useCallback, useRef } from "react";
import { useAuth } from "../../components/auth/AuthProvider";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("mj-session-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mj-session-id", id);
  }
  return id;
}

export function useAnalytics() {
  const { profile } = useAuth();
  // Prevent duplicate in-flight calls for the same product+event
  const inFlight = useRef(new Set<string>());

  const trackEvent = useCallback(
    async (productId: string | number, eventType: string) => {
      const key = `${productId}:${eventType}`;
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);

      try {
        const session_id = getSessionId();
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: String(productId),
            event_type: eventType,
            session_id,
            user_id: profile?.id ?? null,
          }),
        });
      } catch {
        // analytics failures must never surface to the user
      } finally {
        inFlight.current.delete(key);
      }
    },
    [profile?.id],
  );

  return { trackEvent };
}
