# Swahili Trade & Import remaining lane — static receipt

Status: **PARTIAL STATIC CANDIDATE — BROWSER PENDING**
Date: 2026-08-03
Coordinator base: `3a9d769cc7885665fdc4ca93c02c92de4147e060`
Branch: `codex/sw-trade-remaining-20260803`

## Exact reconciliation

| State | Count | Meaning |
|---|---:|---|
| Previously accepted and preserved | 6 | Existing Trade utility acceptance remains valid; every file is byte-identical to its pre-lane SHA-256. |
| New static candidates | 4 | Commodity Tracker, ECOWAS CET/tozo, SADC rules of origin, and EAC CET now have durable Swahili source owners and shared English DOM-free engines. |
| Blocked on legacy source ownership | 11 | Existing native-looking routes still contain inline/ad-hoc controller logic. They were not falsely accepted or rewritten without browser ownership. |
| Blocked on counterpart identity | 1 | The existing Swahili B2B payment owner pairs with `/tools/b2b-payment/`, while the central Trade denominator specifies `/tools/payment-comparator/`; this needs a product identity decision. |
| Exact Trade denominator | 22 | Matches `reports/day6-agriculture-transport-trade-route-inventory.json`. |

The machine-readable state is in `data/localization/sw-trade-import-parity.json`.

Exact legacy-owner blockers: `hs-code-lookup`, `afcfta-tracker`, `landed-cost`, `shipping-estimator`, `fx-import-impact`, `lc-calculator`, `export-docs-trade`, `coo-generator`, `demurrage-calculator`, `incoterms-calculator`, and `trade-finance-comparator`.

Exact counterpart-identity blocker: `payment-comparator`. Its current Swahili source owner declares `/tools/b2b-payment/` as the English equivalent, not the central denominator route `/tools/payment-comparator/`.

## Implemented in this candidate

- Replaced three generic shells with native Swahili workflows backed by `commodity-engine.js`, `ecowas-levy-engine.js`, and `eac-cet-engine.js`.
- Added the previously missing native SADC route backed by `sadc-roo-engine.js`.
- Added one durable owner, one shared runtime, and one responsive/dark-mode stylesheet for those four routes.
- Added local PDF, CSV, JSON and TXT exports plus scoped JSON reopen.
- Invalid submissions fail closed: stale results and the previous export payload are cleared.
- No form value is fetched, logged, stored remotely or sent to AI. The AI link is optional and visibly separate.
- Added SADC discovery to the registry and all four routes to the Swahili Trade hub.
- Added the English-to-Swahili SADC reciprocal link. No French file was modified.

## Source and freshness boundary

`npm run trade:sources:check` passes structurally, but reports:

- `datasetReviewed: 2026-05` — 94 days old at audit time.
- High-risk cadence: 45 days.
- 9 of 24 duty-rate markets have recorded customs-authority source gaps.

ECOWAS and EAC remain explicitly planning-grade and are not accepted as current regulatory truth. Their UI warns users to confirm the exact HS line, rate, levies, VAT, preference and exemption with the responsible authority.

## Hreflang boundary

The full validator represents 11,270 pages, 33,332 relationships and 5,340 groups. It reports two reciprocal warnings for the new SADC route because the existing French SADC page does not link to Swahili. The lane prohibited edits to other locales, so this is carried as a coordinator serialization item rather than silently editing French output.

## Artwork

Canonical artwork exists for all 22/22 Trade inventory rows. The four new candidates reference dedicated WebP assets. Rendered crop/contrast inspection remains browser-pending. See `reports/swahili-trade-remaining-missing-artwork.md`.

## Validation

Passed:

- `node tests/sw-trade-remaining-static.test.js`
- `node scripts/build-sw-trade-regional-parity.js --check`
- `npm run trade:sources:check` (valid with disclosed freshness/source warnings)
- `npm run audit`
- `npm run lint`
- `npm run type-check`
- `npm run validate:hreflang` (command passes; two exact carried SADC reciprocity warnings above)
- `npm run check-links` — 138,445 internal links across 11,489 HTML files; no broken internal links
- `git diff --check`
- zero physical deletions (`git diff --diff-filter=D --summary` empty)

Not run by mandate:

- Chromium/Playwright, responsive rendering, keyboard traversal, theme rendering, console/network capture, real PDF parsing, CSV/JSON/TXT download and reopen.
- Sitemap, localization platform output, AI routing map, redirects, `dist`, build/deploy, push, PR or merge.

## Browser continuation contract

When the Chromium slot is released, run one worker against the exact worktree and accept each of the four candidates only after valid calculation, invalid-result clearing, PDF parsing, CSV/JSON/TXT parsing, JSON reopen, no-network proof, 320/375px, 200% reflow, manual/system dark mode, keyboard/focus, canonical/OG/schema and console checks. Until then, acceptance does not increase beyond the six prior apps.
