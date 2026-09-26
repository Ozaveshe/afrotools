# Mobile-money output context — 2026-09-26

## Scope and baseline

- Candidate baseline: `origin/main` `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009`, fetched before the isolated audit. Branch: `codex/mobile-money-output-context-20260926`.
- Routes: `/tools/mobile-money-fees/`, `/fr/tools/frais-mobile-money/`, `/sw/zana/ada-pesa-simu/`.
- Source owner changed: `assets/js/pages/mobile-money-quote-parity.js`, manual quote comparison renderer and human summary only.
- Added browser proof: `tests/e2e/mobile-money-output-context.spec.js`.
- Separate next-batch candidate; no integration, push, build artifact or deployment is claimed.

## Confirmed defects and changes

1. Two send quotes costing 20 and 10 XOF plus a withdrawal quote costing 0 XOF produced the correct machine comparison (10 XOF; withdrawal excluded). Cards, copied text and human JSON summaries omitted transaction type and participation, leaving the apparent cheaper quote unexplained. Each now identifies the native transaction action and whether it is included, excluded for expiry, or excluded because no compatible second quote exists.
2. Human outputs showed a relative expiry state without the comparison calculation time or explicit expiry deadline. They now include date, time, seconds and timezone offset. Missing expiry remains explicitly unknown; existing copy/download recalculation still changes expired quotes to excluded. Calculation timestamps are the engine's `result.asOf`, not an independent clock reading.

All five supported manual actions have native labels: send, withdraw, merchant payment, bill payment and other. Machine schema version 1, property names, calculation formulas, tariff datasets, eligibility logic, analytics and privacy behavior are unchanged. The tariff-finder controller in the same file is unchanged.

## Validation

- Existing browser regressions: **18/18 passed** (market parity, export-time expiry recheck, copy success/unavailable/denied). The first combined run was 22 passed / 2 failed because the new test expected `GMT+3` while native Swahili correctly formats `GMT +3`. Only the test expectation was corrected.
- Final new output suite: **6/6 passed** (two cases per EN/FR/SW), using Chromium, synthetic quotes, blocked external requests and fixed time in `Africa/Nairobi`.
- Mixed-action proof: visible headline 10 XOF, fees [20, 10, 0], participating indexes [0, 1], third quote excluded; actual copied text and downloaded JSON human summaries identify the withdrawal action and exclusion. Other supported action labels are checked visibly and in copied text.
- Expiry proof: 12:00Z calculation / 12:01Z expiry appear as 15:00 / 15:01 with timezone offset. At 12:02Z, actual copy and download show the new calculation time and expired exclusion. Clearing a deadline retains machine null/unknown and native human missing-deadline wording.
- Actual saved artifacts: **12 downloaded JSON files, 12 captured clipboard text files and 3 result-card screenshots**. Top-level JSON keys and schemaVersion are asserted for each locale; machine result participation, fees and UTC timestamps are asserted separately from human wording.
- 320px viewport: no horizontal overflow in all six new cases. Three native result-card screenshots inspected for readable wrapping and timestamps.
- `node tests/mobile-money-quote-engine.test.js`: passed.
- `node --test --test-isolation=none tests/mobile-money-tariff-source-review.test.js`: **5/5 passed**, including existing band-boundary fixtures.
- `npm run build:i18n:validate`: passed.
- `npm run validate:hreflang`: passed.
- Syntax checks for runtime/new spec and `git diff --check`: passed.

Private local evidence is outside product source, under `C:/Users/Oza/.codex/worktrees/cover-letter-parity-20260916/`:

- `mobile-money-output-context.log`: first combined browser run, including the two corrected test-expectation failures.
- `mobile-money-output-context-final.log`: final six-case pass.
- `mobile-money-output-context-final-evidence/`: all 27 product artifacts (plus Playwright run metadata).
- `mobile-money-i18n-validate.log`, `mobile-money-hreflang.log`: locale checks.
- Baseline probes: `mobile-money-audit-20260926.json`, `mobile-money-expiry-context-audit-20260926.json`.

## Limits and risks

- This proves source-served manual comparison outputs, not current provider tariffs, live transactions, production deployment or SEO improvement. Synthetic fees are not real offers.
- Existing dated-source caveats remain: source-review fixtures do not establish current tariff validity, account eligibility or unknown withdrawal taxes. No rates, source dates or confidence claims were changed.
- Built-in tariff provider/country/action coverage is unchanged. No PDF export or import workflow was added or claimed; the manual tool offers JSON and copy.
- Only Chromium and the Nairobi timezone were exercised for this change; broader browser/timezone coverage and combined release build/dist/security verification remain with integration.
- Routes, canonicals, generated page markup and SEO metadata are unchanged. Native output text changes are additive. No sensitive input is persisted, transmitted or logged by the product change; all retained test artifacts contain synthetic data.
- Rollback: revert this scoped commit. No flag or migration is required.