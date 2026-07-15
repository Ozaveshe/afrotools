# Meme Generator — Audit (upside-100)

- Live: https://afrotools.com/tools/meme-generator/
- File: `tools/meme-generator/index.html`
- Traffic: ~20k

## What it does

A fully client-side meme maker. Users choose a base image two ways: five built-in "starter scenes" (gradient backdrops with an emoji + label: NEPA, Market day, Family group chat, Weekend football, Exam week) or upload/drag-and-drop their own photo/screenshot (FileReader → in-memory `Image`). Six African caption packs (NEPA power, last price, morning forwards, football, past-question shock, client payment) pre-fill top/bottom text. Users edit top/bottom text, pick one of 3 text styles (classic Impact, warm poster, bold), and a font-size slider. A `<canvas>` (1200×900) renders a live preview and exports a PNG via `toDataURL` — no watermark, no upload, no sign-up. Confirmed working and 100% in-browser (no network calls for image handling).

## Competitors & gaps (imgflip, Kapwing)

- **No real template library** — imgflip offers hundreds of named classic meme templates; here there are only 5 abstract gradient scenes. Biggest gap.
- **Text is fixed to top/bottom only** — no draggable/repositionable text boxes, no extra text layers (imgflip/Kapwing allow arbitrary placement).
- **No custom colour/font picker** — only 3 style presets; classic "Impact" relies on the local font being installed.
- **No image adjustments** — no crop, rotate, or scale controls for uploads.
- **No sticker/emoji overlay or direct social share** to a target platform.
- Strengths vs competitors: genuinely local caption library, no watermark, no account, privacy-preserving (nothing leaves the device).

## SEO / UX / a11y findings

- **Title** was generic ("Meme Generator | AfroTools") — no keyword or African intent.
- **H1** did not contain the target keyword phrase.
- **JSON-LD**: WebApplication + BreadcrumbList present and valid, but no DesignApplication typing, no featureList, and no HowTo despite 4 clearly numbered on-page steps. No visible FAQ, so FAQPage correctly omitted.
- **a11y**: `<canvas>` had no accessible name; file input already labelled.
- Client-side claim was true but only stated in meta/verification panel — reinforced in title/description.
- UX: clean 4-step flow, mobile grids collapse at 980px/720px, edit→export path works.

## Fixes applied 2026-07-14

- `<title>` → "African Meme Generator - Local Caption Packs | AfroTools" (keyword + African intent).
- Meta description rewritten (156 chars): free, no watermark/sign-up, "created in your browser".
- og:title/description and twitter:title/description aligned to the new keyword framing.
- H1 → "Make African memes with your own screenshots, local caption packs, and starter scenes." (unique keyword).
- WebApplication JSON-LD: `@type` now `["WebApplication","DesignApplication"]`, added `featureList`, `isAccessibleForFree`, sharper name/description.
- Added a valid **HowTo** JSON-LD block mirroring the 4 visible on-page steps.
- a11y: `<canvas>` given `role="img"` + `aria-label="Live meme preview"`.
- No FAQ added (no visible FAQ on page).
- All 3 ld+json blocks validated with `node` (WebApplication/DesignApplication, HowTo, BreadcrumbList) — ALL VALID.

## Deferred

- Real named template library (top gap vs imgflip) — needs a shared image/template asset pipeline, out of scope for surgical single-file edit.
- Draggable/multi text layers and custom colour/font picker — engine-level rewrite.
- Crop/rotate for uploads.
