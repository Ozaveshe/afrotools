# Day 10 African, Religious/Cultural, and Data/Productivity Receipt

Date: 2026-07-27
Base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`
Scope: African Tools, Religious & Cultural, and Data & Productivity
Release state: **LOCAL PASS — 69/69 canonical apps accepted; not yet built, merged, deployed or live-approved**

This receipt is deliberately separate from `docs/FREE-APP-VIP-READINESS-LEDGER.md`. The master ledger was not edited.

## Exact inventory

| Measure | African | Religious & Cultural | Data & Productivity | Total |
| --- | ---: | ---: | ---: | ---: |
| Canonical hubs | 1 | 1 | 1 | 3 |
| Alternate hub routes | 1 | 0 | 1 | 2 |
| English canonical live/new destinations | 35 | 22 | 12 | 69 |
| Expanded English experiences | 50 | 22 | 12 | 84 |
| Localized registry records | 112 | 37 | 22 | 171 |

Expanded experiences are not counted as canonical destinations. The additional 15 African experiences are declared members of the generator-fuel family. Localized records are registry rows, not proof that an English workflow was accepted.

## Acceptance accounting

- Canonical hubs accepted: **3 of 3**; left: **0**.
- English canonical apps accepted: **69 of 69**; left: **0**.
- Data & Productivity apps accepted: **12 of 12**.
- African apps accepted: **35 of 35**; left: **0**.
- Religious & Cultural apps accepted: **22 of 22**; left: **0**.

The original pass accepted Data & Productivity and left 57 apps pending
independent product oracles. The final African and Religious/Cultural addenda
close that gap route by route. The consolidated director replay now passes
**162/162 browser tests** across all three hubs, every canonical app, the 35
African output oracles, the 22 Religious/Cultural authority and correctness
oracles, the 12 Data/Productivity contracts, and the shared local-export/privacy
boundary. Shared-helper repairs alone were not used as app acceptance.

### Accepted Data & Productivity apps

`/tools/pomodoro/`, `/tools/unit-converter/`, `/tools/budget-planner/`, `/tools/countdown-timer/`, `/tools/time-zone/`, `/tools/public-holidays/`, `/tools/working-days/`, `/tools/age-calculator/`, `/tools/grade-tracker/`, `/tools/random-picker/`, `/tools/meeting-cost/`, `/tools/tip-calculator/`

Each route has a deterministic browser contract in `tests/e2e/day10-data-productivity-contracts.spec.js`. The suite independently checks timer state, conversion and financial arithmetic, empty/invalid stale-state clearing, timezone conversion, inclusive working-day calculation, date arithmetic, weighted grades, HTML escaping, deterministic random selection, meeting-cost formulas, tip/tax/split formulas, reset behavior, local persistence boundaries, and parser/reopen checks for JSON and ICS exports.

### Accepted African apps

`/tools/japa-calculator/`, `/tools/generator-fuel/`, `/tools/mobile-money-fees/`, `/tools/fintech-fee-watch/`, `/tools/ajo-tracker/`, `/tools/electricity-estimator/`, `/tools/fuel-cost/`, `/tools/hawala-tracker/`, `/tools/burial-cost/`, `/tools/staple-basket/`, `/tools/wholesale-retail-spread/`, `/tools/land-size/`, `/tools/naira-to-words/`, `/tools/amount-words-ke/`, `/tools/amount-words-gh/`, `/tools/susu-tracker/`, `/tools/whatsapp-link/`, `/tools/remittance-compare/`, `/tools/informal-fx-watch/`, `/tools/remittance-v2/`, `/tools/cost-of-living/`, `/tools/afroatlas/`, `/tools/afropoints/`, `/tools/afrokitchen/`, `/tools/africa-conflict/`, `/tools/brideprice-advisor/`, `/tools/ajo-interest/`, `/tools/diaspora-guide/`, `/tools/nollywood-pitch/`, `/tools/okada-income/`, `/tools/market-days/`, `/tools/ajo-chama/`, `/tools/afroprices/`, `/tools/ankara-kente-cost/`, `/tools/fabric-cost/`

All 35 have independent synthetic-input, adverse-state, privacy, mobile, dark
mode and 200%-text browser proof in
`tests/e2e/day10-african-contracts.spec.js`. The exact oracle, defect and export
matrix is recorded in `DAY10-AFRICAN-FINAL-ADDENDUM.md`.

### Accepted Religious & Cultural apps

`/tools/tithe-calculator/`, `/tools/lobola-calculator/`, `/tools/lobola-negotiation-checklist/`, `/tools/lobola-gift-list/`, `/tools/african-proverbs/`, `/tools/zakat-calculator/`, `/tools/prayer-times/`, `/tools/ramadan-timetable/`, `/tools/faraid-inheritance/`, `/tools/hajj-budget/`, `/tools/islamic-finance/`, `/tools/wedding-budget/`, `/tools/naming-ceremony/`, `/tools/funeral-cost/`, `/tools/baby-name-generator/`, `/tools/traditional-calendar/`, `/tools/age-calculator-african/`, `/tools/festival-calendar/`, `/tools/aso-ebi-cost/`, `/tools/traditional-attire/`, `/tools/halal-compliance/`, `/tools/islamic-calendar/`

All 22 have independent arithmetic/reference oracles and explicit religious
authority, quotation, ruling, calendar, certification and cultural-context
boundaries in `tests/e2e/day10-religious-cultural-contracts.spec.js`. Twelve
PDF outputs were downloaded and parsed, and seven CSV/TXT outputs were reopened.
The exact matrix is recorded in
`DAY10-RELIGIOUS-CULTURAL-FINAL-ADDENDUM.md`.

## Hub result

- `/uniquely-african/` now exposes exactly the 35 canonical African destinations and a matching 35-item schema. Tithe and lobola are no longer presented as African-category inventory.
- `/religious-cultural/` now exposes exactly 22 destinations and clearly says the apps are planning/reference aids, not religious rulings, certification, binding inheritance decisions, authenticated quotations, or universal cultural practice.
- `/business-roi/` now exposes exactly 12 Data & Productivity destinations, a matching schema, and no fake coming-soon count.
- `/african/` and `/data-productivity/` remain alternate routes with explicit canonicals.

## Repairs and product-contract evidence

- Corrected timezone conversion so a `datetime-local` value is interpreted in the selected source zone rather than the browser machine zone.
- Cleared stale output and surfaced live validation status for countdown, working-days, and age calculations.
- Escaped user-entered course labels and grade labels before grade-table rendering.
- Removed unsupported country/investment recommendations from the budget result logic and made the 50/30/20 split an editable example.
- Repaired narrow-screen and 200% text reflow issues in the affected African, Religious/Cultural, and Data/Productivity pages.
- Removed email gates from shared African and Religious/Cultural local PDF workflows.
- Made telecom lead capture explicit opt-in only; entering an email without checking consent cannot trigger capture, and local PDF generation remains available.

## Evidence commands

- `node tests/day10-category-contract.test.js`
- `node tests/day10-shared-export-privacy.test.js`
- `npx playwright test tests/e2e/day10-data-productivity-contracts.spec.js --reporter=line`
- `npx playwright test tests/e2e/day10-shared-export-privacy.spec.js --reporter=line`
- `npx playwright test tests/e2e/day10-category-workflows.spec.js --reporter=line`
- `npx playwright test tests/e2e/day10-african-contracts.spec.js tests/e2e/day10-religious-cultural-contracts.spec.js tests/e2e/day10-data-productivity-contracts.spec.js tests/e2e/day10-shared-export-privacy.spec.js tests/e2e/day10-category-workflows.spec.js --workers=3 --reporter=line` — **162/162 passed**
- `npm run lint`
- `npm run type-check`
- `npm run check-links`
- `npm run audit`
- `git diff --check`

The maintained category browser suite uses the registry inventory and serially exercises all three hubs followed by every canonical app. It covers 320px and 375px viewports, 200% root-font reflow, light/manual-dark/system-dark modes, reduced motion, keyboard focus, labels/live regions, browser storage visibility, and unexpected console, page, and URL-leak signals.

The original generic run passed **72/72**. The final consolidated app-level
matrix passes **162/162**. The legacy-page fallback explicitly
excludes navbar, footer and newsletter controls, preventing the earlier false
workflow and synthetic-email submission on Africa Conflict while preserving
real controls on pages without a semantic `main`.

The static contract also proves that every one of the 69 canonical routes has a registry search name/description and is present in the committed `data/ai/tool-catalog-pack.json`, in addition to its title, description, canonical, schema, source/freshness language, and confidence boundary.

## Risks and boundaries

- No app was promoted solely by a shared workflow or route smoke; all 57
  formerly open apps now have route-specific oracle and source/authority
  evidence in the two final addenda.
- The registry audit exits successfully but continues to report three pre-existing out-of-scope missing job-offer pages: English, French, and Swahili job-offer-evaluator routes.
- AfroPrices reaches its local submission endpoint during the synthetic
  workflow and logs the expected missing local Supabase key. Its deterministic
  search workflow, invalid clearing and privacy boundary are accepted; a live
  submission/backend claim is not made.
- Parser-level PDF verification is recorded only where the app exposes PDF;
  print-only and non-PDF routes are not mislabeled as parsed PDF proof.
- No production, Supabase, deploy, or live-route action was performed.
- No generated localization, sitemap, bundle, minified engine, or broad build output was regenerated.
- No shared navbar or design-system source was changed. Shared-helper overlap is limited to `assets/js/african-workflow.js`, `assets/js/religious-cultural-apps.js`, and `assets/js/telecom-toolkit.js`; integration should serialize those owners.
