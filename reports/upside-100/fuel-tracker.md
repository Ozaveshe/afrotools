# AfroFuel — African Fuel Price Tracker

- Live: https://afrotools.com/tools/fuel-tracker/
- File: `tools/fuel-tracker/index.html`
- Traffic: ~30k

## What it does
Live/snapshot fuel-price tracker for 54 African countries: petrol (per L), diesel (per L),
and LPG (per kg) shown in local currency first, USD as reference. Includes an interactive
Africa price map, sortable/searchable comparison table with region + fuel-type filters, a
two-country comparison card, a 12-month trend chart, a multi-mode fuel planner
(household / generator / fleet / transport fare / procurement), and a full generator-cost
calculator (presets, size, hours/days, grid + solar break-even comparison, PDF export).
Prices/currency come from a shared snapshot (`/data/fuel/latest.json`) via
`fuel-tracker.js` + `live-data.js`; the source-confidence badge renders from the shared
`afro-source-meta` component (`data-source-meta-id="afrofuel-static-snapshot"`).

## Real analogues & gaps
- **GlobalPetrolPrices.com / CEIC / Trading Economics** are the direct global comparators.
  AfroFuel's edge is Africa-first depth, local-currency-first display, and the practical
  generator/backup-power calculators those sites lack.
- **Gaps vs analogues (all pipeline/feature-level, not tool-local):**
  - No explicit named primary source per price (regulator/NNPC/NPA/EPRA etc.); attribution
    is a generic "saved snapshot" label. GlobalPetrolPrices cites a weekly methodology.
  - Snapshot cadence: page currently reads **"Updated 12 Jun 2026"** (see freshness below).
  - Trend history is client-generated (12-month line) rather than a sourced historical series.

## Freshness finding
Freshness IS surfaced well and in multiple visible places: hero "Last updated" stat
(`#fuelDeskState` = 12 Jun 2026) with an sr-only "Source: saved fuel price snapshot updated
12 Jun 2026", the selected-country meta line, the Data notes panel, and per-country guide
cards. A "prices indicative / verify locally" message is repeated (consumer note under the
table, Data notes, and the "Verify the fuel snapshot before acting" disclaimer panel).
**Concern:** the displayed as-of date is **12 Jun 2026 — ~1 month stale** as of 14 Jul 2026,
consistent with the known automation outage (memory: scrapers down since ~Jun 30). The date
is snapshot/JS-driven (`#fuelDeskState`) and the value repeats hardcoded in several places
(lines ~95-96, 112, 678). This is data-pipeline territory — NOT edited here. Flagged for the
data owner; see `_shared-fixes.md`.

## SEO / UX / trust audit
- **Title** (60 chars): "African Fuel Prices and Generator Cost Calculator | AfroFuel" — keyword + African intent. Good.
- **Meta description** (141 chars): in the 120-160 window, names petrol/Nigeria/diesel/Ghana + generator. Good.
- **H1**: single, unique, keyword-rich ("African fuel prices, generator costs, and country comparisons"). Good.
- **Canonical + hreflang** (en/fr/sw/x-default) present and self-consistent. Good.
- **JSON-LD**: 6 blocks, ALL valid JSON — WebApplication, WebPage, Dataset (with
  `variableMeasured`, `distribution` → latest.json, `dateModified`, `temporalCoverage`),
  BreadcrumbList, FAQPage (10 Qs — exact parity with the 10 visible FAQ items), ItemList
  (54 countries). This is already best-in-class; no schema changes needed.
- **UX**: country selection via hero, workspace, compare, calculator, and map; sortable table
  + mobile card fallback; skeleton loading states; copy/share summaries; aria-live regions
  throughout. Strong.
- **Mobile (375px)**: inline `@media(max-width:640px)` forces 44px/16px touch targets on all
  interactive classes; table has a dedicated mobile-card view. Good.
- **A11y**: skip link, labelled selects/inputs, aria-pressed toggles, role="dialog" drawer,
  sr-only map help, canvas role="img" with labels. One real gap addressed below.
- **Trust**: repeated "not official / verify locally" disclaimers, source-confidence badge,
  dedicated verification + privacy panel. Strong.

## Changes made (tool-local only)
- Added a visually-hidden `<caption class="sr-only">` to the price-comparison `<table>`
  (screen-reader table context + reiterates "indicative, verify locally"). This was the only
  genuine on-page defect found; everything else in the FIX brief was already satisfied, so no
  redundant markup was added (avoided gold-plating).

## Deferred (not tool-local; flagged in _shared-fixes.md)
- Stale snapshot date (12 Jun 2026) — data pipeline / scraper outage.
- Named per-price source attribution — shared `afro-source-meta` / data layer.

## Fixes applied 2026-07-14
- `tools/fuel-tracker/index.html`: added `<caption class="sr-only">` to `#price-table`.
- Verified all 6 `ld+json` blocks parse (node) after the edit — 0 invalid.
- No `<title>`, meta, H1, canonical, or JSON-LD changes were needed (already compliant).
- Did NOT touch fuel data, scraper output, `live-data.js`, `source-confidence.js`, or the
  shared `afro-source-meta` component.
