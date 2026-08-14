# GSC Demand Capture Program — August 2026

## Evidence boundary

This batch uses the demand signals supplied in the task brief. The named workbook `AfroTools_GSC_Opportunity_Backlog_2026-08-13.xlsx` and JSON export `afrotools-gsc-opportunities-2026-08-13.json` were not present in the supplied attachment directory or repository, so granular query/page rows could not be re-opened. Query totals below are discovery signals, not a direct query-to-page join. Likely landing routes were verified in the repository.

## Repeatable operating model

1. Export GSC Queries and Pages independently; retain period, clicks, impressions, CTR and position.
2. Cluster by user job, country, provider or authority. Do not join privacy-filtered query rows to page rows as though they were complete.
3. Inspect the likely canonical route, registry entry, source ledger, data owner, analytics and tests.
4. Classify each cluster as `RECOVER_EXISTING_ROUTE`, `ADD_MISSING_FEATURE`, `BUILD_TOOL`, `BUILD_DATA_EXPERIENCE`, `BUILD_GUIDE`, `ROUTE_OR_DISAMBIGUATE`, `PROTECT_WINNER` or `PARK_UNTIL_CAPABILITY_EXISTS`.
5. Score demand, position, CTR gap, local fit, job clarity, canonical ownership, data maintainability, effort, freshness burden, repeat use and cannibalization risk.
6. Implement one bounded task-completion surface. Prefer an existing canonical route and source of truth. Do not generate keyword, amount, city, provider or acronym pages.
7. Add meaningful completion/unavailable events, a machine-readable cohort and focused unit/browser proof.
8. Review after 7, 28 and 90 days. Keep product utility stable during measurement unless safety or correctness requires a rollback.

## Opportunity review

| Query family | Evidence supplied | Likely current landing | User job | Current capability and gap | Action | Preferred canonical | Indexing |
|---|---:|---|---|---|---|---|---|
| gas/fuel prices near me | 3,674 impressions, 0 clicks, position 6.57 over 3 months | `/tools/fuel-tracker/` | Find a relevant local fuel reference and cost to fill | Dated country snapshots existed; no explicit location action, market granularity or fill calculator | `ADD_MISSING_FEATURE` | `/tools/fuel-tracker/` | One indexed finder; selection stays in client state |
| Orange/mobile-money fees | 17,481 impressions, 0.46% CTR over 28 days | `/tools/mobile-money-fees/` | Find a verified provider/action/amount fee | Existing product compares user-entered quotes; maintained provider tariff table is absent | `PARK_UNTIL_CAPABILITY_EXISTS` | `/tools/mobile-money-fees/` | No provider/amount pages |
| electricity/water tariffs | 14,680 impressions over 28 days | electricity tariff routes | Find provider/class tariff or prepaid units | Broad calculator surface exists, but changing values carry high provider/freshness burden | `PARK_UNTIL_CAPABILITY_EXISTS` | Existing electricity canonical | No band/provider pages until source packs are current |
| VAT/withholding/TIN | 13,972 impressions over 28 days | country VAT/tax routes | Identify tax treatment or authority service | Multiple calculators exist; needs route-level study | `RECOVER_EXISTING_ROUTE` | Existing country calculators | Protect winners |
| import duty / landed cost | 8,452 impressions over 28 days | `/tools/import-duty/` | Estimate official and practical landed cost | Strong product; origin/destination completion review remains | `RECOVER_EXISTING_ROUTE` | Existing import canonical | No origin page explosion |
| construction / BOQ | ~7,000 impressions over 28 days | BOQ/material tools | Build quantities and priced plan | Workflow exists; maintained local price coverage is the blocker | `BUILD_DATA_EXPERIENCE` | Existing BOQ route | Locality pages only with durable data |
| NYSC | 6,207 impressions, 7 clicks over 28 days | NYSC routes | Complete an exact NYSC task | Requires separate task/freshness mapping | `BUILD_GUIDE` | Existing strongest NYSC route | Avoid year/state thin pages |
| MRA, ERS, ZRA, URA, LRA, RSL PAYE | Repeated variants; aggregate unavailable | country PAYE calculators | Identify jurisdiction and open the right calculator/export | Calculators and source ledger exist; MRA is ambiguous | `ROUTE_OR_DISAMBIGUATE` | `/tools/paye-authority-finder/` | One finder; no acronym pages |
| recipe rich-result clusters | High impressions, weak CTR; exact totals unavailable | recipe pages | Cook a specific recipe | Existing exact pages should be protected | `PROTECT_WINNER` | Existing recipe canonical | No near-duplicates |

The machine-readable backlog is in `docs/seo/gsc-missing-product-backlog.csv`.

## Secondary selection decision

Scores use 1 (weak) to 5 (strong); freshness risk and effort are reverse-scored so 5 is easier/safer.

| Option | Demand | Job clarity | Repo readiness | Truthful data | Maintainability | Low effort/conflict | Repeat value | Total / 35 | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| PAYE Authority Finder | 3 | 5 | 5 | 5 | 5 | 5 | 4 | 32 | Selected |
| Mobile Money Fee Finder | 5 | 5 | 3 | 2 | 2 | 3 | 5 | 25 | Defer until tariff packs exist |
| Electricity Tariff Finder | 5 | 5 | 4 | 2 | 1 | 1 | 5 | 23 | Defer pending source repair |
| Import journey | 4 | 5 | 5 | 4 | 3 | 2 | 4 | 27 | Strong next recovery batch |
| Construction/BOQ | 4 | 5 | 4 | 2 | 2 | 2 | 5 | 24 | Defer until local benchmarks exist |

PAYE routing was selected because source-backed authority identity already exists, calculators are canonical and task-complete, and ambiguity can be solved without copying tax bands. It has lower freshness and Wave 1 merge risk than tariff work and handles the MRA collision between Malawi and Mauritius.

## Implemented product 1: Local Fuel Price Finder

The existing `/tools/fuel-tracker/` remains canonical. `data/fuel/markets.json` is the versioned source of truth. The MVP includes six fresh low-confidence third-party national benchmarks (Angola, Botswana, Ethiopia, Nigeria, Senegal and Uganda) and five high-confidence official EPRA city references for Kenya deliberately shown as stale because their April–May 2026 validity period ended.

Location permission starts only from “Use my location.” Haversine matching runs locally against maintained coordinates. There is no location API, reverse geocoder, coordinate storage, URL state or coordinate analytics. A national match is labelled “National benchmark for [country].” A 45-day threshold and `valid_to` suppress stale prices. The pure fill-cost engine supports litres, US gallons, quantity, or tank size plus current level.

## Implemented product 2: PAYE Authority Finder

`/tools/paye-authority-finder/` resolves supported acronyms, names and countries to one of seven canonical calculators. It shows country, currency, tax-year/status label, official authority and destination. `MRA` returns a mandatory Malawi/Mauritius choice. Unsupported queries return an honest state. No acronym URLs or duplicated rate tables were created.

## Source, analytics and privacy contract

- Fuel: regulator sources preferred; third-party national snapshots are low confidence; stale values are not prefilled.
- PAYE: routing references the official-source registry; rate truth remains with country calculators.
- Fuel events cover location state, selections, result/unavailable and fill-cost completion. Payloads use safe IDs/codes only.
- PAYE events cover country, resolved, ambiguous, unsupported and calculator opened. Unsupported text is represented by length only.
- Raw coordinates are not stored, logged, transmitted, placed in URLs, reports or screenshots.

## Indexing and integration

Both products have one self-canonical route. Personalized fuel state is browser-only. No locality, fuel, authority or parameter pages were created. The PAYE route uses the canonical registry. This branch does not edit any Wave 1 route. If Wave 1 changes generated registry/directory/sitemap output, integrate source changes then rerun owner scripts rather than merging generated rows manually.

Exact cohorts are in `data/seo/gsc-demand-capture-cohorts.json`: implementation 2026-08-14; review 2026-08-21, 2026-09-11 and 2026-11-12.
