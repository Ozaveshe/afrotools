# Swahili Creative parity receipt

## Decision

- Baseline: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`
- Exact scope: 46 English free-app rows where `categoryKey === "creative"`
- Accepted: 12
- Blocked fail-closed: 34
- Artwork resolved: 46/46
- Category discovery: 12/12 accepted apps linked from `/sw/ubunifu-na-watayarishi/`; the three visual-pricing apps are also linked from `/sw/picha-na-design/`

## Accepted apps

`african-palette`, `art-commission`, `book-publishing-cost`, `creator-club`, `creator-course`, `creator-research`, `engagement-rate`, `music-royalty-splitter`, `photography-pricing`, `podcast-monetization`, `self-publishing-royalty`, and `wedding-photo-package`.

Every accepted route uses the corresponding deterministic English engine, exposes a native Swahili form and result surface, rejects invalid input, and provides reopened JSON and TXT exports without a network write.

## Browser proof

The final isolated Chromium run used one worker on port 4428 and passed 60/60 tests:

- 46/46 physical routes: locale metadata, canonical/OG ownership, light/dark presentation, 375px layout, and captured 320px/200% reflow evidence. Reflow is an acceptance assertion on the 12 accepted routes; evidence for the 34 blocked legacy routes is recorded without upgrading their product acceptance.
- 2/2 hubs: exact accepted-app discovery and 320px/200% main-content reflow.
- 12/12 accepted app workflows: valid calculation, invalid-state reset, parsed JSON, reopened TXT, local-only/no-write behavior, focus visibility, and console/page-error checks.

Command: `playwright test --config tests/playwright.sw-creative-parity.config.js` using the repository-pinned Playwright binary.

After the run, port 4428 had no listener and zero owned Node, command-shell, or Chromium processes remained.

## Static proof

- `node tests/sw-creative-parity.test.js` — passed exact 46-row ownership, 12 engine oracles, 34 blocker contracts, artwork, reciprocal hreflang, and hub discovery.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run validate:hreflang` — passed across 11,131 pages and 32,490 relationships.
- `npm run check-links` — passed 137,031 internal links across 11,350 HTML files.
- `git diff --check` — passed.
- Deletion audit — zero deleted paths.

## Explicit blockers

- 3 media tools (`creator-clip`, `creator-record`, `creator-voice`) require real-device capture and reopened codec proof.
- `afrostream` requires route-specific network fallback, freshness, and no-network proof.
- 7 legacy product workspaces require their own state-mutation and parsed export oracles: `creator-desk`, `creator-mail`, `creator-mind`, `creator-polish`, `creator-schedule`, `creator-split`, and `creator-team`.
- 23 other localized Creative routes remain usable but lack a complete route-specific shared-engine, invalid-state, and parsed-export oracle.

The machine-readable route-by-route reasons are in `reports/sw-creative-parity-receipt.json`.

## Coordinator boundary

This lane did not edit the central Swahili acceptance ledger, shared AI route map, master inventory, sitemap, broad localization reports, `dist`, another category, or a live service. The five new physical routes make the broad localization artifacts stale by exactly five rows; the coordinator must regenerate those artifacts and sitemaps once all lanes are integrated.
