# Import Duty / Landed Cost Product Audit

Audit date: 2026-05-21
Scope: current AfroTools repo state only. No external rate refresh was performed, and no production behavior was changed.

## Executive Summary

The strongest existing product is `/tools/car-import-cost/` plus its six country routes. It has source-dated JSON rule packs, clear official-vs-practical cost separation, PDF/CSV/share/save outputs, analytics, country-specific warnings, partner placement, and supporting blog guides.

The generic `/tools/import-duty/` has the best general-goods UX and should become the flagship general import duty calculator, but its rate model is split across inline HTML and `assets/js/lib/import-duty-rules.js`, with broad official claims that are not backed by visible source URLs or last-checked dates on the tool page.

`/tools/landed-cost/` is useful as a merchant margin and scenario calculator, but it asks users to supply duty rate manually while the page/registry claim broader country support than the data file provides.

`/tools/vehicle-import-duty/` should not be the vehicle flagship in its current state. It claims 54 countries, has only 10 named countries plus `other`, contains stale or conflicting inline rates, and overlaps with the better structured car import product.

## Routes Found

| Route or file | Current role | Country support found | Flagship fit |
| --- | --- | --- | --- |
| `/tools/import-duty/` | General goods import duty and landed cost calculator | 17 inline countries; granular shared engine supports fewer country/product combinations | Candidate flagship for general goods after source-backed data cleanup |
| `/tools/landed-cost/` | FOB-to-warehouse landed cost, scenario, P&L, AI advisor | UI badge says 10 countries; registry says 15; data file has 10 | Support tool, not flagship |
| `/tools/vehicle-import-duty/` | Legacy vehicle duty calculator | 10 named countries plus `other`; title claims 54 countries; registry claims 16 | Consolidate into car import flow |
| `/tools/car-import-cost/` | Vehicle landed and on-road cost calculator | NG, KE, GH, UG, ZM, TZ | Vehicle flagship |
| `/tools/car-import-cost/nigeria/` | Country vehicle import route | NG | Vehicle flagship country page |
| `/tools/car-import-cost/kenya/` | Country vehicle import route | KE | Vehicle flagship country page |
| `/tools/car-import-cost/ghana/` | Country vehicle import route | GH | Vehicle flagship country page |
| `/tools/car-import-cost/uganda/` | Country vehicle import route | UG | Vehicle flagship country page |
| `/tools/car-import-cost/zambia/` | Country vehicle import route | ZM | Vehicle flagship country page |
| `/tools/car-import-cost/tanzania/` | Country vehicle import route | TZ | Vehicle flagship country page |
| `/tools/customs-time/` | Adjacent customs timing tool | Not deeply audited | Adjacent support |
| `widgets/iframe/ecommerce-import-duty.html` | Import duty widget surface | Widget-specific | Partner/embed support |
| `widgets/iframe/trade-landed-cost-lite.html` | Landed cost widget surface | Widget-specific | Partner/embed support |
| `widgets/iframe/trade-fx-landed-price.html` | FX landed price widget | Widget-specific | Partner/embed support |
| `widgets/iframe/trade-customs-time-buffer.html` | Customs delay widget | Widget-specific | Partner/embed support |
| `widgets/iframe/trade-afcfta-duty-saving.html` | AfCFTA savings widget | Widget-specific | Partner/embed support |
| `/cars/` generated routes | Car price directory | 1,082 generated car routes found outside `dist`, `.git`, `.claude` | Adjacent funnel into car import |
| `/cars/import-vs-local/` generated routes | Import-vs-local comparison pages | 500 generated routes found | Adjacent funnel into car import |

Blog routes found:

- `/blog/import-duty-nigeria-2026/`
- `/blog/import-duty-ghana-2026/`
- `/blog/import-duty-calculator-kenya-2026/`
- `/blog/import-duty-south-africa-2026/`
- `/blog/afcfta-import-duties-africa-2026/`
- `/blog/car-import-cost-africa-comparison-2026/`
- `/blog/car-import-cost-nigeria-guide/`
- `/blog/car-import-cost-kenya-guide/`
- `/blog/car-import-cost-ghana-guide/`
- `/blog/car-import-cost-uganda-guide/`
- `/blog/car-import-cost-zambia-guide/`
- `/blog/car-import-cost-tanzania-guide/`
- `/blog/used-car-import-japan-to-africa-checklist/`

Sitemap coverage exists for the main tool and blog routes in `sitemap-tools.xml`, `sitemap-blog.xml`, `sitemap-i18n.xml`, and translated import-duty blog routes in `sitemap-fr.xml`.

## Formulas Found

### `/tools/import-duty/`

Primary path:

1. Try `window.AfroImportDutyRules.compute(countryName, category, fob, shipping)`.
2. If no granular rule exists, fall back to inline `COUNTRIES`.
3. Inline formula:
   - `CIF = FOB + shipping`
   - `customsDuty = CIF * dutyRate`
   - `levies = sum(country levy functions)`
   - `vatBase = country.vatBase(CIF, duty, levies)`
   - `VAT = vatBase * vatRate`
   - `totalUSD = CIF + duty + levies + VAT`
   - `totalLocal = totalUSD * inlineFxRate`

Notable formula issues:

- Nigeria inline `vatBase` uses `(CIF * 1.10) + duty + levies`, which is unique to the inline fallback and needs source verification.
- Ghana inline VAT is `20`, while the car import Ghana pack uses VAT `12.5%` plus NHIL and GETFund. This is a cross-product conflict.
- Kenya inline RDL is `2.5%`; the car import Kenya pack uses `2%`. This is a cross-product conflict.
- The page labels shipping and insurance as one input, so insurance is not modeled separately.

### `assets/js/lib/import-duty-rules.js`

This shared granular engine has product profiles for smartphones, laptops, solar panels, generators, rice, cement, clothing bales, cosmetics kits, used sedans, new sedans, SUVs, pickups, and motorcycles.

It returns:

- `fob`, `shipping`, `cif`
- `dutyRate`, `duty`
- `levyItems`, `totalLevies`
- `vatRate`, `vatBase`, `vat`
- `totalUSD`, `totalLocal`, `effectiveRate`
- source note text when a model supplies one

Risk:

- Source notes are mostly human-readable references, not structured source URLs with last-checked dates.
- Some general product rates are described as inferred CET bands.
- Vehicle logic overlaps with the more mature car import rule packs.

### `/tools/landed-cost/` and `engines/landed-cost-engine.js`

Formula:

- `insuranceUSD = input insurance OR 0.5% of FOB`
- `CIF = FOB + freight + insurance`
- `importDuty = CIF * userDutyRate`
- `levies = each configured levy by base: FOB, CIF, CIF+duty, or duty`
- `vatBase = CIF + duty + levies`
- `VAT = vatBase * countryVatRate`
- `totalCustoms = duty + levies + VAT`
- local broker, handling, and haulage are converted to USD by user FX
- `totalLandedUSD = CIF + totalCustoms + localChargesUSD`
- `perUnit = totalLanded / quantity`

Risk:

- Duty rate is a user input, not resolved from HS code or country/category data.
- `data/trade/country-duty-rates.js` is loaded but not used as the duty-rate source of truth in the core calculation.
- Page metadata claims any African country and AI advisor for 54 countries, while the visible badge and data file support only 10.

### `/tools/vehicle-import-duty/`

Formula:

1. Reads country, vehicle type, CIF, age, and engine size.
2. Attempts to use shared `AfroImportDutyRules` for some country/type combinations.
3. Applies an age multiplier to shared results for older vehicles:
   - age >= 8: `0.92`
   - age >= 5: `0.96`
   - age >= 3: `0.98`
4. Falls back to inline `DUTY_DATA`.
5. Fallback charges are simple percentages on CIF, then VAT on `CIF + runningDuty`.

Risk:

- The age multiplier is not source-backed.
- Inline FX and tax rates conflict with other products.
- EV mapping is fragile because the shared product key mapping uses `new-sedan` for electric vehicles.
- The page makes broad FAQ claims that should be treated as unverified until sourced.

### `/tools/car-import-cost/`

Formula source is `assets/js/lib/car-import-cost-engine.js` plus JSON packs.

The flow models:

- purchase price, FOB, CIF, make/model/year valuation seed, or explicit customs value
- freight and insurance
- official taxes and official fees from country rule packs
- practical port, clearing, inland delivery, storage, and delay costs
- registration costs
- exchange-rate sensitivity
- delay sensitivity
- finance estimate
- import-vs-local comparison
- source-market comparison

This is the best current architecture because official, practical, registration, optional, and market estimate components are separated.

## Data Files Found

| File | Purpose | Source posture |
| --- | --- | --- |
| `assets/js/lib/import-duty-rules.js` | Shared general and vehicle import-duty rules | Partly labeled, mostly not URL/date structured |
| `data/trade/landed-cost-data.js` | Port, broker, VAT, levy, and fee presets for landed cost | No structured source URLs or last-checked dates |
| `data/trade/country-duty-rates.js` | Chapter-level country duty bands and typical rates | No structured source URLs or last-checked dates |
| `engines/landed-cost-engine.js` | Landed cost calculation engine | Formula only, no source data |
| `data/trade/car-import-cost-core.json` | Car import core schema, source markets, valuation seeds, FX adapter | Versioned, but freight and valuation seeds are market estimates |
| `data/trade/car-import-cost-ng.json` | Nigeria car rule pack | Structured official source notes, lastVerified 2026-04-10 |
| `data/trade/car-import-cost-ke.json` | Kenya car rule pack | Structured official source notes, lastVerified 2026-04-10 |
| `data/trade/car-import-cost-gh.json` | Ghana car rule pack | Structured official and official-system source notes, lastVerified 2026-04-10 |
| `data/trade/car-import-cost-ug.json` | Uganda car rule pack | Structured official source notes, lastVerified 2026-04-10 |
| `data/trade/car-import-cost-zm.json` | Zambia car rule pack | Structured official source notes, lastVerified 2026-04-10 |
| `data/trade/car-import-cost-tz.json` | Tanzania car rule pack | Structured official source notes, lastVerified 2026-04-10 |
| `data/forex/latest.json` | FX fallback for car import | Loaded by car import; source status was not deeply audited in this pass |
| `data/cars/price-intelligence.json` | Car price intelligence and official source records | Contains official source URLs for vehicle import references plus market data |
| `data/cars/verified-real-data-batch-1.json` | Verified market samples | Market samples with verification dates and coverage warnings |

## Official Source Coverage

Source-backed, repo-declared coverage:

- Car import country packs include `sourceNotes` with `url`, `lastVerified`, `confidence`, and notes.
- Last verified date in the six car import packs is `2026-04-10`.
- Country car blog guides carry verification notes and official source links, commonly refreshed on `2026-04-24`.
- `data/cars/price-intelligence.json` includes official source records for NCS, KRA, GRA, URA, and related authorities.

Weak or missing source coverage:

- `/tools/import-duty/` claims real NCS, KRA, SARS, and GRA customs rates in the registry, but the tool page does not expose structured source URLs or per-country last-checked dates for its inline model.
- `assets/js/lib/import-duty-rules.js` has `source` text strings but not structured URLs or last verified dates.
- `data/trade/landed-cost-data.js` has no structured source metadata.
- `data/trade/country-duty-rates.js` has no structured source metadata despite hundreds of chapter-level duty bands.
- `/tools/vehicle-import-duty/` has no structured source metadata and contains broad country claims.

## Market Estimate Coverage

Market estimates are present and useful, but they need clearer labels on generic surfaces:

- Car import source-market freight assumptions in `data/trade/car-import-cost-core.json`.
- Car import valuation seeds and local dealer comparison prices.
- Registration/plates and practical port or agency costs marked `official: false` in car import country packs.
- Landed-cost broker fees, terminal handling, haulage, port clearing days, insurance rate ranges, and bank/LC fees.
- Vehicle import fallback `other` rates and clearing-cost FAQ bands.
- Blog practical formulas and corridor-cost language in car import guides.

## Unverified Values

These values should be treated as unverified until backed by structured source metadata:

- All inline `COUNTRIES.*.rate`, `vat`, `duties`, `levies`, and `vatBase` rules in `/tools/import-duty/`.
- All HS code duty ranges in `/tools/import-duty/`.
- All rate fields in `data/trade/country-duty-rates.js`.
- All `data/trade/landed-cost-data.js` VAT, levy, port, broker, clearing-day, insurance, and FX-source values.
- All inline `DUTY_DATA` rates in `/tools/vehicle-import-duty/`.
- `/tools/vehicle-import-duty/` FAQ claims around highest duty, EV exemptions, and age limits.
- Any car import components marked `official: false`.
- Car import valuation seed prices unless directly tied to verified market sample records.
- `data/forex/latest.json` source freshness was not verified in this audit.

## Existing Country Support

| Surface | Countries found |
| --- | --- |
| `/tools/import-duty/` inline fallback | Nigeria, Kenya, South Africa, Ghana, Tanzania, Uganda, Rwanda, Ethiopia, Egypt, Morocco, Cameroon, Ivory Coast, Senegal, Zambia, Zimbabwe, Botswana, Namibia |
| `assets/js/lib/import-duty-rules.js` granular general products | Nigeria, Ghana, Kenya, South Africa, Egypt, Morocco |
| `assets/js/lib/import-duty-rules.js` granular vehicles | Nigeria, Ghana, Kenya, South Africa, Egypt, Ethiopia, Tanzania, Uganda, Rwanda, Zambia, Morocco |
| `/tools/landed-cost/` data file | NG, KE, ZA, GH, TZ, EG, RW, MA, CI, CM |
| `data/trade/country-duty-rates.js` | NG, KE, ZA, GH, TZ, EG, RW, UG, ET, CI, SN, CM, MA, TN, AO, ZM, ZW, DZ, LY, SD, MZ, MG, BF, ML |
| `/tools/vehicle-import-duty/` inline data | Nigeria, Kenya, South Africa, Ghana, Ethiopia, Tanzania, Uganda, Rwanda, Zambia, Egypt, Other |
| `/tools/car-import-cost/` | NG, KE, GH, UG, ZM, TZ |

## Existing FX Logic

- `/tools/import-duty/`: hardcoded inline USD-to-local rates per country, plus values returned by shared rule engine.
- `/tools/landed-cost/`: user-editable FX field, seeded from `FX_HISTORY` if available.
- `/tools/vehicle-import-duty/`: hardcoded inline FX rates, with later overrides for a subset of countries.
- `/tools/car-import-cost/`: loads `data/forex/latest.json` through a configured FX adapter and exposes FX sensitivity in outputs.

Risk: FX source freshness is not consistently displayed on the generic import or landed-cost pages.

## Existing Vehicle Import Logic

Vehicle logic exists in three places:

- `/tools/vehicle-import-duty/` inline `DUTY_DATA`
- `assets/js/lib/import-duty-rules.js`
- `/tools/car-import-cost/` JSON rule packs plus `car-import-cost-engine.js`

This is a consolidation opportunity. The car import product has the cleanest data model and should be the source of truth for vehicle import planning.

## PDF, Share, Save, and Output Coverage

| Surface | Outputs found |
| --- | --- |
| `/tools/import-duty/` | Breakdown, chart, compare countries, HS lookup, local save, cloud save button, share result button, PDF export via `AfroTools.pdf.generate`, print fallback |
| `/tools/landed-cost/` | Waterfall, per-unit cost, effective rate, scenario compare, P&L view, AI advisor; no dedicated PDF/share flow found |
| `/tools/vehicle-import-duty/` | On-page breakdown and Wise CTA; no dedicated PDF/share/save flow found |
| `/tools/car-import-cost/` | Summary, official charges, practical costs, registration, scenarios, compare, documents, source list, CSV, PDF, print, share, local save, cloud save |

PDF risk:

- `/tools/import-duty/` generates a PDF but does not load the shared PDF download gate used by PDF-category tools.
- `/tools/car-import-cost/` uses `AfroTools.pdf.generate` when available and falls back to print.

## SEO Metadata and Schema

Good coverage:

- Main audited tool pages have title, description, canonical, OG, Twitter metadata, and indexable robots.
- `/tools/import-duty/` has WebApplication, WebPage, BreadcrumbList, and FAQPage JSON-LD.
- `/tools/car-import-cost/` has WebApplication, BreadcrumbList, FAQPage, hreflang to Swahili, and country pages.
- Blog pages have Article schema and source/verification copy on car import guides.
- Sitemap coverage exists for the main audited tool and blog routes.

SEO issues:

- `/tools/landed-cost/` metadata says any African country and AI advisor for 54 countries; visible UI says 10 countries and registry says 15.
- `/tools/vehicle-import-duty/` metadata says 54 countries; registry says 16; page data has 10 plus `other`.
- `/tools/import-duty/` registry says real NCS/KRA/SARS/GRA rates plus all levies for 17 countries, but source metadata is not visible or structured enough to support that claim.
- Several precise FAQ answers on import-duty and vehicle pages make official-sounding claims without visible source references.
- Cross-product conflicts create search trust risk: Ghana VAT and Kenya RDL differ between generic import and car import products.

## Analytics Events

Found:

- `/tools/import-duty/`
  - `calculation_complete`
  - `pdf_download`
  - `share_click`
- `/tools/car-import-cost/`
  - `car_import_country_selected`
  - `car_import_quote_calculated`
  - `car_import_rule_pack_stale_warning_shown`
  - `car_import_export_pdf`
  - `car_import_share_quote`
  - `car_import_save_quote`
  - `car_import_ai_advisor_opened`
  - `car_import_source_market_selected`
  - `car_import_compare_mode_used`
  - `car_import_outbound_partner_click`
  - `car_import_data_load_error`

Not found in this audit:

- Dedicated calculation analytics for `/tools/landed-cost/`.
- Dedicated calculation analytics for `/tools/vehicle-import-duty/`.

## Mobile UI Issues

This was a code-level inspection, not a browser screenshot pass.

Potential issues:

- `/tools/import-duty/` uses two-column calculator/results layout that collapses under 880px. This is reasonable, but action buttons collapse from three columns to two at 480px, leaving three actions in an uneven 2+1 layout.
- `/tools/import-duty/` tabs wrap at 480px and may create taller tab areas with four labels.
- `/tools/landed-cost/` tab bar uses horizontal overflow and min-width tab buttons, which is safe but can hide available modes from first glance on small screens.
- `/tools/landed-cost/` four-column result grids collapse to 2 columns at 640px and 1 column at 400px, which is acceptable but should be visually checked with real content.
- `/tools/vehicle-import-duty/` is simpler and collapses form fields at 600px, but the results table may still require checking for narrow overflow.
- `/tools/car-import-cost/` has the strongest responsive rules, but the generated tab set is wide and relies on horizontal overflow.

Recommended mobile proof before PRs that touch behavior:

- Capture 390px and 768px screenshots for `/tools/import-duty/`, `/tools/landed-cost/`, `/tools/vehicle-import-duty/`, and `/tools/car-import-cost/`.
- Verify tabs, result tables, PDF/share buttons, and source lists do not overflow.

## Internal Links from Blogs to Tools

Found healthy internal links:

- Generic import duty blog cluster links back to `/tools/import-duty/`.
- Kenya blog has SEO cluster CTA to `/tools/import-duty/`.
- Car import guides link to country routes such as `/tools/car-import-cost/zambia/`, `/tools/car-import-cost/tanzania/`, and `/tools/car-import-cost/uganda/`.
- `/tools/car-import-cost/` links to `/tools/import-duty/`, `/tools/vehicle-import-duty/`, currency converter, delivery cost, car insurance, and car loan tools.

Risks:

- Generic import duty articles contain exact rates in schema and body copy without the same structured source discipline as the newer car import guides.
- The vehicle duty route is still linked from the car import product, even though it is weaker and overlapping.

## Sponsor and Partner Placements

Found:

- `/tools/import-duty/` includes Wise CTA and Afro business CTA.
- `/tools/landed-cost/` includes Wise CTA.
- `/tools/vehicle-import-duty/` includes Wise CTA.
- `/tools/car-import-cost/` has a partner link with `data-partner-zone="clearing-agent"` and copy for clearing, shipping, insurance, finance, and dealer quote zones.
- `/tools/car-import-cost/` tracks partner clicks through `car_import_outbound_partner_click`.

Monetization opportunities:

- Put `/tools/car-import-cost/` forward as the lead-gen flagship for clearing agents, shipping, insurance, finance, and local dealer comparisons.
- Add source-backed lead capture to country car import routes first, where user intent is strongest.
- Keep Wise/FX CTAs on generic import and landed-cost flows, but add country/source freshness before pushing financial partner claims harder.
- Offer embeddable calculators for merchants through `widgets/iframe/ecommerce-import-duty.html` and landed-cost widgets once data provenance is cleaned up.

## Missing User Inputs

Generic import duty:

- HS code search-to-rate selection is not connected to authoritative product-specific rate data.
- Insurance is bundled into shipping.
- Incoterm is absent.
- Entry port is absent.
- Shipment mode is absent.
- Product origin/trade preference is not modeled.
- Customs value override is absent.
- Broker, terminal, storage, demurrage, and inland delivery are absent.
- FX source/date is absent.

Landed cost:

- HS code/product rate resolver is absent.
- Incoterm and origin preference are absent.
- Standards inspection and document fees are not modeled explicitly.
- FX source/date is not visible enough.

Vehicle import duty:

- Make/model/trim/year valuation path is absent.
- First registration month, drive side, fuel, condition, mileage, source market, port, destination city, storage, delay, registration, and local dealer comparator are absent.
- This is mostly solved in `/tools/car-import-cost/`.

Car import cost:

- Strongest input coverage.
- Potential additions: VIN/reference import, official valuation-table upload workflow, more countries, explicit broker quote attachment, and expiry/freshness warnings per source row.

## Missing Outputs

Generic import duty:

- Official source list per result.
- Last-checked date per country/rate.
- Confidence classification per line item.
- Official vs estimate split.
- FX sensitivity.
- Port/broker/local cost split.
- Compliance/document checklist.

Landed cost:

- Official source list per result.
- Country/product duty source.
- PDF/share/save parity with import duty and car import.
- Confidence labels.

Vehicle import duty:

- Official vs market estimate separation.
- Source list and last-checked date.
- PDF/share/save.
- Source-market comparison.
- Compliance checklist.
- FX sensitivity.

Car import cost:

- Best output coverage. Main missing output is a machine-readable source confidence export per line item.

## Recommended PR Sequence

1. Data provenance ledger PR
   - Add structured source metadata for `/tools/import-duty/`, `assets/js/lib/import-duty-rules.js`, `data/trade/landed-cost-data.js`, and `data/trade/country-duty-rates.js`.
   - Do not change rates in this PR.

2. Copy and metadata truth PR
   - Reduce unsupported claims on `/tools/import-duty/`, `/tools/landed-cost/`, and `/tools/vehicle-import-duty/`.
   - Align country counts across title, description, registry, UI badges, and data files.

3. General import duty source-backed model PR
   - Make `/tools/import-duty/` the flagship general-goods calculator.
   - Normalize formula sources and display official/source/last-checked rows in results.
   - Keep current UX, but replace mixed inline/source logic with a single audited source of truth.

4. Vehicle consolidation PR
   - Make `/tools/car-import-cost/` the vehicle flagship.
   - Either deprecate `/tools/vehicle-import-duty/` into a simpler redirect/support page or point it to the car import engine.
   - Remove or quarantine conflicting inline vehicle rates.

5. Landed-cost repositioning PR
   - Position `/tools/landed-cost/` as merchant FOB-to-warehouse, P&L, and scenario planning.
   - Integrate verified duty-rate lookup from the general import model when available.

6. Mobile and conversion proof PR
   - Browser-verify mobile layouts.
   - Add partner placements only after source labels and route truth are corrected.

7. Blog cleanup PR
   - Update generic import-duty articles to match the audited source model.
   - Keep exact rate claims only when source-backed with a visible verification date.

## Flagship Recommendation

- Vehicle import flagship: `/tools/car-import-cost/` and its six country routes.
- General import duty flagship: `/tools/import-duty/`, after provenance and formula cleanup.
- Merchant scenario support: `/tools/landed-cost/`.
- Legacy vehicle duty: consolidate or demote behind `/tools/car-import-cost/`.
