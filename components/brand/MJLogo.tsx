/* ════════════════════════════════════════════════════════════════
 *  MJ STORE — brand identity
 *  MJMark : the chrome "MJ" monogram (brand logo image)
 *  MJLogo : horizontal lockup → mark + "MJ STORE" wordmark
 * ════════════════════════════════════════════════════════════════ */

export function MJMark({
  size = 36,
  className = "",
  glow = false,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-mark.png"
      alt="MJ Store"
      draggable={false}
      className={`select-none ${className}`}
      style={{
        height: size,
        width: "auto",
        filter: glow ? "drop-shadow(0 0 12px rgba(168,85,247,0.5))" : undefined,
      }}
    />
  );
}

export default function MJLogo({
  size = 34,
  showText = true,
  className = "",
  glow = false,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  glow?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <MJMark size={size} glow={glow} />
      {showText && (
        <span
          className="font-black leading-none tracking-[0.06em] text-white"
          style={{ fontSize: Math.round(size * 0.46) }}
        >
          MJ{" "}
          <span className="bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
            STORE
          </span>
        </span>
      )}
    </span>
  );
}
