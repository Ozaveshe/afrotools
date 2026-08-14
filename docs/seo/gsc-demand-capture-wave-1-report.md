# GSC Demand Capture Wave 1 Report

## Outcome

Implemented two completion surfaces: a Local Fuel Price Finder on the existing fuel canonical and a PAYE Authority Finder routing to existing country calculators.

## 1. Opportunities reviewed

Fuel near-me, mobile-money fees, electricity/water tariffs, VAT/withholding/TIN, import/landed cost, construction/BOQ, NYSC, PAYE authority acronyms and recipe demand. Missing granular exports are disclosed in the program document.

## 2. Capability gaps

Fuel lacked explicit localization, granularity and fill-cost completion. PAYE acronym traffic lacked country-safe disambiguation. Mobile money and electricity have higher raw volume but insufficient maintained tariff truth.

## 3. Fuel architecture and near-me honesty

`/tools/fuel-tracker/` remains canonical. Geolocation starts only after “Use my location.” Haversine selection runs locally. No reverse geocoder or external location service was added. Result copy exposes granularity, dates, source, confidence and coverage. National data is never promoted to city/station data.

## 4. Fuel coverage

- Fresh low-confidence national benchmarks: Angola, Botswana, Ethiopia, Nigeria, Senegal and Uganda.
- Stale high-confidence official historical city references: Nairobi, Mombasa, Kisumu, Nakuru and Eldoret, Kenya.
- Supported: petrol/gasoline and diesel.
- No live, station, cheapest-pump, current Kenya, Ghana or South Africa price is claimed.

## 5. Secondary product

PAYE Authority Finder was selected. It handles MRA ambiguity and routes to seven canonical calculators. Mobile money and electricity were deferred until verified source packs support the task.

## 6. Routes

- Changed: `/tools/fuel-tracker/`
- Created: `/tools/paye-authority-finder/`
- No Wave 1 route was edited.

## 7. Source and freshness

Fuel uses `data/fuel/markets.json`, schema 1, 45 days and explicit validity periods. PAYE uses `data/salary-tax/authority-router.json`; tax-rate truth is not duplicated.

## 8. Analytics

Fuel: location state, selections, result/unavailable and fill completion. PAYE: selected, resolved, ambiguous, unsupported and calculator opened. Coordinates and query text are excluded.

## 9. Tests and commands

- PASS `node tests/fuel-tracker-engine.test.js`
- PASS `node tests/gsc-demand-capture-products.test.js`
- PASS focused Playwright at 360 px: 3 tests (fuel result/fill, explicit location privacy, MRA disambiguation)
- PASS `npm run type-check`
- BASELINE FAIL `npm run lint`: the fixed CI lint target currently reports syntax failures across pre-existing AI, Netlify AI, AI widget and AI test files; no changed file is in the lint target or failure list.
- PASS `npm run check-links`: 141,582 links across 11,720 HTML files, no broken internal links.
- PASS `npm run audit`: 3,807 live/new registry rows, zero missing pages.
- PASS `npm run tools:quality`: 3,807 rows scored. Generated ranking reports were not retained in the product diff.
- PASS `npm run fuel:sources:check`: 54 legacy rows, 11 maintained markets, 6 with a current reference.
- PASS `npm run salary-tax:sources:check`: valid with the existing advisory gap count (37 of 54 markets without a bound authority URL).
- PASS `npm run salary-tax:verify`: salary and PAYE workflow verified.
- PASS `npm run sitemap`, `npm run validate:hreflang`, and `npm run seo:report`.
- PASS `npm run build:deploy`, `npm run audit:dist`, and `npm run security:scan`.
- PASS `git diff --check`.

## 10. Unsupported intent and data gaps

No exact station, live price, cheapest pump, reverse-geocoded city or unsupported country result. Ghana and South Africa await a current parsed source period. Liberia routing is medium confidence because the salary-tax ledger still records its official URL binding as a gap.

## 11. Wave 1 integration

Branch `feat/gsc-missing-intent-products-1`, from `origin/main` SHA `3cc7f2f16478c0b44a47ec9808a731b6e2be652c`. If Wave 1 changes generated registry/directory/sitemap output, integrate source first and rerun owner scripts; do not hand-merge generated rows.

## 12. Cohorts

Both routes: implementation 2026-08-14, 7-day 2026-08-21, 28-day 2026-09-11, 90-day 2026-11-12. Full baselines and rollback notes are in `data/seo/gsc-demand-capture-cohorts.json`.

## 13. Next three bounded batches

1. Mobile Money verified tariff pack: two countries/providers, official tariffs, action/amount fixtures, existing canonical only.
2. Electricity source repair: top two GSC countries, provider/class schedules, stale-default retirement and prepaid-unit fixtures.
3. Import journey recovery: one origin-to-country task, with official duties separated from freight, storage, FX and clearing assumptions.
