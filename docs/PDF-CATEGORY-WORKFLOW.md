# PDF Category Workflow

This workflow is the operating contract for AfroTools PDF and document builders.

## Product Flow

1. Keep processing local first. User files should remain in the browser unless a tool clearly says it uses a server API.
2. Let guests upload, configure, preview, and run the tool.
3. Require a free registered AfroTools account before any generated PDF-category output is downloaded.
4. Bypass the gate automatically for registered users detected through `AfroAuth`.
5. Keep the output private. The gate must not upload the generated file.
6. Provide a clear post-result action: download, save recipe or draft, export audit report, or open the next PDF workflow step.

## Download Gate Contract

All PDF-category tools must load:

```html
<email-gate-modal></email-gate-modal>
<script src="/assets/js/lib/pdf-download-gate.js?v=20260502" defer></script>
```

The legacy `auto-email-gate.js` email lead gate should not be used for PDF downloads. Email capture is not the same as registration.
For older tool bundles, `auto-email-gate.js` now acts only as a compatibility bridge into the shared account gate.

Direct download callbacks should use either API:

```js
window.AfroPdfDownloadGate.guard(function () {
  downloadPdf();
});
```

For async generators, prefer the promise API:

```js
var context = await window.AfroPdfDownloadGate.guardPromise({
  toolSlug: "ng-paye",
  toolName: "Nigeria PAYE Calculator",
  reportName: "April salary report"
});
if (!context) return;
downloadPdf();
```

or the compatibility element already used by many older tools:

```js
var gate = document.querySelector("email-gate-modal");
if (gate) gate.show(downloadPdf);
else downloadPdf();
```

The shared gate also intercepts generated `<a download>` clicks on PDF-category pages, including blob URLs created inside existing tools. That interception is a fallback, not a replacement for wrapping the main download action.

`assets/js/lib/pdf-template.js` is the shared jsPDF generator for lightweight reports. It must gate before saving, then dispatch `afro-pdf-generated` with metadata so category-specific workflow layers can save a local report record or signed-in workspace item. The gate captures account intent and report context only; it must not upload the generated file.

Non-PDF workflow exports that are derived from a generated report, such as Salary & PAYE handoff JSON briefs or audit packets, may call `guardPromise(...)` directly before creating the browser download. These exports should stay metadata-only unless a page-specific backend contract says otherwise.

## Category Workflow Layer

The `/document-pdf/` hub is a workflow surface, not only a grid of PDF tools. It loads:

- `assets/js/lib/document-pdf-report-sync.js`
- `assets/js/lib/document-pdf-workflow.js`
- `assets/css/document-pdf-workflow.css`

The public `/document-pdf/` category page should expose the planner and recommended route only. Do not auto-mount the saved plan/checklist readiness workspace on the public hub; detailed saved state belongs in the dashboard `PDF Workspace` tab or in explicit metadata-only exports.

The report-sync layer listens for `afro-pdf-gate-passed` and `afro-pdf-generated` on PDF-category tools. It saves metadata-only export trails under `afro_document_pdf_reports_v1` and, when a signed-in workspace is available, syncs the metadata as `item_type = 'document-pdf-report'`.

The category planner saves:

- Planner choice: `afro_document_pdf_plan_v1`
- Handoff briefs: `afro_document_pdf_handoff_briefs_v1`, workspace `item_type = 'document-pdf-handoff'`
- Reusable workflow recipes: `afro_document_pdf_recipes_v1`, workspace `item_type = 'document-pdf-recipe'`
- Readiness boards: `afro_document_pdf_readiness_v1`, workspace `item_type = 'document-pdf-readiness'`
- Audit packets: `afro_document_pdf_audit_packets_v1`, workspace `item_type = 'document-pdf-audit-packet'`

These records must remain metadata-only. Do not store source PDFs, generated PDF blobs, ZIP files, DOCX files, images, OCR text dumps, passwords, redacted content, or raw document contents in the category-level stores.

The planner should route users through the main workflow families:

- Clean, compress, protect
- Merge and organize pack
- Convert and publish
- Review, redact, sign
- Business document pack
- Career and meeting pack

Inter-category handoffs should stay explicit and route the user into a real destination:

- Dashboard workspace: `/dashboard/`
- Salary & PAYE: `/salary-tax/`
- AfroPayroll workspace: `/tools/afropayroll-os/workspace.html`
- Legal workflows: `/legal/`
- Trade packs: `/trade/`
- Image & Design: `/image-design/`

The dashboard should expose PDF reports, handoffs, reusable recipes, readiness boards, and audit packets in one `PDF Workspace` tab. Guest users can create all local workflow records on the device. Signed-in users can sync metadata through `AfroWorkspace` when available.

## Advanced Workflow Features

The category planner should not only recommend the next tool. It should help users repeat the same professional route safely:

- Smart workflow profile: show risk level, review focus, destination warning, next action, and free-vs-Pro implication for the selected route.
- Reusable recipe: save the selected workflow and destination as `document-pdf-recipe` with route steps, target metadata, plan tier, and profile metadata.
- Recipe export: export a metadata-only JSON recipe through the shared PDF account gate. The export must not include source files, file bytes, OCR text, passwords, or generated document contents.
- Dashboard continuity: show recipes in the `PDF Workspace` tab with route and destination actions.

Recipe limits:

- Guests and free accounts can keep one reusable recipe. Existing recipe updates stay allowed.
- Pro and Team accounts can keep unlimited reusable recipes.
- The Pro gate should explain that unlimited recipes are for repeated client, legal, payroll, business, and career packets.

## Competitor-Informed Gates

Reviewed on 2026-05-02 against the current public workflows for Adobe Acrobat, iLovePDF, and Smallpdf:

- Adobe separates anonymous use, free account use, and paid Acrobat plans around download/account gates, cloud storage, premium tools, OCR, redaction, comparison, e-signature, AI, and team workflows.
- iLovePDF keeps essential tools free, then sells premium for unlimited document processing, desktop/mobile access, digital signatures, custom workflows, regional processing, priority support, and AI credits.
- Smallpdf keeps a free tier with limited downloads/tasks and upgrades Pro/Team users into unlimited tools, downloads, OCR, strong compression, AI tools, mobile access, team billing, and access management.

AfroTools should use the same product principle without copying their cloud-heavy model:

- Let guests use core PDF tools and the category planner locally.
- Require the shared free account gate before generated PDF, ZIP, DOCX, JSON handoff, or audit packet downloads.
- Treat a registered free account as the baseline workspace: saved report trails, local planner, one reusable recipe, limited category handoffs, and limited audit packets.
- Treat Pro as the workflow layer: unlimited recipes, unlimited handoffs, unlimited audit packets, longer metadata history, batch lanes, OCR-heavy review, AI-heavy review, reusable workflows, and team-ready packet history.
- Keep source files local unless a page explicitly documents a server-backed flow.

Current category-level limits:

- Guests: run tools and plan locally. Downloads open the free account gate.
- Free account: downloads unlocked, 10 report trails visible in the category meter, 1 reusable recipe, 3 active category handoffs, 3 audit packet exports per month.
- Pro account: unlimited report trails, recipes, category handoffs, and audit packet exports. Pro also owns batch, AI-heavy, OCR-heavy, compare, redact, team, and reusable workflow lanes when those are elevated.
- Team or Business account: Pro rules plus team metadata, billing, access, and admin controls when the backend product layer exists.

The UI must show these gates before the user hits a hard stop. If a free user reaches a limit, show the Pro gate with a clear `Continue free` escape hatch and keep the non-export workflow usable.

Source URLs for future refresh:

- Adobe Acrobat pricing and plan comparison: `https://www.adobe.com/acrobat/pricing.html`
- Adobe online services free quota help: `https://helpx.adobe.com/uk/document-cloud/faq/try-acrobat-online-services.html`
- iLovePDF pricing: `https://www.ilovepdf.com/pricing`
- Smallpdf pricing: `https://smallpdf.com/pricing`

## Category Banner Prompt

Use this prompt for the Document & PDF category banner:

```text
Create a premium horizontal website banner for AfroTools Document & PDF Workspace. Show a secure browser-based PDF operations desk with merge, split, compress, OCR, convert, watermark, sign, redaction, and audit packet panels. Include clean document thumbnails, local privacy cues, African professional business context, blue, green, and gold accents, high-trust SaaS interface lighting, no readable text, no logos, no fake brand marks, wide 16:9 composition.
```

## QA Checklist

- Guest click on a PDF or ZIP result shows the account gate and does not download.
- Registered user click downloads without seeing the gate.
- Free account over the handoff or audit limit sees the Pro gate and can still continue with the free planner.
- Free account over the reusable recipe limit sees the Pro gate, while updating the existing recipe remains allowed.
- Pro or Team account sees unlimited workflow counters and does not hit category-level packet gates.
- The same tool still works when the download is generated by `pdf-lib`, `jsPDF`, a ZIP blob, or `PdfUtils.downloadBlob`.
- Merge and split tools are always tested because they cover both PDF and ZIP outputs.
- Run `node --check assets/js/lib/pdf-download-gate.js`.
- Run `node --check assets/js/lib/pdf-template.js`.
- Run `node --check assets/js/lib/document-pdf-report-sync.js`.
- Run `node --check assets/js/lib/document-pdf-workflow.js`.
- Run `npm run pdf:verify` to check category gate coverage, hub ItemList count, and workflow documentation.
- Run a browser smoke for one guest and one registered-user path.
- Run `npm run audit` after category wiring.

## Runtime Dependency Policy

- Prefer local runtime assets under `assets/vendor/` for PDF generation, rendering, compression, encryption, and ZIP export.
- Do not add new CDN-based PDF runtimes when a local vendor file already exists for the same library.
- Treat `npm run pdf:verify` warnings as a queue for future hardening, not as cosmetic output.
- OCR uses local Tesseract assets under `assets/vendor/tesseract/`: API script, worker script, all four v5 core variants, and the exposed language files `eng`, `fra`, `ara`, `swa`, and `por`.
- When adding a new OCR language option, add the matching `.traineddata.gz` file under `assets/vendor/tesseract/lang/` and update `scripts/verify-pdf-category-gate.js`.
