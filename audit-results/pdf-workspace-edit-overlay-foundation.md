# PDF Workspace overlay and page organization upgrade

Date: 2026-05-21

## Scope

- Target route: `/tools/pdf-workspace/`
- Source changed: `tools/pdf-workspace/index.html`
- Processing model remains browser-local.
- PDF.js still renders previews.
- pdf-lib still builds exported/downloaded PDFs.

## Editing foundation

- Added a normalized overlay layer per rendered page.
- Overlay objects stay separate from the original PDF until export.
- Export flattens supported overlay objects into the final PDF.
- Current editing is overlay editing, not true existing PDF text-object editing.

Supported overlay objects:

- Text box
- Image
- Signature
- Highlight
- Freehand draw
- Rectangle
- Circle
- Arrow
- Line
- Stamp
- Comment/note
- Watermark
- Whiteout cover for quick correction

Object controls:

- Select, move, resize, delete, duplicate
- Color, opacity, rotation, page, size/position
- Text font size, alignment, bold, italic
- Keyboard delete/backspace
- Ctrl/Cmd+Z and Ctrl/Cmd+Y for overlay undo/redo while an object is selected

## Honest Edit PDF mode

- Edit mode uses the copy "Add or cover text".
- Quick correction is labeled as "Cover existing content and place new text".
- The UI explicitly says this is overlay editing and not true PDF text-object editing.
- Common correction flow now works: add a white cover rectangle, place replacement text above it, move/resize before export.

## Page organization workspace

- Thumbnail sidebar has a sticky page header, selected-page count, and contextual operation toolbar.
- Click selects a page.
- Ctrl/Cmd-click toggles multi-select.
- Shift-click selects a range.
- Selected-page toolbar appears only when pages are selected.
- Sidebar thumbnails support drag/drop reorder.
- Selected pages can be rotated, duplicated, deleted with confirmation, extracted, split into a ZIP, or used as insert targets.
- Insert PDF supports before/after the selected page group.
- Page operations that do not rebuild the source PDF support undo/redo.
- Mobile uses a drawer-style thumbnail sidebar.

## Export behavior

- Download builds from current page order, selected page rotations, duplicated pages, and flattened overlays.
- Original uploaded bytes are not mutated by overlay edits until export.
- Operations that intentionally rebuild the working PDF, such as insert, crop, redaction, and page numbers, reset volatile overlay/page undo state after committing the new PDF bytes.

## Known limitations

- Existing PDF text is not edited in place.
- Existing text detection/coordinate selection is not enabled in this pass.
- Image crop handles are not implemented; images can be moved/resized.
- Inserted PDFs rebuild the working PDF, so page-operation undo history is cleared after insertion.
- Rotation is tracked per visible page position in the current workspace and is flattened on download.

## Browser smoke

Generated sample: `audit-results/pdf-workspace-smoke/sample.pdf`

Smoke results:

- Multi-select selected 2 pages.
- Duplicate increased page thumbnails from 4 to 6.
- Confirmed delete reduced thumbnails from 6 to 4.
- Quick correction created 2 overlay objects.
- Export build returned 4 pages and non-empty PDF bytes.
- Desktop horizontal overflow: false.
- Mobile drawer width after opening: 280px.
- Browser console errors: none.

## Validation

- Inline script syntax check: passed, 4 inline scripts parsed.
- `git diff --check`: passed.
- `npm run pdf:verify`: passed.
- `npm run build`: passed.
- `npm test`: passed after the build regenerated a related import-duty surface that had blocked the first link-check run.
- Browser smoke on `/tools/pdf-workspace/`: passed after build.

## Fill And Sign Follow-Up

Added in the next pass:

- Fill text field overlay.
- Checkbox overlay with checked/empty state.
- Date overlay.
- Initials overlay.
- Typed signature overlay.
- Drawn signature overlay.
- Uploaded PNG/JPG signature overlay.
- Optional local-only signature save.
- Clear saved signature control.

Privacy copy in the signature modal:

`Your signature stays in your browser unless you choose to save it. AfroTools does not upload it to a server.`

Fill-and-sign smoke results:

- Desktop fill text field, checkbox, date, initials, typed signature, uploaded signature, and drawn signature: passed.
- Local signature save opt-in: passed.
- Clear saved signature: passed.
- Mobile signature modal and draw pad: passed.
- Flattened export build: 1 page, 4,229 bytes, objects included field, checkbox, date, initials, typed signature, and image signatures.
- Browser console errors: none.

## Redaction And Protection Safety Follow-Up

Added in the redaction/protection safety pass:

- Redaction mode now uses honest labeling: `Cover content visually`.
- The old misleading permanent-redaction copy was removed.
- Redaction boxes are overlay objects that can be drawn directly on the PDF page, selected, moved, resized, duplicated, or deleted.
- The warning is visible before redaction work: `Redaction must permanently remove or flatten hidden text. Do not share sensitive documents until you verify the redacted PDF.`
- Redacted export now uses a security checklist before download.
- Redacted export offers a default flattened image-copy path. This is slower, but avoids carrying hidden selectable PDF text into the exported redacted copy.
- A non-flattened export remains available but is labeled as a visual cover workflow and warns that hidden text may remain.
- Metadata removal is offered where the browser PDF library supports it.
- Password protection now checks that the local QPDF encryption runtime is available before offering AES-256 encryption.
- Protect/encrypt can remove metadata before encryption when supported.

Redaction smoke results:

- Desktop redaction warning: passed.
- Draw redaction box on page: passed.
- Security checklist before export: passed.
- Flattened redacted export: passed, 4 pages, 63,629 bytes.
- Basic visual check found black redaction pixels in the exported flattened PDF.
- Mobile redaction warning via More menu: passed.
- Mobile horizontal overflow: false.
- Browser console errors: none.

## Export And Optimization Follow-Up

Added in the export workflow pass:

- The prominent Download action now opens a polished export drawer.
- The drawer shows before/after file size estimates when the browser can calculate them.
- Compression options are labeled:
  - High quality: preserves vector text/images and favors compatibility.
  - Balanced: uses modern PDF object streams and is recommended for normal sharing.
  - Small file: rasterizes pages to JPEG and warns that text will no longer be selectable.
- Edited PDF download remains available.
- Selected-page PDF download is available when pages are selected.
- Page export to PNG ZIP is implemented through the browser PDF renderer.
- Embedded-image extraction is explicitly labeled unsupported in this browser engine.
- Redacted copy and password-protected copy actions are surfaced from the drawer when applicable.
- Save to Vault is surfaced when the Vault component is available.
- The drawer lists what will be included and warns when overlays/redaction covers need flattening or verification.

Export smoke results:

- Export drawer opened from the prominent Download button: passed.
- Before/after size summary rendered: passed.
- Balanced compression download: passed.
- Edited PDF download: passed.
- Selected-page PDF download: passed.
- PNG ZIP page export: passed.
- Redacted-copy checklist path from export drawer: passed.
- Mobile export drawer: passed.
- Desktop and mobile horizontal overflow: false.
- Browser console errors: none.
