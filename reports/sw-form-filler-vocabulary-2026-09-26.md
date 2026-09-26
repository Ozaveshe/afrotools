# Swahili form-filler fallback vocabulary — 2026-09-26

## Changed Files

Source:

- `assets/js/pages/pdf-form-filler.js`: native Swahili field-count labels for zero, one and multiple fields. Other locale strings, form parsing, calculations and export logic remain unchanged.
- `scripts/build-swahili-document-pdf-lexicon.js`: five explicit form-filler route overrides for upload accessibility, no-fields help and optional flattening wording.

Owner outputs:

- `data/localization/sw-document-pdf-lexicon.json`
- `assets/js/pages/sw-document-pdf-lexicon.js`
- `sw/zana/kujaza-fomu-pdf/index.html`

Tests: `tests/e2e/sw-form-filler-vocabulary.spec.js`.

## User-Facing Changes

Opening a PDF without interactive fields now shows `Sehemu 0` and fully native first-step guidance. The keyboard upload control is named `Chagua PDF yenye fomu`. Optional flattening is described as combining filled values with page content; the wording does not claim security or that the PDF cannot be edited. One- and two-field counts use the same native format. Uploaded names and values are not translated.

## Baseline and Isolation

Branch: `codex/sw-form-filler-vocabulary-20260926` in its own worktree. Requested base: `d5fdb6764f2c556919f4b42a46d6eb4b23c2f7af`. Fresh fetch recorded origin/main `b9591cd19424eee477db576b6d95459da686e4ec`; the candidate deliberately retains the coordinator-requested d5fdb base. The frozen combined candidate and earlier BOQ branch were not edited. No push or deploy.

## Tests Run

- PASS: `node scripts/build-swahili-document-pdf-lexicon.js --write --sync-overrides=pdf-form-filler`, then the same scoped check without `--write`.
- PASS: `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-form-filler`, then `--check --apps=pdf-form-filler` (1/1 route).
- PASS: existing form-runtime unit test, 1/1.
- PASS: 18 existing EN/FR/SW browser regressions from `pdf-form-filler-correctness.spec.js` and `pdf-form-filler-guest-output.spec.js`. These include guest interactive/flattened exports, required fields, keyboard upload/reset, source replacement, invalid-source recovery, radio and multiselect preservation.
- PASS: new 3/3 vocabulary browser cases, 14.5 seconds: no-fields fallback at 320px; one/two-field forms; native accessible upload and flatten labels; exact synthetic field names/values through interactive exports; independent pdf.js text extraction of flattened output; no horizontal overflow.
- PASS: `npm run build:i18n:validate` (11,576 pages, 8 manifest locales; all FR/SW/YO/HA keys match EN).
- PASS: `npm run validate:hreflang` (32,568 relationships, 5,304 equivalence groups).
- PASS: changed-JS syntax, `git diff --check`, and deletion review (no deleted files).

The first test run had 18 existing passes and three incorrect new assertions against a hidden file input. The second run passed the no-fields case, exposed the existing native type prefix in field accessible names, and had one keyboard chooser timeout before initialization settled. Tests now inspect the visible upload control, wait for page initialization, and include the actual native type prefix. Final 3/3 passes; earlier evidence is preserved. Product code did not change during these test corrections.

No full build, broad test suite, registry rewrite, or production checks: this is a scoped source candidate. Regular publisher generation must refresh cache hashes. Regenerating the selected page also repositions its owned metadata and drops stale injected-asset query hashes; canonical/hreflang values are unchanged.

## Screenshots Needed

Completed local synthetic screenshots, private evidence outside the product tree: `../evidence/sw-form-filler-vocabulary-verified/`. Read-only artwork/fallback audit remains separately under the BOQ worktree parent: `../evidence/document-fallback-artwork-20260926/read-only-review.md` there.

## Risk Notes

- Privacy: files stay local; no uploaded field names, values or machine identifiers are translated. Fixtures use public synthetic text.
- Accessibility: native visible keyboard upload name and optional-flatten checkbox name verified; 320px no-overflow checks pass.
- SEO/routes: no route or canonical change; hreflang validation passes.
- Analytics: unchanged.
- Source freshness/confidence: wording describes existing pdf-lib flatten behavior without security guarantees; no rate/data changes.
- Generated output: only selected lexicon entries and one generated route; no minified runtime exists for this readable form-filler source.
- Carried limitations: English text inside related-card artwork remains separate. The first commit left valid-form completion text such as `0 of 1 fields complete`; the authorized follow-up below resolves it. This does not claim complete language parity for the form-filler or all 31 document apps.

## Rollout Flag

- Flag/config: none.
- Rollback path: revert the scoped commit and regenerate owner outputs.


## Follow-up: valid-form statuses and uploaded-name preservation

Second scoped change on top of a7ea5a18. Only the readable runtime, browser tests and this report change; no generated output is required because public EN/FR/SW form-filler pages directly load assets/js/pages/pdf-form-filler.js.

### Reproduced and changed

A fresh local browser audit of a7ea5a18 with a synthetic three-field PDF showed:

- Completion: “0 of 3 fields complete”, then “1 of 3 fields complete”.
- Required count: “1 required left”, then “0 required left”.
- Checkbox type badge: “Check”.
- Flattened export success: “PDF imepakuliwa (flattened).”.
- Uploaded checkbox/radio accessible names “Upload PDF” / “Download PDF” became “Pakia PDF” / “Pakua PDF”. Their underlying PDF names were not renamed, but the displayed accessible names were wrong.

The maintained runtime now renders Swahili completion as “Sehemu zilizojazwa: X kati ya Y”, remaining required count as “Sehemu za lazima zilizobaki: N”, a native checkbox type badge, and a native flattened-download explanation. The already-calculated totals, percentage, required-field rules and export algorithms are unchanged; EN/FR retain their original status source strings.

The runtime also marks the uploaded filename and checkbox/radio name containers with the existing translate=no contract. This aligns them with protected text-field names and dropdown/radio option text. It does not modify source PDF field identifiers, options, file names, or entered values. Checkbox status text remains separately localizable.

### Active status audit boundary

Reviewed every runtime-owned text/status assignment in the form-filler controller. Existing loading, invalid-file, no-fields explanation, required-export error, failure, processing, ordinary download, review guidance, page indicator, placeholder, dropdown prompt and remaining type/status labels already use native messages or existing exact localizer/integrity rules. The new changes target the concrete uncovered completion, required count, checkbox-type and flattened-success gaps. User text, format tokens, machine identifiers and app-generated sample input values are excluded from vocabulary replacement. Artwork remains a separate carried limitation.

### Exact follow-up proof

- PASS: 22/22 Chromium tests in one run, 52.4 seconds, using the private focused config. Includes all 18 existing EN/FR/SW correctness/export cases plus four expanded Swahili vocabulary cases.
- Verified actual completion states 0/1, 1/1, 0/2, 1/2, 2/2; percentage semantics 0%, 50%, 100%.
- Verified mixed text/checkbox/dropdown/radio states 0/4, 1/4, 2/4, 4/4 and reset to 0/4; remaining required counts 2, 1, 0 and reset to 2; required-field export rejection remains native.
- Verified uploaded filename, field names, option labels and values matching translation phrases stay exact in the visible/accessibility surfaces and downloaded interactive PDF. Existing one/two-field tests still verify flattened PDF text independently with pdf.js.
- Verified ordinary and flattened success messages, native checkbox label, keyboard upload, and 320px no-overflow checks.
- PASS: runtime-owner unit test 1/1, changed-JS syntax, diff whitespace and no deletions. The first unit-test attempt could not spawn under the sandbox (EPERM); the permitted rerun passed.
- Evidence: ../evidence/sw-form-filler-status-followup/ in the isolated worktree parent. Earlier evidence remains preserved.

No full build, push, deploy, frozen-candidate edit, image edit, math/feature change, or generated registry change. Prior localization/hreflang checks from the first commit remain applicable to unchanged localized page and lexicon outputs; they were not repeated for this runtime-only follow-up.
