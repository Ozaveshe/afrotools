# Manual market capability parity — 16 September 2026

The completeness matrix identified an unresolved French restriction, not an intentional exception to the user’s parity goal.

## Expected contract and reproduction

The shared engine groups by normalized market, currency, transaction type and amount. Recognized country aliases receive a canonical country identifier without replacing entered text; other market names remain free text. Only groups with at least two unexpired quotes compare.

Actual baseline: three quotes in Senegal/Mali/Sénégal, same XOF amount, fees 30/0/10. English renders all three and selects 10 XOF from the Senegal pair. The cheaper Mali quote is not comparable. French rejects the entire form and removes all results. French also rejected unrecognized market names, although English and Swahili accepted them.

## Source change

Removed only the French pre-rejection. All locales now use the same existing engine grouping and alias contract. Country suggestions remain available in French; the helper now explains that free-text markets are allowed and a shared currency alone does not make quotes comparable. No engine, tariff, calculation, privacy or user-text transformation change.

`--sync-market-help` in the generator updates exactly the existing French helper paragraph from the canonical template; missing/duplicate owners fail and surrounding bytes remain unchanged. Other locales are untouched by this mode. Normal full-generation behavior remains unchanged.

## Validation

- EN/FR/SW real browser scenarios cover two different countries (no comparison), a valid pair plus another country (only the pair compared), expired third quote (no remaining valid pair), matching accented free-text markets, and currency/action mismatches. Reopened JSON retains exact market strings and confirms excluded rows cannot be lowest.
- Existing French recovery, native summaries and guide-to-app workflows rerun with the new shared contract. Assertions now require explicit incomparable output rather than the retired French-only rejection.
- Owner tests: 7 passed, including exact helper-byte preservation and missing/duplicate rejection. Engine tests pass unchanged. Generator: 3 routes, zero drift.
- Browser: **13 passed in 1.0 minute**, output `../money-market-parity-proof`.

No deployment or acceptance update. The earlier Airtel current-validity, MTN exact-tax and account-eligibility uncertainties are unchanged. This fixes the market capability difference; it does not certify the whole app or its current tariffs.
