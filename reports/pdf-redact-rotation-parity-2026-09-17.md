# Rotated/cropped PDF redaction correction

Ready patches (independent, apply geometry first):
1. pdf-redact-rotation-fix.patch (readable runtime, generated runtime, 12-case browser suite).
2. pdf-redact-sw-review-copy.patch (source override, bounded sync owner, generated lexicons, native-message regression, five owner tests).

Both plain git apply --check PASS against coordinator e16f718149ea8d86a52844b268b5527a27b63ae8. Investigation started15f3ca0a, preserving previous candidate. No coordinator edits, deploy, accounts or external document uploads.

## Defect and correction
Search text-run boxes transformed only the text origin and assumed horizontal width/height. At90degrees, the exported image showed a horizontal strip while the sensitive marker stayed visibly readable. Extracted text was nevertheless empty, so extraction alone gave false assurance. All3quality baseline tests failed on that marker pixel.

makeTextRunBox now transforms advance and vertical vectors, includes a conservative descent, computes axis-aligned bounds from all4corners, clips to the viewport, and converts to the same flattened display-page coordinate system as manual rectangles. Rendering/export strategy and original PDF content are otherwise unchanged. Conservative bounds may redact slightly beyond glyph ink; review remains necessary.

## Evidence
- Original baseline failures preserved in baseline-results (three English quality cases, each four-page synthetic CropBox fixture). en-rotation90.png viewed: visibly readable SECRET_471_MARKER alongside misplaced strip.
- First repaired nine locale/quality cases PASS41.1s.
- Final expanded15browser cases PASS1.3minutes (session86623): prior3guest/native-review/stale-download cases plus12geometry cases. Search at compact/balanced/high in all3locales; manual at balanced in all3locales. Each geometry export has4pages with0/90/180/270rotation and CropBox(40,80,500,600).
- Independent oracle uses fixed PDF fixture positions and PDFLib Helvetica text width, not application box coordinates. Full marker rectangle >97%black, public text ink retained, green marker preserved, white background preserved, dimensions correct, all output extracted text empty.48pages across12geometry output PDFs.
- Candidate90degree French raster viewed directly: vertical black rectangle fully replaces marker; public content remains readable.
- Final artifact directory final-results contains actual PDFs and balanced-quality PNGs for all rotations/locales.
- Five Node tests PASS: exact one-phrase update preserves all other JSON/runtime entries; unknown/empty route, ambiguous phrase owner and invalid generated boundary fail without writes.
- Syntax checks PASS. Runtime generated with current production Terser options; existing minify owner --only=pdf-redact executed in private mapped-file harness (unrelated navbar writes suppressed).

## Native Swahili owner
New review body: Weka tiki kuthibitisha ukaguzi wa mwisho kabla ya kuhamisha PDF. Sehemu ulizoficha zitafutwa, na kurasa zitahifadhiwa kama picha.
The source ROUTE_OVERRIDES entry owns the wording. Full lexicon generation discovers919unrelated missingstrings, so no network translation was attempted successfully. New --sync-overrides=pdf-redact only replaces existing uniquely owned override keys and preserves all other existing catalogue entries; source/default full-generation behavior remains. Generated JS is one long line, so patch size is large despite exactly one changed dictionary value. JSON comparison and Node tests confirm this.
Command after application: node scripts/build-swahili-document-pdf-lexicon.js --sync-overrides=pdf-redact --check (add --write only when regenerating).

## Production ancestry and limits
Fetched origin/main bfca5b2763fc0dc12b267b152f738eb606752e47 and original b027ff71 have identical legacy redaction blob e4c7e28460725ef8c2a83a63f7ffd644d735e594. Thus the bug predates the guest/stale-output repair; this is repository ancestry proof, not fresh production/deploy verification.
Normal text Helvetica fixtures, fixed crop offsets and quarter-turn rotations are verified. Skewed/vertical writing, complex scripts, OCR/scans, encryption, huge files and arbitrary malformed PDFs remain unverified. Search still depends on PDF.js extractable text and matches text runs. Output intentionally rasterizes every page, losing selectable text/accessibility structure. No whole-app acceptance claimed.

## Coordinator integration proof
Both patches applied on e16f7181. Actualminifier regeneration, scopedlexicon check andfiveNodeowner tests passed. Independent comparison of actualgeneratedJS before/after confirmed exactlyonechangedexisting key among7,094entries, noentry additions/deletions.

Root actualsource browser session29627 passed15/15 in1.2minutes on4518/defaultanalytics with externalnetworkblocked bytests. TwelvegeometryPDFs/48pages coveralllocales, quarterturnrotations, fixedCropBox, allsearchqualities andmanualbalanced. Root visually inspected French90degree downloadedraster: completeblack rectangle atsecretposition, publictextandgreenmarkerpreserved. Earliernormalrotationcases stillpass. The reproducedrotation defect is repaired in thisboundedsourceproof; release stillrequiresrebuilt-dist/fullchecks. Complexscripts/OCR/arbitrarymalformedPDFsremainunverified.
