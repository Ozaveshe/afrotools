# Climate Section Improvement Pass - 2026-04-27

## Scope

Reviewed and rebuilt the `/climate/` category as 13 distinct working apps, not a generic batch of cards.

Primary files:

- `climate/index.html`
- `assets/js/climate-tools.js`
- `assets/css/climate.css`
- `scripts/enhance-climate-section-pass.js`
- `assets/js/components/tool-registry.js`
- `tools/{climate-tool}/index.html`

## What Changed

- Fixed the section inventory mismatch: the Climate page advertised 13 apps, while the registry only had 6 and 7 routes were missing.
- Converted the old country-selector-only pages for air quality, carbon credit, and flood risk into functional pan-African calculators at the root tool routes.
- Added real pages for drought risk, water scarcity, rainfall tracking, deforestation impact, waste management, recycling revenue, and charcoal-vs-clean cooking.
- Rebuilt e-waste, tree planting ROI, and sustainability scorecard around more useful decisions: data wipe and hazard handling, survival-adjusted ROI, and evidence-based business scoring.
- Added source cards to each tool with relevant external references.
- Added a shared Climate runtime so every tool renders a result, metrics, a decision breakdown, and an action plan.

## Tool-by-Tool Improvements

- Drought Risk Assessment: crop, soil, rainfall anomaly, irrigation, expected loss, water deficit, insurance trigger.
- Water Scarcity Calculator: shortage days, storage buffer, demand per user, reuse savings, recommended tank size.
- Rainfall Pattern Tracker: received vs expected rainfall, crop-stage sensitivity, irrigation and drainage action.
- Carbon Credit Revenue: project type, crediting years, buffer reserve, validation cost, standard pathway, MRV checklist.
- Flood Risk Assessment: site exposure, elevation, drainage, building vulnerability, annual loss proxy, insurance budget.
- Air Quality Index Tracker: AQI and PM2.5 estimate, health-group adjustment, indoor-fuel context, mask guidance.
- Deforestation Impact: forest type, hectares, land-use conversion, CO2 release, lost future sink, restoration budget.
- Waste Management Cost: collection cost, circularity score, organic share, hazardous flag, source-separation plan.
- Recycling Revenue: material mix, contamination loss, transport drag, CO2 avoided, buyer-quality advice.
- Charcoal vs Clean Cooking: multi-year cost comparison, smoke-risk score, CO2 reduction proxy, stove-payback view.
- E-Waste Collection Value: payout estimate, device condition, data-risk cleanup, hazard score, formal recycler route.
- Tree Planting ROI: survival rate, carbon price, maintenance, verification route, 25-year net value.
- Sustainable Business Scorecard: energy, waste, water, sourcing, safety, reporting evidence, 90-day plan.

## Source Anchors Used

- EPA AQI and AQI activity guidance
- WHO household air pollution and clean cooking guidance
- World Bank Climate Risk Screening Tools and Climate Knowledge Portal
- UN-Water scarcity and UN water facts
- FAO water and forest reporting
- NASA drought and rainfall monitoring references
- Verra VCS and Gold Standard project certification guidance
- UNEP Global Waste Management Outlook and zero-waste material
- ITU Global E-waste Monitor and WHO e-waste health material
- GRI Standards and IFC EDGE resource-efficiency framing

## Validation

- `npm run audit` passed.
- `node scripts/check-registry-syntax.js` passed.
- `node scripts/validate-registry.js` passed.
- `node scripts/seo-daily-fix.js --report` passed with no fixes needed.
- Climate-targeted link check passed for the category page and 13 tool pages.
- Runtime smoke passed for all 13 calculator engines through `window.AfroClimateTools.calculate`.
- HTTP smoke passed for `/climate/`, all 13 tool routes, `/assets/js/climate-tools.js`, and `/assets/css/climate.css`.
- Headless Chrome screenshots were captured for `/climate/` and `/tools/air-quality/`.

Known baseline issue outside this pass:

- `npm run check-links` still reports one unrelated broken link: `/icons/icon-192.png` from `tools/pwa-manifest/index.html`.

## Regeneration

Use this command when the Climate tool definitions need to be regenerated:

```bash
node scripts/enhance-climate-section-pass.js
```

The script writes the Climate category page, the 13 tool pages, and the Climate registry block.
