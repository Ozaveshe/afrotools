# Preserve uploaded document filenames — 26 September 2026

## Changed files and behavior

The Swahili compressor and redactor changed an uploaded synthetic filename `Upload PDF` to `Pakia PDF` through the general interface translator. The runtime now marks filename containers as user content. Compressor processing labels and warning messages already use native formatters; their mixed filename/status text is protected from a second translation. Redactor reset explicitly supplies the EN/FR/SW empty-file label.

Readable owners are `assets/js/pages/pdf-compress.js` and `assets/js/pages/pdf-redact.js`. The matching `tools/pdf-compress/app.js` and `tools/pdf-redact/app.js` were regenerated with scoped `scripts/minify.js --only=pages/<owner>.js`. Existing output-name sanitization, PDF processing, local guest downloads and metadata remain unchanged. No shared translator exemption or locale-page rewrite was added.

## Validation

- Root local synthetic upload probe reproduced both incorrect displayed filenames before editing and exact preserved filenames afterward.
- Independent source review found no new defect; four reviewed source/generated hashes remained identical throughout the review. In-memory Terser regeneration matched both apps byte-for-byte.
- Independent Chromium: 9/9 passed in45.1 seconds. All three locales retain exact single/batch names, native reading/warning text and reset states. Actual compressor PDF/ZIP downloads were independently parsed for document text, page counts and grayscale pixels. Redactor clear/reset preserves native labels and disables output.
- Adopted the same nine-case regression as `tests/e2e/pdf-upload-filename-preservation.spec.js`, replacing only the external absolute vendor import with its repository-relative equivalent. No product changes followed the passing browser run.
- Source/minified/spec syntax and whitespace checks passed. Full build and optimized-artifact validation are pending for this separate follow-up batch.

The first independent test run incorrectly expected spaces in download filenames; existing sanitization uses underscores. Expectations were corrected, with initial evidence retained. No export naming behavior changed to satisfy the test.

## Evidence and limits

Private independent review and per-case JSON are under `C:/Users/Oza/.codex/worktrees/sw-form-filler-vocabulary-20260926/evidence/filename-preservation-review*`. The reviewer initially inspected parent91147190 plus the four dirty files; later unrelated form/artwork/fixture commits advanced the coordinator to973e2791. The four tested hashes stayed unchanged.

Synthetic fixtures and blocked external requests only. No production access or analytics change. Redaction pixel behavior was unchanged and was not retested in this filename-only review. Large/malformed PDFs and arbitrary filename conventions remain outside this bounded proof. Full catalogue parity is not asserted.

Rollback: revert the scoped runtime changes and regenerate their app outputs. No storage migration or flag.
