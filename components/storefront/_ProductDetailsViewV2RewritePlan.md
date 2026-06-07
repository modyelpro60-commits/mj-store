Wireframe (top → bottom) for the rewritten **ProductDetailsViewV2.tsx**

1) Background effects remain (AuroraBackground, FloatingParticles, MouseGlow).

2) Sticky/compact Top Bar
   - Back button (left)
   - Small rating + review count pill (only if reviews exist)
   - Small sold-count pill (only if sales_count > 0)

3) “Battle Lobby” Hero (NEW layout)
   - Left column: big product image in a tilted frame
   - Right column: info panel inside a different visual container
     - Product name (very large)
     - Premium label only if we can infer from real data (otherwise omit)
     - Real description preview (clamped by chars, not only first paragraph)
     - Read more toggle that reveals the remaining description (real data)
     - Price block + Buy Now CTA

4) Content Row: Description + Features in a single cohesive section
   - Left: Description block (full text, scrollable if long)
   - Right: Features block (only if features.length > 0)
   - If either is missing, that column is omitted (no placeholders)

5) Reviews Section (de-emphasized)
   - Header row with icon + “Reviews”
   - Write-review form OR login call-to-action (kept)
   - Reviews list:
     - show first N reviews (e.g. 3)
     - “Load more” toggles to show the rest (no fake pagination)
   - Loading + empty states kept

6) Bottom CTA Bar (NEW)
   - Fixed bar with price + Buy Now CTA
   - Only uses real price

No debug text. No fake trust badges. No generic stats. No delivery/activation estimates. If data doesn’t exist, the entire block is hidden.

