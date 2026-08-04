# Swahili Education Affordability Parity Evidence

Date: 2026-08-04

Baseline: `4f74dee35e5fed17140cd98d12bf6b71ea646875`

Branch: `codex/sw-edu-dev-20260804`

## Outcome

- Scoped implementation acceptance: **8/8 native Swahili apps**.
- Hub discovery acceptance: **2/2 hubs** (`/sw/elimu/`, `/sw/zana-za-elimu/`).
- Export proof: **24/24 outputs reopened**: JSON parsed, TXT decoded, and PDF signature plus text parsed for every app.
- Artwork: **8/8 existing dedicated English-owner WebP assets reused**; no fallback artwork.
- Physical deletions: **0**.
- Central acceptance remains unchanged by design. The coordinator must record this receipt after integration.

## Exact app scope

| English owner | Swahili owner | Engine reused | Oracle |
|---|---|---|---|
| `/tools/school-fees/` | `/sw/zana/ada-za-shule/` | `school-fees-engine.js` | annual `144,000`; monthly reserve `12,000`; payment `48,000` |
| `/tools/ke-helb/` | `/sw/zana/kikokotoo-helb-kenya/` | `helb-engine.js` | first-month interest `1,200`; deterministic amortization |
| `/tools/student-budget/` | `/sw/zana/bajeti-ya-mwanafunzi/` | `student-budget-engine.js` | resources `4,500`; expenses `3,500`; balance `1,000` |
| `/tools/teacher-salary/` | `/sw/zana/mshahara-wa-mwalimu/` | `teacher-salary-engine.js` | gross `120,000`; take-home `105,000` |
| `/tools/student-loan-repay/` | `/sw/zana/marejesho-ya-mkopo-wa-mwanafunzi/` | `student-loan-engine.js` | extra-payment plan reduces payoff months |
| `/tools/tutoring-rate/` | `/sw/zana/bei-ya-tutoring/` | `tutoring-rate-engine.js` | required session revenue `11,875` |
| `/tools/edu-savings/` | `/sw/zana/akiba-ya-elimu/` | `edu-savings-engine.js` | projected fund `7,000`; required monthly contribution `750` |
| `/tools/study-abroad-cost/` | `/sw/zana/gharama-za-kusoma-nje/` | `study-cost-engine.js` | gross `37,600`; funding gap `20,600`; upfront `8,000` |

The six pre-existing authoritative routes were preserved. Only Tutoring Rate and Study Abroad Cost received new Swahili routes. A live `buildReport()` reconciliation recognizes all eight exact owners; the committed central inventory was not regenerated in this lane.

## Product contract

- All visible workflow, validation, result, privacy, export and planning-boundary copy is native Kiswahili.
- Calculations remain in the existing DOM-free English-owner engines; no formula was forked or translated.
- Inputs stay inside the browser. No account, storage, analytics payload, AI request or other network send was added.
- Invalid input clears stale results and produces an assertive Kiswahili error.
- Results can be copied or downloaded as JSON, TXT and real PDF.
- The shared UI supports system dark mode, an explicit light/dark control, reduced motion, visible focus, real labels and status/live regions.
- Canonical, Open Graph, structured data, artwork and reciprocal hreflang are route-correct.

## Cross-locale metadata-only scope

The coordinator authorized four reciprocal metadata-only edits required for a complete hreflang clique. No English or French UI, runtime, formula or copy changed.

- `tools/tutoring-rate/index.html`
- `tools/study-abroad-cost/index.html`
- `fr/tools/calculateur-tarif-tutorat/index.html`
- `fr/tools/cout-etudes-etranger/index.html`

## Validation

- PASS — `node tests/sw-education-affordability-parity.test.js`: 8/8 source owners, generator freshness, artwork and formula oracles.
- PASS — eight upstream focused engine suites: 23 tests plus their assertion-level checks.
- PASS — isolated one-worker Chromium suite: 10/10 tests.
  - all eight calculations and invalid/reset flows;
  - JSON/TXT/PDF download and reopen/parse for every app;
  - 320px and 375px layouts, 200% reflow, manual dark mode;
  - keyboard entry/focus, native labels/landmarks/live regions;
  - canonical/OG/artwork and no console, page or outbound-network errors;
  - both Swahili education hubs expose all eight routes without 320px overflow.
- PASS — `npm run validate:hreflang`: 11,290 pages, 33,412 relationships, 5,351 equivalence groups.
- PASS — `npm run check-links`: 138,218 internal links across 11,509 HTML files.
- PASS — `npm run build:i18n:validate` and `npm run localization:check` contract execution.
- PASS — `npm run lint`, `npm run type-check`, syntax checks and `git diff --check`.

## Carried integration work and tooling limit

- The localization checks report that `data/registry/locale-page-coverage.json` and `reports/localization-coverage.*` are stale because this bounded lane intentionally did not write central/generated coverage artifacts. Regenerate them once after all Swahili commits are integrated.
- `axe-core` is not installed in this worktree. Accessibility proof is browser-backed keyboard/focus, labels, landmarks, live regions, responsive reflow and theme behavior; no dependency was added for this lane.
- No central acceptance file, AI map, registry, sitemap, redirect, service worker, `dist`, other generated search artifact, push, PR, merge or deployment was performed.
