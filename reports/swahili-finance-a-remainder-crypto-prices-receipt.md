# Swahili Finance A remainder — crypto-prices

- Position 16. The previous mapped Swahili surface was only the crypto hub and is not counted; this adds the native app owner `/sw/zana/bei-za-crypto/`.
- Candidate delta +1; no central acceptance credit is claimed here.
- Runtime reuses the maintained market controller and server contract: CoinGecko, NGN/ZAR only, 100-row request ceiling and 30-minute freshness.
- Unavailable responses fail closed without cached, converted, estimated or zero prices.
- CSV and JSON include source, currency, timestamps and freshness receipt and are parsed in Chromium.

## Verification

- Existing API parity/freshness tests and focused static tests: passed.
- Focused Chromium: 5/5 passed for fresh/unavailable states, search/details, bounded request, parsed CSV/JSON, 320/375px, dark/reduced-motion, keyboard, 200% reflow, metadata and artwork.
- Existing English/French Chromium regression: 1/1 passed.
- Hreflang: 33,564 relationships / 5,351 groups passed.
- Links: 138,339 / 11,532 pages passed.
- Registry audit, lint, type-check and `git diff --check`: passed.
