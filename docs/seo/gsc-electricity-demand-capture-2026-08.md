# GSC Electricity Tariff and Prepaid Units Demand Capture — August 2026

## Evidence boundary

The supplied GSC headline is 14,680 impressions over the most recent 28 days for the electricity/water tariff cluster. The repository does not contain the granular query/page/device export, so clicks, CTR, average position, country split and device split remain unknown. This document does not invent a query-to-page join. The cohort records those fields as `null` until a real export is available.

## Opportunity map

| Intent class | Query family | Current route(s) | Existing capability | Source/data finding | Release action |
|---|---|---|---|---|---|
| `CALCULATE_PREPAID_UNITS` | prepaid electricity units; how many units for an amount | `/tools/prepaid-meter/`, 54 prepaid country pages, `/tools/electricity-estimator/` | Receipt reconciliation and broad national defaults | Defaults were reviewed `2026-03`; provider, class, deductions and effective period were not bound to exact notices | Move the transaction to `/tools/electricity-tariff/`; retain prepaid URLs as noindex compatibility routes |
| `CALCULATE_BILL_FROM_KWH` | electricity bill calculator; kWh cost | `/tools/electricity-tariff/`, 54 tariff country pages | User-entered rate and national planning defaults | Country defaults could not prove current utility/class ownership | Upgrade the existing root with a deterministic provider/class engine; retire thin country calculators |
| `LOOKUP_CURRENT_TARIFF` | current electricity tariff; price per kWh | tariff root/country pages; country blog guides | National snapshots and regulator names | Only Uganda UEDCL Q3 2026 and Tanzania TANESCO D1/T1 met the release evidence bar | Expose exact source, effective/valid dates, verified date, granularity and confidence beside the result |
| `PROVIDER_OR_CLASS_LOOKUP` | UEDCL tariff; TANESCO D1; provider tariff class | no single owner | Free-text/broad account classes | Existing records did not identify a provider or exact account class | Provider and customer class become first-class selections on the canonical route |
| `EXPLAIN_TARIFF` | lifeline tariff; why units dropped; tariff bands | `/blog/nigeria-electricity-tariff/`, `/blog/prepaid-meter-units-budget-africa/`, tariff FAQs | General explanations | Guides are useful context but cannot own the calculation | Keep guides explanatory and link the transactional calculator; add crawlable supported examples |
| `UNSUPPORTED_OR_INSUFFICIENT_DATA` | unsupported country/provider/class | all broad country pages | Calculator silently fell back to national values | A regulator homepage or benchmark does not establish a current tariff | Fail closed and offer a local-only custom rate from a current bill or notice |

## Route and cannibalization inventory

- `/tools/electricity-tariff/` is the single transactional canonical for money → units and units → bill.
- `/tools/prepaid-meter/` remains reachable for bookmarks as a self-canonical `noindex,follow` handoff to `/tools/electricity-tariff/`; it cannot compete in search.
- The 54 electricity-tariff and 54 prepaid-meter country URLs remain reachable as self-canonical `noindex,follow` compatibility pages. Their prior calculators were thin because they reused stale national defaults, and none remains eligible for indexing.
- `/tools/electricity-estimator/` retains the distinct appliance/usage job: estimate kWh before applying a tariff.
- `/tools/electricity-bill-verify/` retains the distinct bill/meter reconciliation job.
- `/blog/nigeria-electricity-tariff/`, `/blog/prepaid-meter-units-budget-africa/` and `/blog/south-africa-electricity-tariffs-2026-27/` remain explanatory guides, not alternate calculators.
- `/fr/tools/tarifs-electricite/` and `/sw/zana/kikokotoo-tariff-ya-umeme/` are equivalent localized surfaces backed by the same `data/energy/electricity-tariffs.json` dataset and `electricity-cost-engine.js` engine. The standalone French prepaid alias reuses that product; the older standalone Swahili LUKU route remains self-only and does not claim hreflang equivalence.

No provider, amount, city, band, acronym or query-parameter page was created.

## Canonical product decision

The existing `/tools/electricity-tariff/` route is the strongest owner because it already represents the broad transactional job and has established energy-category discovery. Its new title is **Electricity Cost & Prepaid Units**. The first screen asks for country, provider when multiple verified providers exist, customer class, direction and amount/kWh. It does not ask a user to understand the legacy route split.

## Release coverage

| Country | Provider | Classes | Pricing model | Effective/valid | Granularity | Confidence | Source |
|---|---|---|---|---|---|---|---|
| Uganda | UEDCL | Domestic standard; domestic lifeline eligible; commercial low-voltage average | Flat; lifeline tiered | 2026-07-01 to 2026-09-30 | National provider + exact class | High | [ERA UEDCL Q3 2026 tariff schedule](https://www.era.go.ug/download/schedule-of-end-user-electricity-tariffs-to-be-charged-by-uganda-electricity-distribution-company-limited-for-the-third-quarter-july-to-september-of-2026/) |
| Tanzania | TANESCO | D1 low-usage domestic; T1 general-use low voltage | Lifeline tiered; flat | Effective order remains listed; verified 2026-08-15 | Mainland provider + exact class | High | [EWURA September 2025 sector update, Annex 8](https://ewura.go.tz/uploads/documents/en-1767379126-SEPTEMBER%202025.pdf) |

Uganda lifeline eligibility is not inferred: the user must know that the account meets ERA's rolling six-month average rule. Time-of-use industrial classes and Uganda's cooking tariff are not modeled in this release. Tanzania D1 is selectable only by users whose TANESCO account is assigned D1.

## Unsupported priority markets

Nigeria, Ghana, Kenya, South Africa, Zambia, Côte d'Ivoire and Senegal stay custom-rate only. Nigeria has monthly DisCo MYTO orders and increasingly subnational regimes; South Africa has Eskom and municipal schedules; Kenya has variable pass-through components. The existing dataset does not bind those dimensions to a current automatic calculation. Ghana's current exact schedule and provider/class table, Zambia's end-user schedule, and official Côte d'Ivoire/Senegal source bindings were not sufficiently evidenced for release.

## Source and freshness contract

`data/energy/electricity-tariffs.json` owns automatic tariff truth. Every row carries market, country, provider, tariff/class, meter type, currency, unit, pricing model, tiers, fixed charge, levies, taxes, minimum charge, prepaid deductions, effective date, optional validity end, verification date, exact source, granularity, confidence, status and notes.

The engine requires `official_current`, an HTTPS source, an unexpired `valid_to` when present, and a verification age within `max_age_days`. A failing row returns: **“This tariff is no longer current enough for an automatic estimate.”** It is never silently reused. Custom rates are session-only browser inputs and are labelled unverified.

The legacy `country-energy-index.js` remains available to other planning tools, but no longer supplies automatic tariff truth to this canonical calculator.

## Engine and calculations

`engines/src/electricity-cost-engine.js` is DOM-free and CommonJS/browser compatible. It supports flat and tiered/lifeline energy charges, fixed charges, percentage or fixed levies/taxes, minimum charges, and prepaid deductions. Money → units uses a deterministic binary inversion of the complete bill calculation—including represented fixed charges, levies, taxes and minimum charges—after prepaid deductions, preventing the two directions from drifting.

Examples from the maintained records:

- UEDCL domestic standard: UGX 10,000 / 779.4 = 12.83 kWh before receipt-specific deductions.
- UEDCL eligible lifeline: 30 kWh = 15 × 250 + 15 × 779.4 = UGX 15,441.
- TANESCO D1: 100 kWh = 75 × 100 + 25 × 350 = TZS 16,250.

## Product, accessibility and privacy

The result is an `aria-live` region, every input has a visible label and helper, errors identify the affected field, keyboard focus is visible, and the grid collapses without horizontal overflow at 360 px. Source/effective/verified/granularity/confidence content remains adjacent to the result. No token, meter number, address, location, phone, payment reference or raw financial value is stored or sent.

## Analytics

The runtime emits `electricity_country_selected`, `electricity_provider_selected`, `electricity_tariff_selected`, `electricity_money_to_units_completed`, `electricity_units_to_bill_completed`, `electricity_custom_rate_used`, `electricity_stale_data_shown`, `electricity_unsupported_market`, and `electricity_source_opened`. Payloads use country/provider/tariff/class IDs, source state and broad value buckets. Raw amounts and kWh are excluded.

## GSC measurement

The cohort is `gsc-demand-capture-2026-08-electricity-cost-prepaid-units` in `data/seo/gsc-demand-capture-cohorts.json`. The verified production deployment date is `2026-08-15`; the derived 7/28/90-day reviews are `2026-08-22`, `2026-09-12` and `2026-11-13`. Monitor the prepaid root, appliance estimator, bill verifier, electricity guides and localized routes for cannibalization.

## Next coverage additions

1. Nigeria: parse one current DisCo monthly MYTO with explicit service bands and state-regulator boundary; add fixture math before enabling it.
2. Ghana: bind the latest PURC tariff decision to ECG/NEDCo customer classes and confirm taxes/levies on prepaid vending.
3. Kenya: model the EPRA/KPLC base tariff separately from monthly pass-through charges and show the applicable billing month.
4. South Africa: start with one supplier schedule, not a national rate; keep Eskom and municipal tariffs separate.
5. Zambia: bind the current ERB-approved ZESCO end-user schedule rather than the net-metering reference tariff.

## Implementation files

- Dataset: `data/energy/electricity-tariffs.json`
- Engine: `engines/src/electricity-cost-engine.js` and generated `engines/electricity-cost-engine.js`
- UI: `tools/electricity-tariff/index.html`, `assets/js/pages/electricity-cost-prepaid-units.js`, `assets/css/electricity-cost-prepaid-units.css`
- Localized parity: `fr/tools/tarifs-electricite/index.html`, `sw/zana/kikokotoo-tariff-ya-umeme/index.html`, `assets/js/pages/french-energy-parity.js`, `assets/js/pages/swahili-electricity-parity.js`
- Compatibility ownership: `tools/prepaid-meter/index.html`, `scripts/generate-energy-x54.js`, generated country pages
- Discovery/cohort: `assets/js/components/tool-registry.js`, `data/seo/gsc-demand-capture-cohorts.json`
- Tests: `tests/electricity-cost-engine.test.js`, `tests/electricity-demand-capture.test.js`, `tests/e2e/electricity-cost-prepaid-units.spec.js`
