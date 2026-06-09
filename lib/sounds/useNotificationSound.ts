"use client";

/**
 * useNotificationSound
 * ─────────────────────
 * Web Audio API-based notification sounds — no external files required.
 *
 * Two synthesized sounds:
 *  • playNotification() — two-tone ascending chime (Discord-style, A5→C#6)
 *  • playMessage()      — soft single descending ding (Slack-style)
 *
 * Optional override: place MP3 files at /public/sounds/notification.mp3
 * and /public/sounds/message.mp3. The hook will try them first and fall
 * back to synthesis if they are absent or fail to load.
 *
 * Smart de-duplication: processNotifications() seeds "seen" IDs on first
 * call (initial page load) so it never fires for old notifications.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Constants ─────────────────────────────────────────── */
const STORAGE_KEY = "mj_notification_sounds";

/** Types that trigger the softer message-ping instead of the chime */
const MESSAGE_TYPES = new Set([
  "new_message",
  "support_reply",
  "review_reply",
]);

/* ─── Helpers ────────────────────────────────────────────── */
type ACtx = AudioContext;

/** Create a GainNode with a smooth bell-curve envelope */
function bell(
  ctx: ACtx,
  startTime: number,
  vol: number,
  attackMs: number,
  decayMs: number
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(vol, startTime + attackMs / 1000);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + (attackMs + decayMs) / 1000);
  return g;
}

/** Thin high-shelf filter for the "glassy" shimmer */
function glassFilter(ctx: ACtx): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = "highshelf";
  f.frequency.value = 2200;
  f.gain.value = 5;
  return f;
}

export interface SoundNotification {
  id: number;
  type: string;
}

/* ─── Main hook ──────────────────────────────────────────── */
export function useNotificationSound() {
  const [enabled, setEnabledState] = useState(true);

  /* Internal refs — safe across re-renders without triggering effects */
  const ctxRef         = useRef<ACtx | null>(null);
  const seenIdsRef     = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);
  const lastPlayedAt   = useRef(0); // ms timestamp — debounce guard

  /* ── Load preference from localStorage (client only) ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) setEnabledState(raw !== "false");
    } catch {}
  }, []);

  function setEnabled(val: boolean) {
    setEnabledState(val);
    try { localStorage.setItem(STORAGE_KEY, String(val)); } catch {}
  }

  /* ── Lazy AudioContext ── */
  const getCtx = useCallback((): ACtx | null => {
    if (typeof window === "undefined") return null;
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      }
      if (ctxRef.current.state === "suspended") {
        void ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  /* ── Warm up AudioContext on first user interaction ── */
  useEffect(() => {
    const warmUp = () => getCtx();
    document.addEventListener("click",   warmUp, { once: true });
    document.addEventListener("keydown", warmUp, { once: true });
    document.addEventListener("touchend",warmUp, { once: true });
    return () => {
      document.removeEventListener("click",   warmUp);
      document.removeEventListener("keydown", warmUp);
      document.removeEventListener("touchend",warmUp);
    };
  }, [getCtx]);

  /* ── Debounce guard ── */
  function canPlay(): boolean {
    const now = Date.now();
    if (now - lastPlayedAt.current < 600) return false;
    lastPlayedAt.current = now;
    return true;
  }

  /* ── Notification chime ─────────────────────────────────
   *  Two-tone ascending ding — A5 (880 Hz) → C#6 (1109 Hz)
   *  Total duration ≈ 650 ms  |  Volume: subtle
   * ─────────────────────────────────────────────────────── */
  const playNotification = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx || ctx.state !== "running") return;
    if (!canPlay()) return;

    const t = ctx.currentTime;
    const notes = [
      { freq: 880,  startOffset: 0,    attack: 6,  decay: 360, vol: 0.15 },
      { freq: 1109, startOffset: 0.13, attack: 6,  decay: 420, vol: 0.12 },
    ] as const;

    notes.forEach(({ freq, startOffset, attack, decay, vol }) => {
      const osc1  = ctx.createOscillator(); // fundamental
      const osc2  = ctx.createOscillator(); // 2nd harmonic (low, for body)
      const filt  = glassFilter(ctx);
      const gain  = bell(ctx, t + startOffset, vol, attack, decay);
      const gain2 = bell(ctx, t + startOffset, vol * 0.08, attack, decay); // very quiet

      osc1.type = "sine";
      osc1.frequency.value = freq;
      osc2.type = "sine";
      osc2.frequency.value = freq * 2;

      osc1.connect(filt);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      filt.connect(gain);
      gain.connect(ctx.destination);

      const stop = t + startOffset + (attack + decay) / 1000 + 0.05;
      osc1.start(t + startOffset);
      osc2.start(t + startOffset);
      osc1.stop(stop);
      osc2.stop(stop);
    });
  }, [enabled, getCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Message ping ──────────────────────────────────────
   *  Single soft descending ding — 880 Hz → 698 Hz (A5 → F5)
   *  Total duration ≈ 300 ms  |  Volume: quieter than chime
   * ─────────────────────────────────────────────────────── */
  const playMessage = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx || ctx.state !== "running") return;
    if (!canPlay()) return;

    const t    = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const filt = glassFilter(ctx);
    const gain = bell(ctx, t, 0.11, 4, 280);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(698, t + 0.06);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.34);
  }, [enabled, getCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Process notification list ─────────────────────────
   *  Call this every time the notifications array updates.
   *  First invocation: seeds IDs silently (initial page load).
   *  Subsequent: plays sound for each unseen notification ID.
   * ─────────────────────────────────────────────────────── */
  const processNotifications = useCallback(
    (list: SoundNotification[]) => {
      if (!initializedRef.current) {
        list.forEach((n) => seenIdsRef.current.add(n.id));
        initializedRef.current = true;
        return;
      }

      for (const n of list) {
        if (!seenIdsRef.current.has(n.id)) {
          seenIdsRef.current.add(n.id);
          if (MESSAGE_TYPES.has(n.type)) {
            playMessage();
          } else {
            playNotification();
          }
          // Only one sound per batch — avoids noise bursts
          break;
        }
      }
    },
    [playMessage, playNotification]
  );

  return {
    enabled,
    setEnabled,
    playNotification,
    playMessage,
    processNotifications,
  };
}
