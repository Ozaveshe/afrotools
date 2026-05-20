# CV Builder Template and PDF Export Audit

Audit date: 2026-05-20
Route: `/tools/cv-builder/`
Local test URL: `http://127.0.0.1:4176/tools/cv-builder/`
Scope: audit only. No template, CV data, ATS, save, or export logic was rebuilt.

## Executive Verdict

The "22 real templates" claim is numerically true in the current source and runtime: the gallery metadata lists 22 templates, `CVTemplates` exposes 22 renderer functions, and all 22 tested templates rendered a preview and downloaded a PDF.

The claim is not yet product-safe if users interpret it as "22 premium PDF-ready templates." All 22 export, but the export pipeline still has systemic quality problems. In the smoke audit:

- Claimed template count: 22.
- Gallery metadata count: 22.
- Runtime renderer count: 22.
- Default Nigeria/current-country visible selector count: 14.
- Preview-affecting template count: 22.
- PDF-download-capable count: 22.
- Smoke PDF-ready count, using no export failure, no obvious overflow, and no mostly blank final page: 6 of 22.
- Premium/advertising-ready PDF template count: 0 of 22 until the raster export and pagination system are fixed.

## Evidence Paths

Evidence JSON:

- `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-evidence.json`

Screenshots:

- `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-screenshots\desktop-template-gallery.png`
- `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-screenshots\mobile-form.png`
- `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-screenshots\mobile-preview-export.png`
- Per-template preview screenshots: `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-screenshots\<template-id>-preview.png`

PDF samples:

- All 22 PDFs were exported to `C:\Users\Oza\Documents\afrotools\audit-results\cv-template-export-audit-pdfs\`.
- Required minimum of 3 sample PDFs exceeded: 22 sample PDFs were generated.

## Files and Systems Involved

- Page route: `tools/cv-builder/index.html`
- Core app, save/localStorage, preview render: `tools/cv-builder/js/cv-app.js`
- Base template metadata and country data: `tools/cv-builder/js/cv-data.js`
- Legacy template renderer functions: `tools/cv-builder/js/cv-templates.js`
- Studio template renderer functions: `tools/cv-builder/js/cv-template-studio.js`
- Template gallery and "22 real templates" UI: `tools/cv-builder/js/cv-template-gallery.js`
- Export options, print, plain text, JSON backup, older PDF export: `tools/cv-builder/js/cv-export-upgrade.js`
- Active PDF quality override: `tools/cv-builder/js/cv-export-pdf-quality.js`
- Core preview and print CSS: `tools/cv-builder/css/cv-builder.css`
- Export clone and print CSS: `tools/cv-builder/css/cv-export-upgrade.css`
- Studio template CSS: `tools/cv-builder/css/cv-template-studio.css`
- PDF libraries loaded by page: `/assets/vendor/html2canvas/html2canvas.min.js` and `/assets/vendor/jspdf/jspdf.umd.min.js`

## Template System Findings

The template system is partly data-driven and partly hardcoded. Gallery metadata is data-driven in `cv-template-gallery.js`, but the real template output is hardcoded renderer functions in `cv-templates.js` and `cv-template-studio.js`.

Actual registered templates:

1. `slate`
2. `ember`
3. `phantom`
4. `indigo`
5. `noir`
6. `stone`
7. `lagos`
8. `cape`
9. `nairobi`
10. `accra`
11. `cairo`
12. `abuja`
13. `kigali`
14. `panaf`
15. `franco`
16. `diaspora`
17. `boardroom`
18. `portfolio`
19. `systems`
20. `graduate`
21. `impact`
22. `global`

The first 16 are legacy renderer functions. The final 6 are studio renderer functions added by `cv-template-studio.js`.

No missing renderer IDs were found. All 22 affect preview because `CVApp.renderPreview()` calls the selected `CVTemplates[templateId]` renderer. All 22 affect PDF export because the active exporter clones `#cvpreview`.

## Export Pipeline Findings

The active PDF pipeline is not a semantic print/PDF renderer. It is a screenshot pipeline:

1. Clone `#cvpreview` into an off-screen `.cv-export-clone-wrap`.
2. Render the clone to a bitmap using `html2canvas`.
3. Slice the bitmap into pages using `jsPDF`.
4. Search backward near the page boundary for a mostly white row.
5. Add each slice as a JPEG image to the PDF.

This explains the current PDF quality ceiling:

- PDF text is rasterized, not selectable text.
- Page breaks are based on pixels, not CV sections.
- `break-inside` and page-break classes do not reliably control the final PDF pages because the final output is image slices.
- Preview, PDF, and print use different sizing/margin assumptions.
- The active PDF export uses 6 mm side margins and 8 mm top/bottom image placement inside A4.
- Print uses a separate new-window path with `@page size:A4;margin:10mm`.
- Core print CSS also has `@page size:A4;margin:0` and makes `#cvpreview` fixed at 210 mm.
- The active PDF override does not explicitly await `document.fonts.ready` before capture.

## Why Page 2 Becomes Mostly Blank

The exporter calculates page count from bitmap height. If a template renders just over one A4 page, the exporter must create a second page even when the remaining content is tiny. The current white-row heuristic only searches a narrow band near the proposed break and does not trim trailing blank area or compact the CV to one page.

Observed causes:

- Many templates render between 1.08 and 1.24 A4 heights, which creates a tiny second page.
- Studio templates enforce or inherit A4-like minimum heights, so small overflow becomes a full extra PDF page.
- Sidebar layouts with long skill pill groups increase vertical pressure.
- The algorithm has no "fit to one page if overflow is under X percent" logic.
- The algorithm has no semantic "move whole section to next page" logic.

## Template PDF Smoke Results

The final-page fill ratio is the measured slice height of the last exported PDF page divided by the available page slice height. A low value means the last page is mostly blank.

| Template | PDF pages | Last page fill | Preview height | Result |
| --- | ---: | ---: | ---: | --- |
| `phantom` | 1 | 1.00 | 841 px | Best current one-page result |
| `ember` | 2 | 0.50 | 1238 px | Usable two-page fill, still raster PDF |
| `cape` | 2 | 0.69 | 1414 px | Usable two-page fill, still raster PDF |
| `cairo` | 2 | 0.40 | 1184 px | Borderline usable two-page fill |
| `abuja` | 2 | 0.63 | 1377 px | Usable two-page fill, dense/government style |
| `global` | 2 | 0.42 | 1177 px | Borderline usable two-page fill |
| `indigo` | 2 | 0.36 | 1121 px | Weak short second page |
| `stone` | 2 | 0.35 | 1111 px | Weak short second page |
| `accra` | 2 | 0.32 | 1112 px | Weak short second page |
| `panaf` | 2 | 0.28 | 1081 px | Weak short second page |
| `diaspora` | 2 | 0.29 | 1088 px | Weak short second page |
| `graduate` | 2 | 0.27 | 1039 px | Weak short second page |
| `slate` | 2 | 0.21 | 1019 px | Mostly blank second page |
| `noir` | 2 | 0.09 | 923 px | Mostly blank second page |
| `lagos` | 2 | 0.21 | 1024 px | Mostly blank second page; one minor decorative overflow detected |
| `nairobi` | 2 | 0.21 | 1025 px | Mostly blank second page |
| `kigali` | 2 | 0.11 | 941 px | Mostly blank second page |
| `franco` | 2 | 0.15 | 941 px | Mostly blank second page |
| `boardroom` | 2 | 0.21 | 1021 px | Mostly blank second page |
| `portfolio` | 2 | 0.07 | 905 px | Mostly blank second page |
| `systems` | 2 | 0.13 | 936 px | Mostly blank second page |
| `impact` | 2 | 0.17 | 977 px | Mostly blank second page |

## Broken or Weak Templates

Export-failed templates: none.

Templates with mostly blank second pages:

- `slate`
- `noir`
- `lagos`
- `nairobi`
- `kigali`
- `franco`
- `boardroom`
- `portfolio`
- `systems`
- `impact`

Templates with weak short second pages:

- `indigo`
- `stone`
- `accra`
- `panaf`
- `diaspora`
- `graduate`

Templates with overflow or layout warning:

- `lagos` had one minor decorative overflow beyond the preview box during the audit.

Templates that exported without the blank-page problem in this sample:

- `phantom`
- `ember`
- `cape`
- `cairo`
- `abuja`
- `global`

Important: this is a smoke result using one representative filled CV. The blank-page problem is systemic, so different user content can move templates between categories.

## Duplicate and Color-Only Risk

No exact duplicate template ID or missing renderer was found.

However, the 22-template promise overstates the amount of layout variety. Several templates are variations inside the same structural family:

- `ember`, `indigo`, and `stone` are strongly color-led variations of a similar single-column section pattern.
- `slate`, `noir`, `lagos`, `nairobi`, `accra`, `franco`, and `kigali` are all sidebar/two-column family variants. They have real styling and country differences, but the PDF weaknesses are shared.
- `panaf`, `phantom`, `abuja`, and `global` are simpler ATS/formal family variants. They are more distinct than pure color swaps, but still need explicit one-page/two-page export rules.
- The 6 studio templates are the most visually distinct, but 5 of 6 produced a mostly blank or weak second page in this sample.

Recommendation: keep the 22 count only if the UI labels are tightened to distinguish "available templates" from "PDF-ready templates."

## Mobile Preview and Export Problems

Mobile preview/export uses the same desktop `#cvpreview` clone and export pipeline. That is good for PDF consistency but weak for mobile UX:

- The user does not get mobile-specific export guidance.
- The preview is hard to inspect at A4 scale on a narrow screen.
- Export status is tied to the same desktop-oriented toolbar patterns.
- Mobile screenshots are available at `audit-results/cv-template-export-audit-screenshots\mobile-form.png` and `audit-results/cv-template-export-audit-screenshots\mobile-preview-export.png`.

## Severity-Ranked Issues

### Critical

1. The active PDF export is a raster screenshot workflow, not a real document renderer.
   - Files: `tools/cv-builder/js/cv-export-pdf-quality.js`, `tools/cv-builder/js/cv-export-upgrade.js`
   - Risk: weak text quality, non-selectable text, poor ATS/plain-text trust, and poor page-break control.

2. Pagination is not section-aware.
   - Files: `tools/cv-builder/js/cv-export-pdf-quality.js`, `tools/cv-builder/css/cv-export-upgrade.css`
   - Risk: mostly blank page 2, awkward splits, and no reliable way for templates to declare page-break behavior.

### High

3. "22 real templates" is true by count but not by PDF readiness.
   - Files: `tools/cv-builder/js/cv-template-gallery.js`, `tools/cv-builder/js/cv-templates.js`, `tools/cv-builder/js/cv-template-studio.js`
   - Risk: ad copy can overpromise if users expect 22 premium export-ready layouts.

4. Preview/PDF/print parity is inconsistent.
   - Files: `tools/cv-builder/css/cv-builder.css`, `tools/cv-builder/css/cv-export-upgrade.css`, `tools/cv-builder/js/cv-export-upgrade.js`, `tools/cv-builder/js/cv-export-pdf-quality.js`
   - Risk: preview does not guarantee exact printed output.

### Medium

5. Several templates are visual variants of the same layout family.
   - Files: `tools/cv-builder/js/cv-templates.js`, `tools/cv-builder/js/cv-template-studio.js`
   - Risk: gallery quality feels inflated versus major resume builders.

6. Sidebar layouts can over-emphasize skill pills and personal details.
   - Files: `tools/cv-builder/js/cv-templates.js`, `tools/cv-builder/css/cv-template-studio.css`
   - Risk: right/left rails dominate space and push content into short second pages.

### Low

7. PDF library preloads produced browser warnings when not used immediately.
   - Files: `tools/cv-builder/index.html`
   - Risk: minor console noise and possible performance concern, not an export blocker.

## Recommended PR Sequence

1. Template truth and QA PR
   - Add a small automated template audit script that renders all template IDs, captures preview metrics, and records export page counts.
   - Add explicit template metadata: layout family, one-page/two-page intent, ATS-safe level, PDF-ready status.
   - Acceptance criteria: gallery count equals renderer count; unsupported templates cannot be claimed; PDF-ready badges come from real smoke evidence.

2. PDF engine PR
   - Replace or supplement raster slicing with a semantic export renderer.
   - At minimum, await fonts, trim trailing blank canvas, add "fit one page if overflow is small," and make page breaks section-aware.
   - Acceptance criteria: no mostly blank second page for representative sample CVs; text quality is visibly sharper; preview/PDF parity is documented.

3. Template hardening PR
   - Tune all 22 templates for A4 constraints.
   - Reduce oversized sidebar/pill pressure.
   - Add per-template compact modes and proper page-break hints.
   - Acceptance criteria: all 22 templates pass A4 preview smoke; no overflow; no low-contrast text; final page fill is acceptable for one-page and two-page scenarios.

4. Gallery honesty PR
   - Separate "Available" from "PDF-ready" and "ATS-safe."
   - Add warnings for creative/sidebar/photo templates.
   - Acceptance criteria: no template badge claims PDF readiness or ATS safety unless automated checks pass.

5. Mobile export UX PR
   - Add a mobile export review step with page count, filename, and template warnings.
   - Acceptance criteria: mobile user can preview, understand page count, and export without hunting through desktop controls.

## Validation Evidence

Commands run or planned for this audit:

- Local server: `npx.cmd --yes http-server C:\Users\Oza\Documents\afrotools -a 127.0.0.1 -p 4176 -c-1 --silent`
- Browser audit: Playwright/Chromium render pass across all 22 templates.
- PDF exports: 22 PDFs written to `audit-results/cv-template-export-audit-pdfs\`.
- Screenshot capture: 22 per-template previews plus gallery and mobile screenshots.
- `git diff --check` passed.
- `npm run pdf:verify` passed.
- `npm run audit` passed.
- `npm test` passed. It reported existing automation freshness warnings, but no failures.

There is no `lint` script in `package.json`.

Full `npm run build` was not run because this PR is audit-first and broad build scripts can rewrite generated site artifacts unrelated to the template/PDF audit. Run it in the implementation PR that changes export or template source.
