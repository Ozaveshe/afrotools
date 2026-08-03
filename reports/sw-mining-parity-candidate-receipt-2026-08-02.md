# Swahili Mining parity candidate receipt — 2026-08-02

## Decision

- Candidate acceptance: **ACCEPT 6 / BLOCK 0**.
- Central acceptance registry: **unchanged by design**. The six live candidates remain `unclassified-candidate` until coordinator review and central regeneration.
- Parent contract: direct child of `8354e321ff34caf60a33a3393cd0dcddfb00c023`.
- Scope: Mining only. No Energy, Engineering, Climate, shared AI routing, master ledger, sitemap, `dist`, deployment, merge, or push work.

## Exact six-row outcome

| English owner ID | Kiswahili route | Candidate decision | Product oracle |
|---|---|---:|---|
| `diamond-valuation` | `/sw/zana/thamani-ya-almasi/` | ACCEPT | USD 12,000 adjusted; 7,800 wholesale; 14,400 insurance; 5,400 resale |
| `oil-well-production` | `/sw/zana/uzalishaji-wa-kisima-cha-mafuta/` | ACCEPT | 926.7896026715391 bbl/day; 304,450.3844776006 bbl/year; USD 15,983,645.18507403 net |
| `oil-gas-revenue` | `/sw/zana/mgawanyo-wa-mapato-ya-mafuta-na-gesi/` | ACCEPT | USD 16,100,000 contractor; USD 48,900,000 government; 65.2% government |
| `mining-license-fee` | `/sw/zana/gharama-ya-leseni-ya-madini/` | ACCEPT | NG exploration: 600,000 initial; 63,000 annual; 915,000 total |
| `mining-royalty` | `/sw/zana/mrahaba-wa-madini/` | ACCEPT | TZ gold: 60,000 royalty; 10,000 separate levy; 930,000 net |
| `artisanal-mining-income` | `/sw/zana/mapato-ya-uchimbaji-mdogo/` | ACCEPT | 1,000 monthly per miner; 12,000 annual; 990 formal-channel gap |

## Product and truth boundaries

- The six pages expose product-specific fields, units, results, breakdowns, formulas and invalid states; they are not a generic card shell.
- All formulas use the existing DOM-free `AfroToolsMiningPlanners` engine. Browser checks compare each Kiswahili result with the independent English owner display.
- Diamond, oil and artisanal prices are user-entered and source-dated. No current, official or live commodity price is claimed.
- Licence and royalty routes reuse `data/mining/mining-fees.js` and `data/mining/mining-royalties.js`, preserving jurisdiction, currency, authority, review date, confidence and missing-value fail-closed behavior.
- Evidence name, checked date and confidence are mandatory. Future dates fail; evidence older than 90 days is visibly stale and remains planning-only.

## Workflow, export and privacy proof

- Valid workflow and exact numeric/no-NaN oracle: 6/6.
- Route-specific invalid state: 6/6. Boundary proof includes a finite explicit 100% PSC royalty scenario.
- Any input/change or failed calculation hides and clears the result snapshot, removes raw outputs, nulls the frozen report and disables JSON/CSV/PDF exports.
- JSON: downloaded, parsed, reopened, inputs restored, and recalculated without trusting exported results.
- CSV: downloaded and parsed for tool, source, inputs and results.
- PDF: downloaded, `%PDF-` validated and text parsed for AfroTools, source and date.
- No `fetch`, XHR, WebSocket, beacon, storage or non-GET local writes exist in the controller; the browser suite observed zero network writes.
- AfroTools AI link carries only the candidate tool ID and is keyboard-disabled until explicit consent. Shared AI routing was not edited.

## Browser, accessibility and SEO proof

- Chromium: 6/6 routes passed with no console or page errors and no failed required resources.
- Responsive: 320px and 375px at 200% text, zero horizontal overflow and zero clipped controls.
- Themes: explicit light, explicit dark, system-light and system-dark all passed computed control contrast assertions on every visible `input`, `select` and `textarea`.
- Measured control minima across all six routes: boundary **3.476:1**, keyboard focus indicator **3.200:1**, and control text **15.810:1**. Light/system-light minima were 4.759:1 boundary, 5.169:1 focus and 17.853:1 text; explicit-dark minima were 3.476:1, 3.200:1 and 17.499:1; system-dark minima were 3.476:1, 3.200:1 and 15.810:1.
- Keyboard/a11y: labelled controls, Enter submission, focused invalid control, focused result, live status, 44px interactive targets and reduced-motion behavior.
- Artwork: all six English-owner assets load completely at 1200×1200; queue has 6 reuse-approved and 0 missing.
- SEO: self-canonical, OG/Twitter artwork, WebApplication/Breadcrumb/FAQ schema, `lang=sw`, and reciprocal en/fr/sw/x-default hreflang. Full validator passed 31,106 relationships / 5,276 groups.
- Discovery: six maintained source-registry rows, each mapped once to its English `sourceId`. Coordinator-owned surface generation will project them into shared catalog output after acceptance.

## Tests and integration boundary

- PASS — `node --test tests/sw-mining-parity.test.js` (7/7).
- PASS — `npx playwright test -c playwright.sw-mining.config.js` (6/6).
- PASS — `npm run mining:sources:check` (18/18 markets sourced; dataset stamp 2026-07; declared gaps retained).
- PASS — `npm run validate:hreflang` (31,106 relationships; 5,276 groups).
- PASS — `npm run test:sw-parity` against the unchanged committed central inventory (1,257 rows; 199 centrally accepted).
- PARTIAL — `npm run sw:surface:check` kept its scoped 5/5 language-lane assertions green, then correctly failed on the intentionally unregenerated shared output set described below.
- EXPECTED COORDINATOR DRIFT — `npm run sw:parity:check` detects the six new unclassified candidates. The generated inventory and localization coverage artifacts were not written because this lane explicitly excludes central acceptance and broad generated churn.
- EXPECTED COORDINATOR DRIFT — `npm run build:i18n:validate` stops at `localization:check` because localization platform counts rise by six routes; `data/registry/locale-page-coverage.json` and `reports/localization-coverage.*` require coordinator-owned regeneration.
- EXPECTED COORDINATOR DRIFT — `npm run sw:surface:check` reports 127 generated surfaces stale after the six source-registry additions. Those broad outputs were deliberately not regenerated in this scoped lane.

## Carried risks

- Central acceptance remains 0/6 for this category until the coordinator reviews this candidate receipt, updates the central acceptance source, regenerates the Swahili AI map from accepted truth, and refreshes generated inventory/coverage outputs.
- The Mining data ledger records five jurisdiction gaps / six unsourced claim classes. The UI preserves those gaps and never converts a missing fee/rate into zero.
- No live deployment or production-route proof was attempted.
