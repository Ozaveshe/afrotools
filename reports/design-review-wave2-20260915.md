# Design review: directory and country entry points

## Changes

- Fixed the shared mobile search rule that gave decorative SVGs a 160px flex basis. The directory search icon measured 166.8px before and 16px after.
- Directory hydration now shows eight cards per category, with 24 more per expansion. Filtering still searches the complete registry; changing filters resets expansion. All categories remain visible and the static fallback remains intact.
- Added visible, announced result counts and keyboard focus on the first newly revealed card. Added Hausa and Yoruba language filters.
- Repaired directory night-mode search, badges, filters and supporting text.
- Repaired shared country-hub night-mode hero, badge, information-panel and table-header surfaces. Existing light styling is preserved.

## Browser evidence

Local in-app Chromium preview on port 4186, from this isolated worktree. This is not production proof.

- Directory: 390px and 320px, light and dark checks. Search icon is 16px. At 320px, document scroll width and client width both 314px; long Show more control wraps inside its 274px width.
- Initial directory: 255 visible cards, 2493 matching records in the renderer. Header discovery counts are a separate metric. No claim that these measures are interchangeable.
- Finance expansion: 8 to 32 cards; focus moves to AfroFuel, the first newly revealed card.
- Search for `wallet address` finds Wallet Address Format Validator outside the initial batch, with one result.
- Hausa filter returns only HA cards, with 58 of 87 matching records initially shown across categories.
- Directory console error log: empty in the checked session.
- Nigeria: dark hero visibly failed before (pale text over white background); repaired surface is rgb(11,21,36), heading rgb(238,245,255). 390px document has no horizontal overflow. No broken completed images observed.
- Kenya: independently checked the shared hero repair at 320px. Dark heading and metadata readable; no document overflow.
- French homepage: dark mobile 390px and tablet 768px checked; no document overflow or broken completed images observed.
- Swahili homepage: dark tablet 768px and narrow phone 320px checked; no document overflow. No broken completed images observed at tablet width.

## Checks

- PASS: `node tests/progressive-directories.test.js` (canonical static fallback still current).
- PASS: `node --test tests/tool-directory-batching.test.js` (2 behavior tests: expansion/reset/no duplicates; full-list search/language/empty result).
- PASS: combined English/French UI contract and inventory tests plus batching tests (7 total).
- PASS: directory inline JavaScript syntax compilation; `git diff --check`.
- Completed bounded mobile audit of seven entry pages. Four have heuristic issues; browser results above distinguish confirmed defects from warnings. Reports: `design-mobile-entrypoints-20260915.json` and `.md`.

## Still required

The overall design goal remains active. This is a second repair batch, not a whole-site compatibility verdict.

- Continue tool-family workflows, images, exports, keyboard navigation, tablet/desktop/light checks, and deeper localized pages.
- Review the remaining unwanted accent patterns using rendered evidence; semantic warnings should stay distinguishable.
- Run shared-asset cache version regeneration through the normal build owners before release. This affects many pages and has not been claimed complete here.
- Run the full publish build, security and dist checks before any release. No merge, push, deployment, Safari or Firefox verification performed.
- Review directory load cost further: batching reduces hydrated DOM, but complete static fallback and registry payload remain large.

No user input data, analytics behavior, calculation rules, route canonicals or source ledgers changed. No live database operations.
