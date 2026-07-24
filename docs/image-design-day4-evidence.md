# Image & Design Day 4 evidence ledger

Branch: `codex/day4-image-design-20260725`

Base: `4544d89142efdbd1eeb67e5f4a30e5d1696f16b4`

Scope: English canonical free Image & Design tools only. Pro apps are excluded.

## Acceptance contract

Each app is reviewed independently for 320/360/375/768 layouts, 200% text reflow, manual and system dark mode, signed-out core functionality, invalid inputs, download MIME/dimensions/reopen, local-first privacy, object URL cleanup, accessibility, console/network errors, canonical/structured data, and search-facing copy. A shared-source change is accepted only after the affected app is re-run individually.

The browser reports a 29px document overflow at 320px and 200% text size from the shared navbar shadow DOM. Light-DOM app content is independently measured and must remain within the viewport. This inherited navbar item is not counted as an app defect in this lane.

## Hub

Status: accepted in commit `6500b67`.

- Fresh view now shows the 19 English apps instead of mixing all 78 localized instances.
- All/English/French/Swahili filters retain the 78/19/19/40 registry counts.
- The no-JavaScript directory exposes 78 unique direct routes.
- Runtime ItemList structured data now reconciles to 78 items; the former static count was 74.
- 320/360/375/768/1440 layout, manual/system dark mode, keyboard controls, console, links, audit, and SEO report were checked.

## App ledger

| # | App | Mobile and 200% | Dark | Function and failure path | Export proof | Privacy and lifecycle | SEO/a11y | Status |
|---:|---|---|---|---|---|---|---|---|
| 1 | Image Compressor | Light-DOM overflow 0 at 320/360/375/768 after title/preset/compare-label reflow fix | Manual + system: panel `#121f33`, title `#eef5ff`, 15.08:1 | Valid PNG batch completes; text file reports “No supported image files found.” | Signed-out direct WebP, 640x480, 5.7 KB, decoded and reopened | No image payload/filename in requests; delayed consent-denied analytics contains page metadata only; 2 URLs created/2 revoked after clear | 1 H1, main, canonical, valid JSON-LD, 0 unnamed controls, 0 undersized non-checkbox actions | Accepted |
| 2 | Image Resizer | Light-DOM overflow 0 at 320/360/375/768 after target-card reflow fix | Manual + system: 15.08:1 primary panel/title | Custom stretch workflow completes; text file rejected explicitly | Signed-out direct PNG, exact 320x240, 75.2 KB, reopened | No image payload/filename in requests; 2 URLs created/2 revoked after clear | Canonical + valid JSON-LD; 0 unnamed controls; 0 undersized actions | Accepted |
| 3 | QR Generator | Light-DOM overflow 0 at 320/360/375/768 after verification-status reflow fix | Manual + system panels use dark surfaces; workflow clutter retired | Text QR generates locally. Found and fixed a real defect: SVG button was a no-op because the canvas renderer never created an SVG node | Signed-out PNG 256x256 plus matrix-derived SVG with valid root/viewBox and quiet zone | Synthetic QR payload did not appear in any request; SVG object URL is revoked after download | Canonical + valid JSON-LD; 0 unnamed controls; 0 undersized actions | Accepted |
| 4 | Background Remover | Light-DOM overflow 0 at 320/360/375/768 after hero/status min-content fixes | Manual + system: 15.08:1 primary panel/title | Smart-edge removal and render complete; text file gives supported-format guidance | Signed-out direct PNG, 640x480, 285.4 KB, reopened | No image payload/filename in requests. Found and fixed export URL surviving navigation; pagehide now closes the lifecycle at 2 created/2 revoked | Canonical + valid JSON-LD; 0 unnamed controls; 0 undersized actions | Accepted |
| 5 | Passport Photo | Light-DOM overflow 0 at 320/360/375/768 after status reflow fix | Manual + system: 15.08:1 primary panel/title | South Africa preset renders; text file gives an explicit browser-supported-image error | Signed-out direct JPG 4x6 sheet, exact 1800x1200, 172.1 KB, reopened | No image payload/filename in requests; 2 URLs created/2 revoked on page lifecycle | Canonical + valid JSON-LD; 0 unnamed controls; 0 undersized actions; requirement caveat retained | Accepted |
| 6 | Image Crop | Light-DOM overflow 0 at 320/360/375/768 and 200% | Manual + system: 15.08:1 primary panel/title | Exact selection (100,60,320x240), resize, and PNG render complete; text file reports “Choose a valid image file.” | Signed-out direct PNG, exact 320x240, 86.0 KB, reopened | No payload/filename leak; 1 URL created/1 revoked on lifecycle | Canonical + valid JSON-LD; 0 unnamed controls; 0 undersized actions | Accepted |
| 7 | Color Picker | Light-DOM overflow 0 at 320/360/375/768 and 200% after card min-content fix | Manual + system dark panels accepted | HEX `#1D4ED8` correctly derives RGB/HSL/OKLCH/CMYK; palette and Tailwind exports work | Signed-out CSS and JavaScript downloads reopen with matching `text/css` and `text/javascript` blob MIME | No user-data request; 2 URLs created/2 immediately revoked | Title trimmed 68→50 chars; canonical + valid JSON-LD; 0 unnamed/undersized controls | Accepted |
| 8 | Favicon Generator | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 9 | Image to Text | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 10 | Meme Generator | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 11 | Logo Maker | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 12 | Image Filters | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 13 | Social Card | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 14 | Certificate Maker | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 15 | Flyer Maker | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 16 | Thumbnail Maker | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 17 | Bulk Watermark | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 18 | Image Format Converter | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 19 | Colour Palette | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## First-five browser receipts

- No console or page errors in the layout, dark, valid-input, invalid-input, or export runs.
- No primary image download opened a login, registration, paywall, or account modal while signed out.
- External requests during user actions were limited to consent-denied analytics page-view metadata; synthetic file names and QR payloads were absent.
- System-dark and manual-dark computed receipts match. Representative screenshots are in `artifacts/day4-image-design/after/` and are intentionally not product source.
- The generic “Image workflow desk” checklist panel is hidden for reviewed tools. It duplicated the tool workflow, pushed the primary task below the fold, and failed dark contrast.
