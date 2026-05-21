# PDF Workspace Live Ad-Readiness Smoke

Date: 2026-05-21
Live route: `https://afrotools.com/tools/pdf-workspace/`
Verdict: **Not ready**

## Summary

The live PDF Workspace core engine worked in the smoke: upload, text, image, highlight, signature, page reorder, rotate, extract, compress, watermark, visual redaction, and final download all completed. The final downloaded PDF parsed successfully and included the added text and watermark.

It is not ready for controlled ads yet because the live route still ships the long flat toolbar, not the responsive command-bar experience. On a normal laptop viewport, several controls are offscreen inside a horizontally scrolling toolbar. The live route also overclaims redaction as permanent and still has broad marketing copy that says "no sign-up required" and "convert between formats."

## Evidence Artifacts

- Raw result JSON: `audit-results/pdf-workspace-live-ad-readiness-smoke/live-smoke-results.json`
- Desktop screenshots:
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/desktop-after-upload.png`
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/desktop-final.png`
- Mobile screenshots:
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/mobile-after-upload.png`
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/mobile-final.png`
- Downloads:
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/extract-sample_extract.pdf`
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/compress-sample_compressed.pdf`
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/final-sample_edited.pdf`
  - `audit-results/pdf-workspace-live-ad-readiness-smoke/mobile-final-sample_edited.pdf`

## Desktop Workflow

| Test | Result | Notes |
| --- | --- | --- |
| Upload PDF | Pass | Uploaded `sample.pdf`; live app detected 4 pages. |
| Add text | Pass | Added `LIVE QA TEXT`; PDF bytes increased. |
| Add image | Pass | Added PNG image from `assets/img/categories/pdf-workspace.png`; PDF bytes increased. |
| Highlight | Pass | Highlight action completed. |
| Sign | Pass | Drew and applied a signature. |
| Reorder pages | Pass | Page order became `[3, 0, 1, 2]`. |
| Rotate page | Pass | Rotation state recorded page `3` at `90` degrees. |
| Extract pages | Pass | Downloaded `sample_extract.pdf`, 5641 bytes. |
| Compress | Pass | Downloaded `sample_compressed.pdf`, 6186 bytes. |
| Add watermark | Pass | Added `LIVE QA WATERMARK`. |
| Redact/cover content | Pass technically, copy issue | Black cover rectangle applied, but the UI calls it permanent redaction. |
| Download final PDF | Pass | Downloaded `sample_edited.pdf`, 7693 bytes. |
| Reopen/parse final PDF | Partial | Browser `file://` reopen triggered Chromium's PDF download behavior, but `pdf-parse` reopened it successfully. |

Parsed final PDF proof:

- Pages: 4
- Contains added text: yes
- Contains watermark text: yes
- Text sample included `LIVE QA TEXT` and `LIVE QA WATERMARK`.

## Mobile Workflow

| Test | Result | Notes |
| --- | --- | --- |
| Mobile upload | Pass | Uploaded the same sample PDF at 390x844. |
| Mobile edit | Pass with reachability concern | Added text successfully. The control is still in the horizontal top toolbar, not a true mobile tool sheet. |
| Mobile download | Pass | Downloaded `sample_edited.pdf`, 2128 bytes. |
| Mobile usability | Risky | Bottom bar exists, but it is zoom/download only; edit tools depend on the horizontally scrolling top toolbar. |

## Toolbar Responsiveness

Fail for ad-readiness.

- Laptop viewport `1366x768`: toolbar client width was `1366px`, but toolbar scroll width was `2151px`.
- Offscreen toolbar controls included Extract, Stamp, Redact, Crop, Protect, zoom out, and zoom in.
- Mobile viewport `390x844`: toolbar client width was `390px`, but toolbar scroll width was `676px`.
- Body-level horizontal overflow was false, but the toolbar itself requires horizontal scrolling. That is exactly the weak experience the responsive command system is supposed to fix.

## Console and Overflow

- Desktop console errors: none captured.
- Mobile console errors: none captured.
- Body horizontal overflow: false.
- Internal toolbar overflow: present on laptop and mobile.
- Debug/inspector UI: no debug labels like `Rect Transform`, `Raycast Target`, `Canvas Renderer`, or `Image Type` were visible.

## Privacy Copy

Pass, with one caveat.

- Live page clearly says files stay in the browser and emphasizes no upload/local processing.
- The live page also says "no sign-up required." That is not safe if downloads are gated for guests by the PDF account gate. In the smoke, a registered-user local auth path was used to exercise downloads.

## Unsupported Claims

Fail for ads until copy is corrected.

- Redaction modal says: "Draw a black rectangle to permanently redact content." The tested behavior is a black PDF rectangle overlay, not verified removal of underlying hidden text. It should say "cover content visually" unless true flattening/removal is shipped and verified.
- Public copy says "convert between formats," but the tested live workspace is not a general PDF converter.
- Public copy says "no sign-up required," which conflicts with the shared PDF download-gate strategy for generated downloads.

## Analytics Events

Partial.

- Google tag loaded: `G-D859CGF391`.
- `assets/js/lib/analytics.js` loaded.
- GA page-view request was observed.
- Data layer events observed: `config`, `gtm.dom`, `gtm.load`, and `gtm.linkClick` events for blob downloads.
- No explicit PDF workflow events were observed for upload, text, image, highlight, sign, reorder, rotate, extract, compress, watermark, or redaction. For ad optimization, add named events for the main funnel steps.

## Final Verdict

**Not ready**

Core PDF operations worked and the downloaded final PDF included edits, but the live route fails two acceptance criteria for ad-readiness:

- Toolbar is not responsive enough on laptop/mobile.
- Product copy overclaims permanent redaction and unsupported capabilities.

Ship the responsive command bar/mobile tool sheets and fix the redaction/conversion/sign-up copy before sending paid traffic.
