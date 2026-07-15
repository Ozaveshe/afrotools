# African Car Landed Cost Calculator — Upside-100 Audit

- Live: https://afrotools.com/tools/car-import-cost/
- File: `tools/car-import-cost/index.html`
- Engine (do NOT edit): `assets/js/lib/car-import-cost-engine.js`, `assets/js/car-import-cost.js`, `assets/js/car-import-cost-enhancements.js`
- Data packs (do NOT edit): `data/trade/car-import-cost-{core,ng,ke,gh,ug,zm,tz}.json`

## What it does
Estimates a vehicle's **landed cost** and **on-road cost** for six African markets (Nigeria, Kenya, Ghana, Uganda, Zambia, Tanzania). Inputs: source market (Japan/UAE/UK/South Africa/local dealer), FOB/CIF/customs-value or make-model-year, freight/insurance, port/delay/storage, clearing mode, finance terms. Engine builds a CIF customs value, applies the versioned country rule pack (taxes + registration components), adds practical port/clearing/inland extras, then produces: full breakdown, best/normal/painful scenarios, ±5% FX sensitivity, delay-day sensitivity, finance schedule, resale band, import-vs-local-dealer comparison, and a source-market comparison sorted by on-road cost.

## Data freshness / labeling — VERIFIED ACCURATE
- All six markets have **real country rule packs** under `data/trade/car-import-cost-*.json`; the engine reads `countryRulePacks[CC]`. No market is falsely presented as covered.
- Page labels the output honestly: "Rule-pack estimate" badge, "source-dated and versioned instead of scraped live", "Reviewed 2026", plus a stale-rule-pack warning path in the engine (`staleAfterDays`). This matches the cars.md rule (real pack vs directory-estimate).
- Local currency is engine-driven via `formatMoney(currency)` with USD retained as the base/audit amount (`usdToLocal`, every total mirrored `*Usd`/`*Local`) — satisfies "local-currency-first, USD reference".

## Landed-cost math logic (page/engine, spot-checked — NOT the duty rates)
- CIF derivation is sound: CIF mode back-solves FOB = CIF − freight − insurance; FOB/purchase mode builds CIF = FOB + freight + insurance(1.2% default). Manual customs value overrides correctly.
- `totalLandedUsd = CIF + officialTaxes + officialFees + practicalCosts + inlandDelivery`; `onRoadUsd = totalLanded + registration`. Scenario/finance/sensitivity all derive from `onRoadUsd`. Logic is internally consistent.

## SEO
- Title: strong — keyword + African intent ("Car Import Cost Calculator for Africa | Know the True Landed Cost | AfroTools").
- Meta description: was 165+ chars → trimmed to 156.
- One unique keyword H1 ("Car Import Cost Calculator for Africa"). Only one H1 on page. Good.
- JSON-LD: WebApplication/FinanceApplication + BreadcrumbList + FAQPage all present and valid.

## Gaps
- **Generic templated FAQ (df block).** Visible `df-faq` and its mirrored FAQPage JSON-LD describe "route, distance and costs" and "confirm current fuel prices, fares" — copy for a *transport-fare* tool, not a car-import tool. It technically mirrors the visible FAQ (schema-valid) but is off-topic and weakens topical relevance/GEO. Left untouched per the "don't touch df blocks" rule; flagged for the df-generator.
- **df-form offers ZAR (South Africa)** as a destination currency, but there is no ZA rule pack — the manual df planner implies a market the rule-pack engine does not cover. df block, not touched; flagged.
- Real competitors: national customs duty calculators, Checki/Cheki & Jiji import guides, clearing-agent blog calculators. AfroTools' edge = multi-market rule packs + scenario/FX sensitivity + source-market comparison; keep leaning on that depth in copy.

## Changes applied (index.html only)
1. Meta description trimmed to 156 chars (was >160), still keyword-rich with all six markets.
2. Added a concise visible estimate/customs disclaimer `<p role="note">` directly under the calculator app ("duties, valuation rules, and FX change — confirm with a licensed clearing agent and national customs authority").
3. a11y: breadcrumb separators marked `aria-hidden="true"`; current crumb marked `aria-current="page"`.

## Deferred (rules/df-block boundaries)
- Rewrite the generic `df-faq` + `df-upgrade` copy to car-import topic (fuel/fares wording is wrong) — needs the df generator, not a hand edit.
- ZAR option in df-form without a ZA rule pack — reconcile in the df/data layer.
- No duty-rate accuracy defects observed in this pass (rates live in the untouched packs).

## JSON-LD valid: YES (3/3 parse via node).

## Fixes applied 2026-07-14
- `tools/car-import-cost/index.html` meta description trimmed to 156 chars (keyword + all six markets).
- Added visible estimate/customs disclaimer `<p role="note">` under `#carImportApp`.
- a11y: breadcrumb separators `aria-hidden="true"`, current crumb `aria-current="page"`.
- Verified: 3/3 JSON-LD blocks parse via node (WebApplication/FinanceApplication, BreadcrumbList, FAQPage).
- Not touched: shared engine (`assets/js/**`), data packs (`data/trade/car-import-cost-*.json`), df blocks. Deferred items logged in `_shared-fixes.md`.
