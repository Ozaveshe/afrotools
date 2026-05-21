# CV Builder ATS Plain PDF Parser Fix

Date: 2026-05-21
Route: `/tools/cv-builder/`
Local smoke URL: `http://127.0.0.1:4317/tools/cv-builder/`

## Summary

ATS Plain PDF export now produces a real, one-column, selectable-text PDF that the repo's `pdf-parse` dependency can read directly. Normal designed PDF export was smoke-tested in the same browser run and still downloads successfully.

## Root Cause

The previous ATS Plain PDF route used jsPDF for a very small text PDF. The file downloaded, opened, and contained text, but the repo's default `pdf-parse` path could throw `bad XRef entry` when reading that small PDF from `fs.readFileSync()` as a Node `Buffer`. The failure was reproducible with a minimal jsPDF text PDF, while larger designed image PDFs parsed for page count.

The practical risk was that parser-based ATS, recruiter, or QA systems could reject the ATS Plain PDF even though the browser download appeared successful.

## Change Made

Changed only the ATS Plain PDF path:

- Added `tools/cv-builder/js/cv-ats-plain-pdf-fix.js`
- Wired it from `tools/cv-builder/index.html`
- Left the normal visual PDF export, CV data model, template registry, and 8 visual templates unchanged
- Added `scripts/verify-cv-ats-plain-pdf.js` for browser export plus parser verification

The new ATS Plain PDF writer:

- Generates a real `application/pdf` Blob
- Uses a simple PDF 1.4 structure with a conventional xref table
- Uses standard Helvetica / Helvetica-Bold fonts
- Uses one-column text only
- Avoids images, columns, icons, graphics, and CSS conversion
- Preserves the existing filename pattern through `CVExportUpgrade.filename("pdf", "ATS")`
- Includes parser-safe metadata padding so the downloaded PDF is large enough to avoid the small-Buffer XRef edge seen in `pdf-parse`

## Before / After Parser Result

| Check | Before | After |
| --- | --- | --- |
| ATS Plain PDF download | Pass | Pass |
| `pdf-parse` default parser | Failed with `bad XRef entry` in the real-user QA sample | Pass |
| Extracted candidate name | Not available due parser failure | `Parser Candidate` |
| Extracted email | Not available due parser failure | `parser.candidate@example.com` |
| Extracted section headings | Not available due parser failure | `PROFESSIONAL SUMMARY`, `EDUCATION`, `SKILLS` |
| Normal designed PDF export | Pass before | Pass after |

Machine-readable proof:

- `audit-results/cv-builder-ats-plain-pdf-fix/parser-check.json`

Generated files:

- `audit-results/cv-builder-ats-plain-pdf-fix/Parser-Candidate-CV-Data-Analyst-ATS.pdf`
- `audit-results/cv-builder-ats-plain-pdf-fix/Parser-Candidate-CV-Data-Analyst.pdf`
- `audit-results/cv-builder-ats-plain-pdf-fix/mobile-390x844-export-smoke.png`

## Extracted Text Sample Summary

Parser extracted:

- Candidate: Parser Candidate
- Email: parser.candidate@example.com
- Role: Data Analyst
- Sections: Professional Summary, Work Experience, Education, Skills, Certifications, Languages

Full CV text is not repeated here to avoid turning the audit report into a duplicate CV artifact.

## Browser / Mobile Smoke

The targeted verifier:

- Loaded `/tools/cv-builder/`
- Populated a CV through `CVApp`
- Exported ATS Plain PDF
- Parsed the downloaded PDF with `pdf-parse`
- Exported a normal designed PDF as a regression check
- Opened the route at `390 x 844`
- Checked export controls are visible
- Checked horizontal overflow is `0`
- Recorded no console errors

## Validation

| Command | Result |
| --- | --- |
| `node --check tools/cv-builder/js/cv-ats-plain-pdf-fix.js` | Pass |
| `node --check scripts/verify-cv-ats-plain-pdf.js` | Pass |
| `node scripts/verify-cv-ats-plain-pdf.js` | Pass |
| `git diff --check` | Pass |
| `npm run test:cv-template-registry` | Pass |
| `npm run pdf:verify` | Pass |
| `npm test` | Pass |
| `npm run build` | Pass |
| Post-build `node scripts/verify-cv-ats-plain-pdf.js` | Pass |

`npm test` and `npm run build` still print the existing repo-wide content-review and automation-evidence warnings, but both commands exited successfully and no CV-specific failure remained.

## Remaining Risk

No ATS Plain PDF blocker remains for controlled ad testing. A live-domain smoke after deployment is still recommended because this verification used a local static server.
