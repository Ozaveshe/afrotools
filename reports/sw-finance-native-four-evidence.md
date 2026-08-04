# Swahili Finance Native-Candidate Evidence

Date: 2026-08-04

Baseline: `4f74dee35e5fed17140cd98d12bf6b71ea646875`

Lane: `codex/sw-finance-native-20260804`

## Result

- Reviewed: 4/4 exact candidates.
- Accepted for coordinator reconciliation: 1/4 (`cbk-rates`).
- Fail-closed: 3/4 (`salary-intelligence`, `crypto-prices`, `paye-calculator`).
- Central acceptance ledger, locale coverage, registry, AI route map, sitemaps, redirects, other locales and deploy output were not changed.

“Accepted for coordinator” is lane evidence only. It does not change the central acceptance count until the coordinator reviews and integrates it.

## Accepted candidate

### `cbk-rates`

- English route: `/tools/cbk-rates/`.
- Swahili route: `/sw/zana/viwango-vya-cbk/`.
- Native source owner: `sw/zana/viwango-vya-cbk/index.html`.
- Shared unchanged runtime: `assets/js/pages/cbk-manual-converter.js`.
- Product contract: the user brings a dated official CBK Mean rate; the browser performs `amount / quoted units * rate` and shows the exact formula. No bundled or live FX feed is claimed.
- Browser proof: 250 JPY at a KES 85 rate per 100 units returns KES 212.50; empty input and future dates fail in Kiswahili and focus the relevant field.
- Privacy: calculation produced no FX/rate API request and changed neither local nor session storage. No export is advertised; the page explicitly says no PDF or download is created.
- UI/accessibility: passed at 320px light and 375px dark, plus 320px at 200% root text size; no horizontal overflow, controls have labels or stable accessible button text, result/error regions announce state, and keyboard focus is visible.
- SEO: native `lang=sw`, Swahili WebApplication schema, matching canonical, and reciprocal English hreflang are present.
- Artwork: both language owners and registry rows use the dedicated `assets/img/tools/cbk-rates.webp` social preview.
- AI: the existing Swahili registry candidate carries `sourceId: cbk-rates`. This lane records candidate evidence only and does not change the coordinator-owned AI route map.

## Fail-closed blockers

### `salary-intelligence`

The proposed `/sw/mshahara-na-kodi/` route is the Salary and Tax category hub. The English app is the private Salary Evidence Notebook and owns `salary-evidence-notebook.js`, `salary-intelligence-vip.js`, comparable-row validation, and JSON/CSV/PDF workflows. The Swahili hub owns none of those. Its English hreflang is `/salary-tax/`, not `/tools/salary-intelligence/`. A hub cannot serve as app proof.

### `crypto-prices`

The proposed `/sw/mshahara-na-kodi/crypto/` route is the Crypto category hub. The English app owns `crypto-prices-vip.js`, a CoinGecko snapshot table, freshness receipts, sorting/search, and CSV/JSON exports. The Swahili hub owns none of those. Its English hreflang is `/salary-tax/crypto/`, not `/crypto/prices/`. A hub cannot serve as app proof.

### `paye-calculator`

The proposed `/sw/mshahara-na-kodi/paye/` route is the PAYE category hub. The English app is a separate 54-country directory driven by `paye-country-directory.js` and a country selector. The Swahili hub does not own that controller or selector. Its English hreflang is `/salary-tax/paye/`, not `/tools/paye-calculator/`. A hub cannot serve as app proof.

These three require dedicated source-owned counterparts and later coordinator-owned route/coverage reconciliation. This bounded lane did not manufacture new routes or rewrite central mappings.

## Validation

Passed:

- `node tests/sw-finance-native-four-review.test.js`
- `node tests/paye-country-directory.test.js`
- `node tests/salary-evidence-notebook.test.js`
- `AFROTOOLS_TEST_DISABLE_ANALYTICS=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:43161 npx playwright test tests/e2e/sw-finance-cbk-native.spec.js --workers=1 --reporter=line` — 3/3
- `npm run validate:hreflang` — 11,288 public pages, 33,400 relationships, all reciprocal
- `git diff --check`

The pre-existing `day3-finance-cbk-rates-vip.spec.js` was also sampled. Its product assertions reached the English and French workflows, but the run failed because its blanket “no POST” assertion now counts consent-aware Google Analytics requests; the default test server then disappeared before later cases. Rerunning its exact Swahili case with analytics disabled passed 1/1. The lane-owned suite uses the current analytics-disable contract and an isolated server, and passed 3/3.

No Axe dependency was added. The shared install does not currently expose `axe-core`; keyboard, labels, focus, state announcements and reflow were checked directly instead.
