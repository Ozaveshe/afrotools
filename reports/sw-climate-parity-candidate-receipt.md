# Swahili Climate & Environment parity candidate receipt

## Outcome

**ACCEPTED — 13/13 native Swahili Climate & Environment applications.**

The exact Climate & Environment denominator is 13 English applications. All 13 now have source-owned, native Swahili interfaces backed by the same DOM-free `window.AfroClimateTools.calculate(toolId, inputs)` calculation contract used by English. All 13 passed the static contract and the full serialized real-browser acceptance suite. There is no remaining architecture, export or browser blocker in this category.

## Inventory

| State | Count |
| --- | ---: |
| Canonical English applications | 13 |
| Physical Swahili routes | 13 |
| Native Swahili implementations | 13 |
| Static/oracle/source/export/metadata accepted | 13 |
| Accepted after real-browser proof | 13 |
| Browser-pending | 0 |
| Product or calculation architecture blockers | 0 |
| Missing artwork | 0 |

The exact route contract is recorded in `data/localization/sw-climate-parity-manifest.json`. The hub at `/sw/hali-ya-hewa-na-mazingira/` exposes exactly those 13 unique routes.

## Implemented

- Replaced 12 localized runtime shells and one explicit English fallback with 13 native Swahili owners.
- Added one maintained manifest/copy source and one deterministic generator that writes exactly the 13 routes plus their category hub.
- Preserved every English calculation engine and field contract; no formula source was edited.
- Added native Swahili result labels, metric labels, action plans, status messages and validation feedback.
- Added explicit source, model-review date, low-confidence, no-live-data and planning-only boundaries on every route.
- Kept values local: calculations, copy, device storage, JSON and PDF do not send entered values to AI, analytics, URLs or application endpoints.
- Reopened local copy, localStorage, JSON download, validated JSON import/recalculation and local PDF export.
- Added visible labels, live regions, focus styles, invalid-field focus/`aria-invalid`, reduced-motion handling, manual dark mode and system dark mode CSS.
- Added canonical, reciprocal English/Swahili hreflang, `x-default`, dedicated OG artwork and `WebApplication` schema per application.
- Removed the post-render translation runtime from these routes; generated pages contain native Swahili copy at first render.

## Static proof completed

- `node scripts/build-sw-climate-parity.js` — PASS; generated exactly 13 applications and one hub.
- `node tests/sw-climate-parity.test.js` — PASS; 13/13 exact inventory, route ownership, engine oracles, registry discovery, metadata, artwork, source/freshness/confidence, privacy and export contracts.
- `node -c scripts/build-sw-climate-parity.js` — PASS.
- `node -c assets/js/pages/sw-climate-tools.js` — PASS.
- `node -c tests/e2e/sw-climate-native-parity.spec.js` — PASS.
- `npm run lint` — PASS; 44 JavaScript files checked.
- `npm run type-check` — PASS; AI manifest and prompt contracts validated.
- `git diff --check` — PASS.
- `git diff --diff-filter=D --summary` — PASS; zero deleted files.

The deterministic oracle suite loads the shared engine in a DOM-free VM and checks the exact result, risk/decision level and first metric for every application.

## Browser proof completed

The identity-gated suite `tests/e2e/sw-climate-native-parity.spec.js` passed **55/55** with one Chromium worker on isolated port `43153` in 122 seconds. The server and every tested route proved candidate commit `cd5dbcc56db83488158ec82a57a3cc80c1fc8807`, tree `780b36a1de77c6f4856cceb95e02097c6beabd45` and root `C:\w\sw-climate-0803` through fail-closed response headers. It covered:

- all 13 shared-engine English/Swahili comparisons;
- all 13 calculations, stale-result clearing, invalid input and accessible focus behavior;
- 13 JSON downloads with parsed payloads plus 13 validated reopen/recalculations;
- one downloaded, parsed PDF with the planning boundary;
- 320px and 375px layouts, 200% reflow, manual and system dark modes;
- visible labels, keyboard focus, canonical/hreflang/OG metadata, console errors and local-only request behavior;
- the 13-card Swahili category hub at 320px and 375px;
- zero unexpected external or API requests, zero user-input request bodies and zero console errors.

Machine-readable proof is recorded in `reports/sw-climate-browser-evidence.json`. The first attempted browser run was discarded because the sparse test checkout omitted tracked `assets/fonts/typography.css` and the local bundled jsPDF asset. After restoring the full tracked `assets/` read-set, the unchanged candidate passed in full; this was a test-fixture/read-set correction, not a product-code repair.

## Scope and safety

- Foundation: `f7036c210c34146d58b43d0a2a5d4c023cb91694`.
- English formula files changed: **0**.
- Other locale product files changed: **0**.
- Central acceptance ledger changed: **no**.
- Central AI route map changed: **no**.
- Sitemap, redirects, `dist/` or deployment output changed: **no**.
- Deleted files: **0**.
- Live Supabase, merge, push and deployment actions: **none**.

Broad localization generation and global hreflang validation were intentionally deferred to coordinator integration because this worktree is sparse and this lane was prohibited from changing shared generated outputs.
