# Harvest Date Estimator — Audit

- Live: https://afrotools.com/agriculture/harvest-date/
- File: `agriculture/harvest-date/index.html`

## What it does
Country-hub landing page for a harvest-date estimator. Links to 54 per-country
subpages (`/agriculture/harvest-date/{slug}`), grouped by region and rendered
both statically and via `/data/agriculture/country-index.js`. Concept: estimate
when a crop is ready from planting date + days-to-maturity, adjusted for regional
temperature/altitude and irrigation. Includes an embedded "df" planning widget
(planting date, crop, maturity days, weather risk) and an About / How-calculated
/ FAQ SEO block.

## Date math verification (node)
Standard `Date` day-addition is correct across edge cases:
- 2026-04-01 + 110 = 2026-07-20 ✓
- 2024-01-01 + 60 = 2024-03-01 (leap) ✓
- 2023-01-01 + 60 = 2023-03-02 (non-leap) ✓
- 2024-02-28 + 1 = 2024-02-29 (leap day) ✓
- 2025-12-15 + 90 = 2026-03-15 (year crossing) ✓

## Gaps found
1. Meta description was 206 chars (over the 160 limit). **Fixed** → 155.
2. No `WebApplication` JSON-LD (only CollectionPage/FAQPage/Breadcrumb). **Fixed** — added.
3. No visible "estimate varies" disclaimer near the explanatory copy. **Fixed** — added.
4. H1 emoji read as content by screen readers. **Fixed** — `aria-hidden`.
5. The embedded df widget does NOT actually compute planting date + maturity
   days — it emits a static base string. Real math lives in the shared
   `english-df-app-upgrades.js`, which has no `harvest-date-estimator` handler.
   Deferred to `_shared-fixes.md` (df block off-limits per task rules).
6. Two visible "Frequently Asked Questions" H2s (seo-content + df-faq). Left as-is
   (df block off-limits). FAQPage schema correctly mirrors only the 4 seo-content Qs.

## SEO / UX / trust
- Title strong: keyword + "for Africa" + 54 Countries. Kept.
- One unique keyword H1. Good.
- FAQPage JSON-LD (4 Q) exactly mirrors visible seo-content FAQ — compliant.
- Canonical + hreflang (en/fr/sw/x-default) present.
- Mobile: `country-grid` uses `minmax(200px,1fr)` auto-fill, fine at 375px.

## Fixes applied 2026-07-14
- Meta description trimmed 206 → 155 chars (keyword + African intent).
- Added `WebApplication` JSON-LD (free, publisher AfroTools). All 4 ld+json blocks parse.
- Added visible estimate/variability disclaimer (`.hd-disclaimer`, pale-blue, no accent border).
- a11y: wrapped decorative H1 emoji in `<span aria-hidden="true">`.
- Verified date math via node (leap year, year-crossing, leap day).
- Deferred: df widget does not compute the date (shared JS) → logged in `_shared-fixes.md`.
