# Swahili Finance remainder — crypto-stablecoins

- Exact remaining Finance ID `crypto-stablecoins`; native owner `/sw/zana/marejeo-ya-stablecoin/`.
- Candidate delta +1; no central acceptance credit is claimed here.
- Reuses the maintained fresh-only endpoint/controller contract: CoinGecko reference rows for USDT, USDC and DAI, NGN/ZAR only, 30-minute provider freshness ceiling. These are not exchange, P2P, bank or remittance quotes.
- Unavailable provider state fails closed without cached, estimated or platform prices. CSV and JSON were downloaded and parsed with source/scope/time receipts.

## Verification

- API/freshness and Swahili static tests: 4/4 passed.
- Focused Swahili Chromium: 5/5 passed for fresh/unavailable states, parsed CSV/JSON, bounded endpoint requests, 320/375px, 200% reflow, themes, keyboard, metadata and artwork.
- Existing English/French browser regression: 1/1 passed.
- Reciprocal hreflang (33,588 / 5,351), links (138,374), registry audit, lint, type-check and diff checks passed.
