import { MJMark } from "../brand/MJLogo";

/* MJ STORE branded hero panel — features the chrome MJ logo.
 * Fully static (no animation / blur) so it stays light. */
export default function MJHeroBrand() {
  const chips = ["STREAMING", "GAMING", "AI", "MUSIC"];

  return (
    <div
      className="relative w-full h-[280px] md:h-[360px] overflow-hidden rounded-[1.5rem] border border-purple-500/15"
      style={{
        background:
          "radial-gradient(circle at 50% 32%, rgba(124,58,237,0.30) 0%, rgba(8,8,22,0) 62%), linear-gradient(160deg,#0C0C24 0%,#08081A 60%,#060612 100%)",
      }}
    >
      {/* Micro grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(circle at 50% 42%, #000 35%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 42%, #000 35%, transparent 78%)",
        }}
      />

      {/* Corner accent glows */}
      <div aria-hidden className="absolute -top-10 -left-10 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.22), transparent 70%)" }} />
      <div aria-hidden className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full" style={{ background: "radial-gradient(circle, rgba(217,70,239,0.18), transparent 70%)" }} />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* The chrome MJ logo */}
        <MJMark size={120} glow className="md:!h-[150px]" />

        {/* "— STORE —" wordmark (completes the brand name under the MJ mark) */}
        <div className="flex items-center justify-center gap-3 -mt-1">
          <span className="h-px w-9 md:w-12 bg-gradient-to-r from-transparent to-purple-400/55" />
          <span className="text-sm md:text-base font-black tracking-[0.5em] pl-[0.5em] text-purple-100/85">
            STORE
          </span>
          <span className="h-px w-9 md:w-12 bg-gradient-to-l from-transparent to-purple-400/55" />
        </div>

        {/* Service chips */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-purple-500/25 bg-purple-500/[0.08] px-3 py-1 text-[10px] font-bold tracking-[0.15em] text-purple-100/80"
            >
              {c}
            </span>
          ))}
        </div>

        <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.25em] text-white/35">
          INSTANT · SECURE · 24/7
        </p>
      </div>
    </div>
  );
}
