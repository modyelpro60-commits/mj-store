"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY  = "mj_chat_sounds_v2";
const DEBOUNCE_MS  = 600; // don't play twice in quick succession

type ACtx = AudioContext;

function getCtxSingleton(ref: React.MutableRefObject<ACtx | null>): ACtx | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ref.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ref.current = new Ctor();
    }
    if (ref.current.state === "suspended") void ref.current.resume();
    return ref.current;
  } catch { return null; }
}

/**
 * useChatSounds
 * ─────────────
 * Two synthesised notification sounds, no audio files required.
 *
 *  playIncoming()   – soft descending two-tone chime (new message from other party)
 *  playOutgoing()   – very quiet single tick (message sent confirmation)
 */
export function useChatSounds() {
  const [enabled, setEnabledState] = useState(true);
  const ctxRef  = useRef<ACtx | null>(null);
  const lastRef = useRef(0);

  /* Load from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) setEnabledState(raw !== "false");
    } catch {}
  }, []);

  /* Expose setter so toggle is persisted */
  function setEnabled(v: boolean) {
    setEnabledState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
  }

  /* Warm up AudioContext on first interaction */
  useEffect(() => {
    const warm = () => getCtxSingleton(ctxRef);
    window.addEventListener("pointerdown", warm, { once: true });
    return () => window.removeEventListener("pointerdown", warm);
  }, []);

  /* Incoming: two-tone descending chime (A5 → F#5) */
  const playIncoming = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastRef.current < DEBOUNCE_MS) return;
    lastRef.current = now;

    const ctx = getCtxSingleton(ctxRef);
    if (!ctx) return;
    const t = ctx.currentTime;

    const freqs = [880, 740];
    freqs.forEach((freq, i) => {
      const delay = i * 0.13;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "highshelf";
      filt.frequency.value = 2500;
      filt.gain.value = 4;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.11, t + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.55);
      osc.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.6);
    });
  }, [enabled]);

  /* Outgoing: very short quiet click/tick */
  const playOutgoing = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtxSingleton(ctxRef);
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1050;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }, [enabled]);

  return { enabled, setEnabled, playIncoming, playOutgoing };
}
