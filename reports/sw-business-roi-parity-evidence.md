# Swahili Business & ROI parity evidence

Status: **ACCEPTED**

Baseline: `f7e45c5ed98f50767281ce71b8960d16d138bd33`

Branch: `codex/sw-business-roi-remaining-20260803`

Date: 2026-08-03

## Exact scope and acceptance

- Denominator: 12 English free apps in the Business & ROI / Data & Productivity programme.
- Implemented native Swahili owners: 12/12 apps plus `/sw/data-na-tija/`.
- Accepted: 12/12.
- Blocked: 0/12.
- Architecture blockers: none.
- Missing artwork: 0/12. Every route points to its existing semantic `assets/img/tools/<source-id>.webp` owner.
- Physical file deletions: 0.

| English owner | Swahili owner | Implementation | Acceptance |
| --- | --- | --- | --- |
| `/tools/pomodoro/` | `/sw/zana/pomodoro/` | Native shared-engine workflow | Accepted |
| `/tools/unit-converter/` | `/sw/zana/kubadilisha-vipimo/` | Native shared-engine workflow | Accepted |
| `/tools/budget-planner/` | `/sw/zana/mpango-bajeti/` | Native shared-engine workflow | Accepted |
| `/tools/countdown-timer/` | `/sw/zana/hesabu-siku-za-tukio/` | Native shared-engine workflow | Accepted |
| `/tools/time-zone/` | `/sw/zana/kigeuzi-saa-za-maeneo/` | Native shared-engine workflow | Accepted |
| `/tools/public-holidays/` | `/sw/zana/kalenda-likizo-za-umma/` | Native source-confirmed single-event workflow | Accepted |
| `/tools/working-days/` | `/sw/zana/siku-za-kazi/` | Native shared-engine workflow | Accepted |
| `/tools/age-calculator/` | `/sw/zana/kikokotoo-umri/` | Native shared-engine workflow | Accepted |
| `/tools/grade-tracker/` | `/sw/zana/kifuatiliaji-alama/` | Native shared-engine workflow | Accepted |
| `/tools/random-picker/` | `/sw/zana/chaguo-nasibu/` | Native local-crypto workflow | Accepted |
| `/tools/meeting-cost/` | `/sw/zana/gharama-ya-mkutano/` | Native shared-engine workflow | Accepted |
| `/tools/tip-calculator/` | `/sw/zana/kigawanya-bili-na-tip/` | Native shared-engine workflow | Accepted |

## Product and architecture evidence

- `data/localization/sw-business-roi-parity.json` is the exact 12-row source manifest.
- `scripts/build-sw-business-roi-parity.js` owns all 12 app pages and the exact 12-card Swahili hub; `--check` fails when generated owners are stale.
- `assets/js/pages/sw-business-roi-parity.js` contains native Swahili presentation, validation, local saving and exports. Calculation logic remains in `engines/src/business-roi-engine.js`.
- The shared engine received only backward-compatible locale presentation support for Swahili time-zone and user-confirmed holiday output. Existing formulas and English/French behavior remain covered by the original 12 owner fixtures.
- PDF, CSV, JSON and TXT are exposed by every route. Public Holiday additionally exposes ICS. All downloads are local and ungated.
- Registry rows now reconcile one-for-one to their English owner ids, category and artwork ids. Grade Tracker now has its missing Swahili discovery row.
- The two obsolete English-fallback declarations for Public Holiday and Tip Calculator were removed.
- Locale coverage changed exactly 13 existing records: 11 app routes from `localized-shell` to `native`, one Public Holiday fallback-derived route to `native`, and the already-native hub to its maintained generator owner. No coverage record was added or removed.
- AI intent candidates exist for all 12 routes in the scoped manifest. The central acceptance-driven Swahili AI map was deliberately not edited before browser acceptance.
- The central acceptance ledger, sitemaps, redirects, `dist/`, other locales and deployment surfaces were not edited.

## Static validation completed

- PASS `node scripts/build-sw-business-roi-parity.js --check`
- PASS `node tests/business-roi-engine.test.js` — 12/12 existing shared-engine owner fixtures
- PASS `node tests/sw-business-roi-engine.test.js` — Swahili time-zone and holiday locale fixtures plus English compatibility
- PASS `node tests/sw-business-roi-parity.test.js` — exact 12 apps, hub, owners, discovery, artwork, privacy, exports and reciprocal English metadata
- PASS `npm run lint`
- PASS `npm run type-check`
- PASS `npm run audit` (carried unrelated missing-page notices: `job-offer-evaluator` and `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`)
- PASS `npm run check-links` — 137,984 internal links across 11,473 HTML files
- PASS `npm run build:i18n:validate`
- PASS `npm run validate:hreflang` — 11,254 pages, 33,234 relationships, 5,340 equivalence groups
- PASS `node scripts/build-localization-platform.js --check`
- PASS `node tests/ai-consent-server.test.js`
- PASS `git diff --check`
- PASS deletion audit — zero deleted paths

## Browser proof

- Exact server identity: worktree `C:/Users/Oza/.codex/worktrees/sw-business-roi-remaining-20260803/afrotools`, candidate SHA `13830eb0877a093401746dbac61746fad04827f0`, isolated `http://127.0.0.1:43153`.
- PASS focused repair: 1/1 `unit-converter: invalid input fails closed`.
- PASS complete serial Chromium suite: 37/37 with `--workers=1` in 1.4 minutes.
- PASS all 12 owner-driven calculation workflows and all 12 invalid or boundary paths.
- PASS 320px, 375px and 200% reflow; manual and system dark modes; keyboard entry; canonical, OG and reciprocal English metadata; console and page-error checks for every app.
- PASS 49 downloaded outputs reopened or parsed: 12 JSON, 12 CSV, 12 TXT, 12 PDF through `pdf-parse`, and one ICS calendar file.
- PASS local copy, local storage and print action for every app.
- PASS privacy/network boundary: `window.AfroLocalOnly === true` and zero unexpected external, `/api/`, or `/.netlify/functions/` requests across all 24 workflow and responsive-shell tests.
- PASS exact hub: 12 unique cards linked to the 12 manifest-owned routes.
- Proven repair: changing the unit family now keeps only compatible units available, and negative non-temperature measurements fail closed. Negative temperatures remain valid.
