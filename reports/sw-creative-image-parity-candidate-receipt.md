# Swahili Creative + Image & Design candidate receipt

- Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Exact denominator: **53** (**34 Creative**, **19 Image & Design**)
- Accepted candidates: **13**
- Blocked fail-closed: **40**
- Central acceptance ledger changed: **no**
- Verdict: **PARTIAL — FAIL CLOSED**

## Per-app result

- `image-compress` — accepted-candidate: English and Swahili 160x90 PNG output was byte-identical. Swahili PNG, JPG, WebP and auto-selected files reopened at 160x90; a 20 KB target JPEG reopened at 600x400 within target; Download all emitted two WebP files that reopened at exact 120x68 and 90x90 dimensions.
- `image-resize` — accepted-candidate: English and Swahili 60x40 PNG output was byte-identical. Direct PNG, JPG and WebP plus fit/fill/pad/stretch outputs reopened at exact dimensions; two files across custom and thumbnail targets produced four individually reopened files and four more reopened through Download all at 60x40 or 512x512.
- `qr-generator` — accepted-candidate: PNG reopened by signature/IHDR parser at exactly 256x256; SVG reopened as XML with a 1024x1024 vector canvas, quiet zone, exact colors and more than 100 QR module paths.
- `background-remover` — blocked-english-fallback: The route is an explicit preparation page that hands off to the English studio; no native remover workflow exists.
- `passport-photo` — accepted-candidate: Controlled English and Swahili single-photo PNG output was byte-identical at 413x531. All nine advertised PNG, JPG and WebP combinations reopened in the browser at exact single 413x531, 4x6-sheet 1800x1200 and A4 2480x3508 dimensions; the localized requirement brief retained exact preset dimensions, source URL and 300 DPI contract.
- `image-crop` — accepted-candidate: English and Swahili 64x48 PNG output was byte-identical. Swahili PNG, JPG and WebP downloads were each reopened by format parser at exactly 64x48; the localized clipboard recipe was also read back.
- `color-picker` — accepted-candidate: CSS variables and Tailwind JS were downloaded, reopened as text and parsed for five exact palette values.
- `favicon-generator` — accepted-candidate: Controlled English and Swahili text output was byte-identical. The ZIP parsed with exactly four PNGs, one ICO and one site.webmanifest; all PNGs and every ICO-embedded PNG reopened at 16, 32, 48 and 64 pixels, and the manifest referenced the exact four files.
- `image-to-text` — blocked-feature-parity: The route performs local OCR but does not reuse the English local OCR/studio owners or reproduce their source, language, clearing, and export contracts.
- `meme-generator` — blocked-missing-route: No physical Swahili route or native meme canvas/export owner exists on the coordinator base.
- `logo-maker` — blocked-feature-parity: The reduced inline canvas does not reproduce the English logo templates, editing surface, quality boundaries, and export contract.
- `image-filters` — accepted-candidate: English and Swahili 60x40 PNG output was byte-identical. Direct PNG, JPG and WebP reopened at exactly 60x40; a parsed two-source PNG ZIP manifest retained 120x80 source dimensions and every nested output reopened at 60x40; the clipboard recipe was read back.
- `social-card` — accepted-candidate: Controlled English and Swahili 1200x630 PNG output was byte-identical. Direct PNG, JPG and WebP reopened at 1200x630; the six-file platform set reopened at exact OG, LinkedIn, square, portrait, story and YouTube dimensions; OG metadata and handoff clipboard exports were parsed.
- `certificate-maker` — blocked-english-fallback: The route is an explicit preparation page that hands off to the English certificate workflow; no native PDF/image export owner exists.
- `flyer-maker` — blocked-feature-parity: The reduced inline canvas does not reuse flyer-maker-studio.js or reproduce the English templates, asset controls, exact dimensions, and export behavior.
- `thumbnail-maker` — accepted-candidate: Controlled English and Swahili 1280x720 PNG output was byte-identical. All 15 advertised size/format combinations reopened at exact 3840x2160, 1280x720, 1920x1080, 1080x1920 or 1080x1080 dimensions; all three A/B PNG variants and an uploaded background/subject/logo PNG reopened at 1280x720; localized upload brief, checklist and design-link exports were parsed.
- `watermark-bulk` — accepted-candidate: Current and two-file batch PNGs were downloaded and reopened by PNG signature/IHDR parser; source dimensions remained exactly 64x48 and 40x30.
- `image-format-convert` — accepted-candidate: English and Swahili 60x40 PNG output was byte-identical. Swahili PNG, JPG and WebP downloads reopened at exactly 60x40; unsupported AVIF stayed disabled; a two-source, three-format ZIP manifest parsed and all six nested files reopened at 60x40; copied picture markup was read back.
- `colour-palette` — accepted-candidate: Per-palette CSS, all-palette CSS and JSON downloads were reopened; JSON parsed to all 45 records and CSS parsed to all 225 colors.
- `afrostream` — blocked-parity-unproved: The English owner is a network-backed streaming hub. Route-specific fallback, freshness and no-network proof is not complete.
- `creator-analytics` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-bios` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-brand` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-calendar` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-canvas` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-captions` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-carousel` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-clip` — blocked-parity-unproved: Real-device capture and reopened codec proof is unavailable; acceptance fails closed.
- `creator-desk` — blocked-parity-unproved: The legacy Swahili route has no route-specific project-state and portable export oracle.
- `creator-hashtags` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-hooks` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-invoice` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-kit` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-mail` — blocked-parity-unproved: The legacy Swahili route has no reopened HTML/TXT newsletter export oracle.
- `creator-mind` — blocked-parity-unproved: The legacy Swahili route has no route-specific idea-generation and JSON/TXT export oracle.
- `creator-money` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-page` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-polish` — blocked-parity-unproved: The legacy Swahili route has no route-specific analysis and rewritten-text export oracle.
- `creator-pricing` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-record` — blocked-parity-unproved: Real-device capture and reopened codec proof is unavailable; acceptance fails closed.
- `creator-repurpose` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-resize` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-schedule` — blocked-parity-unproved: The legacy Swahili route has no route-specific calendar-state and parsed CSV/iCal oracle.
- `creator-scripts` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-split` — blocked-parity-unproved: The legacy Swahili route has no collaborator mutation, exact-total and parsed export oracle.
- `creator-stock` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-team` — blocked-parity-unproved: The legacy Swahili route has no task-state mutation and parsed CSV/JSON export oracle.
- `creator-thumb` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-titles` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `creator-voice` — blocked-parity-unproved: Real-device capture and reopened codec proof is unavailable; acceptance fails closed.
- `linkedin-optimizer` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `personal-brand-audit` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.
- `social-media-calendar` — blocked-parity-unproved: The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.

## Product and source decisions

- Color tools are owned by scripts/build-sw-image-color-family.js and preserve the English conversion formula and 45-palette dataset verbatim.
- Watermark Bulk retains the English local FileReader/Image/HTML-canvas PNG engine and full-resolution dimensions; only Swahili UI, status and accessibility wiring changed.
- Image Crop now loads the maintained English image-crop-studio.js owner directly; a bounded Swahili adapter localizes dynamic status and clipboard output without changing crop or codec calculations.
- Image Compress now loads the byte-exact extracted English image-compress-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, queue and history without changing batch, target-size, resize, codec, comparison, filename or download calculations.
- Image Format Convert now loads the maintained English image-format-convert-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, guidance and history without changing codec, sizing, manifest or export calculations.
- Image Filters is generated from the English studio DOM contract and loads the maintained image-filters-studio.js owner; translation is limited to text nodes and accessible labels so DOM identifiers and pixel/export semantics cannot drift.
- Image Resize now loads the maintained English image-resize-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, queue, preview and history without changing resize geometry, codec or export calculations.
- The English color-picker owner was repaired so invalid HEX clears stale derived values and disables exports in both locales.
- QR now uses its committed local runtime plus a shared DOM-free English/Swahili payload engine; OCR dependencies are local but that row remains blocked because local dependencies alone do not prove product parity.
- Social Card is generated from the English studio workspace contract and loads social-card-studio.js; a shared CSS repair constrains hidden file inputs so both English and Swahili reflow at 320px without changing canvas or export semantics.
- Passport Photo is generated from the English studio workspace contract and loads passport-photo-studio.js; the shared engine remains the sole owner of country presets, source-confidence notes, crop geometry, 300 DPI sheets and codec output.
- Thumbnail Maker is generated from the English studio DOM contract and loads thumbnail-maker-studio.js; the shared engine remains the sole owner of five output sizes, layouts, readiness, local assets, hook variants, brand state and PNG/JPEG/WebP exports.
- Favicon Generator is generated from the English studio DOM contract and loads favicon-generator-studio.js; the shared engine owns local image/text rendering, four PNG sizes, multi-image ICO construction, site.webmanifest and ZIP output.
- Real-device capture/codec rows creator-clip, creator-record and creator-voice remain blocked without actual device output and reopen proof.

## Browser and export proof

- Chromium, one worker, isolated ports 4398, 4401, 4404, 4405, 4406, 4407, 4408, 4409, 4410 and 4411: **33 passed**. Widths 320/375 and 200% reflow equivalent were checked with light/dark, keyboard/focus, contrast, SEO metadata, console/page/resource errors and network-write assertions.
- Color Picker downloads reopened as CSS and Tailwind JS; Colour Palette downloads reopened as CSS and parsed JSON; Image Compress reopened PNG, JPG, WebP, auto-selected, target-size and two Download all outputs at exact dimensions and matched English PNG bytes; English and Swahili QR downloads reopened as 256x256 PNG and parsed 1024x1024 SVG; Image Crop reopened PNG, JPG and WebP at exact dimensions and matched English PNG bytes; Image Filters reopened direct PNG, JPG and WebP plus every file in its parsed two-image ZIP and matched English PNG bytes; Image Format Convert reopened direct PNG, JPG and WebP plus all six files in its parsed batch ZIP at exact dimensions and matched English PNG bytes; Image Resize reopened direct PNG, JPG and WebP plus fit/fill/pad/stretch and every multi-file multi-target output at exact dimensions and matched English PNG bytes; Social Card reopened PNG, JPG and WebP plus all six exact platform dimensions and matched controlled English PNG bytes; Passport Photo reopened all nine PNG, JPG and WebP single, 4x6-sheet and A4 outputs at exact dimensions and matched controlled English single-photo PNG bytes; Thumbnail Maker reopened all 15 direct size/format outputs, three A/B variants and the local-asset output at exact dimensions and matched controlled English PNG bytes; Watermark Bulk downloads reopened as PNG and retained exact source dimensions 64x48 and 40x30.
- Synthetic data only. Accepted candidates remained local-only with analytics declined and no raw-input fetch/XHR/WebSocket/non-GET request.

## Validation gates

- PASS: thumbnail static oracle; thumbnail Chromium (3 tests, one worker, port 4411); hreflang (33,418 relationships / 5,351 groups); links (138,265 / 11,510 HTML files); registry audit; lint; type-check; privacy/AI consent.
- OWNERSHIP BOUNDARY: `build:i18n:validate` reports stale coordinator-owned locale coverage artifacts after the new physical route. This lane is prohibited from regenerating them; the coordinator must regenerate and rerun the gate after integration.
- Carried audit debt: the two unrelated missing-page rows remain `job-offer-evaluator` and `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`.
- Reciprocal metadata-only edits: `tools/thumbnail-maker/index.html` and `fr/tools/createur-miniatures/index.html`.

## Artwork

- Present: **53/53**
- Missing queue: **0**

## Boundary and baseline debt

The 40 blocked rows were unaccepted on the recorded baseline and remain fail-closed. No coordinator-owned acceptance, inventory, AI, sitemap, redirect, service-worker, locale-coverage or deployment output was changed. `.claude/rules/i18n.md` was absent and coordinator-declared non-blocking.
