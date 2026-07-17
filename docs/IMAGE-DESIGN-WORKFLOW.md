# Image & Design Workflow Layer

## Scope

The Image & Design category is a registry-backed section with 19 live tools under `/image-design/` and `/tools/<tool>/`.

The shared workflow layer is intentionally metadata-only. It helps users plan, check, save, and copy a short job brief, but it does not store source images or generated files.

## Shared Assets

- `assets/css/image-design-workflow.css`
- `assets/js/lib/image-design-workflow.js`

Load both assets on Image & Design tool pages that should receive the shared workflow desk and accessibility helpers.

## Category Hub State

The `/image-design/` hub keeps route, filter, and search state in `localStorage` under `afro_image_design_hub_state_v1`.

Hub state rules:

- URL parameters `q`, `filter`, and `route` override local state on load.
- Route cards save the selected workflow route before sending the user into the first tool.
- Filter and search changes update the URL with `history.replaceState` so the current view can be shared.
- Checklist progress is local-only metadata and is not added to the URL.
- A `storage` listener keeps the hub view in sync across open tabs on the same browser.

## Tool Families

- Optimize & convert: `image-compress`, `image-resize`, `image-format-convert`, `image-crop`, `image-filters`
- Documents & identity: `passport-photo`, `background-remover`, `image-to-text`, `qr-generator`
- Brand foundations: `logo-maker`, `colour-palette`, `color-picker`, `favicon-generator`
- Promotion & publishing: `social-card`, `thumbnail-maker`, `flyer-maker`, `certificate-maker`, `meme-generator`
- Batch & protection: `watermark-bulk`

## Accessibility Helpers

The shared script adds:

- a main landmark when legacy tool pages use `.tool-main` or `.workspace` instead of `<main>`
- a skip link to the tool body
- derived `aria-label` values for unlabeled visible controls when no explicit label exists
- keyboard activation for common drop zones and upload zones
- visible focus styles for the workflow panel and upload zones

These helpers are a category-wide baseline. If a specific tool has complex controls, fix the native labels in that tool page during its dedicated deep pass.

## Validation

Recommended checks after changing this workflow:

1. `node --check assets/js/lib/image-design-workflow.js`
2. Verify all Image & Design tool pages include both shared assets.
3. Smoke `/image-design/` and representative tools from each family in a browser.
4. Run `npm run audit` or the narrowest available tool audit before shipping broader changes.
