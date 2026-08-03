# Swahili Finance two-app repair evidence

- Baseline: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`
- Scope: Compound Interest and Investment Return only
- Acceptance: 2/2 native Swahili apps accepted; 0 blocked
- Central acceptance ledger, AI intent router, sitemaps, `dist/`, and other locale routes outside the exact reciprocal EN/FR metadata owners were not changed.

## Product proof

Both Swahili routes use the existing DOM-free `investment-return-engine` and preserve the English inputs, constraints, defaults, option keys, calculation timing, and rounding contract. Browser proof covered deterministic standard, zero-rate, timing, inflation and loss cases; invalid inputs; and changes to every calculation input including the display currency. Prior results and all exports fail closed whenever the input signature changes.

The advertised native downloads were reopened and checked against the current result:

- Compound Interest: TXT and parsed PDF
- Investment Return: clipboard text, parsed CSV and parsed PDF

The same browser run covered 320px, 375px, 200% equivalent reflow, light/dark/system themes, text and control-boundary contrast, focus visibility, keyboard flow, labels/live regions, canonical/OG/schema/artwork, reciprocal EN/FR/SW hreflang, console errors, network failures, and local-first privacy behavior.

## Validation

- `node --test tests/investment-return-engine.test.js tests/swahili-compound-interest-contract.test.js tests/swahili-investment-return-contract.test.js`: 25/25 passed
- Exact two-app Playwright run on one Chromium worker: 16/16 passed
- `npm run test:privacy-ai-consent`: 3/3 passed
- `npm run validate:hreflang`: 11,127 pages and 32,466 relationships passed
- `npm run check-links`: 136,955 internal links across 11,346 HTML files passed
- `npm run audit`: passed; two inherited unrelated missing-page rows remain
- `npm run lint`: passed
- `npm run type-check`: passed
- `node scripts/build-i18n.js --validate`: all French, Swahili, Yoruba and Hausa catalog keys passed
- Compound Interest gap-generator replay: idempotent; the native owner was preserved
- `git diff --check`: passed
- Deleted files: 0

## Coordinator boundary

Fresh read-only localization generation classifies both routes as `native`, indexable Swahili equivalents. The three broad generated coverage artifacts are now stale and are intentionally left for the coordinator's combined localization/sitemap generation pass:

- `data/registry/locale-page-coverage.json`
- `reports/localization-coverage.json`
- `reports/localization-coverage.md`

No deployment, push, PR, sitemap rebuild, or central acceptance write was performed in this lane.

## Coordinator replay hardening

The coordinator replay exposed two timing/cascade-sensitive failures after the original acceptance. The Swahili Compound Interest owner now loads the existing consent manager explicitly, before the lazy analytics wrapper, so `window.AfroTools.analyticsConsent` is deterministic rather than dependent on a second asynchronous script insertion. Investment Return now gives its enabled primary action an explicit high-specificity dark/system-dark palette (`#07121d` on `#bae6fd`, 14.21:1 by the WCAG relative-luminance formula), and its browser contract requires at least 7:1 in every tested theme.

After these narrow repairs, the complete two-route one-worker Chromium suite passed 16/16 again, and the shared-engine plus scoped static contracts passed 25/25. No formula, export, locale ledger, sitemap, coordinator branch, or generated coverage owner changed.
