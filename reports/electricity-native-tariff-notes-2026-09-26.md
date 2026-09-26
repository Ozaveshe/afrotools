# Electricity tariff native notes — 2026-09-26

## Changes

Existing French energy and Swahili electricity translation owners now cover all five maintained tariff records: **17 exact strings per locale** (five names, five eligibility/limitation notes, seven tier labels). Records: Uganda domestic standard, eligible domestic lifeline and commercial low voltage; Tanzania D1 and T1.

Translations preserve the six-month average eligibility threshold, TANESCO-assigned D1 eligibility, receipt-adjustment uncertainty, commercial time-of-use exclusions and T1 scope. No rates, formulas, dates, identifiers, provider records or source URLs changed. English remains the data source language; no new regulatory verification is claimed.

## Evidence

- PASS: **9 browser tests in 32.4 seconds**, terminal exit 0. Chromium, local source server port 4268. Six existing workflow smoke checks plus three new locale cases, each visiting all five records.
- Actual displayed FR/SW tariff names, notes and tier labels are native after selection and calculation. Stable selector IDs, source links and verification dates match the unchanged dataset.
- The 100 kWh stored-schedule fixtures produce identical EN/FR/SW totals: UGX 77,940 / 69,999 / 56,210 and TZS 16,250 / 29,200.
- New tests explicitly use 2026-08-20 to exercise all five stored records. This is controlled historical coverage, not a current tariff verification. Existing smoke checks separately cover current-date behavior, expiry, unsupported-market fallback, local custom rates, 360px labels and keyboard flow.
- PASS: engine regression checks for tier boundaries, charges, both directions, freshness, fallback and provider/class resolution.
- PASS: source/test syntax and whitespace checks. Zero diff in tariff dataset, calculator controller and engine. No deleted paths.
- Initial test setup was stopped because this sparse checkout omitted the existing engine directory. Populating it from the branch resolved setup without product changes.

## Files and limits

Sources: `assets/js/pages/french-energy-parity.js`, `assets/js/pages/swahili-electricity-parity.js`. Regression: `tests/e2e/electricity-native-tariff-notes.spec.js`. Private evidence contains the actual displayed five-record JSON for each locale.

This bounded follow-up does not refresh regulatory data or complete energy/category parity. Other provider/source titles, exports and catalogue-wide feature/design review remain outside this change. Combined build, security, release and live verification belong to the coordinator. No main push or deployment here.
