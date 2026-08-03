# Swahili Hajj Budget parity evidence

## Scope and baseline

- Baseline: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db` (`origin/main` on 2026-08-03).
- Route: `/sw/zana/bajeti-ya-hajj-na-umrah/`.
- English owner: `/tools/hajj-budget/`.
- Acceptance result: **1/1 locally accepted**, pending coordinator-owned central ledger recording.
- No registry, AI route map, locale coverage, sitemap, service worker, `dist/`, French UI/runtime, or deployment changes.
- No file deletions.

## Product proof

- Native Swahili interface with two owner-parity workflows: inherited package example and current written quote.
- Exact formula fixtures cover Hajj/Umrah factors, 15 origin multipliers, package constants, day allowance, group size, contingency, edge values, and invalid input boundaries.
- Any input change clears stale results and disables all result exports until recalculation.
- Source, review date, assumptions, confidence, current-price limitation, operator/visa verification, and planning-only disclaimer are visible.
- Dedicated Hajj artwork is used in the page, Open Graph, Twitter, and structured data.
- The app is deterministic and local-only. It performs no AI call and requires no AI consent; browser monitoring found no external request or write.
- Advertised exports proved: clipboard, parsed JSON download, JSON import/recalculation, local save/reopen, parsed PDF, and print.

## Browser acceptance

`tests/e2e/sw-hajj-budget.spec.js`: **8/8 passed** with Chromium, one worker, analytics disabled, dedicated port `43157`.

- Exact calculation, invalid state, stale state, offline recalculation: passed.
- Clipboard, parsed JSON/import, local reopen, parsed PDF, print: passed.
- Canonical, reciprocal hreflang, existing hub/discovery row, source boundary, artwork: passed.
- Four theme states: system light, system dark, forced light, forced dark.
- Minimum computed text contrast: `6.88:1` light and `9.59:1` forced dark.
- Minimum component boundary contrast: `4.76:1` light and `9.84:1` forced dark.
- Sequential keyboard traversal: `31/31` focusables in every theme, with visible focus.
- Axe: zero violations and zero incomplete findings in every theme.
- Reflow: 320px and 375px at 100% and true 200% root font size; zero body/main overflow and zero visible offenders.

## Static and repository gates

- `node tests/sw-hajj-budget.test.js`: passed.
- `npm run automation:preflight`: 12 passed, 2 environment warnings, 0 failures.
- `npm run build:i18n:validate`: passed.
- `npm run validate:hreflang`: 11,126 pages, 32,460 relationships, 5,340 groups, passed.
- `npm run sw:ai-routes:check`: 487 accepted central routes, passed with no candidate mutation.
- `npm run check-links`: 136,946 internal links, zero failures.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- Syntax checks for engine, controller, static test, and browser test: passed.
- `git diff --check`: passed.

## Coordinator-only follow-up

`npm run sw:surface:check` reports only this route as stale because `scripts/build-swahili-product-surface.js` exempts an app after it is present in `data/audits/swahili-free-app-acceptance.json`. This lane intentionally did not edit that central ledger. After coordinator review and ledger acceptance, rerun `npm run sw:surface:check`; no page-level workaround or broad generated write is warranted.
