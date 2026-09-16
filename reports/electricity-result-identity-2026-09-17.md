# Electricity result identity — 2026-09-17

A read-only browser diagnostic reproduced stale results in all three locales on f309e89d. After calculating12.83kWh from the maintained Uganda record, changing the amount left that result visible. Switching to Ghana custom-rate mode also left the Uganda result and assumptions visible alongside changed source details.

The shared readable owner assets/js/pages/electricity-cost-prepaid-units.js now invalidates the visible estimate and cached result on form input/change events before source/control handlers run. The calculation engine, rates, source records and locale routes are unchanged.

Root browser session62500 passed three EN/FR/SW cases in28seconds at320px. Cases cover amount/country/tariff/custom-rate/fixed-charge/tax/deduction/currency edits, successful recalculation, custom66-to20kWh arithmetic and15/16kWh lifeline boundaries. Tests deliberately use the record's2026-08-15 date through the existing test hook; they prove deterministic workflow behavior, not current tariff validity. Diagnostic JSON and test artifacts are retained privately. No observed horizontal overflow in these fixtures.

Remaining scope: native dataset-note translation is incomplete (the French diagnostic contained mixed-language assumptions), exhaustive provider/class coverage, source freshness, exports and full accessibility are unverified. This is a bounded result-identity repair, not whole-tool parity. No live or full-build claim for this batch yet.
