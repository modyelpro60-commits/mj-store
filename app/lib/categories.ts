/**
 * Category utilities — single source of truth for category normalization.
 *
 * Import in:
 *   • API routes  (server)  — sanitizeCategory before DB write
 *   • Admin UI    (client)  — normalizeCategory for live preview
 *   • Storefront  (client)  — sortCategories for display order
 *
 * ─── Future-ready ────────────────────────────────────────────────
 * To add icons, images, ordering, or featured flags later, only
 * extend CategoryConfig and KNOWN_CATEGORIES. No other file changes.
 * ─────────────────────────────────────────────────────────────────
 */

/* ── Default fallback ──────────────────────────────────────────── */
export const DEFAULT_CATEGORY = "General";

/* ── Normalisation ─────────────────────────────────────────────── */

/**
 * Title-case each word and collapse whitespace.
 * "GAMING" → "Gaming"   "gift  cards" → "Gift Cards"
 */
export function normalizeCategory(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Always returns a clean, non-empty, normalized category string.
 * Falls back to DEFAULT_CATEGORY ("General") when input is blank/null.
 */
export function sanitizeCategory(raw: string | null | undefined): string {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return DEFAULT_CATEGORY;
  return normalizeCategory(cleaned);
}

/* ── Known category config ─────────────────────────────────────── */

/**
 * Extend this type when you want to add per-category metadata later.
 * All fields except `label` and `order` are intentionally commented out
 * so you can uncomment+implement them without touching any other file.
 */
export type CategoryConfig = {
  label: string;
  order: number;
  // iconName?:  string;   // lucide-react icon name  — add when ready
  // accentColor?: string; // tailwind accent class    — add when ready
  // imageUrl?:  string;   // hero/thumbnail image URL — add when ready
  // featured?:  boolean;  // pin above others          — add when ready
};

export const KNOWN_CATEGORIES: Record<string, CategoryConfig> = {
  Gaming:        { label: "Gaming",        order: 1 },
  Streaming:     { label: "Streaming",     order: 2 },
  Subscriptions: { label: "Subscriptions", order: 3 },
  Music:         { label: "Music",         order: 4 },
  Software:      { label: "Software",      order: 5 },
  "Gift Cards":  { label: "Gift Cards",    order: 6 },
  General:       { label: "General",       order: 99 },
};

/**
 * Sort an array of category names:
 *  1. By known order (KNOWN_CATEGORIES.order)
 *  2. Unknown categories at position 50 (before General)
 *  3. Alphabetically within the same order bucket
 */
export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const oa = KNOWN_CATEGORIES[a]?.order ?? 50;
    const ob = KNOWN_CATEGORIES[b]?.order ?? 50;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });
}
