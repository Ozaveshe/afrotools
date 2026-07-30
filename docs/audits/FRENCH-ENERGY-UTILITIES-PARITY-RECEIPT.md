# French Energy & Utilities parity receipt

Date: 2026-07-29

## Scope and denominator

- Canonical English owner apps: **20**
- Expanded English country/app experiences represented by those owners: **287**
- French owner routes built and checked: **20/20**
- French Energy hub cards and structured-data items: **20/20**
- French registry, filesystem, hub, and AI-route contract: **20/20**
- English calculation/controller scripts and external engine/data dependencies changed: **0**
- Deleted files: **0**

The repeatable owner is `scripts/build-french-energy-parity.js`; the exact
contract is `scripts/lib/french-energy-parity-contract.js`. The French pages
retain the English formulas and source wiring, then add native French
interaction labels, local scenario export/reopen, print/PDF, dated
source/confidence disclosure, and an explicit-consent AI handoff that sends
only the known tool id.

## Verification

- `npm run fr:energy:check` — passed, 20/20.
- `npm run test:fr-energy` — passed, 20 owners and 287 expanded experiences.
- `npm run test:fr-energy:browser` — covers all 20 routes at 320 px, 375 px,
  200% page scale, primary workflows, JSON download/reopen, print/PDF,
  keyboard consent, light mode, manual dark mode, and system dark mode.
- `npm run validate:hreflang` — passed, including reciprocal English, French,
  and existing Swahili equivalents.
- `npm run fr:surface:check` — passed with the new source owner respected.
- `npm run build:i18n:validate` — passed.
- `npm run check-links` — passed.
- `npm run category-workflow:verify` — passed.
- `npm run ai:french-routes:check` — passed for Energy; unrelated ambiguous
  Agriculture/PDF records remain outside this scope.
- `npm run fuel:sources:check` — passed structurally: 54 rows.
- `npm run solar-roi:data:check` — passed: 54/54 country records.
- `npm run test:privacy-ai-consent` — passed.
- Focused Energy Node tests — passed: 20/20 suites.
- `npm run lint` and `npm run type-check` — passed.

## Freshness and proof boundaries

The protected Energy formula/source snapshot is dated 2026-03-01. Because it
is older than 30 days, every French route fails closed to an archived/stale
state and tells the user to confirm tariffs, fuel prices, taxes, quotes, and
technical assumptions locally. No live tariff, official approval, installer
design, legal, financial, or safety claim was added.

The global `data/source-registry.json` freshness check is carried backlog and
was not rebuilt because this lane excludes master/generated ledgers. The
global live-data browser suite also retains unrelated AfroFX, AfroFuel, and
AfroRates selector failures; the two Energy estimator scenarios pass.

## Release boundary

This receipt is local commit proof only. No sitemap, other locale, broad build,
push, pull request, merge, deploy, live route, database, or scheduled worker
was changed or claimed.
