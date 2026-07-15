# Image Compressor Studio — Audit

- URL: https://afrotools.com/tools/image-compress/
- File: `tools/image-compress/index.html`
- Reviewed: 2026-07-14

## What it does
Batch client-side image compressor ("Tier Gold" studio UI). Users drop, paste (Ctrl+V), or
choose multiple images (JPG/PNG/WebP/AVIF, up to 50MB each). Features:
- Export recipes/presets: WhatsApp Share, Portal Upload, Marketplace, Fast Website.
- Quality slider, output format (auto-smallest / JPEG / WebP / PNG), target-KB mode
  (binary search over quality), max width/height resize with no-upscale option,
  JPEG background fill for transparency, filename suffix.
- Per-file + "Download all" batch export, before/after compare slider, savings metrics
  (original/output/%), local run history, persisted settings.

## Client-side / privacy — VERIFIED
Fully local. Uses `createImageBitmap` → `<canvas>` → `canvas.toBlob` → object URLs;
settings/history in `localStorage`. No `fetch`/XHR/upload of image data anywhere in the
inline engine. Canvas re-encode also strips EXIF/GPS. Privacy claim is accurate and already
stated in hero, badges ("No upload", "Client-side"), a "Why this is safe" panel, and FAQ.

## Competitors & gaps (TinyPNG, Squoosh)
- Strong vs TinyPNG: true privacy (TinyPNG uploads to server), batch, target-size, presets,
  local history, resize+convert in one pass — all client-side and free with no quota.
- Vs Squoosh: Squoosh uses WASM codecs (mozjpeg/oxipng/libwebp) for better ratios and gives
  a live quality/size dial per codec. This tool relies on the browser's native `toBlob`
  encoders, so PNG is not truly re-optimized (lossless-ish, minimal savings) and AVIF export
  is unavailable in most browsers.
- Gaps worth noting (not fixed — out of surgical scope): no ZIP for "Download all" (fires N
  sequential downloads, 150ms apart — can trip browser multi-download prompts); PNG output
  offers little compression benefit; no AVIF encode.

## SEO
- Title (69 chars): keyword + intent, good.
- Meta description: 156 chars (in 120–160), good.
- Single H1 "Image Compressor Studio" (keyworded), clean h2/h3 hierarchy.
- JSON-LD: WebApplication, WebPage, FAQPage, BreadcrumbList — all 4 parse; FAQPage exactly
  mirrors the 5 visible FAQ items. Canonical + en/fr/sw + x-default hreflang present.
- Good content depth (intro paragraph, FAQ, verification/limitations panel, related tools).

## UX / a11y
- Upload → recipe → tune → compress → download flow is clear; auto-recompress on change.
- Mobile: responsive grids collapse to 1-col at 980/640px; controls meet size targets.
- All inputs labelled (label/aria-label); compare images have alt text; drop zone is
  keyboard-operable (Enter/Space).
- Defects found: (1) hero `::after` watermark had mojibake `content:'???'` rendering faint
  literal question marks; (2) `.preset-grid` used `role="list"` but children are `<button>`
  (no `listitem`), an invalid ARIA structure.

## Fixes applied 2026-07-14
- Hero watermark: `content:'???'` → `content:''` (removes broken glyph; decorative only).
- Preset grid ARIA: `role="list"` → `role="group" aria-label="Export recipe presets"`
  (valid grouping for the button set).
- Verified all JSON-LD parses via node; no title/meta/H1/privacy changes needed (already
  compliant). No shared libs/assets touched.

## Deferred (out of scope / not defects)
- ZIP-based "Download all", WASM codecs for better PNG/AVIF, per-preset AVIF — product
  enhancements, not audit fixes.
- Orange "#b84315" Tier-Gold accents left as-is (deliberate tier theme, no accent border bars).
