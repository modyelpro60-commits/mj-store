"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const THROTTLE_MS = 1200; // max 1 broadcast per 1.2s per user
const EXPIRE_MS   = 3500; // clear "other is typing" after 3.5s silence

/**
 * useTypingBroadcast
 * ──────────────────
 * Uses Supabase Realtime broadcast channels to exchange typing events.
 * No DB writes — purely ephemeral P2P signalling.
 *
 * @param roomId   Active room (null = not connected)
 * @param myId     Unique identifier for this client (userId)
 */
export function useTypingBroadcast(roomId: string | null, myId: string | null) {
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const clearTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef    = useRef(0);
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ── Subscribe / unsubscribe on room change ── */
  useEffect(() => {
    if (!roomId) { setOtherIsTyping(false); return; }

    const ch = supabase.channel(`chat-typing:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "typing" }, ({ payload }: { payload: Record<string, string> }) => {
      if (payload?.sender === myId) return; // ignore own echo (redundant with self:false)
      setOtherIsTyping(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setOtherIsTyping(false), EXPIRE_MS);
    }).subscribe();

    channelRef.current = ch;

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
      setOtherIsTyping(false);
    };
  }, [roomId, myId]);

  /* ── Broadcast that this user is typing (throttled) ── */
  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (!channelRef.current || !roomId || now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: myId ?? "anon" },
    });
  }, [roomId, myId]);

  return { otherIsTyping, broadcastTyping };
}
