# Four-dataset fallback release blocker

Status: **no data promotion; fuel/rates freshness remains a concrete release blocker**. This is a read-only investigation and proposal, not a refreshed dataset candidate.

Base: freshly fetched `origin/main` `9b29eab0408eedd9442c98c2cabf567098da80ab`. Isolated branch: `codex/growth-fallbacks-investigation-20260908`. Existing indexing PR109 and the coordinator's combined checkout were untouched.

## Confirmed failure chain

1. The committed four snapshots date from August 23. Running `npm run data:fallbacks:check` on this clean baseline reproduces all four failures against the unchanged 10,080-minute limit. See `fallback-gate.log`.
2. The most recent inspected [weekly refresh run](https://github.com/Ozaveshe/afrotools/actions/runs/34130985786) failed on September 7 at 14:07:03Z with `TypeError: fetch failed`, in `fetchLiveRow` (`scripts/refresh-static-fallbacks.js:51`), `Promise.all` index 1 (fuel). The failure occurred during the Supabase HTTP read, before payload validation or file replacement. The log does not expose a lower-level cause code. It does **not** establish DNS, TLS, authentication, a provider outage, or a database write failure. Other inspected recent refresh runs also ended in failure, but their detailed causes were not independently inspected.
3. On September 8, the configured `supabase_afrotools` MCP returned the correct project URL, `https://zpclagtgczsygrgztlts.supabase.co`; `select 1`, narrowly scoped schema inspection, and four payload reads succeeded. Current MCP connectivity is separate evidence from the earlier GitHub runner HTTP failure.
4. The normal refresh would still fail today even with working HTTP access: the live fuel and rates payloads remain August 24. `refreshStaticFallbacks` fetches four rows plus `meta`, then validates **all four before writing any files**. Captured payloads were run through its unchanged `validateSnapshot` function. Forex and commodities pass; fuel and rates fail their age limits. See `validation.json` and `live-snapshots.json`.

## Dataset readiness and confidence

| Dataset | Live payload timestamp / coverage | Readiness |
|---|---|---|
| Forex | September 7 00:00Z; 50 currencies; `fawazahmed` | Eligible for the seven-day fallback gate, but already stale under the separate 24-hour public compatibility contract. Direct provider GET returned 200 with the same September 7 date; 49/50 stored currency values match within 0.00011. ZWL remains 6800, also present in the committed snapshot, and differs from the provider. Existing `stabilizeRates` can retain an old value for an unverified jump; without its execution log this is an explanation to investigate, not verified provenance for that row. Preserve this limitation; do not claim a fully current FX feed. |
| Commodities | September 8 02:21Z; 19 records; period `2026M08`; `worldbank-cmo-xlsx` | Eligible for fallback age validation. The latest matching scraper run is `ok`, 19 records. The official [World Bank page](https://www.worldbank.org/en/research/commodity-markets) confirms publication of August observations on September 2. The workbook was not independently parsed in this bounded pass; this key has no registered compatibility schema, so a validator pass alone is not full numerical verification. |
| Fuel | August 24 00:13Z; 54 rows; third-party snapshot | Ineligible. Individual row dates are older still: 35 March-dated rows, 18 dated August 17 and one August 10. No row is marked officially verified in metadata. No complete, current fuel replacement was established. |
| Policy rates | August 24 00:28Z; 15 countries; seven previously verified country codes | Ineligible. Stored verification is explicitly partial. Current official evidence was checked for only Nigeria and Kenya, not all 15 countries and lending/savings/inflation fields. No complete refreshed payload was established. |

The compatibility registry has different purposes and thresholds from the fallback-release gate: forex 24 hours, fuel 720 hours, rates 1,080 hours. Those classifications do not override the release gate's seven-day requirement. No threshold was changed.

## Current provider access

- [Fawaz provider JSON](https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json): direct Node GET 200; date and 50-currency comparison recorded in `provider-probes.json`.
- [CBN decisions](https://www.cbn.gov.ng/MonetaryPolicy/decisions.html): direct GET 200; official July 21 decision retains 26.5%. This supports one policy-rate observation, not a complete pack refresh.
- The CBK owner's old URL automatically redirects to the [current CBR table](https://www.centralbank.go.ke/rates/central-bank-rate/), with direct GET 200 and the August 11 row at 8.75%. The existing owner follows this redirect, so changing this URL is not an evidenced fix for the storage gap.
- [GlobalPetrolPrices Nigeria page](https://www.globalpetrolprices.com/Nigeria/gasoline_prices/): web-tool request returned 429. No retry or bulk crawl was made. This is a single-request access failure, not proof that every country page or every network path is unavailable.
- [EPRA official pump-price page](https://www.epra.go.ke/pump-prices): web-tool request timed out. No repeat.
- [South Africa DMPR fuel index](https://www.dmpr.gov.za/Branches/Petroleum-Resources/Fuel-Prices): accessible and lists a September 2 effective period. The linked schedule was not parsed into absolute prices/product/geography/units; an index date is insufficient to update a price or refresh the entire 54-country pack.

## Owners and smallest safe next action

`npm run data:fallbacks:refresh` is owned by `scripts/refresh-static-fallbacks.js`, invoked by `.github/workflows/static-data-fallback-refresh-pr.yml`. It reads exactly `forex-latest`, `fuel-latest`, `rates-latest`, `commodity-prices-latest` and `meta` from the verified AfroTools project. It preserves payload timestamps, validates freshness/compatibility, enriches fuel source labels from `data/fuel/official-source-workflow.json`, then writes the four JSON files and reconciles only their entries in `data/_meta.json`. It requires the existing scoped service-role secret; no secret was inspected or printed in this investigation.

Upstream producers are `scheduled-fetch-forex-rates.js`, `scheduled-fetch-commodity-prices.js`, `scheduled-fetch-fuel-prices.js` and `scheduled-fetch-central-bank-rates.js`. Fuel is configured every six hours; rates every twelve hours. The last observed fuel scraper run is August 24, `ok`, 54 rows; no newer fuel run appeared in the bounded latest-run query. Commodities has a September 8 successful run. Rates does not use the shared scraper-run path; its metadata contains both `status: ok` and `error: Write failed`. This contradiction warrants owner-log inspection but is not enough to diagnose a missing credential, disabled scheduler or database rejection.

Recommended sequence:

1. The runtime owner should inspect the scheduled fuel/rates invocation logs and write responses spanning the August 24 gap. The existing connector exposed project/deploy readers, not function-execution logs; this pass did not establish the scheduler's runtime cause. Check invocation occurrence, provider results and the actual `setData` outcome before changing configuration. Today’s MCP connectivity is not proof that the GitHub runner or deployed functions have equivalent access.
2. If the GitHub HTTP failure recurs, the smallest useful code change is **diagnostics only** in `fetchLiveRow`: retain the dataset key and a sanitized `error.cause.code`, with a bounded timeout, without logging credentials, headers, raw response bodies or changing stale acceptance. This would make DNS/TLS/connectivity distinctions reviewable. It is a proposal, not an implemented or sufficient release fix.
3. Re-establish source-backed fuel/rates collection under their owners, preserving each observation's effective date, source and partial-coverage labels. Do not invoke scheduled handlers merely to advance timestamps: fuel can carry existing rows or only recalculate USD equivalents; rates can reuse manual/reference data. Both transforms assign a run timestamp, which alone cannot satisfy the user's no-date-only requirement.
4. Once all four validated payloads have adequate source provenance, run the unchanged owner refresh and gate in an isolated branch. Review all four payload diffs plus `data/_meta.json`; retain the FX retained-row caveat or resolve it from source evidence. Only then send a candidate to the coordinator for calculation checks and final artifact validation.

There is no evidenced one-line configuration or parser fix that honestly clears this blocker now. Refreshing only forex/commodities would leave the release gate red, and promoting fuel/rates by timestamp or partial substitution would misrepresent the evidence. The recommendation is to hold all data promotion until the upstream fuel/rates read/write and source-coverage gap is resolved.

## Validation and boundaries

`npm ci` passed; the clean-baseline fallback gate failed as expected on all four committed timestamps. Captured-live `validateSnapshot` results are two pass/two fail; compatibility outcomes are recorded separately. Direct provider probes used bounded, read-only GETs. No producer handler was invoked, no live database row changed, no freshness rule weakened, no production deployment or paid signup performed. Only investigation evidence is committed; product source and data files are unchanged. A build/browser rerun is unnecessary for this report-only handoff.
