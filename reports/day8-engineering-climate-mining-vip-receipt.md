# Day 8 deep-improvement evidence receipt

Categories: Engineering, Climate, Mining

Audit and implementation date: 2026-07-27

Base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`

Branch: `codex/day8-engineering-climate-mining`

## Acceptance summary

- Engineering: **26 accepted / 0 left**. All 26 current English canonical live/new registry routes executed their deterministic primary workflow and passed the Day 8 browser contract.
- Climate: **13 accepted / 0 left**. All 13 current English canonical registry routes executed, rejected invalid state, marked stale results, reset, and produced a reopened local PDF with a valid `%PDF-` signature.
- Mining: **6 accepted / 0 Mining-owned apps left**. All six Mining-owned routes now have explicit registry rows and all seven hub-linked routes passed the browser contract. Commodity Tracker remains Trade-owned and is a cross-link, not duplicate Mining credit.
- Scheduled Day 8 total: **45 accepted / 0 category-owned apps left** across 46 hub-real routes. The 46th route is the Trade-owned Commodity Tracker cross-link.

## Registry and schedule reconciliation

Current source truth from `assets/js/components/tool-registry.js`:

| Category | English live/new rows | Expanded live experiences |
|---|---:|---:|
| Engineering | 26 | 26 |
| Climate | 13 | 16 |
| Mining | 6 | 6 |
| Energy | 20 | 287 |

Climate expands to 16 because carbon credit, flood risk and air quality each carry `toolCount: 2`.

Energy is not a fourth Day 8 category. Its 20 rows expand to 287 under the registry's current `getTotalToolCount` contract, not 271. The 271 figure must not be used without naming a different selector or exclusion rule.

### Reconciled ownership

Six Mining-native routes now have approved Mining registry rows. Commodity
Tracker remains exclusively Trade-owned and is cross-linked from the Mining hub
without duplicate app credit. Energy remains outside Day 8 at 20 rows and 287
registry-expanded experiences.

The master readiness ledger was not edited in this PR.

## Route inventory

### Engineering — 26

- `/engineering/afrodraft/`
- `/engineering/floor-planner/`
- `/tools/solar-calculator/`
- `/tools/floor-plan/`
- `/tools/boq-builder/`
- `/tools/structural-calc/`
- `/tools/electrical-load/`
- `/tools/concrete-mix/`
- `/tools/paint-calculator/`
- `/tools/tiles-calc/`
- `/tools/water-tank/`
- `/tools/roof-calculator/`
- `/tools/borehole-cost/`
- `/tools/rebar-calculator/`
- `/tools/generator-sizing/`
- `/tools/boq-generator/`
- `/tools/home-renovation-cost/`
- `/tools/septic-tank/`
- `/tools/fence-cost/`
- `/tools/swimming-pool-cost/`
- `/tools/architectural-fee/`
- `/tools/site-clearing/`
- `/tools/road-construction-cost/`
- `/tools/scaffolding-calc/`
- `/tools/window-door-sizing/`
- `/tools/plumbing-material/`

### Climate — 13

- `/tools/drought-risk/`
- `/tools/water-scarcity/`
- `/tools/rainfall-tracker/`
- `/tools/carbon-credit/`
- `/tools/flood-risk/`
- `/tools/air-quality/`
- `/tools/deforestation/`
- `/tools/waste-management/`
- `/tools/recycling-revenue/`
- `/tools/charcoal-vs-clean/`
- `/tools/ewaste-value/`
- `/tools/tree-planting-roi/`
- `/tools/sustainability-scorecard/`

### Mining hub — 7

- `/tools/commodity-tracker/` — registry-owned by Trade
- `/tools/diamond-valuation/` — Mining-owned
- `/tools/oil-well-production/` — Mining-owned
- `/tools/oil-gas-revenue/` — Mining-owned
- `/tools/mining-license-fee/` — Mining-owned
- `/tools/mining-royalty/` — Mining-owned
- `/tools/artisanal-mining-income/` — Mining-owned

## Implemented evidence

- Hubs: removed unsupported standards, reserves and market-stat claims; exposed the Mining registry mismatch; added mobile/200% reflow protection.
- Engineering: repaired window/door material-key `NaN` output and balance fallback logic; removed automatic Build Pack storage; removed lead gates; added scoped small-screen reflow; replaced code-compliance and current-standard claims with planning-only safety boundaries.
- Climate: removed email-gated export and CDN PDF dependency; uses the bundled local PDF engine; added invalid/empty/non-finite handling, stale result state, reset, accessible live status, dark-mode state and mobile/200% reflow across all 13 routes.
- Mining: fixed commodity balance rendering, added deterministic route fixtures,
  category-local reflow, and six honest Mining-owned discovery rows without
  adding official/live claims.
- Privacy: browser suite blocks external requests, observes no first-party non-GET writes, and verifies Engineering Build Pack does not persist until the user explicitly saves.
- SEO/AI-search: every route has a title, description and matching canonical; unsupported structured FAQ claims were removed from Mining hub, structural calculator and electrical-load surfaces.

## Browser workflow evidence

The category suite:

- opens all three hubs;
- executes all 26 Engineering workflows with deterministic defaults;
- executes all 13 Climate workflows, invalid/empty, stale, reset and local PDF export/reopen checks;
- executes all seven Mining hub workflows with explicit synthetic inputs;
- checks 320px and 200% text reflow, manual/system dark mode, canonical/title/description, visible headings, accessible control names, keyboard focus, non-finite output, external-network isolation and first-party write absence.

No deploy, merge, broad deploy generation, sitemap regeneration, localization regeneration, sitewide hash update or master-ledger edit is part of this receipt.

## Gates run

Passed:

- `npm run test:day8-category-vip`
- `npm run test:day8-category-vip:browser` — 6/6 suites, all 46 routes
- `npm run lint`
- `npm run type-check`
- `npm run registry:check`
- `npm run test:registry`
- `npm run registry:build`
- `node scripts/build-tool-directory.js`
- `node scripts/build-search-index.js`
- `npm run audit`
- `npm run check-links`
- `npm run ai:tool-context:check`
- `npm run pdf:verify`
- `npm run test:privacy-ai-consent`
- `npm run solar-roi:data:check`
- `npm run audit:public-claims`
- `npm run category-workflow:verify`
- `git diff --check`

Known non-Day-8 gate result:

- `npm run test:live-data-status` — 1/6 passed. Five failures are on unrelated AfroFX, AfroFuel, AfroRates and Energy routes: three legacy selectors are absent, and the Energy API-source assertion expects old copy while the current page exposes planning-dataset metadata. The dated electricity fallback test passed. Energy was not changed or added to Day 8.
- `npm run source-registry:check` reports that the current `origin/main` source-registry output is stale. Running its owner also pulled unrelated date, PAYE hash and localized-route churn, so that generated churn was removed from this scoped PR.

## Residual risks

- Mining discovery and ownership are reconciled for its six native apps;
  Commodity Tracker intentionally remains a Trade-owned cross-link.
- Electrical, structural and other construction results are planning prompts. Licensed professionals and current local rules remain required.
- The existing install reports 11 dependency audit findings (7 moderate, 4 high); no dependency or lockfile change is included.
- Nine surfaces use valid shared fallback artwork and remain in the separate artwork queue.
