# Day 8 deep-improvement evidence receipt

Categories: Engineering, Climate, Mining

Audit and implementation date: 2026-07-27

Base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`

Branch: `codex/day8-engineering-climate-mining`

## Acceptance summary

- Engineering: **26 accepted / 0 left**. All 26 current English canonical live/new registry routes executed their deterministic primary workflow and passed the Day 8 browser contract.
- Climate: **13 accepted / 0 left**. All 13 current English canonical registry routes executed, rejected invalid state, marked stale results, reset, and produced a reopened local PDF with a valid `%PDF-` signature.
- Mining: **0 ledger-accepted / 7 left for director reconciliation**. All seven routes linked by the Mining hub executed and passed the browser contract, but the registry contains zero Mining rows. They are route-quality verified, not silently ledger-accepted.
- Scheduled Day 8 total: **39 accepted / 7 left** across 46 hub-real routes.

If the director treats the Trade-owned commodity tracker as already credited outside Mining, the precise unique candidate count becomes 45: 39 accepted plus six Mining-owned rows awaiting approval.

## Registry and schedule reconciliation

Current source truth from `assets/js/components/tool-registry.js`:

| Category | English live/new rows | Expanded live experiences |
|---|---:|---:|
| Engineering | 26 | 26 |
| Climate | 13 | 16 |
| Mining | 0 | 0 |
| Energy | 20 | 287 |

Climate expands to 16 because carbon credit, flood risk and air quality each carry `toolCount: 2`.

Energy is not a fourth Day 8 category. Its 20 rows expand to 287 under the registry's current `getTotalToolCount` contract, not 271. The 271 figure must not be used without naming a different selector or exclusion rule.

### Director approval requested

1. Add or approve Mining registry rows for:
   - `/tools/diamond-valuation/`
   - `/tools/oil-well-production/`
   - `/tools/oil-gas-revenue/`
   - `/tools/mining-license-fee/`
   - `/tools/mining-royalty/`
   - `/tools/artisanal-mining-income/`
2. Decide whether `/tools/commodity-tracker/` remains exclusively Trade-owned with a Mining hub cross-link, or receives explicit cross-category credit without duplicate app credit.
3. Correct the schedule/ledger note for Energy to 20 rows and 287 registry-expanded experiences, or document the exact rule that intentionally produces 271.

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
- `/tools/diamond-valuation/` — no registry row
- `/tools/oil-well-production/` — no registry row
- `/tools/oil-gas-revenue/` — no registry row
- `/tools/mining-license-fee/` — no registry row
- `/tools/mining-royalty/` — no registry row
- `/tools/artisanal-mining-income/` — no registry row

## Implemented evidence

- Hubs: removed unsupported standards, reserves and market-stat claims; exposed the Mining registry mismatch; added mobile/200% reflow protection.
- Engineering: repaired window/door material-key `NaN` output and balance fallback logic; removed automatic Build Pack storage; removed lead gates; added scoped small-screen reflow; replaced code-compliance and current-standard claims with planning-only safety boundaries.
- Climate: removed email-gated export and CDN PDF dependency; uses the bundled local PDF engine; added invalid/empty/non-finite handling, stale result state, reset, accessible live status, dark-mode state and mobile/200% reflow across all 13 routes.
- Mining: fixed commodity balance rendering, added deterministic route fixtures and category-local reflow without adding unsupported registry rows or official/live claims.
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

- Mining remains discovery-inconsistent until the director approves registry ownership; route functionality does not resolve that ledger decision.
- Electrical, structural and other construction results are planning prompts. Licensed professionals and current local rules remain required.
- The existing install reports 11 dependency audit findings (7 moderate, 4 high); no dependency or lockfile change is included.
- Nine surfaces use valid shared fallback artwork and remain in the separate artwork queue.
