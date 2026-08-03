# Swahili Transport & Logistics static candidate receipt

Date: 2026-08-03

Coordinator base: `f7036c210c34146d58b43d0a2a5d4c023cb91694`

Branch: `codex/sw-transport-static-20260803`

Acceptance mode: fail closed; browser slot is owned by Health.

## Exact denominator

- English free apps: **18**
- Previously accepted: **0**
- Static parity candidates after this lane: **1**
- Fully accepted after this lane: **0**
- Blocked: **17**
- Physical deletions: **0**

The central Swahili acceptance ledger was intentionally not edited. The single architecture candidate remains blocked until both conditions are met:

1. the several hundred country-rule-pack strings (FAQ answers, document labels, warnings and source notes) receive reviewed native Swahili copy rather than being inherited from the shared English JSON; and
2. the coordinator can run calculation, invalid-reset, export/reopen, responsive, theme, keyboard, console and local-network proof in the shared browser slot.

## App-by-app reconciliation

| # | English owner | Swahili route | Static outcome | Exact boundary |
| --- | --- | --- | --- | --- |
| 1 | `car-import-cost` | `/sw/zana/gharama-kuagiza-gari/` | Architecture candidate; copy and browser blocked | Generic FOB/duty/VAT shortcut retired. Route now mounts the shared six-country `car-import-cost-engine`, English production controller, exports and enhancements under a scoped Swahili presentation/privacy boundary. Static controls and result-shell labels are translated, but the English rule-pack JSON still supplies country-specific FAQ, document, warning and source-note text. Source ledger status is `changed`, so claims remain planning estimates. |
| 2 | `car-price-intelligence` | Missing | Blocked | Although shared price/import engines exist, `docs/SWAHILI-LOCALIZATION-STRATEGY.md` explicitly requires a separate product-truth review before localizing the car-price directory. |
| 3 | `ride-fare` | `/sw/zana/nauli-za-ride-hailing/` | Blocked | English production calculation is inline; source ledger is blocked/manual. No safe DOM-free shared owner to reuse. |
| 4 | `boda-income` | `/sw/zana/mapato-ya-boda-boda/` | Blocked | English production calculation is inline; source ledger is changed. |
| 5 | `matatu-fare` | `/sw/zana/nauli-za-matatu-danfo-trotro/` | Blocked | English production calculation is inline; source ledger is changed. |
| 6 | `delivery-cost` | `/sw/zana/gharama-ya-delivery/` | Blocked | English production calculation is inline; source ledger is changed. |
| 7 | `car-loan-vs-cash` | `/sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/` | Blocked | English production calculation is inline; source ledger is changed. |
| 8 | `vehicle-registration` | `/sw/zana/usajili-na-nyaraka-za-gari/` | Blocked | English production checklist/fees are inline; source ledger is changed. |
| 9 | `roadworthiness` | `/sw/zana/ukaguzi-wa-roadworthiness/` | Blocked | English production checklist is inline; source ledger is changed. |
| 10 | `vehicle-depreciation` | `/sw/zana/kushuka-thamani-ya-gari/` | Blocked | English production calculation is inline; source ledger is changed. |
| 11 | `fleet-fuel` | `/sw/zana/gharama-mafuta-ya-fleet/` | Blocked | English production calculation is inline; source ledger is changed. |
| 12 | `last-mile-delivery` | `/sw/zana/gharama-last-mile-delivery/` | Blocked | English production calculation is inline; source ledger is changed. |
| 13 | `parking-fee` | `/sw/zana/ada-za-maegesho/` | Blocked | English production calculation is inline; source ledger is blocked/manual. |
| 14 | `route-cost` | `/sw/zana/gharama-njia-za-logistics/` | Blocked | English production calculation is inline; source ledger is blocked/manual. |
| 15 | `toll-calc` | `/sw/zana/ada-za-toll/` | Blocked | Source ledger is OK, but the English production calculation remains inline with no shared DOM-free owner. |
| 16 | `truck-load` | `/sw/zana/kupakia-lori/` | Blocked | English production calculation is inline; source ledger is blocked/manual. |
| 17 | `vehicle-operating-cost` | `/sw/zana/gharama-uendeshaji-gari/` | Blocked | English production calculation is inline; source ledger is changed. |
| 18 | `vehicle-tracker-roi` | `/sw/zana/faida-ya-tracker-ya-gari/` | Blocked | English production calculation is inline; source ledger is blocked/manual. |

## Candidate behavior preserved

- The exact English calculation engine and country rule packs remain the formula source; no English formula or transport data file changed. The rule-pack copy must not be counted as fully translated yet.
- Nigeria, Kenya, Ghana, Uganda, Zambia and Tanzania country rules, source-market comparison, age/steering warnings, customs/port/registration breakdowns and scenario logic are available through the production controller.
- PDF, CSV and print actions remain local. Sharing is forced to the route only, with no vehicle values in the URL.
- The existing network AI button is intercepted and replaced with deterministic local guidance; no vehicle inputs are sent.
- Invalid non-negative inputs clear the visible result. Editing a fresh result marks it stale and requires recalculation.
- The route uses its canonical `car-import-cost.webp` artwork instead of the generic OG image.

## Source and freshness proof

`npm run transport:sources:check` passed with **41 sources, 3 changed, 12 blocked/manual and 0 broken**. Changed hashes are review signals only; this lane did not alter duties, tariffs, tolls, registration rules or other rates.

## Validation

- PASS `node tests/car-import-cost-engine.test.js`
- PASS `node tests/swahili-transport-static-candidate.test.js`
- PASS `node -c assets/js/pages/swahili-car-import-cost.js`
- PASS `npm run transport:sources:check`
- PASS `npm run sw:parity:check` — 1,257 English free apps, 770 accepted; this candidate intentionally did not mutate acceptance.
- PASS `npm run sw:ai-routes:check` — 770 accepted routes remain mapped.
- PASS `npm run sw:surface:check` — 887 published Swahili records.
- PASS `npm run validate:hreflang` — 11,256 public pages, 33,248 relationships, all reciprocal.
- PASS `npm run check-links` — 138,173 internal links across 11,475 HTML files.
- PASS `npm run audit`, `npm run lint`, `npm run type-check`, `node tests/ai-consent-server.test.js` and `git diff --check`.
- BROWSER PENDING: Health owns Chromium; no browser was launched from this lane.

## Guardrails

No master acceptance ledger, AI master map, sitemap, redirect, `dist/`, service worker, other locale, English formula, transport data or broad generated output was edited. No push, PR, merge or deployment was performed.
