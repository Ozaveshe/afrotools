# Swahili Burkina Faso VAT result-state repair — 1 October 2026

## Behavior and scope

`sw/burkina-faso/kikokotoo-vat/index.html` retained a previous positive result when the amount became zero, negative or blank. Its PDF/share actions could therefore use stale values. Zero now calculates normally in add/extract modes. Invalid input or an unavailable engine clears the result object, visible values, formula, chart and dependent withholding output. Sharing stops when recalculation cannot produce a valid result. The amount error is associated with the input and its invalid state resets on recovery.

The existing shared TVA engine, country rate, custom-rate controls, independent invoice-item calculations, source metadata, public route and local export provider are retained. This is a targeted native-page repair; a search of tracked generator/runtime sources found no owner for this page's inline calculation function. No broad translation regeneration or financial/source-data update is included.

`tests/e2e/swahili-burkina-vat-result-state.spec.js` proves both zero modes, negative/blank clearing and recovery, engine failure/recovery, invalid export/share suppression, 320 px width and an actual parseable Swahili PDF without previous values or an account gate. Synthetic scalar fixtures only.

## Evidence and validation

- Before the repair, the zero scenario fails because the prior `118000` total and `18000` VAT remain in `RESULT`; preserved log/trace: `sw-bf-vat-before-20261001`.
- Source Chromium: **3/3 passed**, one worker, zero retries; actual PDF signature/text, no same-origin writes and no page runtime errors.
- `npm run vat-business-tax:verify`: passed.
- `npm run build:i18n:validate` and `npm run validate:hreflang`: passed.
- `npm run check-links`: passed (147,579 links across 11,928 HTML files).
- `node scripts/build-dist.js`: passed; 18,651 files packed, 1,857 JS / 641 CSS assets optimized.
- Optimized deploy-artifact Chromium: **3/3 passed**, one worker, zero retries, including actual PDF parsing and invalid/engine-failure recovery.
- `npm run audit:dist` and `npm run security:scan`: passed.
- `git diff --check` and test JavaScript syntax: passed; no deletions/unrelated changes.

The parent French candidate's independent artifact proof remains separate. This page-only follow-up uses the owner-packed artifact and narrow proving tests. It does not repeat `npm test` or the broad generator chain; the parent image-export full-build/aggregate evidence remains separately recorded. Final integrated CI/build and exact-SHA production verification are owned by the publisher. This artifact was packed before the new commit, proving repaired product behavior without claiming exact-SHA production.

## Integration and limitations

Parent dependency: `c4b46cfd03aee995288d0be8e098d2997ab5e552`, which depends on the image-export candidate `9a4d0e77398afbff579d7394c7bfc27125a110b9`. Review this follow-up against its immediate parent to avoid duplicate intake.

No main push, lease, production deployment or database operation from this lane. Whole free-app parity, source freshness, complete native source-badge wording and French SEO click uplift remain unproved. Pro is deferred until the free-app programme is complete.

## Risks and rollback

Privacy/analytics behavior is unchanged; invalid state now prevents stale exports/shares. The native alert remains accessible and is linked to its field. SEO, canonical and hreflang are unchanged. No tracked generated output is required. Revert this follow-up commit to roll back, retaining the independent French and image-export candidates.
