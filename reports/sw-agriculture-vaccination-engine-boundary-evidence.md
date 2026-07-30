# Swahili Agriculture vaccination engine boundary evidence

Reviewed: 2026-07-31
Branch: `codex/sw-parity-agriculture-20260730`
Parent checkpoint: `e5bf7b3e`

## Outcome

The mandatory English architecture boundary is resolved. No Swahili Agriculture
row is accepted by this checkpoint alone; it removes the blocker that prevented
source-owned Swahili implementation.

- `engines/src/vaccination-engine.js` is now readable and DOM-free.
- The shared contract exposes calculation, normalization, and strict input
  validation.
- `assets/js/agriculture/vaccination-renderer.js` owns the four browser renderers.
- All 54 English country controllers use the shared calculation engine and the
  separate renderer.
- `scripts/migrate-vaccination-engine-boundary.js` is the idempotent source owner
  for the 54 English controller migrations.
- The generated `engines/vaccination-engine.js` was rebuilt from its readable
  source with the narrow minification owner.
- Existing formulas, disease selection, ordering, month selection, government
  campaign handling, currency behavior, rounding, and legacy numeric defaults
  are protected by pre-refactor fixtures.

## Browser proof

`tests/e2e/vaccination-engine-boundary.spec.js` passed 4/4 with one Chromium
worker:

- Kenya all-livestock calculation and KES rendering at 375px.
- Nigeria cattle calculation and NGN rendering at 375px.
- Tanzania poultry calculation and TZS rendering at 375px.
- Kenya result reflow at 320px with 200% text, including the horizontally
  scrollable 12-month calendar.
- Keyboard focus, console/page-error cleanliness, shared-engine identity, and
  separated renderer ownership were asserted.

The browser run exposed an existing calendar intrinsic-width leak at 200% text.
The source-owned shared stylesheet
`assets/css/agriculture/vaccination-responsive.css` now contains the scrollable
calendar inside the result card without clipping its data.

## Deterministic proof

- PASS: `node --test tests/vaccination-engine-parity.test.js` — 7/7.
- PASS: `node scripts/migrate-vaccination-engine-boundary.js --check` — 54/54.
- PASS: `npm run test:source-safe-minification` — 1/1.
- PASS: `npm run test:day6-category` — all explicit 447-route and 16-workflow
  contracts.
- PASS: `git diff --check`.
- PASS: deletion audit — zero deleted files.

The parity fixtures cover Kenya, Nigeria, Tanzania, South Africa, and the
legacy fallback/default path. The generated browser engine is compared with the
readable source contract.

## Carried baseline

`node scripts/build-fr-agriculture-singleton.js --id vaccination-schedule --check`
reports the already-stale French generated page. This checkpoint does not edit
French, other locales, the master ledger, sitemaps, `dist`, redirects, or
deployment output.

## Next stage

Resume the exact 447-row Swahili Agriculture program family by family, using
the now-compliant engine for the vaccination owner and preserving fail-closed
per-app acceptance.
