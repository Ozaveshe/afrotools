# African Car Price Directory — Audit

- URL: https://afrotools.com/cars/
- Source of truth: `data/cars/price-intelligence.json` + `assets/js/cars-directory.js` (client render) + `scripts/generate-car-price-pages.js` (static shell). **Generated — do not hand-edit `cars/**`.**
- Rule file: `.claude/rules/cars.md`

## What it does

A pan-African used-car buying-decision app, not a marketplace. For 20 markets (6 with full customs rule packs: Nigeria, Kenya, Ghana, Uganda, Zambia, Tanzania; 14 as `directory-estimate`) it layers, per vehicle:
- local asking band, import **landed cost** (best/normal/painful), and source-market price (Japan/UAE/UK/SA);
- import-risk, fuel, maintenance, resale-liquidity and finance-fit scores;
- an "import vs buy local" recommendation, cost breakdown, CSV/summary export, watchlist.

Client app (`cars-directory.js`) renders hub / country / make / model / vehicle / compare / import-vs-local routes from JSON + live FX (`/api/forex?base=USD`, fallback `/data/forex/latest.json`). Currency is **local-first with USD kept as audit reference** — compliant with the cars rule.

## Competitors + gaps

Real competitors: **Cars45**, **AutoChek/Cheki**, **Jiji Cars**, **Carmudi**, **Cars.co.za**.
- They are inventory marketplaces (real listings, photos, VIN/history, dealer contact, sell-side). AfroTools has **none of that** and shouldn't chase it.
- AfroTools' genuine moat is the one thing none of them offer: **cross-border import-vs-local landed-cost intelligence** in local currency. That is defensible and under-exploited.
- Gaps worth closing (buyer-guidance, not inventory): thin catalogue (**25 vehicles, Toyota-heavy**); no depreciation/total-cost-of-ownership curves; no visible buyer guides; no age-eligibility rule explainer per country.

## Thin-content flag — CONFIRMED (root cause found)

The audit's "thin visible copy" is real and localized to the **highest-authority URL**, `/cars/`:
- In `generate-car-price-pages.js`, `staticContentHTML(meta)` returns `""` when `meta.pageType` is falsy (line 132). The root `writePage("cars", …)` call (line 262) passes **no `pageType`**, so the hub ships with only a `<noscript>` title+description and an empty `<div id="carsApp">`.
- Country/make/model/vehicle pages DO get server-rendered tables (`vehicleTableHTML`, `countryEditorialHTML`, `vehicleDetailHTML`) — so the deep pages are fine, but the hub a crawler is most likely to rank has near-zero indexable body text.
- The **FAQ (3 Q&A in `data.faqs`) is never server-rendered as visible HTML** anywhere — it exists only in JSON-LD and in the JS-built app. No-JS crawlers and AI answer engines get the schema but no readable passage.
- Note: the deployed `cars/index.html` also carries related-tools SSR + `source-confidence.js` that the generator template (lines 199-245) does not emit — the live file has been post-processed by the SEO pipeline. Generator remains authoritative for regeneration; template should be reconciled so a regen doesn't strip those blocks.

## SEO

- Title/description/canonical/OG/Twitter/hreflang(en,fr,x-default): all present and good.
- JSON-LD: `WebApplication` + `BreadcrumbList` + `FAQPage` + `ItemList` present. `ItemList` items carry **only `name`, no `url`** — wastes internal-link/rich-result signal. No `Vehicle`/`Product` markup on vehicle detail pages (missed price-range rich result).
- Single visible `<h1>` only via JS; the static hub has no server `<h1>` outside `<noscript>`.

## UX / a11y / mobile

- Rich filter set, insight rails, paginated cards, per-card risk/resale/eligibility badges — strong.
- Cards use `onerror` image fallback to a generic tool webp; images are illustrative, not real listings (disclosed).
- 375px: `cars-directory.css` + tokens grid should hold; verify filter grid + wide cost tables scroll (tokens mobile layer handles table overflow) — spot-check live.
- Escaping via `t()`/`escapeHtml` throughout; schema `<` escaped. Good.

## Data-trust

- Strong labeling: `estimatePolicy`, per-market `pricingMode` (`full-rule-pack` vs `directory-estimate`), freshness/stale-window notes, and repeated "Not an official valuation, dealer offer, lender approval, or customs decision" disclaimers. Compliant with cars.md (directory-estimate markets stay labelled).
- Red flags: (1) static-table FX comes from `data/forex/latest.json` snapshot baked at generate time — can be stale vs the live app; the note says amounts "update live inside the directory," acceptable but the static band could mislead a no-JS reader. (2) Only 6/20 markets have real `data/trade/car-import-cost-*.json` packs; the other 14 landed figures are FX-model estimates — correctly labelled, but catalogue depth (25 cars) makes coverage look thinner than the 20-market claim implies.

## Recommendations logged
See `_shared-fixes.md` → `### cars directory` for exact generator/data changes.
