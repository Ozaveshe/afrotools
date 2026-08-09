# Swahili PAYE country directory parity evidence

Checked: 2026-08-09

## Exact product identity and denominator credit

- English registry app: `paye-calculator`
- English owner: `/tools/paye-calculator/`
- French owner: `/fr/tools/calculateur-paye/`
- Swahili owner: `/sw/mshahara-na-kodi/paye/`
- Source owner: `scripts/build-sw-paye-country-directory.js`
- Candidate acceptance: 1 directory app, not a fourteenth country PAYE calculator.
- The separate `/salary-tax/paye/` and `/fr/salary-tax/paye/` pages remain category/family hubs and receive no app credit from this change.

The registry product is a country resolver and crawlable directory. It performs no tax calculation. It asks for country only, then opens the country owner that contains the tax bands, contribution rules, assumptions, source status, calculation, invalid state, and exports.

## Route and hreflang serialization

The exact app equivalence group is now:

- `en`: `https://afrotools.com/tools/paye-calculator/`
- `fr`: `https://afrotools.com/fr/tools/calculateur-paye/`
- `sw`: `https://afrotools.com/sw/mshahara-na-kodi/paye/`
- `x-default`: `https://afrotools.com/tools/paye-calculator/`

The broader English and French PAYE family hubs no longer declare the Swahili app route as their equivalent. This removes the previous one-Swahili-route-to-two-English-products ambiguity.

## Country routing and source boundary

- All 54 African country options resolve to unique physical Swahili owners.
- Every destination declares `lang="sw"`.
- Guinea-Bissau now resolves to `/sw/guinea-bissau/kikokotoo-kodi-mshahara/`; the English route `/guinea-bissau/gw-paye` also exists, so the former unsupported claim was removed.
- Local source record: `paye-tax-engine-country-packs` in `data/source-registry.json`.
- External directory source URL: none; this is an AfroTools reviewed route/dataset registry rather than a rate source.
- Last checked and reviewed: 2026-06-14.
- Review cadence: 90 days.
- Confidence: reviewed.
- Checked against the repository on 2026-08-09.

The directory never claims that route availability makes a tax result official or current. Users are told to verify the destination calculator's tax year, source date, assumptions, and fail-closed state. Official authority URLs and changing tax facts remain owned by each country calculator.

## Workflow, privacy, AI, and exports

- One accessible country selector exposes all 54 routes.
- The result is announced through a polite live region and reveals a stable country link.
- No salary, employer, name, email, or financial input is collected on this page.
- No calculation, filing, assessment, or network AI call is made by the directory.
- The existing AI prefill adapter remains local-first: it routes directly to a country owner and keeps salary data out of the URL through browser-session storage.
- No PDF, CSV, JSON, or print action is advertised by the directory because it produces no report. Export parse/reopen proof is therefore not applicable here; the destination country app owns and proves its advertised formats.

## Surface preservation

| Owner | Bytes before → after | Visible words before → after | H2 before → after | Controls before → after | Buttons before → after | Links before → after |
|---|---:|---:|---:|---:|---:|---:|
| Swahili | 19,776 → 21,945 | 477 → 549 | 4 → 5 | 1 → 1 | 10 → 0 | 19 → 58 |
| English | 15,267 → 15,315 | 461 → 462 | 5 → 5 | 1 → 1 | 0 → 0 | 64 → 65 |
| French | 9,366 → 9,441 | 387 → 386 | 4 → 4 | 1 → 1 | 0 → 0 | 26 → 26 |

The ten removed Swahili buttons were generic family-hub quick filters and did not belong to the exact directory workflow. The country selector is retained as the sole task control and now resolves every country. Visible guidance and crawlable country links expanded.

## Verification

- `node --test tests/paye-country-directory.test.js tests/sw-paye-country-directory-parity.test.js tests/sw-finance-native-four-review.test.js` — 7/7 passed.
  - exact registry identity and no duplicate country-app credit;
  - all 54 unique physical Swahili routes;
  - directory-only surface and no salary/export controls;
  - source record and cadence;
  - deterministic generation;
  - repaired legacy route-identity assertion.
- Focused Chromium `tests/e2e/sw-paye-country-directory.spec.js` — 4/4 passed.
  - all 54 selector outcomes;
  - Kenya and Guinea-Bissau route oracles;
  - exact EN/FR/SW reciprocal metadata and non-conflated category hubs;
  - no entered-data egress or console errors;
  - 320px and 375px at 200% text in light and dark modes;
  - keyboard focus and live-region behavior.
- `node --test tests/ai-prefill-adapters.test.js tests/ai-tool-manifest.test.js` — 2/2 passed.
- `node scripts/build-i18n.js --validate` — French, Swahili, Yoruba, and Hausa keys passed.
- `npm run validate:hreflang` — 33,972 relationships across 5,350 groups passed.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `git diff --check` — passed.
- Encoding scan across touched source, page, test, and receipt files — no mojibake marker found.
- `git diff --diff-filter=D --summary` — empty; zero physical deletions.

## Residual risk

The directory's reviewed route pack does not replace the source contract of any country calculator. A destination can become stale or unavailable independently; its own visible source status and fail-closed behavior remain authoritative. No acceptance ledger, AI route map, locale coverage, sitemap, redirect, service worker, release artifact, or live system was changed.
