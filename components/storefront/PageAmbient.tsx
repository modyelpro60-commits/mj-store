/*
 * PageAmbient — full-page atmospheric depth layer.
 * Static blurred blobs at 3–4 % opacity for depth without cost.
 * (Previously these animated their position, which forced the browser to
 * re-composite three huge blurred layers every frame — kept static now.)
 */
export default function PageAmbient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Blob A — purple, upper-product zone */}
      <div className="absolute top-[55%] right-[-8%] h-[65vh] w-[65vh] rounded-full bg-purple-700/[0.04] blur-[100px]" />
      {/* Blob B — fuchsia, lower-product / footer zone */}
      <div className="absolute top-[78%] left-[-6%] h-[50vh] w-[50vh] rounded-full bg-fuchsia-700/[0.03] blur-[90px]" />
      {/* Blob C — indigo, mid-page — nearly imperceptible */}
      <div className="absolute top-[42%] left-[28%] h-[40vh] w-[40vh] rounded-full bg-indigo-800/[0.03] blur-[110px]" />
    </div>
  );
}
