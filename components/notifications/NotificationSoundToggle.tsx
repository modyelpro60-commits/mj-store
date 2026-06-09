"use client";

import { useCallback } from "react";
import { Bell, BellOff, Play, Volume2, VolumeX } from "lucide-react";
import { useNotificationSound } from "../../lib/sounds/useNotificationSound";

/**
 * NotificationSoundToggle
 * ────────────────────────
 * Renders an ON/OFF toggle for notification sounds plus a
 * "test sound" button. Designed to be embedded in user settings
 * pages or inside the NotificationBell dropdown footer.
 *
 * variant="card"   → full card with label, description, and test button
 * variant="inline" → compact toggle chip (for the bell dropdown footer)
 */
export default function NotificationSoundToggle({
  variant = "card",
}: {
  variant?: "card" | "inline";
}) {
  const { enabled, setEnabled, playNotification, playMessage } = useNotificationSound();

  /** Warm up the AudioContext then invoke `play` */
  function withWarmup(play: () => void) {
    if (typeof window === "undefined") return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        const tmp = new Ctor();
        void tmp.resume().then(() => tmp.close());
      }
    } catch {}
    play();
  }

  const testNotif   = useCallback(() => withWarmup(playNotification), [playNotification]);
  const testMessage = useCallback(() => withWarmup(playMessage),      [playMessage]);

  /* ── Inline variant (used inside NotificationBell footer) ── */
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all",
            enabled
              ? "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
              : "border-white/[0.06] bg-white/[0.03] text-white/25 hover:text-white/50",
          ].join(" ")}
          title={enabled ? "Mute notification sounds" : "Enable notification sounds"}
        >
          {enabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          {enabled ? "Sounds on" : "Sounds off"}
        </button>

        {enabled && (
          <button
            type="button"
            onClick={testNotif}
            title="Test sound"
            className="grid h-6 w-6 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/20 hover:text-purple-300 hover:border-purple-500/20 transition-all"
          >
            <Play className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    );
  }

  /* ── Card variant (used on account / settings page) ── */
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-zinc-900/40 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={[
          "grid h-9 w-9 place-items-center rounded-xl border transition-colors",
          enabled
            ? "border-purple-500/25 bg-purple-500/10 text-purple-300"
            : "border-white/[0.06] bg-zinc-800/60 text-zinc-600",
        ].join(" ")}>
          {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white">Notification Sounds</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {enabled ? "Playing sounds for new notifications" : "All notification sounds muted"}
          </p>
        </div>
        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={[
            "relative h-6 w-10 flex-shrink-0 rounded-full border transition-all duration-200 focus:outline-none",
            enabled
              ? "border-purple-500/40 bg-purple-600"
              : "border-white/[0.08] bg-zinc-800",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-200",
              enabled ? "left-[calc(100%-18px)]" : "left-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Sound type descriptions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-zinc-950/40 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 grid place-items-center rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Volume2 className="h-3 w-3 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-300">Notification chime</p>
              <p className="text-[10px] text-zinc-600">Orders, payments, status updates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={testNotif}
            disabled={!enabled}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/30 transition-all hover:text-white/60 hover:border-white/[0.10] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play className="h-2.5 w-2.5" />
            Test
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-zinc-950/40 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 grid place-items-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Volume2 className="h-3 w-3 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-300">Message ping</p>
              <p className="text-[10px] text-zinc-600">New chat messages & replies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={testMessage}
            disabled={!enabled}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/30 transition-all hover:text-white/60 hover:border-white/[0.10] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play className="h-2.5 w-2.5" />
            Test
          </button>
        </div>
      </div>

      <p className="text-[10px] text-zinc-700 leading-relaxed">
        Setting is saved locally in your browser. Sounds only play when a new notification arrives —
        never for notifications loaded on page refresh.
      </p>
    </div>
  );
}
