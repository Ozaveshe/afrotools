# French and Swahili source panels — 1 October 2026

French and Swahili pages using the shared source panel previously displayed English confidence, freshness and caution text. The panel now follows the page language while keeping source identity, links, dates, confidence and freshness unchanged. English Burkina Faso VAT also fits at 320px after a small grid sizing fix.

## Changed Files

- Source: `assets/js/lib/src/source-confidence.js`, `scripts/minify.js`, `scripts/lib/calculation-quality.js`, `docs/source-confidence-model.md`, `package.json`, `burkina-faso/bf-vat.html`, `tests/source-confidence-locales.test.js`, `tests/calculation-quality.test.js`, `tests/e2e/source-confidence-locales.spec.js`, and this report.
- Generated: `assets/js/lib/source-confidence.js` and 296 HTML files whose only change is the helper's cache reference. The English VAT source page also has that cache update.
- Parent: `80bcf4de3def5e4b664e7bbdf9cefb40d9e5dce5`; dependencies are French VAT `c4b46cfd03aee995288d0be8e098d2997ab5e552` and image exports `9a4d0e77398afbff579d7394c7bfc27125a110b9`, based on `61e588f8283973208eb3457a99373dd285bee15a`.

## User-Facing Changes

- All 104 distinct current caution notes, covering 243 source records, have complete French and Swahili wording. Two default cautions are translated too. Institution names and source titles remain attribution text.
- Exact English-note matching prevents an older translation from masking a changed condition. Unknown or changed notes remain intact with a native English-language label and `lang="en"`.
- Source links have a 44px minimum height and a visible keyboard-focus outline. Long text wraps within narrow panels.
- The English VAT grid can shrink at small widths. Calculation, source data and export logic are unchanged in this batch.
- The calculation metadata guard now recognizes this evidence-display helper's cache key as presentation, preserving the reviewed baseline representation. Script paths, other query parameters, loading attributes, calculator wiring and formula code remain protected. No formula registry or fixture expectations were refreshed.

## Tests Run

- [x] `git diff --check`; no deleted files; independent review of all 296 generated HTML diffs found no changes beyond this helper's cache reference.
- [x] `node -c assets/js/lib/src/source-confidence.js`; scoped minification and cache regeneration.
- [x] `npm run test:source-confidence`: 15 existing English checks and six new localization checks passed. All 243 records are covered; readable and generated helpers agree.
- [x] Independent original-helper comparison: English values/rendered HTML match across nine existing APIs for all 243 records. Intended CSS accessibility changes are separate.
- [x] Source browser: 16/16 passed; optimized artifact browser: 16/16 passed. Includes EN/FR/SW panels at 320px in light/dark, synthetic stale dates, unchanged source links, keyboard focus, changed-note fallback, French/Swahili invalid/zero/recovery, and actual locally generated PDFs parsed for native labels and zero amounts.
- [x] Artifact visual captures: 3/3 passed; French and Swahili panel images inspected.
- [x] `npm run localization:check`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run vat-business-tax:verify`.
- [x] `npm run build:deploy` passed all six build stages and post-build checks. Unrelated regeneration was preserved privately and removed from this patch; `node scripts/build-dist.js` then packed the scoped source successfully.
- [x] `npm run security:scan`, `npm run audit:dist`.
- [x] Broad `npm test`: one test file failed out of 1,179; all seven audits passed. The failure was introduced by the helper's cache update on protected route shells. Independent comparison of all 406 formula records found 14 affected routes, each matching its parent exactly apart from that helper cache reference; parent digests matched their registered values.
- [x] After the guard repair, `node tests/calculation-quality.test.js` passed all 20 checks, including adversarial code/path/query mutations; independent checking found zero mismatches across all 406 formula records. `npm run calculation-quality:check` passed 798 artifacts and 417/417 fixtures, retaining one existing stale-dataset warning. These source-only guard/test changes do not enter the publish artifact. The full aggregate was not rerun after this final focused repair; retain its original failure result and require fresh integration CI.

## Screenshots Needed

Completed private artifact panel captures: `source-confidence-en-artifact-20261001.png`, `source-confidence-fr-artifact-20261001.png`, `source-confidence-sw-artifact-20261001.png`. Stale dates in these captures are test fixtures, not updated source evidence.

## Risk Notes

- Privacy: no new network request or storage; no user content, analytics event or consent behavior changed. Existing registry fetching remains unchanged. PDF tests use synthetic values.
- Accessibility: source-link touch/focus improvements and overflow checks passed. Coverage does not constitute a whole-site accessibility audit.
- SEO/routes: no route, canonical, source date or snippet claim changed. Reciprocal hreflang validation passed. This batch does not prove increased search clicks.
- Analytics: event names unchanged; build analytics coverage check passed.
- Source freshness/confidence: registry records and status enums untouched. Native words do not upgrade evidence. New notes safely retain their original conditions until translated.
- Generated output: the bilingual dictionary makes the cached helper approximately 77.7 KB. A readable owner is now enrolled in the existing minifier; HTML changes were regenerated through the cache owner.
- Existing gap: the old AI command-card source-hint browser assertion fails with both the original helper and this helper. It remains unchanged and is excluded only from this bounded browser run; baseline failure logs are preserved for a separate repair.
- Remaining free-app work includes English Burkina VAT blank/negative input handling and stale zero-chart state. This mobile/source-panel patch does not resolve those calculation-state issues. Whole-catalogue parity remains unfinished; Pro assessment follows free apps.

## Rollout Flag

- Flag/config: none; document language selects English, French or Swahili. Unsupported locales keep existing English behavior.
- Rollback path: revert this bounded commit, including generated helper/cache references. Preserve the earlier VAT/image-export dependencies.
- Integration: existing publisher owns integration, fresh CI/build and deployment. This pre-commit local artifact is product-behavior proof; no exact-commit production verification is claimed.
