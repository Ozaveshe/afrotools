# CV short-grid print flow — 2026-09-16

## Repair

The short complete-form Nairobi fixture printed only its header on page1 because Chromium moved its whole main grid row to page2. Disabling avoidSplits did not fix it. The existing 595px-to-194mm paper scale is retained.

The print owner now measures a main grid against the A4 content height (281mm at the existing 8mm margins), normalized to the595px document. When that grid fits a fresh page but its containing document overflows the first page, a fitting semantic section crossing the usable bottom boundary receives an internal print break. This prevents the browser moving the whole grid below its header. Existing explicit manual breaks disable this automatic planning. Existing fitting-block avoidance is retained. No fields are removed or shortened.

Owners: `tools/cv-builder/js/cv-export-pdf-quality.js`, `tools/cv-builder/css/cv-export-polish.css`. This is print-only; styled raster PDF and saved CV data are unchanged.

## Evidence

Local server4216 in the isolated career-parity-20260916 tree.

- `playwright test tests/e2e/cv-short-print-family-layout.spec.js tests/e2e/cv-print-family-layout.spec.js --workers=1`: six locale/fixture cases PASS, run99579,5.1minutes. Actual60 PDFs /156pages (30short /51pages,30long /105pages).
- Ten families × EN/FR/SW × short/long: first work entry on page1, no blank pages, accented name and expected visible fields parsed, A4 text bounds and physical name scale checked. All60 long-fixture work paragraphs per document preserved.
- `playwright test tests/e2e/cv-manual-print-break.spec.js --workers=1`: three actual manual-print PDFs PASS, run34404. Explicit experience break stays on a later page; no automatic grid marker added.
-17node contracts PASS: model/section identities, fitting/oversized raster block avoidance and physical raster bounds.
- Source syntax and `git diff --check`: PASS.

All156pages rendered with Poppler; nine locale contact sheets visually reviewed. Detailed short Nairobi first page also inspected: body content now follows the header, with references on the continuation page. Sparse final pages can remain when they contain enabled content; no clipping is used to reduce page count.

Artifact hashes and explicitly LF-normalized source hashes: `cv-short-grid-print-final-2026-09-16.json`. PDFs/images remain in `C:/Users/Oza/.codex/worktrees/career-parity-20260916/cv-short-grid-final-proof`.

This supersedes the short-fixture layout finding in `cv-native-print-decoration-2026-09-16.md`. It is bounded Chromium print evidence for ten families and two fixtures, not acceptance of every template/mode/browser or a production deployment. Root owns integration and release checks.
