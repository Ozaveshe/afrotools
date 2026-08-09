# Swahili Finance A remainder — crypto-portfolio

- Position 15; native owner `/sw/zana/portfolio-ya-crypto/`; candidate delta +1.
- Reuses the maintained DOM-free lots engine. NGN/ZAR valuation, cost coverage and fail-closed 30-minute market freshness are unchanged.
- CoinGecko is identified only from the validated AfroTools price receipt. No stale, converted or zero fallback values are shown.
- Holdings persist only in browser local storage; the sole network request contains currency only. JSON backup/import provides portability.
- CSV, JSON, parser-readable PDF and print are browser-proved.

## Verification

- Existing engine and page contracts plus focused static tests: passed.
- Focused Chromium: 5/5 passed, covering fresh/stale data, valuation and partial P/L oracle, invalid import, JSON export/import, CSV/PDF parse, print, request privacy, 320/375px, dark/reduced-motion, keyboard/dialog Escape, 200% reflow, metadata and artwork.
- Existing English/French Chromium: 2/3 passed. The French fail-closed test retains a stale expectation of one option; the maintained controller intentionally exposes three static fallback asset labels when market data is unavailable while still withholding all values and preventing lot submission. No formula or market-value fallback occurs.
- Hreflang: 33,558 relationships / 5,351 groups passed.
- Links: 138,335 / 11,531 pages passed.
- Registry audit, lint, type-check and `git diff --check`: passed.
