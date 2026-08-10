# Swahili AfroPlan Floor Planner final evidence

Date: 2026-08-09

Route: `/sw/zana/mpangaji-ramani-ya-sakafu/`

English owner: `/engineering/floor-planner/`
Source owner: `scripts/build-sw-afroplan-floor-planner.js`

## Accepted scope

- The former reduced brief calculator is replaced by the complete shared AfroPlan workspace.
- Shared English canvas, room, wall, opening, furniture, measurement, label, selection, undo/redo, zoom, template, describe-to-plan, estimate, persistence and import controllers remain the calculation and interaction owners.
- Native Swahili presentation covers static and dynamic workspace copy, validation/status text and export feedback.
- Native Swahili exports cover the advertised builder PDF, plan PNG and BOQ PDF, CSV, XLSX, JSON and printable HTML.
- The registry row owns the exact Swahili route, English source id and existing dedicated artwork.
- English, French and Swahili alternates are reciprocal. Canonical, OG and structured data identify the exact Swahili route.
- No raw plan data leaves the browser. The focused browser proof observed zero non-GET requests.

## Browser proof

Focused Chromium scenarios:

1. Complete object matrix (room, wall, door, window, furniture, dimension and label), undo/redo, keyboard tool changes, local project save/restore, share-hash reopen and corrupt-import fail-closed behavior.
2. Export packet and every advertised output: exact-dimension PNG reopened with `createImageBitmap`; builder and BOQ PDFs parsed with `pdf-parse`; CSV decoded; JSON parsed and its project objects reopened; HTML decoded with its embedded plan image; XLSX reopened with SheetJS and all three worksheets inspected.
3. 320 px and 375 px layouts, 200% text reflow, manual dark theme, keyboard focus, labelled modal semantics, Escape close and focus return.
4. English owner regression using the maintained deterministic 4 m x 3 m fixture and shared export packet.

Final results:

- Workflow, persistence and privacy: PASS.
- Export/reopen: PASS for PNG, two PDFs, CSV, XLSX, JSON and HTML.
- Responsive/theme/accessibility: PASS after adding dialog role, modal labelling, initial focus, Escape close and focus restoration to the Swahili BOQ layer.
- English regression: PASS.

The first focused run exposed that the English consumer export controller captured pointerdown before the Swahili click adapter. The final adapter now suppresses that inherited pointerdown action and performs the native export on click, keeping pointer and keyboard activation aligned. The first responsive run also exposed missing BOQ dialog semantics; the final focused rerun passed after the accessibility repair.

## Static and route proof

- `node scripts/build-sw-afroplan-floor-planner.js --check` — PASS.
- `node tests/sw-afroplan-floor-planner-final.test.js` — PASS.
- `node scripts/audit-tools.js` — PASS, zero live/new rows missing pages.
- `node scripts/validate-hreflang.js` — PASS, 33,966 relationships and 5,350 validated groups.
- `node -c engineering/floor-planner/js/fp-sw-localize.js` — PASS.
- `node -c engineering/floor-planner/js/fp-sw-export.js` — PASS.
- `git diff --check` — PASS.
- `git diff --diff-filter=D --summary` — empty; zero deletions.

## Boundary

No central acceptance ledger, AI route map, localization coverage output, sitemap, service worker, build artifact, push, PR, merge or deployment was changed. No physical-device claim is needed for this non-device workflow.
