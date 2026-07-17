# PDF Workspace Mobile and Tablet QA

Date: 2026-05-21
Route: `/tools/pdf-workspace/`
Source file: `tools/pdf-workspace/index.html`

## Scope

This pass focused on making the existing PDF Workspace usable on phone, tablet, laptop, and desktop viewports without rebuilding the PDF engine or changing export behavior. The QA smoke used the existing sample PDF at `audit-results/pdf-workspace-smoke/sample.pdf`.

## Changes Made

- Hid global floating UI while the full-screen PDF workspace is active:
  - `afro-site-assistant`
  - `#afro-cookie-consent`
- Kept the workspace-active body class in sync when a PDF opens, resets, or closes.
- Raised mobile and tablet touch targets for command buttons, sheet close, page drawer toggle, page operation buttons, property buttons, signature tabs, modal buttons, and inspector/form inputs.
- Lowered the mobile properties panel below command sheets and the bottom mode bar so it does not intercept tool taps.
- Stabilized the mobile signature pad to fit phone screens.
- Preserved existing PDF upload, preview, annotation, sign, organize, export, and download behavior.

## Evidence Artifacts

- Results JSON: `audit-results/pdf-workspace-mobile-tablet-qa/viewport-results.json`
- Screenshots:
  - `audit-results/pdf-workspace-mobile-tablet-qa/mobile-360x800.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/mobile-390x844.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/mobile-414x896.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/tablet-768x1024.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/tablet-landscape-1024x768.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/laptop-1366x768.png`
  - `audit-results/pdf-workspace-mobile-tablet-qa/desktop-1440x900.png`

## Viewport Results

| Viewport | Result | What was validated |
| --- | --- | --- |
| 360x800 | Pass | Uploaded PDF, opened Annotate sheet, applied highlight, opened Sign sheet, drew signature, downloaded edited PDF, opened page drawer, no overflow, no console errors. |
| 390x844 | Pass | Same mobile flow as above. Downloaded `sample_edited.pdf` successfully. |
| 414x896 | Pass | Same mobile flow as above. Bottom mode bar and tool sheets stayed reachable. |
| 768x1024 | Pass | Uploaded PDF, used top grouped toolbar for Organize and Edit, rotated page, added text overlay, opened export drawer through More, no overflow, no console errors. |
| 1024x768 | Pass | Uploaded PDF, organized and edited comfortably with desktop/tablet layout, opened export drawer, no overflow, no console errors. |
| 1366x768 | Pass | Laptop smoke for edit and export drawer, no toolbar overflow, no console errors. |
| 1440x900 | Pass | Desktop smoke for edit and export drawer, no toolbar overflow, no console errors. |

## Mobile UX Findings

- Bottom mode bar is available and usable on phone widths.
- Tool sheets open above the bottom mode bar and no longer sit behind the properties panel.
- Page thumbnail drawer opens from the mobile page toggle with a 44px touch target.
- Upload, annotate, signature, export drawer, and edited PDF download are reachable.
- Signature drawing is usable after constraining the canvas to the phone sheet width.
- Global cookie consent and assistant UI no longer block PDF workspace controls while a PDF is open.
- Preview zoom and pan remain available through the existing scroll/zoom system.

## Tablet UX Findings

- 768x1024 uses the grouped top toolbar and avoids horizontal overflow.
- 1024x768 has enough space for the left page rail and right properties area when an object is selected.
- Export remains reachable through the More menu and prominent Download button.
- Edit and organize actions are comfortable after raising command and inspector controls.

## Known Limitations

- Guest downloads intentionally open the shared PDF account gate. The successful download smoke used the registered-user local auth path, which matches the PDF category workflow.
- The 768x1024 portrait layout keeps the right properties panel constrained because available width is tight; the controls remain reachable without horizontal overflow.
- The browser smoke fulfilled local POST requests because `python -m http.server` cannot handle Netlify form/API POSTs. This prevents static-server-only 501 console noise and keeps the check focused on app-side browser errors.

## Validation

- Inline script parse for `tools/pdf-workspace/index.html`: pass, 4 inline scripts parsed.
- `git diff --check -- tools/pdf-workspace/index.html audit-results/pdf-workspace-mobile-tablet-qa.md`: pass. Git also printed the existing CRLF normalization warning for `tools/pdf-workspace/index.html`.
- `npm run pdf:verify`: pass.
- `npm test`: pass.
- Browser matrix smoke on `/tools/pdf-workspace/` at 360x800, 390x844, 414x896, 768x1024, 1024x768, 1366x768, and 1440x900: pass.
- Horizontal overflow check: pass on all target viewports.
- Console error check: pass on all target viewports after local POST fulfillment.
- Visible touch target check: pass on all target viewports.
