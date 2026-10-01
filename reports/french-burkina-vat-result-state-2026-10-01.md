# French Burkina Faso VAT result-state repair — 1 October 2026

## Changed files and behavior

- `fr/burkina-faso/calculateur-tva.html`: zero is a valid amount in add/extract modes. Blank, negative and non-finite inputs clear the saved result, rendered rows and headline; a French live status explains the required amount. Revoking reduced-rate confirmation also clears the result. PDF export requires a valid result and accepts a valid zero result.
- `tests/e2e/french-burkina-vat-result-state.spec.js`: three browser checks cover zero, invalidation/recovery, reduced-rate eligibility confirmation, a real parseable French PDF, and invalid export suppression.
- `tests/e2e/french-vat-business-tax-wave2.spec.js`: replace an obsolete Burkina Faso source-label assertion with the unchanged panel's actual source links, review date, planning limitation and reduced-rate confirmation requirement. Existing formula, actual PDF, ungated export, 320 px overflow, runtime and network-write checks remain.

The page retains its existing shared TVA engine, rates, eligibility condition, source ledger, privacy behavior and public route. No legal/source freshness assertion has been newly verified. The dated public evidence remains dated evidence.

## Baseline evidence

The new zero scenario fails on the parent candidate because `RESULT` becomes null. The older regression also fails on exact parent HTML at its obsolete `Source officielle à confirmer` assertion. A private Playwright route fixture served the exact parent HTML without reverting source files. That failure predates this repair; the replacement checks preserve source validation.

## Validation

- Source Chromium: **4/4 passed**, one worker, zero retries. Includes synthetic calculations, actual PDF parsing, 320 px dark/reduced-motion regression, no same-origin writes and no runtime failures.
- `npm run build:i18n:validate`: passed.
- `npm run validate:hreflang`: passed.
- `npm run check-links`: passed.
- `npm run vat-business-tax:verify`: passed.
- `node scripts/build-dist.js`: passed; packed 18,651 files and optimized 1,857 JS / 641 CSS assets through the artifact owner.
- Optimized deploy-artifact Chromium: **4/4 passed**, one worker, zero retries, including actual PDF parsing and the retained source/formula/privacy/mobile regression.
- `npm run audit:dist`: passed.
- `npm run security:scan`: passed.
- `git diff --check`: passed; no deletions or unrelated source changes.

The broad source build and original aggregate test evidence belong to the parent image-export candidate. This page-only follow-up does not repeat `npm test` or the full generator chain: its single hand-authored page is packed through the artifact owner and proved in the browser. The publisher must validate the final integrated release independently. The artifact was packed from the repaired working tree before this follow-up commit; it proves product behavior, not exact-SHA production.

## Integration and remaining scope

Parent dependency: `9a4d0e77398afbff579d7394c7bfc27125a110b9`. Review this follow-up against that commit so the earlier seven source files and 63 generated cache references are not counted twice.

No main push, publisher lease, deployment or database action from this lane. Exact integration CI, production SHA/provider proof and production browser verification remain publisher/live work. Whole-catalogue parity and French SEO click improvement are not established. Free apps remain first; Pro is deferred.

The shared dynamically hydrated source-confidence badge still contains English wording on this French route. It is recorded as a separate remaining language defect. This repair does not alter source-confidence logic or source metadata.

## Risk notes

- Privacy/analytics: synthetic scalar fixtures; exports remain local and ungated; no analytics behavior change.
- Accessibility: amount error is associated with the input, live-announced, and cleared on recovery.
- SEO/routes: canonical, metadata, route and hreflang unchanged.
- Generated output: no tracked generated source changes required; deploy artifact is rebuilt through its owner.
- Rollback: revert this follow-up commit; preserve the independent parent image-export candidate.
