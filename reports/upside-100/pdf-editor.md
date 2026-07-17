# PDF Editor — Audit (reports/upside-100)

- Live: https://afrotools.com/tools/pdf-editor/
- Source: `tools/pdf-editor/index.html` (single-file app, ~2,093 lines)
- Traffic: ~40k (highest-traffic tool — changes kept surgical, core PDF logic untouched)

## What it does
A full-screen, in-browser PDF annotation/editor. Upload a PDF (drag-drop or browse), then overlay: Text, Images (PNG/JPG/WebP, drag+resize), Shapes (rect/circle/line), Highlight, Freehand Draw, Eraser/Whiteout, typed Signature, and Stamps (Approved/Reviewed/Confidential/Draft/Paid/Void). Page thumbnails sidebar, zoom/fit, undo/redo (Ctrl+Z/Y), keyboard shortcuts, mobile bottom toolbar. Handles password-protected PDFs via a local unlock (qpdf-aes) then edits, and exports a flattened `*_edited.pdf`.

## Processing model — is it local? (VERIFIED)
YES, genuinely 100% client-side.
- `grep` for `fetch|XMLHttpRequest|FormData|.upload|supabase|/api/|netlify` in the file: **zero matches**.
- Rendering via local `pdf.js` (`/assets/vendor/pdfjs/pdf.min.js`), editing/export via local `pdf-lib` (`/assets/vendor/pdf-lib/pdf-lib.min.js`), password unlock via local `/assets/js/lib/qpdf-aes.js`. No remote endpoints.
- Export = `PdfUtils.downloadPdf(outBytes, name)` — an in-browser Blob download. File data never leaves the browser.
- Privacy is a real, defensible selling point. The existing trust bar ("your files never leave your browser — zero server uploads", line 273) and the "Privacy & Security" content section are accurate.
- Note: an optional shared `<email-gate-modal>` may gate the download click, but it does not upload the PDF; the file bytes stay client-side regardless.

## Competitors & gaps
Direct competitors: Smallpdf, iLovePDF, Sejda, PDFescape, Adobe Acrobat online.
- Strength vs competitors: true local processing (most cloud editors upload the file to a server) + no page/size caps + free. This is the core differentiator and is already messaged.
- Gaps vs leaders: cannot edit *existing* PDF text (overlay-only; competitors like Sejda/Acrobat do inline text edit) — this is clearly disclosed in the FAQ, which is the honest approach. No OCR, no form-field filling, no page reordering here (page ops live in the sibling PDF Workspace/Merge-Split tools, which are cross-linked). These are reasonable scope boundaries, not defects.

## SEO
- Title (line 7): `Edit PDF Online Free | Add Text, Sign, Draw, Highlight | AfroTools` — strong keyword + intent. Kept.
- Meta description (line 8): ~155 chars, feature-rich, in the 120–160 range. Kept.
- Canonical + hreflang (en/fr/sw/ha/x-default) present and correct.
- H1: exactly one (`Your PDF Editor`, line 280) containing the primary keyword; an SEO `<h2>Free Online PDF Editor</h2>` reinforces intent. Left as-is to avoid changing hero UX on the highest-traffic tool.
- Content depth: already strong — Features, Privacy, How to Use (6 steps), Keyboard Shortcuts grid, Supported File Types, and 10-item visible FAQ.
- **Defect found & fixed:** the `FAQPage` JSON-LD (line 21) contained 3 questions that did **not** match any of the 10 visible on-page FAQ items — a Google structured-data guideline violation (FAQ markup must mirror visible content) and a rich-result eligibility risk. Rewrote it to mirror 9 visible FAQ Q&As verbatim.
- `WebApplication` JSON-LD: `applicationCategory` = `UtilitiesApplication` (valid enum, appropriate). Kept. BreadcrumbList present and valid.

## UX / a11y
- Flow (upload → tool → edit → download) is clear, with empty-state hint, processing overlay, toast feedback, and a password-entry modal (proper `role="dialog"`, `aria-modal`, labelled). Good error handling on save/password.
- Mobile: responsive with a dedicated bottom toolbar and sidebar toggle; 44px touch targets; `100dvh`.
- **a11y defect found & fixed:** icon-only buttons `tbUndo`, `tbRedo`, `tbDL` (download — its text `<span>` is `display:none` on mobile, leaving no accessible name) and all 9 mobile-bar buttons (`mText`…`mUndo`) had only `title` attributes. Added explicit `aria-label`s. Most form inputs already had `aria-label`s.

## Fixes applied 2026-07-14
1. **FAQPage JSON-LD rewritten to mirror visible FAQ** (line 21). Replaced 3 non-matching questions with 9 verbatim on-page Q&As ("Can I edit the existing text…", "What image formats…", "Can I sign and stamp…", "Is there a file size limit?", "Are my files uploaded to a server?", "Does it work on mobile?", "Can I undo my changes?", "How do I add shapes with no fill?", "Does the editor modify the original PDF content?"). Restores Google FAQ rich-result eligibility.
2. **a11y labels added** to icon-only controls: `tbUndo` (Undo), `tbRedo` (Redo), `tbDL` (Download edited PDF), and mobile-bar `mText`/`mImage`/`mShape`/`mHighlight`/`mDraw`/`mEraser`/`mSign`/`mStamp`/`mUndo`.
3. Verified all 3 `ld+json` blocks parse via node — WebApplication, FAQPage, BreadcrumbList all valid.

### Not changed (deliberate)
- Title, meta description, canonical/hreflang, WebApplication schema — already correct.
- H1 left as `Your PDF Editor` (one unique keyword H1; changing hero copy on a 40k-traffic tool is a risky, low-upside edit).
- Trust/"files never leave your browser" note already present and verified true — no new note needed.
- No `HowTo` schema added: the page has a numbered "How to Use" list, but Google deprecated HowTo rich results (2023), so it would add markup with no rich-result value. Deferred.
- Core PDF logic, shared libs (`pdf.js`, `pdf-lib`, `qpdf-aes.js`, `pdf-utils.js`) untouched.

### Deferred / for owner
- Consider strengthening the H1 to a fuller keyword phrase if hero copy is ever A/B-tested.
- Feature gaps vs Sejda/Acrobat (inline existing-text edit, OCR, form-fill) are out of scope for a surgical pass.
