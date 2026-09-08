# French car import country selection

Implementation: `06481927d9868ba3ebdd63e5471b6faff4a75f32` on `codex/fr-car-import-country-20260908`.
Parent: `2a47ee0f17d1c83fae85abceda3f01377ecd662d`; original PR107 implementation `a7ca2a31d3ccf3daee57eb8160330c14433525fa` and evidence remain preserved.
Worktree: `C:\Users\Oza\.codex\worktrees\3466\afrotools`.

## Changed files and behavior

- `assets/js/pages/french-transport-parity.js`: the French car-import adapter waits for supported country options, adds a required blank choice, suppresses initial default results before paint, and requires a supported manual selection plus calculation before displaying results or enabling exports. Changing country, custom reset, native form reset and reload invalidate that choice/result. Local vehicle inputs survive country validation and selection. All added behavior is restricted to `car-import-cost`.
- `tests/e2e/french-car-import-country-gate.spec.js`: six focused browser cases at 390px, with synthetic local inputs and parsed in-memory CSV/TXT downloads.
- `tests/e2e/french-transport-parity.spec.js`: changes only the two country/default-result expectations in the existing French advertised-action test: blank/hidden initially and blank after reset.

Before this fix, both the blank French route and `?country=XX&country=KE#country=GH` produced an empty query/hash, country `NG`, visible Nigeria result and disabled PDF. After the fix, country is blank, results are hidden and exports are disabled. The legacy controller can still calculate internally during initialization; this adapter suppresses presentation and export. No claim is made about removing that internal calculation or its analytics event.

## Validation

All browser checks use local source on port 4187, consent declined and traces disabled. The shared controller is the preserved parent version; indexing commits were not imported.

- PASS: `node -c assets/js/pages/french-transport-parity.js`.
- PASS: `node tests/french-transport-parity.test.js` (18/18 contracts).
- PASS: `node tests/car-import-cost-engine.test.js`.
- PASS: `git diff --check` and staged whitespace check.
- PASS: `npx playwright test tests/e2e/french-car-import-country-gate.spec.js --project=chromium --workers=1 --trace=off` (6/6, 18.6 seconds), with `PORT=4187` and `AFROTOOLS_TEST_DISABLE_ANALYTICS=1`. See `browser.log`.
- Focused coverage: blank URL; unsupported country; conflicting query/hash; even valid incoming country requires manual selection; query/hash stripped; no visible result frame while result readiness is false; blank-country validation/focus; vehicle inputs retained; Kenya/KES result; CSV Kenya charge and total matched against UI; French TXT country/model content; no implicit draft; country changes disable stale result/export; custom/native reset and reload; no 390px document overflow or entry page errors.
- FAIL / broader coverage unverified: existing `French Car Import keeps every advertised action local, explicit and reopenable` test stops at `privacy-initial-375 baseline root font size`, expected 16, received 32 (`tests/e2e/french-transport-parity.spec.js:389`, caller line 1311). Its earlier 320px/200% stage completed. See `extended-browser.log`.

Exact broader-test reproduction: with the same environment, run `npx playwright test tests/e2e/french-car-import-country-gate.spec.js tests/e2e/french-transport-parity.spec.js --project=chromium --workers=1 --trace=off --grep 'entry |vehicle inputs survive|reset|French Car Import keeps every advertised action'`. This invocation ran in fresh Playwright browser contexts per test; the broader test failed on the second reflow check within its own fresh context. An isolated fresh-context 375px-only case was not run. No typography changes or repeated broad test attempts were made. Later assertions in that test, including PDF parsing and its full privacy/reopen flow, are not claimed as passed.

## Coordinator integration

Cherry-pick the implementation commit above onto the combined branch. Do not reapply PR107's ancestor commits if already integrated. This lane has not changed `assets/js/car-import-cost.js` or the indexing test.

In indexing-owned `tests/car-import-country-entry.browser.js`, amend only the old French baseline assertion(s): country value `NG` becomes `''`; initial result visibility `true` becomes `false`; keep PDF disabled. Assert query/hash are empty and `carImportCostLastInput` is null. Retain explicit manual `KE` selection, calculation, Kenya/KES result and enabled local export recovery. Do not copy the French blank-on-valid-query behavior into English entry tests.

Run the focused French suite together with the updated indexing suite against the combined controller, then perform the combined full build/deploy-artifact/security checks and owned cache-bust regeneration. This lane did not run a new full build, edit generated route/cache files, or verify the combined controller/artifact/live deployment.

## Risk and rollback

Privacy: existing query/hash stripping and implicit-draft prevention are preserved. Synthetic test downloads were parsed in memory; no real user data or screenshots are included. Accessibility: blank selector is required, failed selection receives focus and `aria-invalid`, and French status/error text uses existing feedback regions. SEO/routes and analytics identifiers are unchanged. The change does not assert current customs-rate accuracy or human French language acceptance. Generated output is unchanged. No migration, live database action, main merge or deployment occurred. Roll back the focused implementation commit to restore the prior adapter behavior.
