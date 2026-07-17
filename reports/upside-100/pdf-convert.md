# PDF Format Converter — Audit & Upside

- Tool: PDF Format Converter
- Live: https://afrotools.com/tools/pdf-convert/
- Source: `tools/pdf-convert/index.html`
- Reviewed: 2026-07-14

## What it does

Four in-browser conversion modes in one tool:

- **Word to PDF** — DOCX parsed via `mammoth`, rendered to PDF with `jsPDF` + `html2canvas`; page size (A4/Letter) and margin presets.
- **Excel to PDF** — XLSX/XLS/CSV parsed via `xlsx`, drawn as a styled `jsPDF` table (headers, zebra rows, auto-fit, orientation, font size, multi-sheet tabs).
- **PDF to Text** — selectable text extracted with `pdf.js`, per-page tabs, copy/download `.txt`.
- **PDF to Images** — pages rendered with `pdf.js` to canvas, exported as PNG/JPG in a ZIP via `JSZip`; scale + page-range control.

## Is conversion client-side / private?

**Yes — verified.** Every mode reads the file with `file.arrayBuffer()` and processes it entirely with vendored libraries loaded from `/assets/vendor/**` (mammoth, jspdf, xlsx, html2canvas, jszip, pdfjs). No `fetch`/`XHR`/form-post of file bytes exists anywhere in the page. Output blobs are created locally and saved via `URL.createObjectURL`. The "Client-side / No Upload / files never leave your device" claims are accurate.

Caveat worth noting (already disclosed in copy, not a privacy defect): PDF-category downloads pass through a shared **email/account gate** (`AfroPdfDownloadGate` / `email-gate-modal`, `assets/js/lib/pdf-download-gate.js`). The gate collects an email before download but does **not** upload the file — the SEO copy states this. This is a UX friction competitors don't impose.

## Competitors & gaps

Vs Smallpdf / iLovePDF (mostly server-side):

- **Differentiator:** true client-side privacy; no server upload. Smallpdf/iLovePDF upload files to their servers.
- **Coverage gaps:** no reverse conversion (PDF→Word/Excel/PPT), no Image→PDF, no PPT→PDF, no OCR here (AfroTools has a separate PDF OCR tool + PDF Editor/Merge-Split/Compress/Workspace tools, cross-linked in Related Tools).
- **Batch:** single file per run only; competitors allow batch/queue.
- **Fidelity:** Word→PDF fidelity is best-effort (html2canvas raster path); complex layouts/fonts/floated images degrade — honestly disclosed in copy.

## SEO

- **Title:** keyword + intent, good — "PDF Converter Online Free | Word, Excel, Text, Images | AfroTools".
- **Meta description:** ~155 chars, in range, accurate. Left as-is.
- **H1:** was generic "PDF Converter" → changed to "Free PDF Converter" (single unique H1, aligned with title intent).
- **JSON-LD:** WebApplication + BreadcrumbList valid. **FAQPage was defective** — only 4 questions and answer text that did not match the 6 visible FAQ items (rule: FAQPage must mirror visible FAQ). Rewritten to mirror all 6 visible Q&A verbatim.
- **Depth:** strong — per-mode explainer sections, tips, 6-item FAQ, related-tools SSR. Good passage-level citability.

## UX / a11y

- Upload→convert→download flow is clear per mode; progress bar + toasts for loading/error states; output-review checkbox gate before download.
- Mobile: single-column stacking at ≤768px, 44px touch targets, `touch-action:manipulation` throughout — solid at 375px.
- File inputs carry `aria-label`s. **Gap fixed:** FAQ accordions were click-only `<div>`s (no keyboard, no ARIA). Added `role="button"`, `tabindex="0"`, `aria-expanded` sync, and Enter/Space keyboard toggling via a progressive-enhancement block.

## Fixes applied 2026-07-14

1. **FAQPage JSON-LD** rewritten to mirror all 6 visible FAQ items with exact visible answer text (was 4 items, mismatched wording).
2. **H1** "PDF Converter" → "Free PDF Converter" (unique, keyword-aligned, keeps `<em>` brand styling).
3. **FAQ a11y** — accordions made keyboard-operable (Enter/Space) with `role=button` / `tabindex` / `aria-expanded`.
4. Verified all 3 JSON-LD blocks parse (node): WebApplication, FAQPage (6 items), BreadcrumbList.

### Deferred (not tool-local)

- Shared **email/account download gate** (`pdf-download-gate.js`) adds friction absent on Smallpdf/iLovePDF; product decision, not edited here.
- Reverse conversions (PDF→Word/Excel), Image→PDF, and batch mode are feature gaps — would need shared libs, out of surgical scope.
- Local-processing note already present and verified true; no new note needed.
- No shared-lib edits were required (core pdf logic untouched).
