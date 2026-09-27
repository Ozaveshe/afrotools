# Car price evidence and expansion

## Public workflow

`/cars/` is the buyer entry point. It shows 25 older source-budget starter vehicles and source-linked local asking-price observations where available. Its full search covers those 25 plus 456 more make/model/year options from the import-duty catalog (481 total) and opens an editable quote in `/tools/car-import-cost/` for one of six supported destinations. The 481 options are catalog identities, not 481 verified market prices. `/tools/import-duty/` remains the general-goods calculator; its vehicle selector hands off to the car import workspace.

## Price evidence contract

- `data/cars/market-observations.json` holds small, dated aggregates of asking prices. Keep make, model, year, market, condition, currency, sample count, quartiles, reviewed date, source URL, method, and limitations together. Check exact-year results and exclude wrong-year, wrong-condition, contradictory, or duplicate ads. Record independent marketplace checks separately rather than blending their selections.
- A listing ask is neither a completed sale nor an assessed customs value. Default to "no sourced local sample" when a country/vehicle pair lacks a traceable observation. Do not promote `data/cars/import-duty-vehicle-estimates.csv` comparable estimates as observed local prices.
- The current observation freshness review window is 14 days. An old observation may remain as a dated historical snapshot; never move its date forward without reviewing the source again. Run `npm run cars:market:observations:check` to see stale and missing coverage.
- Jiji and other marketplaces retain rights to listing photos, descriptions, and seller details. Store original aggregates and source links only. Use approved/licensed AfroTools car imagery from the media library, labelled as illustrative. Do not collect phone numbers or seller identities.
- Source-market seed budgets and FX conversions are planning estimates. The car import calculator must allow an actual purchase quote and show its duties, freight, port, clearing, registration, FX, and rule-pack assumptions. Customs and tax changes need verified authority evidence through the trade source lane.

## Scheduled collection

The existing `transport-source-freshness-sweep` Codex cron runs daily at 11:00 Asia/Tashkent. It reviews a bounded car batch against accessible marketplaces, checks the observation audit, stages only source-linked aggregate changes, runs the focused car tests, and submits a producer handoff. It does not publish itself. Do not schedule `cars:market:refresh` unattended: its current refresh script can write scraped samples directly into the import estimate CSV, without the observation review gate. The publisher owns integration and production proof.

## SEO and product backlog

The 2026-09-08 GSC sample includes car import links to unsupported country routes that returned 404. The directory now only links to supported six-country calculator paths; confirm those old URLs redirect correctly on the deployed site. Keep the root, countries with dated local price evidence, and evidence-rich vehicle pages crawlable. Country pages without such evidence, make/model, duplicate import-vs-local, and unobserved year pages remain user routes with `noindex`; adding more near-identical pages is not a substitute for fresh market data. The French car generator still publishes roughly 1,081 car routes with modelled local-price copy; audit their indexability and price labels before treating localized car SEO as complete. Recheck country-page depth, structured data, and Search Console coverage after publishing.

Next data batch: source-linked local samples for the 22 starter vehicles without a Nigeria observation, then additional catalog vehicles by demonstrated search demand. Prioritize distinct trim/condition groups and corroborate across marketplaces where possible. Promote a catalog vehicle into the priced directory only with a reviewed source-market price band, matching model/year details, and an approved image. Never use a generated date alone as evidence of new prices.
