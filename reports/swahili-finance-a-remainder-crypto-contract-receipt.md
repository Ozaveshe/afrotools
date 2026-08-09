# Swahili Finance A remainder — Contract Address Evidence receipt

## Boundary and ownership

- Exact row: `crypto-contract`, Finance A position 10. Position 9 (`crypto-cgt`) was already accepted; no unaccepted row was skipped.
- Baseline for this serial app: `239a4c19ce30cd5aacab6af47bb9d1caec74157d`.
- Native owner added: `/sw/zana/ukaguzi-ushahidi-anwani-mkataba/`.
- Finance B owns positions 47–92, so this row has no overlap.
- Candidate delta is +1. Central acceptance, AI, generated coverage, sitemap and service-worker files remain untouched.

## Correctness and source boundary

- Maintained DOM-free CommonJS engine: `assets/js/engines/contract-address-evidence.js`.
- Safe-DOM controller: `assets/js/pages/contract-address-evidence.js`.
- Exact-record source: `data/crypto/scam-reports.json`, reviewed 2026-07-23. It intentionally contains zero published records after unsupported legacy allegations were removed.
- The product validates only the basic `0x` plus 40 hexadecimal-character EVM text shape and exact chain/address registry matches.
- It makes no blockchain/address lookup and no checksum, token, source-code, permissions, holders, liquidity, sellability, honeypot or safety claim.
- Invalid input, unavailable registry and no-record states are distinct and fail closed. A no-record result explicitly does not prove safety.
- The address is never included in the registry request, analytics request or browser storage. It reaches an external explorer only after the user deliberately opens the disclosed link.

## Functional proof

- Native Swahili page, runtime errors/results, stale state, disclosures and TXT export.
- TXT was downloaded, reopened as UTF-8 and checked for the exact address plus Swahili boundaries.
- Adversarial reviewed-record fixture proved source strings render as text, not HTML/script.
- Selected chain controls the sole explorer URL.
- Browser proof includes 320px, 375px, 200% reflow, dark mode, reduced motion, keyboard focus, console, canonical, OG, schema, reciprocal hreflang and dedicated artwork.

## Green gates

- Existing engine and contract suites: 12/12.
- Lane static proof: 21 assertions.
- Focused Chromium: 6/6.
- `npm run validate:hreflang`: 33,534 relationships / 5,351 groups.
- `npm run check-links`: 138,322 links / 11,527 pages.
- `npm run audit`: localized row found; only two frozen missing-page findings remain.
- `npm run lint`, `npm run type-check`, `git diff --check`.

## Deliberately carried

- Central localization artifacts remain stale because this serial lane must not regenerate or edit them.
