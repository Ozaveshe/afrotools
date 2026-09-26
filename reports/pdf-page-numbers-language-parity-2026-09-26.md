# PDF page numbering language and placement parity — 2026-09-26

## Changes

English `/tools/pdf-page-numbers/`, French `/fr/tools/numerotation-pdf/`, and Swahili `/sw/zana/namba-za-kurasa-pdf/` share the recovered readable runtime. French PDF labels use `Page 07 sur 4`; Swahili uses `Ukurasa 07 kati ya 4`. PDF, range, font and fit failures show native messages without raw parser errors. Primary PDF and ZIP exports work for guests. Dynamic results and user filenames are excluded from secondary translation.

The Swahili source generator repairs historical `page-of-jumla` and `number-of-jumla` option values to stable engine identifiers, plus odd/even and right/center labels. Placement fits the complete rotated font box inside the visible CropBox intersected with MediaBox, accounting for page rotation. Oversized text fails honestly. Preview renders the same stamped PDF representation as export.

Sources: `assets/js/pages/pdf-page-numbers.js`, its pair in `scripts/minify.js`, and the page-numbering row/repair map in `scripts/build-swahili-document-pdf-parity.js`. Generated: `tools/pdf-page-numbers/app.js` and the FR/SW pages. Existing routes and canonicals remain; no deleted files.

## Recovery provenance

Interrupted repair base: `94af89b783f2779dc3a8c2db5cf4e2d34b6c2641`. Observed `origin/main`: `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009`. No reset or main merge.

Historical readable `5ac8da46:tools/pdf-page-numbers/app.js`, minified with Terser `compress: { passes: 2 }`, equals baseline app.js byte-for-byte. SHA-256: `46bb8d93be9bb5c204db7d1a947c945c8c9fb216ead1167da408d02578694a80`. Behavior changes reviewed against that source.

## Validation

- PASS: final Playwright suite **9 tests in 1.6 minutes**, terminal exit 0. Chromium, local source server port 4268, default analytics behavior.
- Actual guest downloads: 12 workflow PDFs, 9 geometry PDFs and 3 ZIP archives. Both PDF members of every ZIP reopened and checked.
- Each locale: four-page original text retained; range 2-4 with odd-only subset stamps page 3; start 7, two-digit padding, custom prefix/suffix; native page-of-total, number/total, skip-first-page with alphabetic Z/AA continuation. Tested 320px layouts do not overflow.
- **36 rendered pages**: each locale, page rotations 0/90/180/270, CropBox (30,40,420,594), 72pt labels, top-left/+90, center/-45 and bottom-right/-90. Visible label pixels stay inside pages and requested regions. Original text and green fixture remain. Actual 90-degree page raster visually inspected.
- Every geometry export's first-page preview matches its exported PDF rendering pixel-for-pixel.
- All locales reject oversized text on 20x10pt pages, unsupported standard-font CJK text, invalid page range and invalid PDF without download.
- PASS: inject both historical malformed Swahili option values, run real generator and verify exact restoration of reviewed generated page.
- PASS: targeted FR/SW owner checks; syntax checks; whitespace check. No deletion diff.

Reproduce using `tests/e2e/pdf-page-numbers-language-parity.spec.js` with one worker and the repository static server. Synthetic PDF, PNG and JSON artifacts are private test outputs; not product files.

## Limits and release status

Source/browser evidence only. Coordinator must run combined build, publish artifact checks, security, CI and live verification. No push to main or deployment here.

Not exhaustive: all fonts/glyphs, nine positions, facing-page settings, large/encrypted/malformed variants, form/signature/accessibility preservation, every preset or every browser. Preview serializes a temporary PDF; large-file memory/performance is unmeasured. Unsupported standard-font characters are rejected rather than substituted. Full catalogue parity remains unverified.
