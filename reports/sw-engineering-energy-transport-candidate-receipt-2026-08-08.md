# Swahili Engineering, Energy and Transport candidate receipt

Status: **25 accepted candidates / 30 blocked / exact denominator 55**. This receipt does not edit or imply coordinator acceptance.

## Outcome

| Category | Denominator | Accepted candidate | Blocked |
|---|---:|---:|---:|
| Engineering & Construction | 20 | 5 | 15 |
| Energy & Utilities | 17 | 17 | 0 |
| Transport & Logistics | 18 | 3 | 15 |
| **Total** | **55** | **25** | **30** |

Accepted Energy IDs: `electricity-tariff`, `solar-roi`, `prepaid-meter`, `solar-vs-generator`, `electricity-bill-verify`, `water-bill`, `gas-lpg-cost`, `paygo-solar`, `outage-cost`, `energy-audit`, `appliance-power`, `diesel-vs-solar-farm`, `mini-grid-feasibility`, `carbon-footprint-energy`, `ev-charging`, `biogas-roi`, `generator-fuel`.

Accepted Engineering IDs: `solar-calculator`, `concrete-calc`, `tiles-calc`, `water-tank`, `rebar-calc`.

Blocked Engineering IDs: `afrodraft`, `afroplan-floor-planner`, `floor-plan`, `boq-generator`, `structural-calc`, `electrical-load`, `paint-calc`, `roofing-calc`, `borehole-cost`, `generator-sizing`, `boq-gen`, `home-renovation-cost`, `fence-cost`, `swimming-pool-cost`, `architectural-fee`.

Blocked Transport IDs: `car-import-cost`, `car-price-intelligence`, `ride-fare`, `boda-income`, `matatu-fare`, `delivery-cost`, `car-loan-vs-cash`, `vehicle-registration`, `roadworthiness`, `vehicle-depreciation`, `last-mile-delivery`, `parking-fee`, `route-cost`, `toll-calc`, `vehicle-tracker-roi`.

Accepted Transport IDs: `fleet-fuel`, `truck-load`, `vehicle-operating-cost`.

## Product, formula and source decisions

- The 17 Energy pages use their exact English-owned DOM-free engines through `scripts/lib/sw-energy-remaining-contract.js`; no formulas were translated or copied. Focused tests exercise valid and invalid oracle cases.
- The bounded `data/energy/sw-energy-planning-snapshot.js` owner preserves March 2026 source values and normalizes only the existing LPG field name required by the shared engine. UI labels the data stale, planning-only and low-confidence. The ledger boundary is 12/54 regulator-linked markets with 42 gaps.
- Concrete, tiles, water-tank and rebar now share `assets/js/engines/engineering-materials-engine.js` with their English routes. Exact constants, unit conversions and calculation boundaries have oracle fixtures; after the solar-calculator addition, the remaining 15 Engineering IDs stay fail-closed.
- `solar-calculator` remains Engineering-owned but reuses the maintained March 2026 Energy snapshot and one shared DOM-free sizing engine with the English route. It receives one Engineering acceptance credit and no duplicate Energy credit. The UI marks the country data stale/low-confidence and the output as planning-only, never an installer design or grid approval.
- Fleet fuel, vehicle operating cost and truck load now use the exact English DOM-free Transport cost engine. Truck load uses only user-entered capacity, load, distance, currency label and trip cost; it supplies no fare, tariff, market benchmark or legal load approval. The remaining 15 Transport IDs stay fail-closed, and car-import customs/port sources remain `changed` in `data/transport/source-status.json`.
- All 55 expected dedicated artwork files exist. The machine-readable artwork queue is empty.

## Browser and export proof

- Chromium, one worker, isolated ports 4198 and 4202: 53 existing physical routes at 320px, 375px and 640px with 200% CSS reflow; no horizontal overflow, iframe, canonical mismatch, console error or page error.
- Every Energy app: valid calculation, invalid-state clearing, reset, explicit dark/light toggle, keyboard focus, JSON download/parse/reopen, CSV parse, TXT parse and PDF parse via the repository-vendored PDF.js 3.11 parser. The final proof is split into green 17-test deep-workflow and green 55-test route/boundary runs to isolate browser-cache contention.
- Every accepted Engineering app: the same interaction/export matrix at 320px and 375px, plus a green English-route regression through the shared engine.
- Solar calculator: 320px, 375px and 200% reflow; stale state; invalid/reset; themes and keyboard focus; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and reciprocal English/French/Swahili metadata passed.
- Truck load: exact oracle plus overload boundary; invalid/reset; light/dark; keyboard/focus; reciprocal metadata; JSON parsed and reopened, CSV/TXT parsed, and PDF reopened with PDF.js. The English route passed through the same engine after removal of its unused fuel-consumption field.
- Network instrumentation recorded no fetch/XHR/beacon carrying raw inputs on the accepted deep flows. No AI call exists. Car-import requests were restricted to local synthetic fixture/source JSON paths.
- The remaining absent physical route is `car-price-intelligence`; its absence is asserted and blocked, not hidden by denominator arithmetic.

## Ownership and changed paths

- Energy generator/manifest: `scripts/build-sw-energy-remaining-parity.js`, `scripts/lib/sw-energy-remaining-contract.js`.
- Energy runtime/data/style: `assets/js/pages/sw-energy-remaining-parity.js`, `data/energy/sw-energy-planning-snapshot.js`, `assets/css/sw-energy-remaining-parity.css`.
- Generated by the bounded owner only: 17 `sw/zana/**/index.html` Energy routes and the Swahili Energy hub.
- Transport checkpoint: `assets/js/pages/swahili-car-import-cost.js` and focused transport source/browser tests.
- Engineering generator/manifest/engine: `scripts/build-sw-engineering-materials-parity.js`, `scripts/lib/sw-engineering-materials-contract.js`, and `assets/js/engines/engineering-materials-engine.js`.
- Engineering runtime/style: `assets/js/pages/sw-engineering-materials-parity.js` and `assets/css/sw-engineering-materials-parity.css`; four bounded generated Swahili routes are owned by that generator.
- Solar calculator owner/runtime/style: `scripts/build-sw-solar-calculator-parity.js`, `scripts/lib/sw-solar-calculator-contract.js`, `assets/js/engines/solar-calculator-engine.js`, `assets/js/pages/sw-solar-calculator-parity.js`, and `assets/css/sw-solar-calculator-parity.css`.
- Transport cost engine/manifest/runtimes: `assets/js/engines/transport-cost-engine.js`, `scripts/lib/sw-transport-cost-contract.js`, `assets/js/pages/sw-transport-cost-parity.js`, `assets/js/pages/sw-vehicle-operating-cost-parity.js`, and `assets/js/pages/sw-truck-load-parity.js`.
- Truck-load generator/style/routes: `scripts/build-sw-truck-load-parity.js`, `assets/css/sw-truck-load-parity.css`, `sw/zana/kupakia-lori/index.html`, and the English source route `tools/truck-load/index.html`.
- Proof owners: this receipt, the candidate Playwright config/spec, focused static tests and missing-artwork receipt.
- The requested `.claude/rules/i18n.md` reference is absent in this checkout; the coordinator explicitly declared that absence non-blocking. The repository Swahili strategy and coordinator skill governed the work.

## Verification commands

- `node scripts/build-sw-energy-remaining-parity.js`
- `node --test tests/swahili-energy-remaining-static.test.js tests/swahili-transport-static-candidate.test.js`
- `node --test tests/swahili-engineering-materials-parity.test.js`
- `npx playwright test -c playwright.sw-engineering-materials.config.js --workers=1`
- `node --test tests/swahili-solar-calculator-parity.test.js`
- `npx playwright test -c playwright.sw-solar-calculator.config.js --workers=1`
- `node scripts/build-sw-vehicle-operating-cost-parity.js`
- `node scripts/build-sw-truck-load-parity.js`
- `node --test tests/swahili-transport-cost-parity.test.js`
- `npx playwright test -c playwright.sw-transport-cost.config.js --workers=1`
- `npx playwright test -c playwright.sw-engineering-energy-transport.config.js --workers=1`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run check-links`
- `npm run audit`
- `npm run lint`
- `npm run type-check`
- `npm run test:privacy-ai-consent`
- `npm run solar-roi:data:check`
- `npm run fuel:sources:check`
- `npm run transport:sources:check`
- `git diff --check`
- `git diff --diff-filter=D --summary`

## Carried baseline debt

- `npm run build:i18n:validate` exits 1 because coordinator-owned generated localization artifacts are already stale: `data/registry/locale-page-coverage.json`, `reports/localization-coverage.json`, and `reports/localization-coverage.md`. This lane did not regenerate or edit them. The underlying localization checks pass, and standalone `npm run validate:hreflang` passes 33,412 relationships across 5,351 groups.
- `npm run audit` exits 0 and reports two carried missing registry pages outside this lane: `job-offer-evaluator` and `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`.
- `npm ci` reports 14 dependency advisories (6 moderate, 8 high); no dependency manifest or lockfile was changed.

No PR, merge, deployment, live service mutation, sitemap generation, redirect generation or coordinator-owned acceptance/AI/coverage edit is part of this lane.
