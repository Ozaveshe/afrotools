# Swahili Creator Analytics parity evidence

## Decision

- English owner: `creator-analytics` at `/tools/creator-analytics/` with private workspace `/tools/creator-analytics/app`.
- French equivalent: `/fr/tools/stats-createur/` with workspace `/fr/tools/stats-createur/app`.
- Swahili equivalent: `/sw/zana/takwimu-za-mtayarishi/` with new native workspace `/sw/zana/takwimu-za-mtayarishi/app`.
- Shared calculation owner: `engines/src/creator-analytics-engine.js` and generated browser engine `engines/creator-analytics-engine.js`.
- Category credit: exactly one Creative Economy app. No Image & Design credit and no duplicate workspace credit.
- Acceptance delta proposed to the coordinator: `creator-analytics` +1. The central acceptance, AI, locale coverage and sitemap artifacts were not edited.

## Product contract proved

- Same normalized post fields, validation, weighted engagement formula, platform/format grouping and local persistence as the English/French workspaces.
- Native Swahili form, status, error, summary, table, privacy and method copy.
- Invalid date/reach is rejected and does not persist a post.
- Clear action removes the local dataset and resets the summary.
- CSV was downloaded, reopened as two rows and checked for the complete machine-readable header and exact 8.00% fixture.
- JSON was downloaded, parsed and checked for one post, 800 interactions and 8% engagement.
- No iframe, English handoff, social login, AI request or raw-input network write.
- Dedicated artwork resolves at `/assets/img/tools/creator-analytics.webp`.

## Browser proof

Focused isolated Chromium suite on port 4437: **3/3 passed**.

- 320px and 375px layouts had no horizontal overflow.
- 200% reflow was checked at a 640px viewport with 2x page zoom.
- Light and dark themes retained distinct text/surface colors.
- All workspace inputs/selects have visible labels and keyboard focus is visibly outlined.
- Canonical, OG, schema `inLanguage`, `isBasedOn` and reciprocal EN/FR/SW workspace hreflang passed.
- Console/page errors, external requests and non-read network methods remained empty during the complete fixture workflow.

The legacy 60-test Creative matrix was also run. The exact `creator-analytics` physical-route test passed. Overall it reported 40 passed and 20 carried failures outside this app: eight already-blocked shell routes lack the legacy native-owner marker, and twelve previously accepted legacy workflows attempt Google Tag Manager under that suite's stale consent setup. No failure named or exercised the new Creator Analytics workspace.

## Commands

- `node tests/sw-creator-analytics-parity.test.js` — pass.
- `node tests/sw-creative-parity.test.js` — pass (legacy 46-row contract).
- `playwright test --config tests/playwright.sw-creator-analytics.config.js --project=chromium --workers=1` — 3/3 pass.
- `playwright test --config tests/playwright.sw-creative-parity.config.js --project=chromium --workers=1` — 40/60; carried failures documented above.
- `npm run lint` — pass.
- `npm run type-check` — pass.
- `npm run validate:hreflang` — pass across 11,291 pages, 33,424 relationships and 5,351 groups.
- `npm run check-links` — pass across 138,226 internal links and 11,510 HTML files.
- `git diff --check` — pass.
- Deletion audit — zero deleted files.

## Explicit preceding blocker

`afrostream` remains fail-closed. Its English owner is a network-backed streaming hub, so it still needs route-specific fallback, freshness and offline/no-network proof before it can receive Swahili app acceptance.
