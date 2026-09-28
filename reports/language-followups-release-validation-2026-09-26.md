# Free-app language follow-up validation — 26 September 2026

This batch fixes remaining document translation/output defects, Swahili BOQ discovery and unsafe Burkina Faso payroll presentation. It follows the separately published language release `c5f1c08269bcb1f9814b55e8170155e017bdb784`. **This follow-up is not deployed.** Pro remains deferred until the free-app programme is complete.

## Changed Files

- `assets/js/pages/pdf-form-filler.js`, `pdf-compress.js`, `pdf-redact.js`, `pdf-merge-split.js`, authored `tools/pdf-sign/index.html` and owner-generated native routes: native labels while preserving user-owned text.
- `assets/js/pages/sw-document-pdf-localizer.js`: private Symbol trie terminal, separating phrase values from literal dollar-character children; literal dictionary semantics remain unchanged.
- `assets/js/components/related-tools.js`: text-free existing artwork for three document recommendations. Other recommendation artwork remains unchanged.
- `sw/zana/mjenzi-boq/index.html` and `assets/js/components/tool-registry.js`: truthful quick-calculator copy and link to the established native Swahili BOQ workspace.
- `scripts/build-bf-payroll-review.js`, `assets/js/pages/bf-payroll-review.js`, shared Swahili snippet owner and three payroll routes: a review-required state with saved-record preservation. Historical formula code and source dates are retained, not refreshed or certified.
- Focused tests and individual evidence reports. Final regeneration adds 39 reviewed files: 32 asset-version-only changes, two signing head/fingerprint normalizations, two claim-count reports and three snippet reports. No files deleted.

## User-Facing Changes

- Uploaded filenames, form-field names/options and typed signature text remain exact even when they match translation phrases. Native empty states, progress, validation, page labels and recovery controls remain localized.
- Swahili form completion/required-field counts, zero-field help and flattened-output status are native. Merge/split page numbers are generated natively; unknown/literal dollar phrases no longer cause the shared Swahili translator to throw.
- Three document recommendation images contain no embedded English text. Swahili BOQ discovery opens the native workspace while both existing routes remain valid.
- Burkina Faso automatic net pay, employer cost, reverse calculations, AI analysis and result exports are unavailable pending verification of the rules and their scope. Inputs remain editable and existing saved browser records remain intact. Unverified saved summaries and automatic restoration are also withheld. The notice works without JavaScript and if its runtime cannot load. This is a limitation notice, not a replacement payroll calculation.

## Tests Run

- [x] `git diff --check` and deletion review.
- [x] Focused owner/static checks, including seven trie cases, payroll protection/idempotence through actual release normalizers, 134 Swahili and 261 French snippet checks. Individual reports preserve earlier source/peer checks.
- [x] `npm run build:deploy` from frozen source `3ddd67224de649d0d578301c5e20ccb6ae199ce0`: 18,172 files; 1,839 JS and 623 CSS optimized. Content integrity: 11,803 HTML pages, zero blockers/warnings, three reviewed exceptions.
- [x] Optimized artifact: **76/76 Chromium cases passed in 6.1 minutes**, one worker, zero retries, dedicated port 4577 and fresh output directory. Actual PDF/ZIP/JSON/CSV outputs were reopened; typed signature RGB/alpha pixels matched independent expected bytes. Tests use synthetic fixtures and documented per-case network interception, with no global analytics-disable flag.
- [x] `npm run audit:dist`, `npm run security:scan`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run data:fallbacks:check`.
- [x] `npm run build:checks`: complete, terminal exit 0. All downstream checks ran, including 408/408 calculation fixtures, route/analytics checks, French iframe/snippet checks, Swahili snippets and final search-snippet audit (zero error pages; 650 existing review candidates).
- [x] Final generated diff classified and reviewed against the frozen source; exact literal file list and SHA-256 saved privately. Signing changes independently proved to be asset fingerprints/head metadata order only.
- [ ] Exact publisher-integration GitHub CI and live production checks: not run for this unpublished follow-up. Required before treating it as a completed production release.

Earlier failed checkpoint `021fd384` and its 70-case evidence remain preserved. The fresh build above includes the later owner corrections; it does not relabel the old failed snippet/idempotence checks. Those specific checks now pass after release normalization. No tests were weakened or skipped to remove the failures.

## Screenshots Needed

Focused synthetic screenshots, reopened exports and pixel proofs are preserved in the private artifact directory. Individual source reports include visual reviews. The coordinator also inspected fresh artifact screenshots for the Swahili two-field form, Swahili typed-signature preview and French payroll notice. This is not screenshot-based acceptance of every free-app page.

## Risk Notes

- Privacy: document and signature processing remains local by default. No new upload, consent, analytics-content or account-gate path. Stored payroll records are not deleted.
- Accessibility: focused native accessible names, small-width form flows, errors and recovery are covered; full catalogue accessibility is not established.
- SEO/routes: existing routes and reciprocal alternates remain valid. Payroll snippets describe unavailability and now pass length checks in EN/FR/SW. No click, CTR or ranking improvement is claimed.
- Analytics: event names and production defaults are unchanged; these tests do not prove analytics ingestion.
- Source freshness/confidence: no current Burkina Faso statutory formula is certified, no historical review date is advanced, and no guessed rate is substituted. Remaining research is recorded separately. The current calculation-quality report flags `forex-live-rates` as stale on 2026-09-26, while the separate static fallback-freshness checks pass; no freshness date or rate was changed to suppress this warning.
- Generated output: exact scoped staging only; prior failed checkpoints and unrelated canonical/worktree content are preserved.
- Remaining scope: whole-app dimensions and the 1,256-app programme remain incomplete. The build also reports existing non-app localization gaps; passing generator checks is not blanket parity proof. The non-app report retains French 298 missing/1 under-standard and Swahili 321 missing/1 under-standard out of 459 English routes. Automation audit warnings also remain for the absent local six-week SEO automation and an in-progress election report; this batch does not repair or certify those lanes.

## Rollout Flag

- Flag/config: existing routes; payroll availability is explicitly guarded. No new Pro feature or release flag.
- Publication: publisher integration after the queued education release, fresh-main reconciliation and exact integration CI. This report authorizes no competing publisher lease or deploy.
- Rollback: revert scoped source changes and regenerate through owners. Re-enabling payroll requires verified rules and validation rather than merely removing the notice.

Private evidence prefix: `language-followups-*-3ddd6722` under the coordinator's 2026-09-15 visualization directory, including build, release/locale gates, artifact configuration, 76-case log/artifacts and exact generated-file review.
