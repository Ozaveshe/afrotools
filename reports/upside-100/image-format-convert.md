# Image Format Converter Studio — Audit

- URL: https://afrotools.com/tools/image-format-convert/
- File: `tools/image-format-convert/index.html`
- Logic: `assets/js/lib/image-format-convert-studio.js` (shared image lib — not edited)

## What it does
Batch converts browser-decodable images (HEIC/HEIF, AVIF, SVG, BMP, GIF, PNG, JPG, WebP inputs) to JPG, PNG, WebP, and AVIF. Six presets (portal-safe JPG, web delivery pack, modern bundle, transparent PNG, data saver, clean archive) set format/quality/scale/size/naming. Features: quality + scale sliders, max width/height caps, JPG background flatten color, custom suffix, first-image preview with savings %, per-format download, batch zip with a `manifest.json`, "copy picture markup" (`<picture>` with sources), local history (localStorage), and a live browser-encoder capability check that disables unsupported formats.

## Local / privacy
Fully client-side. Uses `createImageBitmap`/`Image` decode, `canvas.toBlob()` encode, and JSZip assembled in-browser. No `fetch`, `XMLHttpRequest`, `FormData`, or upload anywhere in the logic. All "no upload / stays on this device" claims are accurate.

## Competitors & gaps
- vs Squoosh: Squoosh has advanced codec controls (MozJPEG, OxiPNG, per-codec sliders) and live before/after slider. This tool wins on true batch + zip + manifest + picture markup, which Squoosh lacks.
- vs CloudConvert: CloudConvert supports far more formats (TIFF, PSD, RAW, PDF) and server-side HEIC decode; this tool is limited to what the browser can decode/encode (no server = no guaranteed HEIC/RAW).
- Gaps: no EXIF/orientation preservation (metadata stripped by design — disclosed), no side-by-side quality comparison slider, no per-image (vs global) settings, AVIF/HEIC availability varies by browser.

## SEO
- Title: keyword + intent, 70 chars (slightly long, acceptable) — left as-is.
- Meta description: was 172 chars (over limit) → trimmed to 148.
- H1: was benefit-only, missing core keyword → now "Image format converter: convert to JPG, PNG, WebP, and AVIF locally."
- JSON-LD: WebApplication (MultimediaApplication — semantically correct), WebPage, BreadcrumbList, FAQPage. All 4 parse. FAQPage mirrors the 4 visible `<details>` FAQ items exactly.
- Content depth good: SEO explainer section + 4-item FAQ + verification/limitations panel. hreflang en/fr/sw + canonical present.

## UX / a11y
- Clear 4-step flow (load → recipe → export settings → preview/package) with numbered steps and an aria-live status region.
- Drop zone is keyboard-operable (role=button, tabindex, Enter/Space), paste-from-clipboard supported.
- All inputs carry aria-labels; buttons disabled until valid state. Responsive grid workspace (verify live at 375px, but layout uses token grid).

## Deferred
- Title length (70) — minor, not changed to avoid weakening keyword coverage.
- Codec-level controls / comparison slider / per-image settings — feature work, out of surgical scope.
- Shared logic lib untouched per rules.

## Fixes applied 2026-07-14
- Meta description trimmed 172 → 148 chars, retaining "locally in your browser" client-side signal.
- H1 rewritten to lead with the primary keyword "image format converter" plus target formats.
- Verified all 4 JSON-LD blocks parse (node) and FAQPage still mirrors visible FAQ.
- No shared image libraries modified.
