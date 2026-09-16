# PDF image conversion: bounded functional repair

Base: `892bece024026dabf4135469ded54be326834487`. Freshly fetched origin/main: `7e2fba2b3cc82959cf903b72172ada1231f91a13`. Isolated branch `codex/pdf-image-parity-20260916`.

## Source ownership
Recovered readable `bc2e3669:tools/pdf-image-convert/app.js` into `assets/js/pages/pdf-image-convert.js`. Two successive default Terser passes on historical and current runtime produced byte-identical 22,262-byte results before changes. Exact pair now belongs to scripts/minify.js. SW guest contract belongs to its existing document generator, using supported localFirstDownloads flag.

## Observed defects and repairs
- Extraction hung on a shared image: PDF.js global image IDs need commonObjs, not page.objs.
- Reorder/layout changes left an old downloadable PDF. Both directions now invalidate generated outputs when settings change; reorder invalidates too. Inputs are disabled during conversion.
- Cover drawing overran the explicitly selected margins. Clip drawing to the inner page rectangle.
- SW alone required registration for local output. Align it with EN/FR local guest downloads.

## Actual artifact proof
`NODE_PATH=C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules PORT=4391 CI=1 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 node <shared-node_modules>/@playwright/test/cli.js test tests/e2e/pdf-image-language-fidelity.spec.js --project=chromium --workers=1`: **7 passed**.

For every locale: PNG/JPEG/WebP actual bytes have selected page 2 dimensions 200x400 and expected blue center; ZIP has page2 then page1; embedded PNG recovers original30x20 green pixels; reordered images create PDF pages60x120 then90x60 points with expected blue/red center pixels. Image-only PDF has no searchable text, as expected. Reorder/orientation changes hide stale download. Cover with10mm margins has white outer edge and red center.390px no horizontal overflow. Synthetic filename absent observed requests under analytics-disabled seam. This is bounded privacy evidence, not a complete payload/network audit.

Baseline: all7 tests failed: EN/FR artifact tests reached extraction hang; SW gate blocked first; three stale-output failures; cover margin pixel failure. Prior formats and ZIP passed before extraction.

`node scripts/build-swahili-document-pdf-parity.js --check --apps=pdf-image-convert`, syntax check and git diff --check pass. Generator write and targeted minification completed.

Stable synthetic evidence: sibling `../evidence/` contains rendered image/PDF pages and390px screenshots for all locales. SW screenshot visually inspected: no horizontal clipping but captures lower page after download; it does not establish whole control-layout visual parity.

## Remaining work / limits
Native runtime progress/error/result labels, invalid file feedback, loading races, complete keyboard/axe/default-analytics proof and representative full result screenshots remain for a separate follow-up. No complete app acceptance. Complex PDF masks, transforms, image groups, color profiles, encrypted or huge documents, animation/transparency/EXIF fidelity are not comprehensively verified. No full build, dist or production proof. No upload, push or deployment.
