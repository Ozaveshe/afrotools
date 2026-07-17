# Colour Palette Generator — Audit

Tool: African Colour Palette Generator
Live: https://afrotools.com/tools/colour-palette/
File: `tools/colour-palette/index.html`

## What it does
Client-side browser of 50+ curated African-inspired colour palettes (Kente, Ankara, Maasai, Ndebele, Bogolan, landscapes, flags, modern-city themes). Category filter chips, Random Palette, click any swatch or hex tag to copy, per-palette "CSS vars" export + "Copy all", and full-set "Export All as CSS" / "Export as JSON". All data is a static `PALETTES` array in-page; no network calls.

## Competitors & gaps
- **Coolors / Adobe Color / Khroma**: generate *new* palettes algorithmically, lock/adjust colours, and show contrast/accessibility checks. This tool is a *curated preset browser*, not a generator — its differentiator is authentic African cultural sourcing, which competitors lack.
- Gaps vs. competitors: no on-the-fly colour editing/locking, no RGB/HSL toggle in UI (hex only), no WCAG contrast indicator, no shareable palette URL. These are product enhancements, out of surgical scope — noted for backlog.

## Verify
- Works live: palette grid, filters, copy toast, CSS/JSON exports all render and function (confirmed via source + live fetch).
- Copy uses `navigator.clipboard` with graceful fallback messaging.

## SEO
- Title/meta/H1 keyword-aligned with African intent; H1 unique.
- JSON-LD: WebApplication (DesignApplication), WebPage, BreadcrumbList, FAQPage — FAQPage mirrors the 3 visible FAQ items exactly. No HowTo added (no discrete visible numbered steps to mirror).

## UX / a11y
- Mobile: responsive grid (`minmax(280px,1fr)`), fine at 375px.
- a11y gap fixed: colour swatches (`<div>`) and hex tags (`<span>`) had `onclick` only — not keyboard-operable and unlabeled.

## Fixes applied 2026-07-14
- `<title>` → "African Colour Palette Generator — 50+ Free Hex Palettes | AfroTools" (adds free/hex intent).
- Clickable swatches + hex tags now `role="button" tabindex="0" aria-label="Copy #HEX"` with an `onkeydown` handler (`kc()`) so Enter/Space copy — keyboard + screen-reader operable.
- Verified all 4 ld+json blocks parse via node.

## Deferred (product backlog, not surgical)
- In-UI RGB/HSL toggle, WCAG contrast badge, palette editing/locking, shareable palette permalinks.
