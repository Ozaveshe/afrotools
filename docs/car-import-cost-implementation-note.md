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
- Existing transport ecosystem links: import duty, vehicle import duty, currency converter, delivery cost, insurance, and loan tools.

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
