# Minimum-wage first bounded repair — 2026-09-16

Base: 718a4795. Fresh origin/main: 0656bb1053a25b45a538cd65b1d92edff86423b9.
Own worktree: minimum-wage-parity-20260916/afrotools.

## Confirmed correction
The authored French controller converted already-monthly scenario amounts again using the selected daily/hourly period. Synthetic daily pay 60 EUR, 20 days, allowances 100, employer contribution 10%, payroll fees 25 should cost 1455 EUR monthly; its scenario row showed 26535. Hourly pay 10 EUR, 30 hours/week should cost 1565; it showed 186035. Raw input conversion now occurs once and monthly scenario overrides remain monthly. Restored stable monthly option values (previously mensuel), also used by sample/reset assignments.

No separate generator matching this authored controller was found in scripts. No engine, statutory rates, routes, or metadata changed.

## Evidence
- Chromium baseline: monthly passed; daily and hourly failed on independently expected scenario totals.
- Chromium after correction: all 3 passed (10.9s), including reopened native TXT totals and 320/390px document overflow checks.
- minimum-wage-csv node tests: 2 passed.
- minimum-wage-za-source node contract: passed. This checks repository consistency, not a fresh official-source retrieval.
- git diff --check passed.

## Remaining scope (not accepted)
French is a manual rate/payroll tool with charges and scenarios; English/Swahili are country-reference tools with sector/state selection, compliance, historical charts, living-wage comparisons, CSV and alerts. Equivalent full features are not established. EN/SW compliance invalid input returns silently and may retain old output; sector consistency needs actual browser reproduction. Existing country data, historical/CPI/living-wage and exchange-rate assumptions require primary-source review; no current-law validity claimed here. Dark mode, complete keyboard/axe, alert privacy/failure flow, built PDF/print, full country coverage and all3 workflow exports remain unverified. No deployment or acceptance-ledger update.

## French country-reference addition

The authored French page now loads the existing shared minimum-wage engine through assets/js/pages/minimum-wage-fr-reference.js. It provides native country names, a searchable reference table, exact native-basis amounts, supported state/category selection, two-country side-by-side reference context, recorded history and living-wage data, filtered CSV, reset and explicit transfer into the existing payroll form. Transfer preserves salary/hours/deductions and clears the user's source-check date rather than substituting a statutory effective date. Existing native export opt-out attribute prevents the generic CSV handler from replacing the reference dataset with a page snapshot.

Fresh primary-source retrieval: https://www.gov.za/sites/default/files/gcis_document/202602/54075rg11941gon7083.pdf (16 September 2026), Schedule1: general/farm/domestic30.23ZAR/hour; EPWP16.62; effective1March2026. Schedule2 has weekly learnership allowances; subsequent pages separate cleaning/retail bands. Only the displayed general/EPWP reference scope is marked checked. Other catalog records retain useful rates but explicitly state current applicability unverified; missing entries are not represented as proof no law exists. No engine/rate edits.

Validation: four FR period/reference browser cases passed22.7s. Added mobile light/dark axe serious/critical checks at320/390 and reference workflow rerun: two passed19.1s after repairing a scrollable table keyboard-focus issue. TXT is reopened in period tests, filtered CSV reopened in reference test. Source syntax/diff checks pass. Hreflang11560pages/5289groups passed; build:i18n:validate passed without generated changes. Final missing-rate comparison copy was syntax checked after browser run.

Remaining: no full feature acceptance. Existing EN/SW compliance still needs sector/stale-state repair; FR does not yet replicate alerts or inflation chart, and historical/FX/living-wage assumptions are not current-source verified. FR table does not rank countries across currencies. Full country legal eligibility and fresh country coverage remain outstanding. New section accessibility only, not whole-page accessibility certification. No deploy/build artifact verification.

## EN/SW selected-reference comparison repair

Confirmed by baseline browser failures in both locales: selecting EPWP then entering4000ZAR still compared against the national floor and displayed a failure. Shared runtime minimum-wage-reference-comparison.js now uses the selected state/category and basis.16.62*8*22=2925.12; a daily rate uses22days, a monthly rate is unchanged. The result states these conversion assumptions and compares with the selected reference without certifying illegality/compliance from incomplete scope. Missing rate is not proof of no law. Editing salary/country/category clears prior pass/fail; blank/invalid inputs receive native message, aria-invalid and focus. No rates or engine data changed.

EN authored script reference is inherited by full SW generation. Bounded source-owner --sync-minimum-wage-runtime adds only its owned script reference to existing SW output, preserving release-owned markup. Node fixture proves all other bytes unchanged, idempotence and explicit failure on duplicate/missing body boundaries.

Browser before:2fail; after:2pass4.7s. Strengthened actual pointer (no function-call substitute) workflow, sector switch, literal2925.12 expected, invalid focus and320/390overflow:2pass9.8s. CSV2node and ZA source-consistency tests pass. Syntax/diff pass. New runtime may require calculation-quality inventory registration at integration; no protected hashes refreshed here. No rate freshness upgraded outside the explicitly checked ZA record in the French reference panel. Broader EN/SW source labeling, chart data and alert workflow remain unverified. No entire app acceptance.

## Protected controller registration

New formula-assets-js-pages-minimum-wage-reference-comparison registered legal_regulatory/high and supportStatus review-required. Effective2026-03-01 refers only to the scoped ZA statutory source; verificationBasis explicitly excludes whole-country current-law validity. Currency is same-country local currency, units include hourly/daily/monthly wages and conversion factors. Nine literal expected controller fixtures cover EPWP/general selection, daily/monthly basis, threshold, zero/negative/missing values, input invalidation and missing rate. The VM DOM stub is controller evidence, not browser accessibility or an independent engine model. Earlier actual-browser tests provide pointer/focus/mobile evidence with real engine inputs.

Protected update used only this new formula ID and reviewed source record. CQ795artifacts390/390fixturesPASS; full calculation-quality systemtestsPASS. JSON comparison against HEAD verifies every previous formula, fixture and inventory record exactly preserved. No fixture-delta change because all nine fixtures are additions, not changed historical expectations.
