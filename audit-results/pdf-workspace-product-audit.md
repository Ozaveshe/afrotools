# PDF Workspace Product Audit

Date: 2026-05-21
Route: `/tools/pdf-workspace/`
Scope: audit only. No production behavior changed.

## Executive Verdict

PDF Workspace is a real client-side PDF app, not just a landing page. Upload, canvas preview, thumbnailing, page organization, overlay-style edits, password protection plumbing, gated downloads, and recent local browser saves are all present.

The main product gap is that it is not yet an Adobe-like command system. It is a long single-row toolbar with many modal commands. The current editing model is overlay and page-copy based, not true content editing. Existing PDF text cannot be edited. Redaction is the riskiest feature because it paints a black rectangle but does not remove underlying content.

## Routes And Files Found

- `tools/pdf-workspace/index.html`: the live route and main app. It contains inline CSS, HTML, and most runtime JS.
- `assets/js/components/tool-registry.js`: contains `id: 'pdf-workspace'`, `href: '/tools/pdf-workspace/'`, category `document-pdf`.
- `sitemap-tools.xml`: includes `https://afrotools.com/tools/pdf-workspace/`.
- `_redirects`: contains Swahili legacy redirects for `/sw/tools/pdf-workspace/`.
- `assets/img/tools/pdf-workspace.webp`: route image.
- `assets/vendor/pdfjs/pdf.min.js` and `assets/vendor/pdfjs/pdf.worker.min.js`: PDF rendering.
- `assets/vendor/pdf-lib/pdf-lib.min.js`: PDF modification/export.
- `assets/js/lib/qpdf-aes.js` plus `assets/vendor/qpdf/`: local QPDF WebAssembly password protection path.
- `assets/js/lib/pdf-download-gate.js`: shared account gate and fallback anchor download interception.
- `assets/js/lib/document-pdf-report-sync.js`: metadata-only PDF report trail sync.
- `assets/js/lib/save-state-classic.js`: recent-operation metadata storage.
- Related utilities exist but are not loaded directly by this route: `assets/js/lib/pdf-utils.js`, `assets/js/lib/pdf-lib-utils.js`.

## Feature Inventory

- Upload: single initial PDF upload through `#fileIn`.
- Add/merge: `#tbAdd` appends pages from one or more PDFs after the selected page.
- Preview: PDF.js renders the main page canvases.
- Thumbnails: PDF.js renders JPEG data URLs for each page into the left sidebar.
- Page operations: split, rearrange, delete page, rotate selected page, page numbers, extract pages, crop.
- Overlay operations: add text, signature, image, highlight rectangle, text watermark, text stamp, black rectangle redaction.
- Export: main edited PDF download, extracted PDF download, compressed/re-saved PDF download, split ZIP download, protected PDF download.
- Storage: downloaded PDFs can be stored locally in IndexedDB for "Recent PDF Operations"; metadata goes into localStorage through `SaveState`.
- Account gate: main download explicitly uses `<email-gate-modal>`; generated anchors are also intercepted by `pdf-download-gate.js`.

## What Works

- Local browser smoke loaded `/tools/pdf-workspace/`, uploaded `audit-results/pdf-lib-test.pdf`, opened the workspace, rendered one canvas, rendered one thumbnail, and loaded PDF.js, pdf-lib, and the QPDF wrapper.
- Desktop modal checks opened Split, Rearrange, Page Numbers, Compress, Text, Sign, Image, Highlight, Watermark, Extract, Stamp, Redact, Crop, and Protect.
- Browser console and page error capture were clean for the simple upload/render/modal pass at 1366, 1920, 2560, and 390px widths.
- `npm run automation:preflight` passed with 12 passes and 2 unrelated environment warnings.
- `node --check` passed for `assets/js/lib/qpdf-aes.js`, `assets/js/lib/pdf-download-gate.js`, and `assets/js/lib/document-pdf-report-sync.js`.

## Fake Or Incomplete

- "Compress PDF" is not true compression. It re-saves with pdf-lib options and may optimize object streams, but does not downsample images, remove hidden content, subset fonts, or give before/after size proof.
- "Redact" is not true redaction. It draws a black rectangle over the visible page. Underlying text, images, and metadata can remain extractable.
- "Complete suite" and SEO copy mention conversion between formats, but the workspace toolbar does not expose a format conversion command.
- "No limits" and "no file size limit" are misleading. The app has no hard coded limit, but memory, CPU, canvas, IndexedDB quota, and mobile browser limits are real constraints.
- Signature is visual only. It is not certificate-backed digital signing.
- Highlight is a colored rectangle, not a text-bound PDF annotation.
- There is no undo/redo, history stack, object selection, object movement, or persistent annotation layer.

## Toolbar And Responsive Issues

The toolbar is the largest product problem.

- At 1366px viewport: toolbar `clientWidth` was 1366px and `scrollWidth` was 2179px.
- At 1920px viewport: toolbar `clientWidth` was 1920px and `scrollWidth` was 2179px.
- At 2560px viewport: toolbar fit inside the viewport.
- At 390px mobile: toolbar `clientWidth` was 390px and `scrollWidth` was 676px.

The Download and Close buttons are fixed at the right for widths below 2400px. This keeps the primary action visible, but it means command discovery depends on horizontal scrolling. On mobile, labels are visually hidden and commands become icon-only without tooltips or a command menu. In the mobile smoke, Crop and Protect were off-screen from the initial toolbar position and Playwright could not click them without scrolling the toolbar.

## PDF Editing Limitations

Current text editing is overlay-only.

The app can draw new text on a page with `pdf-lib` using `drawText`. It does not parse existing page text into editable objects, does not map text runs back to visual coordinates for editing, does not rewrite existing content streams, and does not provide OCR correction. Existing PDF text cannot be selected, edited, deleted, reflowed, or replaced.

The object model is also missing. Text, signature, image, highlight, watermark, stamp, redaction, and crop operations are applied into fresh PDF bytes immediately. After applying, the object is no longer a selectable workspace object.

## Export And Download Issues

- Main edited download is gated explicitly through `email-gate-modal`.
- Other downloads rely on the shared anchor interception fallback in `pdf-download-gate.js`, because `dlB()` creates an `<a download>` and clicks it.
- `dlB()` always creates a Blob with `type: "application/pdf"`, so non-PDF exports must avoid it. Split ZIP correctly uses its own ZIP Blob path.
- Extract, compress, protect, and split do not explicitly dispatch `afro-pdf-generated`; metadata is mostly tied to gate and `pdfSaveOp` behavior.
- Split ZIP uses custom ZIP assembly and CRC code. It needs regression proof on multiple PDF parts before being treated as mature.
- Protect needs end-to-end verification that output opens only with the password and respects permissions in common readers.

## Mobile Issues

- Mobile can upload and render a PDF.
- A bottom bar exists for zoom, fit, page count, and download.
- The left thumbnail sidebar collapses to width 0 at 390px and can be toggled.
- The top toolbar still scrolls horizontally and has hidden text labels. There is no grouped command drawer.
- Drag and drop rearrangement is not a good mobile interaction.
- Numeric coordinate modals are difficult on mobile for placement-heavy tools such as text, image, highlight, signature, redaction, and crop.

## Performance Issues

- The full PDF is stored in memory as `pB`.
- PDF bytes are repeatedly copied with `pB.slice()`.
- PDF.js renders every thumbnail eagerly.
- Main preview renders every current page in sequence, not only visible pages.
- pdf-lib loads and serializes the full document for most operations.
- Applying an overlay rebuilds thumbnails and main preview.
- Large files and many-page PDFs can hit memory, CPU, canvas, and storage limits, especially on mobile.
- Recent operations can store downloaded PDF bytes in IndexedDB, which is useful but can hit browser quota for large files.

## Security And Privacy Issues

- Positive: source PDFs stay in the browser for the audited flow. No upload endpoint is used for PDF content.
- Positive: document-pdf report sync stores metadata only, not source PDFs or raw content.
- Risk: recent-operation resume stores downloaded PDF bytes locally in IndexedDB under `afrotools-pdf-workspace`. This should be disclosed clearly in the UI because "files never leave your browser" is true, but "browser keeps local copies after download" is also true.
- Risk: redaction is unsafe for sensitive documents because it does not remove underlying content.
- Risk: password-protect uses local QPDF WASM, but the protected output needs proof against real PDF readers.
- Risk: external Google Fonts and GA scripts still load on the page. They do not receive file bytes, but privacy copy should distinguish file privacy from general page analytics.

## Debug Or Inspector UI

No visible debug or inspector UI was found.

Evidence:

- Source search found no debug or inspector production UI in `tools/pdf-workspace/index.html`.
- Browser smoke found `debugLikeVisible: []` on desktop and mobile.
- There is a source comment, `Save/Share buttons - manual placement needed`, but it is not visible to users.

## Analytics Events

Current analytics are thin.

- Page loads GA config `G-D859CGF391`.
- `pdf-download-gate.js` sends `pdf_download_gate_passed` after a successful gate.
- Core analytics exposes events such as `tool_view`, `time_on_tool`, `feature_used`, and `pdf_download`, but this page does not clearly opt into them because the body does not have `tool-page`.
- No per-command analytics were found for upload, split, rearrange, rotate, compress, text, sign, image, highlight, watermark, extract, stamp, redact, crop, or protect.

## Error Handling

Most operations wrap async work in `try/catch` and show a toast. The global core bundle also has an error banner for uncaught errors.

Gaps:

- Errors are generic and often only say `Error: <message>`.
- No proactive warning for encrypted PDFs, huge files, many pages, or mobile low-memory conditions.
- No cancel button during thumbnail or full-page rendering.
- No recovery path when QPDF WASM fails to initialize.
- No validation for crop boxes before calling `setCropBox`.

## Large PDF Limitations

The current architecture is not ready for large PDFs as a premium workspace.

Expected stress points:

- Many pages: thumbnail generation and main render scale linearly and eagerly.
- Scanned PDFs: canvas rendering and re-saving can be slow and memory heavy.
- Large image PDFs: "compress" may not meaningfully reduce size.
- Mobile: canvas and memory limits can fail before useful errors appear.
- Storage: recent-operation IndexedDB copies can exceed quota.

## Recommended PR Sequence

1. Audit-safe toolbar PR: keep features unchanged, introduce a command registry, group actions into File, Organize, Edit, Review, Security, View, and Export, then replace the long horizontal row with compact groups and overflow menus.
2. Editing model PR: add a workspace object layer for newly added text, images, signatures, highlights, stamps, and redaction boxes. Support select, move, resize, delete, undo, and apply-on-export.
3. Redaction truth PR: rename current redaction to visual blackout or implement true content removal/rasterization with a clear warning and test proof.
4. Compression truth PR: separate "optimize PDF" from real compression, add before/after size reporting, and only claim compression when image/font/object reduction exists.
5. Large-PDF performance PR: lazy thumbnails, visible-page rendering, cancellation, page-count/file-size warnings, and low-memory mode.
6. Mobile command PR: add a bottom command drawer, tooltips/labels, touch-friendly page organization, and non-drag alternatives.
7. Export proof PR: add automated checks for edited PDF text extraction, split ZIP validity, protected PDF open-password behavior, and redaction leakage.
8. Analytics PR: track command usage and export outcomes without sending file content or sensitive text.

## Validation Run

- `npm run automation:preflight`: passed with browser support available; warnings were missing email provider and Netlify blob/site access, not blockers for local PDF browser smoke.
- `node --check assets/js/lib/qpdf-aes.js`
- `node --check assets/js/lib/pdf-download-gate.js`
- `node --check assets/js/lib/document-pdf-report-sync.js`
- Local Playwright smoke on `http://127.0.0.1:4182/tools/pdf-workspace/` at 1366, 1920, 2560, and 390px: upload/render/modal checks completed with no console errors or page errors.
