# MJ Store — SIGNAL Design System

**Version:** 1.0  
**Stack:** Next.js 16 · Tailwind CSS v4 · Framer Motion · JetBrains Mono + Geist Sans  
**Config:** CSS-first via `app/globals.css` — no `tailwind.config.ts` needed (Tailwind v4)

---

## Brand Concept

MJ Store is a **transfer terminal** — the place where digital power moves into the operator's hands.

- Sells: Digital subscriptions · AI tools · Gaming services · Digital products  
- Feel: Futuristic · Premium · Cyberpunk · High-end  
- Not a clone of: Steam, Epic, Battle.net, PlayStation Store  

---

## Color System

All color tokens live in the `@theme` block in `globals.css`.  
They generate Tailwind utilities automatically: `bg-*`, `text-*`, `border-*`.

### Void Palette — Depth / Background Layers

| Token | Hex | Tailwind Class | Use |
|---|---|---|---|
| `--color-void-base` | `#04040A` | `bg-void-base` | Page background (deepest) |
| `--color-void-surface` | `#09091A` | `bg-void-surface` | Card backgrounds |
| `--color-void-elevated` | `#0D0D24` | `bg-void-elevated` | Hover / active surfaces |
| `--color-void-overlay` | `#12122E` | `bg-void-overlay` | Modals, dropdowns |
| `--color-void-line` | `#1A1A3A` | `border-void-line` | Default borders |

### Signal Palette — Identity / Interaction

| Token | Hex | Tailwind Class | Use |
|---|---|---|---|
| `--color-signal-cyan` | `#00D9FF` | `text-signal-cyan` `bg-signal-cyan` | **PRIMARY** — electric, AI, precision |
| `--color-signal-purple` | `#7C3AED` | `text-signal-purple` | **SECONDARY** — gaming depth, premium |
| `--color-signal-lime` | `#A3FF47` | `text-signal-lime` | **ACCENT** — featured / new / hot items |

> **Why cyan as primary?**  
> Every competitor in this space uses purple as primary. Cyan reads as AI, data precision, clinical tech — differentiating MJ Store before a word is read. Purple stays as secondary to cover the gaming dimension.  
> Lime green as the featured accent is the brand's "signature surprise" — the first color the eye hits on any card.

### State Palette

| Token | Hex | Tailwind Class | Use |
|---|---|---|---|
| `--color-state-success` | `#00FF94` | `text-state-success` | Completed, access granted |
| `--color-state-warning` | `#FFB547` | `text-state-warning` | Pending, processing |
| `--color-state-danger` | `#FF3A3A` | `text-state-danger` | Cancelled, banned, error |
| `--color-state-neutral` | `#4A4A6A` | `text-state-neutral` | Inactive, disabled |

### Text Scale

| Token | Hex | Tailwind Class | Use |
|---|---|---|---|
| `--color-text-primary` | `#E8E8FF` | `text-text-primary` | Body text (near-white, cool tint) |
| `--color-text-secondary` | `#8888AA` | `text-text-secondary` | Secondary labels |
| `--color-text-muted` | `#44445A` | `text-text-muted` | Placeholders, captions |

### Raw CSS Variables — Glow & Tint

These are NOT Tailwind tokens. Use them via `var()` or via the `@utility` glow classes below.

```css
/* Glow presets (box-shadow values) */
--glow-cyan-sm
--glow-cyan-md
--glow-cyan-lg

--glow-purple-sm
--glow-purple-md
--glow-purple-lg

--glow-lime-sm
--glow-lime-md
--glow-lime-lg

/* Card shadows */
--shadow-card    /* subtle float */
--shadow-float   /* elevated float */

/* Section tints (ambient background color) */
--tint-cyan      /* rgba(0, 217, 255, 0.08) */
--tint-purple    /* rgba(124, 58, 237, 0.08) */
--tint-lime      /* rgba(163, 255, 71,  0.08) */
```

---

## Typography

Fonts are loaded in `app/layout.tsx` via `next/font/google` (zero-install, self-hosted by Next.js).  
The CSS variables `--font-geist` and `--font-jetbrains` are injected into `<html>` at runtime.  
The `@theme` block maps these to `font-sans` and `font-mono` Tailwind utilities.

### Fonts

| Font | Variable | Tailwind Class | Role |
|---|---|---|---|
| **Geist** | `--font-geist` | `font-sans` | Display, body, all human-facing text |
| **JetBrains Mono** | `--font-jetbrains` | `font-mono` | Data, IDs, prices, category tags, terminal readouts |

### The Two-Voice System

MJ Store's typographic identity uses two voices simultaneously:

**MONOSPACE VOICE** — for data, labels, system readouts:
```
// CATEGORY: AI.TOOLS
// STATUS: ACTIVE
// PRICE: 1,200 EGP
[01] Feature capability
> SYSTEM.READY
```

**SANS VOICE** — for product names, descriptions, human content:
```
ACQUIRE DIGITAL POWER.
Premium digital access for operators who demand more.
```

The contrast between these two voices IS the typographic identity. Every screen has both.

### Type Scale

| Name | Size | Weight | Tracking | Line Height | Use |
|---|---|---|---|---|---|
| Display | `clamp(64px, 8vw, 120px)` | 900 | `-0.04em` | `0.88` | Hero H1 |
| Headline | `clamp(32px, 4vw, 56px)` | 900 | `-0.025em` | `0.95` | Section titles |
| Title | `clamp(20px, 2.5vw, 28px)` | 700 | `-0.01em` | `1.1` | Card titles |
| Body | `16px–18px` | 500 | `0` | `1.6` | Descriptions |
| Label | `10px–12px` | 700 | `0.22em` | `1` | ALL CAPS labels (mono) |
| Mono | `13px–14px` | 400–600 | `0.04em` | — | Data readouts |

### Custom Typography Utilities

```html
<!-- mono-label: "// TAG.FORMAT" convention -->
<span class="mono-label text-signal-cyan">// AI.TOOLS</span>

<!-- data-readout: price / ID / stat numbers -->
<span class="data-readout">◆ 1,200 EGP</span>

<!-- display-headline: hero heading treatment -->
<h1 class="display-headline">ACQUIRE DIGITAL POWER.</h1>
```

---

## Shape Language — The Cut

The signature shape of every MJ Store card. A 45° clip on the top-right corner.  
Nowhere else uses this — it's the visual fingerprint.

### Utility Classes

```html
<!-- Single cut, top-right (default card size) -->
<div class="cut-corner">...</div>

<!-- Single cut, smaller -->
<div class="cut-corner-sm">...</div>

<!-- Single cut, larger (hero cards) -->
<div class="cut-corner-lg">...</div>

<!-- Double cut, top-right + bottom-left -->
<div class="double-cut">...</div>

<!-- Double cut, large -->
<div class="double-cut-lg">...</div>
```

### Clip-path Values Reference

```css
cut-corner-sm:  polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
cut-corner:     polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)
cut-corner-lg:  polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)
double-cut:     polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))
double-cut-lg:  polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 40px 100%, 0 calc(100% - 40px))
```

> **Note on borders with clip-path:** `border` is clipped too. For a visible border around a cut-corner card, use a wrapper with padding + the opposite background, or use `outline` + negative `outline-offset`, or a pseudo-element.

---

## Border Radius

MJ Store uses tight, intentional radii — not the large rounded corners common in consumer apps.

| Variable | Value | Use |
|---|---|---|
| `--radius-badge` | `3px` | Tags, chips, role badges |
| `--radius-btn` | `6px` | All CTA buttons |
| `--radius-input` | `4px` | Form inputs |
| `--radius-panel` | `2px` | Large panel containers |

In Tailwind: use `rounded-[3px]`, `rounded-[6px]` etc. until a v4 shorthand is configured.

---

## Glow System

Glow is light in void. Every glow color is a signal.

### Utility Classes

```html
<!-- Cyan glow — primary interactions, focus states -->
<div class="glow-cyan-sm">...</div>   <!-- subtle -->
<div class="glow-cyan">...</div>      <!-- standard -->
<div class="glow-cyan-lg">...</div>   <!-- dramatic -->

<!-- Purple glow — secondary / gaming elements -->
<div class="glow-purple-sm">...</div>
<div class="glow-purple">...</div>
<div class="glow-purple-lg">...</div>

<!-- Lime glow — featured / accent elements -->
<div class="glow-lime-sm">...</div>
<div class="glow-lime">...</div>
<div class="glow-lime-lg">...</div>
```

### Glow Values Reference

```css
--glow-cyan-sm:   0 0 16px rgba(0, 217, 255, 0.25)
--glow-cyan-md:   0 0 40px rgba(0, 217, 255, 0.30), 0 0 80px rgba(0, 217, 255, 0.12)
--glow-cyan-lg:   0 0 80px rgba(0, 217, 255, 0.40), 0 0 160px rgba(0, 217, 255, 0.15)

--glow-purple-sm: 0 0 16px rgba(124, 58, 237, 0.25)
--glow-purple-md: 0 0 40px rgba(124, 58, 237, 0.30), 0 0 80px rgba(124, 58, 237, 0.12)
--glow-purple-lg: 0 0 80px rgba(124, 58, 237, 0.40), 0 0 160px rgba(124, 58, 237, 0.15)

--glow-lime-sm:   0 0 16px rgba(163, 255, 71, 0.30)
--glow-lime-md:   0 0 40px rgba(163, 255, 71, 0.35), 0 0 80px rgba(163, 255, 71, 0.12)
--glow-lime-lg:   0 0 80px rgba(163, 255, 71, 0.45), 0 0 160px rgba(163, 255, 71, 0.15)
```

### Shadow Utilities

```html
<!-- Subtle card float -->
<div class="shadow-card">...</div>

<!-- Strong elevation -->
<div class="shadow-float">...</div>
```

---

## Background Textures

### Signal Grid

A micro-grid overlay that gives the void background a structured, technical feel.

```html
<!-- 48px grid — standard use -->
<div class="signal-grid">...</div>

<!-- 80px grid — hero sections, large panels -->
<div class="signal-grid-lg">...</div>
```

### Section Tints

For ambient coloring of product sections by category.

```html
<section class="tint-cyan">...</section>    <!-- AI Tools sections -->
<section class="tint-purple">...</section>  <!-- Gaming Services sections -->
<section class="tint-lime">...</section>    <!-- Featured / New sections -->
```

---

## Animation System

All keyframes are prefixed `mj-` to prevent collisions with Tailwind or third-party animations.

### Animation Rules

| Rule | Detail |
|---|---|
| **Animate signal, not decoration** | Every animation communicates state change, response, or data. Nothing exists purely for flair. |
| **Speed hierarchy** | Microinteractions: 150–250ms · Transitions: 300–400ms · Page entrances: 400–600ms · Ambients: 8–40s |
| **Easing intent** | `ease-out` for entering · `ease-in` for exiting · `linear` for loops · spring for interactive |
| **Reduced motion** | All looping animations must check `prefers-reduced-motion` and stop or simplify |
| **One global canvas** | NeuralVoid runs globally. No page mounts an additional full-screen animation on top of it. |

### Keyframes Reference

| Name | Keyframe | Purpose |
|---|---|---|
| Signal Pulse | `mj-signal-pulse` | Status LED heartbeat (available / active) |
| Cursor Blink | `mj-cursor-blink` | Terminal typing cursor |
| Scan Line | `mj-scan-line` | Horizontal sweep over product images |
| Marquee | `mj-marquee` | Signal Feed auto-scroll (CSS-only) |
| Boot Expand | `mj-boot-expand` | Terminal line types in on page load |
| Charge Fill | `mj-charge-fill` | CTA button fills left-to-right on hover |
| Fade In Up | `mj-fade-in-up` | Standard component entrance |
| Hologram Rock | `mj-hologram-rock` | Subtle Y-axis sway on product images |

### Animation Utility Classes

```html
<!-- Status LED — pulsing availability indicator -->
<span class="animate-signal-pulse w-1.5 h-1.5 rounded-full bg-state-success"></span>

<!-- Terminal cursor -->
<span class="animate-cursor-blink">█</span>

<!-- Signal Feed marquee container -->
<div class="animate-marquee hover:animate-marquee-paused flex gap-4">...</div>

<!-- Product hologram sway -->
<img class="animate-hologram" src="..." />

<!-- Entrance animation -->
<div class="animate-fade-in-up">...</div>
```

---

## Z-Index Scale

```css
--z-base:    0    /* normal document flow */
--z-raised:  10   /* floating cards, tooltips */
--z-overlay: 20   /* sidebars, drawers */
--z-nav:     50   /* CommandBar navigation */
--z-modal:   100  /* modals, alerts */
```

In Tailwind: `z-[var(--z-nav)]` or set `z-50`, `z-[100]` directly.

---

## Brand Language

### Vocabulary

| Old | New |
|---|---|
| Buy Now | Acquire |
| Add to Cart | Claim Access |
| Checkout | Authorization |
| My Account | Console |
| Products | Modules |
| Orders | Operations |
| Features | Capabilities |
| Members | Operators |
| Dashboard | Ops Center |

### Category Tag Format

Category tags always use `// NAMESPACE.CATEGORY` in JetBrains Mono, Signal Cyan.

```html
<span class="mono-label text-signal-cyan">// AI.TOOLS</span>
<span class="mono-label text-signal-cyan">// GAMING.SVC</span>
<span class="mono-label text-signal-cyan">// DIGITAL.PKG</span>
<span class="mono-label text-signal-cyan">// SUBSCRIPTIONS</span>
```

### Price Format

Prices always lead with the `◆` diamond glyph.

```html
<span class="data-readout">◆ 1,200 EGP</span>
```

### Status LED

A 6px circle that pulses using `animate-signal-pulse`.

```html
<!-- Available / Active -->
<span class="w-1.5 h-1.5 rounded-full bg-state-success animate-signal-pulse inline-block" />

<!-- Pending -->
<span class="w-1.5 h-1.5 rounded-full bg-state-warning inline-block" />

<!-- Inactive / Sold out -->
<span class="w-1.5 h-1.5 rounded-full bg-state-neutral inline-block" />
```

---

## The 7 Unmistakable Signatures

These elements make MJ Store instantly recognizable, even without a logo.

| # | Signature | Implementation |
|---|---|---|
| 1 | **The Cut** | `cut-corner` clip-path on every card |
| 2 | **`// TAG.FORMAT`** | `mono-label text-signal-cyan` category prefix |
| 3 | **`◆ PRICE EGP`** | Diamond glyph before every price in `data-readout` |
| 4 | **Perimeter Charge** | `conic-gradient` border animation on card hover |
| 5 | **Void + Cyan** | `bg-void-base` + `--color-signal-cyan` palette |
| 6 | **The Language** | Acquire · Module · Operator · Console · Authorization |
| 7 | **Boot Sequence** | Product spec types in character-by-character on first load |

---

## Usage Examples

### A complete Cipher Card skeleton

```tsx
<div className="
  cut-corner
  bg-void-surface
  border border-void-line
  shadow-card
  hover:glow-cyan
  transition-shadow duration-300
  p-5
">
  {/* Category tag */}
  <span className="mono-label text-signal-cyan">// AI.TOOLS</span>

  {/* Status LED */}
  <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-signal-pulse" />

  {/* Product image */}
  <img src={product.image} alt={product.name} className="w-full aspect-[3/4] object-cover mt-3" />

  {/* Name */}
  <h3 className="mt-3 font-sans font-black text-text-primary">{product.name}</h3>

  {/* Price */}
  <p className="data-readout text-signal-cyan mt-2">◆ {product.price} EGP</p>

  {/* CTA */}
  <button className="mt-4 w-full rounded-[6px] border border-signal-cyan text-signal-cyan font-bold py-2">
    ACQUIRE →
  </button>
</div>
```

### A section with signal grid background

```tsx
<section className="bg-void-surface signal-grid tint-cyan py-16 px-8">
  <span className="mono-label text-signal-cyan block mb-4">// LIVE.CATALOG</span>
  {/* content */}
</section>
```

### A glow-on-hover interactive element

```tsx
<motion.div
  whileHover={{ boxShadow: "var(--glow-cyan-md)" }}
  transition={{ duration: 0.2 }}
  className="cut-corner bg-void-surface border border-void-line p-6"
>
  ...
</motion.div>
```

---

## File Reference

| File | Purpose |
|---|---|
| `app/globals.css` | All design tokens, utilities, keyframes (Tailwind v4 CSS-first) |
| `app/layout.tsx` | Font loading (Geist + JetBrains Mono via next/font/google) |
| `docs/design-system.md` | This document — design token reference and usage guide |

---

## Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| **1 — Foundation** | Design tokens · Fonts · Utilities · This doc | ✅ Done |
| **2 — Navigation** | CommandBar replaces StorefrontNavbar | Pending |
| **3 — Product Cards** | CipherCard · cut-corner shape · Perimeter Charge | Pending |
| **4 — Homepage** | PortalZone · SignalFeed · ModuleShowcase · MetricsBar | Pending |
| **5 — Product Detail** | Acquisition Terminal layout · Hologram panel · Boot Sequence | Pending |
| **6 — Checkout** | Authorization Sequence · Terminal form fields · Charge Fill CTA | Pending |
| **7 — Account** | Operator Console · INVENTORY / OPERATIONS / SYSTEM tabs | Pending |
| **8 — Admin** | CommandBar · status badge colors · cleanup | Pending |
