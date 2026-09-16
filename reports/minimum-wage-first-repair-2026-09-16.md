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
