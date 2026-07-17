# Passport Photo Studio - Audit

- Live: https://afrotools.com/tools/passport-photo/
- Source: `tools/passport-photo/index.html`
- Engine: `assets/js/lib/passport-photo-studio.js` (spec presets + Canvas render)
- Styles: `assets/css/passport-photo-studio.css` (shared - do not edit here)

## What it does

Browser-based passport/visa/ID photo preparer. User loads a plain front-facing image
(drag, paste, or file picker), picks a country/destination preset, aligns the face with
manual zoom/move/rotate against crown+chin guides, then exports a single 300 DPI digital
photo or a print-ready 4x6-inch / A4 sheet (JPG/PNG/WebP). Includes a 7-item manual
acceptance checklist, per-preset source links + confidence labels, and local export history.
It deliberately does NOT retouch faces or remove backgrounds (authorities reject altered
photos); the background color only fills canvas behind the crop.

## Local processing - VERIFIED true

All work is client-side: `URL.createObjectURL` for load, an offscreen `<canvas>` +
`drawImage` for render, `canvas.toBlob` for export, `localStorage` for settings/history.
No `fetch`/`XHR`/upload of the image anywhere in `passport-photo-studio.js`. The page's
"Your photo stays on this device" / "No upload" / "Local only" claims are accurate.

## Spec dimensions - spot check (all correct)

- United States: 51x51mm (2x2in), head 25-35mm - matches State Dept.
- Canada: 50x70mm, head 31-36mm - matches IRCC (correctly flags the unusual size).
- UK: 35x45mm, grey/cream background - matches GOV.UK.
- Schengen/Netherlands: 35x45mm - matches Dutch checklist.
- Kenya eCitizen visa: 55x55mm / 207x207px - matches eCitizen (unusual but correct).
- South Africa: 35x45mm - matches DIRCO/Home Affairs.
- Australia: outputs 35x45mm inside the stated 35-40 x 45-50mm range - honest, disclosed.

Presets without published mm sizes (Nigeria, Ghana, Kenya passport packet) transparently
use a 35x45mm fallback and mark source confidence - good honesty signal.

## Competitors & gaps

Competitors: idphoto4you, Persofoto, Photoroom passport, VisaFoto, PhotoAiD.
- Strength vs. them: African-country coverage + source-backed confidence notes + fully
  local processing (no server upload) - a genuine differentiator.
- Gap: no AI background removal/replacement (deliberate policy choice, defensible).
- Gap: no automated face/head-height detection - alignment is fully manual (guides only).
- Gap: preset library is ~14 entries; competitors cover 100+ countries. Room to expand
  African passport presets with exact mm where authorities publish them.

## SEO / UX / a11y

- Title/meta: title was serviceable but not keyword-led; description ran ~195 chars (over).
- H1 lacked the primary "passport photo maker" keyword.
- No FAQPage JSON-LD despite 4 visible FAQs; no HowTo despite 4 numbered steps.
- Trust note already present and true.
- a11y: inputs carry aria-labels, drop zone is a focusable `role="button"` with keydown
  handling, `role="status" aria-live="polite"` on status; `#main-content` landmark present.
  Acceptable; no fixes required.

## Fixes applied 2026-07-14

- `<title>` -> keyword-led "Passport Photo Maker - African Country & Visa Specs, 300 DPI
  Print Sheets | AfroTools" (88 chars).
- Meta description rewritten to 153 chars (was ~195) with named-market intent.
- H1 -> "Passport photo maker for African country and visa specs." (unique, keyword-bearing).
- Added `applicationSubCategory: "DesignApplication"` to WebApplication JSON-LD.
- Added FAQPage JSON-LD mirroring the 4 visible FAQ items exactly.
- Added HowTo JSON-LD mirroring the 4 visible workflow steps.
- All 5 ld+json blocks validated with node - ALL VALID.

## Deferred

- Expand preset coverage (more African passports with exact mm; more visa destinations).
- Consider optional client-side face/head-height auto-detection to reduce manual guesswork.
- CSS/shared-image changes deferred per rules (styles live in shared `passport-photo-studio.css`).
