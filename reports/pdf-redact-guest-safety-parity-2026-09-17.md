# PDF redaction guest and stale-output repair

Patch: pdf-redact-guest-safety.patch. Six files. Based on frozen b027ff71. Fresh fetch origin/main bfca5b2763fc0dc12b267b152f738eb606752e47. Plain git apply --check passed against coordinator f57cda95; shared SW generator context rebased read-only onto its independent form-filler row. No coordinator mutations, checkout/dependencies, accounts, external uploads, push or deploy.

## Confirmed defects and changes
- SW account gate blocked download of an actually generated redacted PDF. Mark only pdf-redact sensitive:true through build-swahili-document-pdf-parity.js; scoped --write --apps=pdf-redact generation removes its gate and retains locale/integrity runtime contracts.
- Shared runtime retained a stale output and review checkbox after undo, add-box and clear-page. Invalidate download and review on those mutations and quality changes, disable stale download, guard export/download with current review state. Clear-all/load already reset result and now also reset review through that owner.
- Guest-local direct download replaces explicit legacy gate callback. No shared gate policy changes.
- Recover authentic readable owner into assets/js/pages/pdf-redact.js from git5ac8da46:tools/pdf-redact/app.js. Add exact scripts/minify.js pair to tools/pdf-redact/app.js. See scoped-runtime.diff for small behavioral diff against recovered source.

## Source recovery and generation
- Historical source and b027 minified runtime have byte-identical canonical output after two default Terser passes (recover.cjs). Current production options produce a semantically equivalent but differently inlined color-luminance helper; their byte outputs do NOT match each other (inspect-recovery.cjs). This difference is documented, not misreported as production-option byte equality.
- Candidate generated runtime uses current getEngineTerserOptions; actual scripts/minify.js --only=pdf-redact was executed in a private mapped-file harness, suppressing unrelated navbar generation. Output matches that owner. All writes mapped outside coordinator.
- SW generator executed with --write --apps=pdf-redact in mapped-file harness:1/1 selected contract PASS. Output changes only gate/config plus owner-normalized metadata ordering/cache query strings. Shared helper dictionaries not edited.

## Actual browser and artifact evidence
- Initial baseline EN/FR search redaction downloaded2-page synthetic PDFs. PDF.js extraction is empty on both pages; selected regions >97%black; public text visible and white background preserved. EN page1 raster viewed directly.
- Fresh baseline defect confirmation:3/3 PASS9.2s; EN/FR undo leaves download row on and review checked; SW download shows actual account modal. Baseline diagnostic tests not included in product patch.
- Candidate3/3 Chromium PASS21.6s. Each locale:2-page search redaction, actual guest PDF, extracted text empty, pixel redaction assertions/public ink preserved, undo invalidates download/review, unreviewed export blocked/focuses review, clear-all disables export, real pointer rectangle at390px, second actual PDF parsed and black pixel confirmed, quality edit invalidates old result, no POST requests/no account modal in tested flow.
- Artifacts: candidate-results/pdf-redact-guest-parity-{en/fr/sw}-*/ contains locale-redacted.pdf, locale-page1.png,page2.png,locale-manual-redacted.pdf. No real document data.
- Syntax check readable owner PASS. git apply --check PASS.

## Limits
- This intentionally rasterizes every page: selectable text/accessibility structure is lost across the exported file. Retained public content remains visible pixels, not searchable text.
- Verified default Helvetica text,2pages,normal rotation,all-page exact-term search, manual rectangle, balanced output. Rotated/cropped/encrypted PDFs, scans/OCR, complex glyphs, huge documents, pattern-search coverage and all quality settings are not certified by these fixtures.
- External network blocked in browser tests; no user accounts created, no real content uploaded. No whole-app acceptance or production proof.

## Coordinator integration
Applied candidate on15f3ca0a; regenerated actual minifier and scoped SWowner, both pass. Root actualsource browser session9859 passed3/3locale cases in23.0seconds, port4511, normalanalytics with external traffic blocked by test. Downloaded PDFs rendered/parsed; root visually inspected SWpage1 and confirmed visible public text/black selected region. Readable syntax anddiffchecks passed. Agent additional native review title/body assertions also applied; integrated rerun follows. No rebuilt-dist or production proof for this batch.

Integrated native-review regression session12932 passed3/3locale cases in23.9seconds with exact visible French/Swahili title and message assertions. Native wording review and rotated/cropped fixtures remain separate follow-up work.
