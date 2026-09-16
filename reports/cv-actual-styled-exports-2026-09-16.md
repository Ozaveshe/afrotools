# CV actual styled export review — 2026-09-16

## Scope and result

Isolated candidate at `C:/Users/Oza/.codex/worktrees/career-parity-20260916/afrotools`, served on `http://127.0.0.1:4216`. This is source-candidate evidence, not a production/build-artifact acceptance record.

| Fixture | EN | FR | SW | Total |
|---|---:|---:|---:|---:|
| All 30 advertised templates, complete form, 320px input viewport | 30 PDFs / 57 pages | 30 / 57 | 30 / 57 | 90 PDFs / 171 pages |
| Ten layout families, long experience and later sections | 10 PDFs / 34 pages | 10 / 34 | 10 / 34 | 30 PDFs / 102 pages |

Correction after the first visual review: three complete-form Nairobi PDFs placed a short final strip about 4.5mm below A4. The initial validity/width/contact-sheet review missed that crop. They have been superseded by two-page exports; original hashes remain in the matrix. All 120 selected PDFs (273 pages) now pass physical image-placement bounds, in addition to parsing, A4 MediaBox and capture-width checks. Every page was rendered with Poppler and reviewed in locale contact sheets. No remaining collapsed columns, invisible skill chips, clipped document width, or missing continuation page was observed in these fixtures. Long outputs reach 3–4 pages, including later education/reference/custom/service sections according to each layout's column order.

Exact enabled field markers were independently checked in all 90 pre-capture document DOMs (zero mismatches, including diaspora country-field exclusion). Raster PDF content was visually inspected; this is **not** a claim of selectable text or automated exact glyph extraction from styled PDFs. Actual selectable-text ATS and DOCX field assertions are separately recorded in the portable-export reports.

## Defects repaired during actual-output review

- `7274d4d6`: expanded paper grids resisted global mobile grid overrides; dark sidebar skill chips gained a dark foreground.
- `6d710345`: generic Swahili mobile main padding no longer alters nested CV document mains. Identical long Creative output now has 3 pages in all three locales, instead of 2 in SW due to reduced paper margins.
- `0f43c323`: ATS/DOCX respect project/reference switches and retain enabled project URLs.
- `d10df001`: portable supplemental fields and partial rows retained through shared model; explicit country and diaspora controls respected.
- `ed59bd0f`: native default headings for untitled custom sections.

## Evidence locations

All directories below are siblings of this worktree under `C:/Users/Oza/.codex/worktrees/career-parity-20260916/`:

- `cv-all-template-pdf-fixed-proof`: final EN/FR complete-form PDFs, DOM snapshots and locale sheets.
- `cv-sw-final-paper-proof`: final SW complete-form PDFs after padding fix; supersedes earlier SW copies.
- `cv-long-template-pdf-proof`: final EN/FR long PDFs and sheets.
- `cv-sw-long-final-paper-proof`: final SW long PDFs after padding fix.
- `cv-final-bounds-proof`: superseding Nairobi complete-form PDFs in all three locales; physical image transforms checked and new pages visually reviewed.
- Earlier `cv-all-template-pdf-proof` is an interrupted pre-fix investigation, not final evidence.

`cv-styled-export-matrix-2026-09-16.json` records the 120 selected artifacts and SHA256 hashes. EN/FR rendered paths were unchanged by subsequent portable-export helper additions and the SW-only padding fix. No claim is made that every earlier downloaded file came from one final full-build SHA.

## Focused automated proof

- `tests/e2e/cv-pdf-page-bounds.spec.js`: 3 PASS, actual Nairobi downloads with both pages inside A4. `tests/cv-raster-pdf-bounds.test.js`: 3 PASS, including negative/above-page transforms. Permanent collector now validates physical bounds.

- `tests/e2e/cv-expanded-pdf-layout.spec.js`: 3 PASS; actual downloads plus export-raster sidebar width and contrast.
- `tests/e2e/cv-creative-mobile-paper.spec.js`: 2 PASS; actual long SW PDFs at 320/390px, paper padding, 3 pages, width and mobile overflow.
- `tests/e2e/cv-pdf-photo-policy.spec.js`: 3 PASS ; 9 actual PDFs. Local PDFLib decodes embedded JPEG streams; red synthetic-photo pixels appear only with enabled photo and a supporting template. Lagos enabled/disabled and Pan-African Minimal unsupported policy checked in each locale.
- `tests/e2e/cv-portable-visibility.spec.js`: 3 PASS; 12 actual ATS/DOCX files.
- `tests/e2e/cv-portable-complete-fields.spec.js`: 3 PASS; 18 actual ATS/DOCX files, enabled/hidden/diaspora states, accents/native labels and synthetic request checks.
- Focused model/DOCX contracts: 15 PASS before the default-heading followup; the updated portable-model file then 6 PASS (including 3 new native default-heading cases).
- `npm run build:i18n:validate`:PASS; `git diff --check`:PASS.

Browser commands used `PORT=4216`, `AFROTOOLS_TEST_DISABLE_ANALYTICS=1`, Chromium and one worker. Traces/video/screenshots disabled for large gallery DOM tests. Actual PDF raster images are separately preserved above.

Reusable collector: `node tests/support/cv-styled-export-audit.js`; set `CV_PDF_AUDIT_BASE_URL`, `CV_PDF_AUDIT_OUTPUT`, and optionally `CV_PDF_AUDIT_LONG=1`. It is the preserved version of the executed isolated collectors, with added source manifest and failure exit checks. Contact sheets: set `POPPLER_PDFTOPPM` and run `python tests/support/cv-pdf-contact-sheets.py <evidence-directory>` (Pillow required).

## Explicit remaining limits

- This covers default comfortable styled export density. Compact/one-page optional hiding, manual break-before controls, browser print and arbitrary oversized/unbroken user content are not accepted by this matrix.
- Styled PDFs are raster documents; use ATS Plain for selectable text. Noto support is not universal Unicode shaping.
- DOCX content/ZIP proof does not establish Word/LibreOffice rendering fidelity.
- Prior JSON roundtrip/restore and actual editor/gallery selection evidence remains separate; these output runs use the actual export API with synthetic state, not 90 repeated UI selections.
- No push, deployment, production acceptance, or acceptance-ledger self-signoff.

## Later bounded mode/content candidates

Manual-break and one-page work has separate reports (`cv-manual-page-breaks-2026-09-16.md`, `cv-one-page-content-choice-2026-09-16.md`). A subsequent document-wrapping stylesheet repair has six styled and three print artifacts in `cv-long-unbroken-exports-2026-09-16.json`. The 120 artifacts above retain their recorded historical hashes; they are not relabeled as a fresh full sweep of that later stylesheet. Whole-CV acceptance remains open.
