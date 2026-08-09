# Swahili Finance A remainder — crypto-p2p

- Position 14; position 13 `crypto-mining` was already accepted elsewhere.
- Native owner `/sw/zana/kilinganisha-bei-p2p/`; candidate delta +1, no central acceptance claimed.
- Reuses maintained DOM-free `p2p-quote-comparator-engine`; arithmetic and validation unchanged.
- User-entered executable quotes only. No live-rate, ranking, safety or suitability claim and no provider API.
- Copy, CSV, JSON and parser-readable PDF are browser-proved; raw inputs remain local.

## Verification

- Engine oracle and focused static tests: passed (existing engine suite plus 3/3 lane tests).
- Focused Chromium: 4/4 passed, covering valid/invalid/reset, copy, parsed CSV/JSON/PDF, raw-input egress, 320/375px, dark/reduced-motion, keyboard, 200% reflow, metadata and artwork.
- Existing English/French Chromium regression: 7/9 passed. The two route workflow checks fail only on the carried assertion that all analytics requests must be absent; current consent-denied route-only analytics loads. Provider/rate endpoints remain absent and the Swahili lane proves raw-input absence from request URLs.
- Hreflang: 33,552 relationships / 5,351 groups passed.
- Links: 138,332 links / 11,530 pages passed.
- Registry audit, lint, type-check and `git diff --check`: passed.
