# African Car Landed Cost Calculator implementation note

## Existing AfroTools patterns found

- Stack: static HTML, CSS, and vanilla JavaScript with folder-based routes and Netlify functions.
- Styling: shared `/assets/css/tokens.min.css` and `/assets/css/global.min.css`, plus per-tool CSS.
- Tool pages: static HTML pages with schema JSON-LD, navbar/footer web components, calculator JavaScript, save/share/export helpers, disclaimers, FAQs, and related-tool links.
- Data strategy: repo seed packs under `/data`, with existing trade data in `data/trade/landed-cost-data.js`, `shipping-routes.js`, and `port-demurrage.js`.
- Analytics: `assets/js/lib/analytics.js` exposes `AfroTools.analytics.track(...)`, with `gtag` fallback.
- Save/share/export: reused `afro-history.js`, `save-result-button.js`, `export-tools.js`, `share-state.js`, and print fallback.
- AI advisor: reused `netlify/functions/ai-advisor.js` by adding a `car-import-cost` tool context that receives structured calculation context.
- Admin: followed the existing lightweight `/admin/*.html` prompt-gated maintenance pattern.
- Supabase: used MCP first. The live data project was not writable from this session, so a migration file was added instead of applying live DDL.

## What was reused

- Static route and country-page conventions.
- Existing currency/FX seed source at `/data/forex/latest.json`.
- Existing save-to-account path via `AfroHistory` and `<save-result-button>`.
- Existing CSV/PDF/print/share patterns, with a PDF fallback to `window.print`.
- Existing transport ecosystem links: import duty and landed cost, currency converter, delivery cost, insurance, and loan tools.

## What was added

- `data/trade/car-import-cost-core.json` plus six country rule packs for NG, KE, GH, UG, ZM, and TZ.
- `assets/js/lib/car-import-cost-engine.js`, a deterministic country-rule calculator pipeline.
- `assets/js/car-import-cost.js`, the browser controller, UI mount, render layer, export/share/save, and AI advisor hook.
- `assets/css/car-import-cost.css`, a native AfroTools mobile-first UI layer.
- Routes:
  - `/tools/car-import-cost/`
  - `/tools/car-import-cost/nigeria/`
  - `/tools/car-import-cost/kenya/`
  - `/tools/car-import-cost/ghana/`
  - `/tools/car-import-cost/uganda/`
  - `/tools/car-import-cost/zambia/`
  - `/tools/car-import-cost/tanzania/`
- Supporting blog guide pages for all six countries.
- `/admin/car-import-cost-rules.html` for JSON/CSV rule-pack maintenance and preview.
- `supabase/migrations/016-car-import-cost.sql` for future live database storage.
- Tool registry source entry for the new transport tool.

## Why

The calculator needs to remain maintainable as country rules and official valuation tables change. The rule-pack design keeps formulas, source metadata, confidence, effective dates, practical presets, and country copy in data instead of hardcoding them into the UI. The engine returns one structured result that can be rendered, saved, exported, tested, and passed safely to the AI advisor.

## Manual verification still needed

- Confirm the latest official duty, levy, excise, valuation, and schedule rows for each country before marking any pack as `published`.
- Upload precise valuation/specific-duty tables for Kenya, Uganda, and Zambia.
- Confirm current partner lead forms before enabling clearing, shipping, finance, insurance, or dealer referral zones.

## Nigeria tariff review, 2026-09-27

- The saved Nigeria pack still models 35% passenger duty plus 35% vehicle levy and omits VAT, ETLS, a duty surcharge, and the announced 2026 green surcharge. Its status is `policy-review-required`; all Nigeria calculations must surface the critical warning, and the country page links to the official calculator before the form.
- In the [Nigeria Trade Information Portal duty calculator](https://tip.nsw.gov.ng/trade-tools/duty-calculator), a synthetic USD 10,000 CIF input for used petrol passenger vehicle HS `8703232000` returned 20% duty, 15% levy, 7.5% VAT, 0.5% ETLS, 7% of duty as surcharge, and 4% of FOB as FCS on 2026-09-27. The same input for new FBU HS `8703231919` returned a 5% levy. These are code-specific portal results, not a validated generic rule pack. The portal's suggestion list displays `100%` for each code, which does not match its calculated breakdown; use the completed calculation, not the suggestion badge, for review.
- The [Nigeria Customs Service announcement of 2026 fiscal measures](https://fmino.gov.ng/nigeria-customs-service-implements-2026-fiscal-policy-measures-and-tariff-amendments/) confirms revised tariff schedules and a green surcharge for vehicles at or above 2000cc. Its linked full variation order was a placeholder during this check. The portal results do not show a green surcharge for the 1.5–3.0L used petrol code. Resolve this conflict with the actual 2026 schedule or NCS ruling before changing the pack's numeric rates or restoring a current-rate claim.
- Next review should map vehicle class, fuel, condition, engine capacity and exact HS code to the official schedule, reproduce the official calculator's tax bases, verify customs valuation and FX dates, then test representative used, new, pickup and EV cases. The weekly trade-desk source lane owns customs-rate promotion.
