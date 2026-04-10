# African Car Price Intelligence Phase 2 Implementation Note

## Existing patterns found

- Stack: static HTML routes, vanilla JavaScript modules, shared CSS tokens/global styles, Netlify functions, and generated folder-based routes.
- Routing: each indexable route is a physical `index.html` folder route. Tool routes live under `/tools/...`; directory-style surfaces can live at a top-level folder when the route is a product hub.
- Styling: existing tools use `tokens.min.css`, `global.min.css`, and page-specific CSS. Phase 2 follows that with `assets/css/cars-directory.css`.
- Calculator architecture: Phase 1 added `assets/js/lib/car-import-cost-engine.js` and static rule packs under `data/trade/`. Phase 2 calls that landed-cost engine instead of duplicating customs formulas.
- SEO/schema: existing pages use canonical links, OG/Twitter tags, `WebApplication`, `BreadcrumbList`, `FAQPage`, and `ItemList` JSON-LD. Generated car pages follow that pattern.
- Analytics: existing pages call `window.AfroTools.analytics.track` or fall back to `gtag`. Phase 2 uses the same fallback.
- Save/share/export: existing tools use localStorage, `save-result-button`, `share-state.js`, and `export-tools.js`; Phase 2 reuses these hooks.
- AI advisor: existing calculators call `/.netlify/functions/ai-advisor` with a `tool` slug and structured context. Phase 2 adds `car-price-intelligence` to the shared advisor context.
- Admin convention: existing admin pages are prompt-gated static screens with browser preview overrides. Phase 2 mirrors that for source/local price packs.
- Related tools: transport pages and tool registry are the discovery layer. Phase 2 adds the `/cars/` directory to the source registry and transport hub.

## What was reused

- Phase 1 landed-cost engine and country rule packs for Nigeria, Kenya, Ghana, Uganda, Zambia, and Tanzania.
- Existing FX fallback behavior through the Phase 1 import data loader.
- Existing route-wrapper pattern from static tool and collection pages.
- Existing `save-result-button`, `export-tools.js`, `share-state.js`, navbar/footer components, and analytics fallback.
- Existing AI advisor Netlify function.
- Existing admin dashboard link-card pattern.

## What was extended

- Added a price-intelligence engine that wraps the landed-cost engine and returns:
  - source-market price range
  - landed-cost best/normal/painful range
  - local-market asking range
  - eligibility status
  - recommendation status and explanation
  - source-market comparison
  - structured AI context
- Added top-level `/cars` information architecture with country, make, model, year, compare, and import-vs-local pages.
- Added source/local price freshness and confidence labels.
- Added local watchlist persistence and calculator deep links.
- Added admin preview/update path for source prices, local prices, vehicles, ports, and destination cities.

## New infrastructure added

- `data/cars/price-intelligence.json`: compact Phase 2 seed pack.
- `assets/js/lib/car-price-intelligence.js`: deterministic price-intelligence and recommendation engine.
- `assets/js/cars-directory.js`: shared route-aware UI for all car directory pages.
- `assets/css/cars-directory.css`: page styling.
- `scripts/generate-car-price-pages.js`: static route generator.
- `admin/car-price-intelligence.html`: admin maintenance screen.
- `supabase/migrations/017-car-price-intelligence.sql`: additive normalized schema for countries, ports, cities, vehicles, valuation packs, source/local prices, shipping, registration, practical costs, saved quotes, and watchlists.

## Data assumptions and verification

- Seed price ranges are broad planning estimates, not official quotes or live marketplace feeds.
- Explicit local-market samples were added for deterministic examples; other combinations use country-level modelled fallback profiles and are labelled with lower confidence when appropriate.
- Official customs/rule data still comes from the Phase 1 rule packs and source metadata; no runtime scraping is used.
- The configured Supabase data project denied schema inspection, so the migration was added to the repo but not applied live.

## Manual verification still needed

- Replace seed source/local price ranges with verified admin price-pack imports.
- Apply and review `017-car-price-intelligence.sql` in the intended Supabase data project.
- Refresh generated pages after any major seed dataset update with `node scripts/generate-car-price-pages.js`.
- Run the normal minify/build pipeline to refresh any minified registries and cache-busted asset references.
- Validate official rule packs and valuation schedules against each country source before using the app for paid partner flows.
