# PDF Repair: English, French and Swahili output parity

Date: 2026-09-26. Candidate base: `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009` (freshly fetched `origin/main`). Branch: `codex/pdf-repair-parity-20260926`. This is a separate next-batch candidate, not a deployment receipt.

## Confirmed defects and changes

- Raster recovery previously used the rendering-resolution viewport as the output page size. Balanced quality enlarged a 300×400-point page to 375×500 points. It now uses the scale-1 visible CropBox viewport for PDF dimensions, including displayed rotation, and applies quality only to image resolution. Image pages have normalized rotation/CropBox metadata; original hidden content outside the crop is not recovered.
- A repair started in normalization mode could finish and expose a vector PDF after the user switched to raster mode during file reading. Each run now snapshots files, mode, password and quality, and checks a source/settings revision before publishing. ZIP completion also checks the revision, report format and review checkbox. Obsolete work may finish privately; it cannot expose a stale download.
- The Swahili source owner now enables local guest PDF, ZIP, JSON and CSV downloads. Its generic integrity listener defers to this tool's native revision guards; otherwise switching JSON to CSV disabled the completed report permanently.
- Repair-owned statuses, diagnostics, progress, methods, review prompts and failure messages are native French/Swahili. User filenames remain unchanged. Engine logs are suppressed because the qpdf logger could expose raw heap dumps; parser errors become stable, native recovery guidance. JSON keys/status enums stay stable. Failed repairs offer a report and no PDF.
- ZIP member names are unique after sanitization, Unicode normalization and case folding. The JSON report records `outputFile`, linking every original record to its archive member.

## Source ownership

- `assets/js/pages/pdf-repair.js`: previously an unpaired minified runtime, now readable at its existing route. `scripts/minify.js` preserves unpaired source files; `scripts/build-dist.js` optimizes the deployed copy. No new bundle path or hand-edited minified counterpart.
- `assets/js/pages/sw-document-pdf-integrity.js`: repair-only exemption for native lifecycle handling; accessibility style ordering still runs.
- `scripts/build-swahili-document-pdf-parity.js`: guest contract and native static repair labels.
- `sw/zana/kurekebisha-pdf/index.html`: regenerated only through that owner with `--apps=pdf-repair --write --check`.
- `tests/e2e/pdf-repair-language-parity.spec.js`: synthetic output/lifecycle regressions.

## Verification

PASS: full focused Playwright suite, **12/12**, 1.8 minutes. After the final ZIP naming change, all **6 affected ZIP/cancellation tests** passed again in 54.8 seconds.

- Actual guest PDF downloads in all three locales: valid normalization and deliberately damaged `startxref`/EOF recovery retain all four page MediaBoxes, CropBoxes, rotations, selectable text and exact rendered pixels.
- Actual raster downloads at quality 1, 1.25 and 1.6, for 0/90/180/270-degree pages: visible physical dimensions unchanged; synthetic green content area within 100 pixels and center within one pixel of the source at scale 1. Raster exports correctly have no selectable text and display explicit loss warnings. Fifteen primary PDFs were reopened and 60 page PNGs saved.
- Actual ZIPs in each locale: seven independent synthetic contents survive identical names, case-only differences, sanitization collisions and repeated Chinese names. Every member is independently reopened and its unique text matched to the JSON report's original filename/outputFile mapping. CSV reports also download as a guest.
- Invalid synthetic input produces native failed reports without raw parser offsets or heap dumps and without a PDF download.
- Delayed file reads plus mode, quality, password or source changes; delayed PDF save; delayed ZIP completion: no obsolete output. Tests wait for actual operation completion rather than an assumed delay.
- Separate smoke of the Terser-minified candidate: Enter runs repair, Enter on an unreviewed download focuses its checkbox, Space confirms review, and Enter downloads an actual PDF in EN/FR/SW. All three result views have zero horizontal overflow at 320px.
- `node --check` for runtime, integrity owner and browser spec; Swahili owner `--apps=pdf-repair --check`; `git diff --check`; no file deletions. Terser output parsed successfully.

Private evidence: `C:/Users/Oza/.codex/worktrees/pdf-repair-audit-20260926/evidence/`. Original audit: `audit-results.json` and actual original exports. Fixed output: `test-output/`, `collision-test-output/`, `keyboard-minified-proof.json`, native result screenshots and keyboard-exported PDFs. Test server used port 4268 with canonical installed dependencies; all browser tests blocked nonlocal requests and used synthetic documents only.

## Limits and integration notes

- Raster recovery is intentionally image-only: selectable text, links, forms and accessibility tags are not preserved. It preserves the visible cropped page and orientation, not hidden off-crop content or original PDF page dictionaries.
- This bounded proof covers valid, damaged cross-reference/EOF and invalid synthetic documents, not every corruption or encrypted-PDF variant. It does not establish complete recovery of inaccessible content.
- The shared, automatically injected Swahili `Share as Image` button still has an English label; repair-owned controls/reports are native. Its sharing workflow was outside this repair scope.
- No rates, formulas, data freshness, canonical routes or analytics event names changed. No new network upload path, account gate or dependencies.
- Full build, broad release tests, production artifact audit and deployment were intentionally left to the coordinator after integration; this candidate did not change or deploy the frozen release.
