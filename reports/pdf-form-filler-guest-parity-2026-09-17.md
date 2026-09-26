# PDF form-filler guest export parity

## Identity and scope
Owned branch codex/pdf-form-filler-20260917 in existing pdf-image-parity-20260916 worktree; parent a27648bf66bc0aebf7b2f7fa7008a3181790d969 preserved on prior branch. Fresh fetched origin/main bfca5b2763fc0dc12b267b152f738eb606752e47. No new checkout or dependencies, no coordinator/canonical changes.

Frozen reference b027ff71 was applied through private git-show overlays of exactly3HTML files before browser baseline. Blob identities:
- tools/pdf-form-filler/index.html:9deb99a4562c40acec2f4e950a666d076e9e7114
- fr/tools/remplir-formulaire-pdf/index.html:0a59af49483900fa20ab16a78c62f53e6e7ebad7
- sw/zana/kujaza-fomu-pdf/index.html:49a11d6dd59d51de5f173bd33d7c43ca779fcd6b
Other assets came from the preserved owned tree; this is targeted frozen-page source proof, not a complete b027ff71 build/dist reproduction. EN/FR differences from parent were metadata/cache versions only.

## Reproduced behavior
Actual EN and FR guest editable/flattened PDF downloads passed. SW primary download opened a localized free-account registration dialog instead of downloading. No signup, login, email entry or lead submission performed. Synthetic two-page AcroForm only.

## Minimal source fix
Only the pdf-form-filler row in scripts/build-swahili-document-pdf-parity.js adds localFirstDownloads:true. No shared helper, other app row, validation, parsing or export implementation changed. Existing generator removes the gate element/script and emits downloadContract:local-guest. Reviewed docs/PDF-CATEGORY-WORKFLOW.md; its generic gate guidance does not override the explicit current task and AGENTS sensitive local-first export requirement for form values.

## Source versus generated handoff
This is intentionally a source/test/report-only commit: coordinator is combining adjacent generator-row candidates and regenerating. All three temporary page overlays/generated files restored after testing; no stale global metadata hashes shipped. Coordinator must run:
`node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-form-filler`
then targeted --check and browser tests. Tested generated SW blob55c74c56951cc4293f57305dcdac852fc1b194f1 preserved privately at sibling evidence/form-filler/sw-generated-candidate.html. Generated changes remove account gate and switch local-guest contract; no paid-feature change.

## Checks
Baseline4408:2PASS (EN/FR),1FAIL (SW actual registration dialog). Final4409: **3PASS**, one perlocale, with default analytics (AFROTOOLS_TEST_DISABLE_ANALYTICS removed), CI1 and shared NODE_PATH.
`node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-form-filler-guest-output.spec.js --project=chromium --workers=1`

Actual editable PDFs reopened with PDF-lib: two pages, exact accented text, checkbox true, dropdown Year1, selected Paper radio. Flattened output: zero remaining fields, both pages retained, PDF.js text contains expected entered text/choice and second-page marker. Actual flattened PDF rendered: accented text, checkmark, dropdown and selected radio visually reviewed.390px no horizontal overflow. Observed requests contain no fixture name/text or capture-lead request. Capture-lead interception was installed as an abort safeguard; none occurred. This is bounded local-export evidence, not universal privacy proof.

Targeted generator write/check passed before overlay restoration. git diff --check passed. No fullbuild/dist/production/deploy claim. No acceptance ledger edit.

Stable tiny artifacts in C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/form-filler/: sw-baseline-account-gate.png, filled-en/fr/sw.pdf and.png, sw-generated-candidate.html. Reviewed filled-sw.png and baseline dialog screenshot.

## Limits
No full form-filler acceptance. XFA, signatures, encrypted files, complex fonts, arbitraryUnicode, option-list multiselection, seeded radio clearing, invalid-field error reporting and full accessibility remain outside this bounded gate repair. Existing processing logic untouched. Review/validation controls retained.

## Coordinator integration proof
Source-only candidate8e6becd7 integrated as604828ac on codex/language-document-followup-20260917, based on db561f90. Targeted generator write/check passed; generated SW blob exactly matches55c74c56951cc4293f57305dcdac852fc1b194f1. No files were deleted by integration (older agent tree itself omits unrelated newer files, so only its scoped commit was cherry-picked).

Coordinator actual-source browser session26439 passed all3locale cases in17.3seconds on port4509 with normal analytics and a fresh server; editable/flattened output checks passed. This is source browser proof, not rebuilt-dist or production proof. Further form correctness fixes remain separate.
