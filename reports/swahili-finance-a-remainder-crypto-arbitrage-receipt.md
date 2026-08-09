# Swahili Finance A remainder — Crypto Arbitrage receipt

## Exact boundary

- English owner: `crypto-arbitrage`, Finance A position 8.
- Prior Finance A evidence: branch `codex/sw-financial-shard-a-20260808` at `bd9f7aa95f1d930af26c946f1f0eacab029397ac` recorded this row as blocked because no physical native Swahili application existed.
- This lane adds exactly one native owner: `/sw/zana/karatasi-ya-arbitrage-ya-crypto/`.
- Finance B owns positions 47–92. This position-8 repair has no Finance B overlap.
- Candidate delta: +1. The coordinator acceptance ledger, AI route map, generated coverage artifacts, sitemaps and service worker were not changed.

## Product and source truth

- The maintained CommonJS-testable owner remains `assets/js/pages/crypto-arbitrage-worksheet.js`; its pure `validate` and `calculate` functions remain DOM-free.
- Formula is unchanged: gross = sell credit − buy debit; net = gross − external costs; return = net / buy debit; break-even sell credit = buy debit + external costs.
- The source boundary is deliberately user-supplied executable receipts, checked timestamps and optional expiry timestamps. The app loads no market rate, venue ranking or official price.
- Expired, future, invalid and unconfirmed receipts fail closed. An unknown expiry is disclosed as requiring another check.
- User values stay in the browser. Analytics may receive the route-level page view after declined consent, but the browser proof confirms no entered route labels or financial values appear in any request URL or body.

## Native product proof

- Native visible UI and runtime messages are Swahili.
- Copy, CSV, JSON and PDF are ungated local exports. JSON and CSV were parsed; PDF was reopened with `pdf-parse` and its numeric oracle was recovered.
- Deterministic fixture: NGN 150,000 buy debit, NGN 156,000 sell credit and NGN 1,000 external cost produce NGN 6,000 gross, NGN 5,000 net, 3.33% return and NGN 151,000 break-even sell credit.
- Browser proof covers invalid focus, valid calculation, stale-result clearing, reset focus, 320px, 375px, 200% reflow, dark mode, reduced motion, keyboard reachability, console, canonical, OG, schema, reciprocal hreflang and the existing dedicated artwork.

## Green gates

- `node tests/crypto-arbitrage-worksheet.test.js`
- `node tests/swahili-finance-a-remainder-crypto-arbitrage.test.js` — 18 assertions
- focused Chromium suite — 4/4
- privacy/AI consent suite — 3/3 plus server contract
- `npm run validate:hreflang` — 33,528 relationships / 5,351 groups
- `npm run check-links` — 138,317 links / 11,526 pages
- `npm run audit` — localized registry row found; only two frozen missing-page findings remain
- `npm run lint`
- `npm run type-check`
- `git diff --check`

## Carried gates, not product blockers

- `npm run build:i18n:validate` stops at the expected stale coordinator-owned coverage artifacts. This lane was expressly prohibited from updating those generated central files.
- The older Day 3 English/French browser suite is 2/4 because its blanket zero-data-request assertion now sees the existing declined-consent route-only Google measurement requests. Its calculation, expiry and all export-oracle tests pass; the focused Swahili suite proves no raw input egress.
