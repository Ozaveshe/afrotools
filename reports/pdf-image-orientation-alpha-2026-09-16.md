# PDF/image EXIF and transparency follow-up

Isolated base815305b2, existing pdf-image-parity-20260916 tree. No fetch/worktree/dependency installation needed for this assigned follow-up. Coordinator tree was untouched.

## Defects and source changes
- Baseline actual JPEG auto exports ignored EXIF mirroring across EN/FR/SW: orientation2 first expected blue quadrant was red. Ordinary JPEG bytes had been embedded without interpreting orientation.
- Readable shared owner assets/js/pages/pdf-image-convert.js now bounds-checks EXIF orientation metadata and normalizes oriented/mirrored JPEGs through the browser decoder to PNG. JPEGs with normal/no recognized orientation remain original-byte embeddings in auto mode.
- Automatic WebP input used JPEG encoding, flattening alpha. It now embeds decoded PNG pixels and retains alpha. PNG original embedding remains unchanged.
- Extracted WebP output also went through an opaque white canvas; PNG and WebP now preserve decoded alpha, while JPEG deliberately uses white.
- Native EN/FR/SW result notes explain automatic orientation/transparency handling and explicitly disclose white flattening for selected JPEG mode. This may increase file size for normalized photos; no compression guarantee is added.
- tools/pdf-image-convert/app.js regenerated only through the existing exact minifier pair.

## Verification
Initial3-locale EXIF tests failed on wrong orientation pixels. After the repair,3locale tests passed for orientations2/6/8, PNG/WebP rendered appearance and PDF soft masks. An intermediate test selector ambiguity between two remove buttons was corrected by scoping to imgFileList; this was a test issue, not a product defect.

Combined existing fidelity and new EXIF/alpha suite:19PASS on4398 (analytics-disabled test seam). This includes16prior tests, all8 orientation dimension/color fixtures, PNG/WebP alpha masks and white-page round trips, explicit JPEG white rendering/native notes. Subsequent stronger test uses4distinct quadrants to distinguish every orientation and adds true embedded-image extraction roundtrip alpha checks for PNG/WebP. Final result recorded below after completion.

Final command uses shared installed dependencies, CI=1, AFROTOOLS_TEST_DISABLE_ANALYTICS=1, PORT=4399:
`node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-image-orientation-alpha.spec.js --project=chromium --workers=1`

Synthetic images are80x40 pixels. Final fixtures independently specify expected4quadrant permutations for EXIF1–8 and swapped dimensions for5–8; exported PDFs are parsed/rasterized at4/3scale to recover original pixel dimensions. PNG/WebP source is half-transparent red beside fully transparent pixels. Assertions verify half-alpha PDF soft masks, correct compositing on white PDF pages, extracted image alpha near128/0, and explicit JPEG-mode white pixels/native copy. No real documents or user data used.

## Limits
Chromium browser decoding, PDF.js rendering and PDF-lib structure inspection are distinct checks but not independent vendor engines. Fixtures cover normal8-bit synthetic JPEG/PNG/WebP with little-endian EXIF; unusual/malformed EXIF, ICC/CMYK color profiles, animated images, very large images, complex PDF masks and cross-browser behavior remain unverified. This does not claim metadata stripping, complete fidelity for every document, full app acceptance or production proof. No build/dist/deploy. Artifacts are tiny and saved in sibling evidence directory after final tests.


Final strengthened3locale tests: **3PASS on4399**, after the final WebP-alpha output branch change. The combined19pass run preceded that final branch; the strengthened3tests directly exercise it. Syntax and git diff --check pass. No broad tests repeated without need.

Visual review: actual orientation6 PDF raster shows yellow/red top quadrants and green/blue bottom quadrants at40x80; expected clockwise90degree transform. Stable artifact path:
`C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/exif-alpha/pdf-image-orientation-alph-1bf3d--alpha-image-PDF-appearance-chromium-orientation-6.png`
Same directory contains tiny transparent-input PDFs and PNG roundtrip artifacts for EN/FR/SW. No large artifacts committed.
