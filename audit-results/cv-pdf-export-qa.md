# CV Builder PDF Export QA

Generated: 2026-05-20

## Scope

Target route: `/tools/cv-builder/`

This pass focused on PDF pagination, print/export rules, density controls, ATS plain export, filename quality, and preview/export parity. It did not change CV data fields, save/autosave behavior, ATS scoring, or template registry semantics.

## Changes Verified

- Added consistent export rules for A4 raster PDF output: fixed 595px A4 preview capture, safe 6mm x 8mm PDF placement, white page background, print color adjustment, controlled section spacing, and compact print density hooks.
- Added page-break handling that trims blank canvas tails, searches for whitespace slice points, avoids splitting sensible sections, and scales near-overflow documents onto one A4 page instead of creating a thin mostly blank page 2.
- Added density controls:
  - Comfortable
  - Compact
  - One-page attempt
- One-page attempt can hide low-priority optional sections only after user confirmation. It does not mutate saved CV data.
- Added export options:
  - Download PDF
  - Print
  - Download ATS Plain PDF
  - ATS Plain Text preview
  - Download text version
  - JSON Backup
- Improved filename fallback:
  - Named CV: `Firstname-Lastname-CV-TargetRole.pdf`
  - Empty CV fallback: `AfroTools-CV.pdf`
- Updated toolbar copy from the unsupported 22-template claim to `8 export-ready templates`.

## Files Involved

- `tools/cv-builder/index.html`
- `tools/cv-builder/css/cv-export-polish.css`
- `tools/cv-builder/js/cv-export-upgrade.js`
- `tools/cv-builder/js/cv-export-pdf-quality.js`
- `tools/cv-builder/js/cv-export-pagination-fix.js`

## QA Evidence

Sample output folder:

`audit-results/cv-pdf-export-qa-samples/`

Evidence files:

- `audit-results/cv-pdf-export-qa-samples/evidence.json`
- `audit-results/cv-pdf-export-qa-samples/mobile-smoke.json`

| Scenario | Template | Density | PDF Pages | Screenshot | PDF |
|---|---:|---:|---:|---|---|
| Empty/minimal CV | ATS Classic | Comfortable | 1 | `audit-results/cv-pdf-export-qa-samples/empty-minimal-cv.png` | `audit-results/cv-pdf-export-qa-samples/empty-minimal-cv.pdf` |
| Graduate CV | Accra Graduate | Comfortable | 1 | `audit-results/cv-pdf-export-qa-samples/graduate-cv.png` | `audit-results/cv-pdf-export-qa-samples/graduate-cv.pdf` |
| Professional CV | Lagos Corporate | Comfortable | 1 | `audit-results/cv-pdf-export-qa-samples/professional-cv.png` | `audit-results/cv-pdf-export-qa-samples/professional-cv.pdf` |
| Executive CV | Cape Town Executive | Compact | 1 | `audit-results/cv-pdf-export-qa-samples/executive-cv.png` | `audit-results/cv-pdf-export-qa-samples/executive-cv.pdf` |
| Two-page CV | NGO Development | Comfortable | 2 | `audit-results/cv-pdf-export-qa-samples/two-page-cv.png` | `audit-results/cv-pdf-export-qa-samples/two-page-cv.pdf` |
| Long skills list | Nairobi Tech | Compact | 1 | `audit-results/cv-pdf-export-qa-samples/long-skills-list.png` | `audit-results/cv-pdf-export-qa-samples/long-skills-list.pdf` |
| Missing education | Diaspora International | Comfortable | 1 | `audit-results/cv-pdf-export-qa-samples/missing-education.png` | `audit-results/cv-pdf-export-qa-samples/missing-education.pdf` |
| Missing work experience | ATS Classic | Comfortable | 1 | `audit-results/cv-pdf-export-qa-samples/missing-work-experience.png` | `audit-results/cv-pdf-export-qa-samples/missing-work-experience.pdf` |
| ATS Plain PDF | ATS Plain | n/a | 1 | n/a | `audit-results/cv-pdf-export-qa-samples/ats-plain-pdf.pdf` |
| Mobile export smoke | ATS Classic | Compact | 1 | `audit-results/cv-pdf-export-qa-samples/mobile-export-state.png` | `audit-results/cv-pdf-export-qa-samples/mobile-export-smoke.pdf` |

## Result

- No ugly blank second page was reproduced in the QA sample set.
- No cut-off sections were found in generated samples.
- The deliberately long two-page CV exported as two pages with meaningful content distribution.
- Long skill lists no longer dominate the PDF through oversized pills in the compact export path.
- ATS Plain PDF exported as a simple one-column document with no photo, columns, sidebar, icons, or decorative template structure.
- Mobile export smoke generated a one-page PDF with no browser console errors.

## Notes

- PDF output remains raster-based for styled templates because the current builder exports the live HTML preview through `html2canvas` and `jsPDF`.
- The ATS Plain PDF path uses text rendering through `jsPDF`, which is cleaner for job portals and parsing.
- This pass adds a final pagination override script so the safer exporter wins without rewriting unrelated CV app logic.
