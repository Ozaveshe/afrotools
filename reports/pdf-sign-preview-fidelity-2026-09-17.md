# Signing preview fidelity and stale-result repair

## Scope and source
Followup to prior pdf-sign.patch, frozen source b027ff71. No coordinator edits, checkout/install, push or deployment. Apply pdf-sign-fidelity.patch, then regenerate French with `node scripts/build-french-document-pdf-parity.js --write --app=pdf-sign` and Swahili with `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-sign`. Both actual frozen owners ran successfully in the private git-backed virtual filesystem. Captured translated outputs are reference artifacts, not hand patches.

Durable source changes: EN tools/pdf-sign/index.html owns signing runtime; mark that runtime and sync it only for pdf-sign in the SW owner. French already derives this runtime from EN. SW integrity excludes only pdf-sign from generic stale invalidation because that generic layer disabled the Apply action after date changes; the signing runtime now owns snapshot-safe invalidation. Existing shared placement helper from prior patch remains unchanged. Generator integration hunk preserves coordinator installFormFillerRuntime call; its integration baseline hash is recorded separately.

## Confirmed problems repaired
- Typed PDF signatures ignored chosen preview font/colour/size and used standard24pt PDF text. Export now embeds the exact preview image, as for drawn/uploaded signatures. Typed preview raster is3x resolution and fits the full supplied name within its box. Original PDF text remains selectable; the visual signature itself is an image.
- Old downloadable bytes remained after edits. Inputs, signature use, placement controls, page changes and move/resize invalidate results; snapshots and a generation counter reject asynchronous stale completion, with nativeEN/FR/SW feedback.
- Full signature rectangles could extend past smaller target pages. Export uniformly fits oversized signatures and clamps position within each target page; no image pixels are discarded.
- Date used a fixed offset and overlapped the signature. It now sits below the actual image rectangle with reserved bottom space.

## Actual validation
Repo-native tests use actual served candidate source, normal cookie rejection, synthetic documents/signatures, and external request blocking. Prior current/all test updated for raster signatures while preserving original text, dimensions, page identities, signature count and independent matrix/physical bounds.

New9 cases cover EN/FR/SW x typed/drawn/uploaded. Typed fixture is Élodie Mwang’ombe, selectedPacifico/navy; drawn fixture uses pointer strokes; uploadedPNG has synthetic magenta strokes/transparency. Decoded PDF image RGB and alpha bytes exactly match preview image pixels, and image transforms match preview placement. Downloaded dated PDFs preserve original text and include date below image. Typed boundary cases center-scroll normally, hit-test resize handle, use actual pointer resize/drag, and assert resulting width>200px/top>350px before testing wholeimage/date bounds. Delayed PDF load plus date change rejects stale output in each locale. Saved signature remains absent without opt-in.

Final command: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4514 node node_modules/@playwright/test/cli.js test tests/e2e/pdf-sign-image-fidelity.spec.js tests/e2e/pdf-sign-guest-parity.spec.js --workers=1`. Native test files do not intercept candidate source; private server composes frozen files with source-owned generated outputs. Source syntax and git apply check passed. Actual24 downloadedPDFs/30pages rendered via Poppler for visual review; artifact hashes in proof.json.

## Limits
These are visual signatures, not cryptographic signatures or legal acceptance proof. External Google cursive-font availability is not proved: network-blocked tests verify the actual rendered preview image (browser fallback font), not availability of every named font. Rotated CropBoxes, arbitrary scripts, keyboard placement, hugefiles, signature retention opt-in, and every browser remain unverified. No full-app/catalogue/release acceptance. Source copy and Unicode typed text remained local; no new upload or account flow.

## Test diagnostics preserved honestly
Initial stronger test exposed real mixed-page image clipping and SW regeneration lock, both repaired. A temporary private FR assertion encoding error was corrected toUTF8. Early resize fixture had not moved EN/FR because sticky navbar covered the handle; final fixture requires real geometry change and normal center-scroll/hit-test, not force clicks. Previous candidate evidence remains in sibling pdf-sign-candidate; this followup supersedes only affected signing output.

Final strict run11953:12/12PASS53.9s, including actual pointer geometry-change assertions and dated output bounds. Final30pages regenerated from this run; superseding hashes recorded.

## Coordinator integration
Appliedsourcepatch on e06bb341; regeneratedbothFR/SWsignroutes withactualowners,checksPASS(0staleFrench). Rootactualsourcebrowser58021 passed12/12 in1.0minute on4518/defaultanalytics/freshserver, including updatedcurrent/allartifactproof, typed/drawn/uploadedimagefidelity, actualpointerplacementanddatedoutputbounds, staleasyncresults andregeneration. npm pdf:verify alsoPASS(31registrytools,34surfaces andworkflowcontracts). No fullbuild/dist/production claim. Independentpeerreview stillpending before releasefreeze.

## Upload identity and tiny-page follow-up
Independent peer review reproduced negative-size tiny-page signatures/date clipping and a delayed-upload preview/export mismatch. The authored English runtime now checks upload identity after reading and parsing, commits file/document together, and renders into an offscreen canvas guarded by render identity. Pending or failed previews cannot export. Actual embedded date width is measured; impossible dated placement returns native guidance, while date-free small-page images retain positive bounded dimensions.

Both locale owners regenerated and checked successfully. Coordinator session84989 passed18/18 actual-source browser cases in1.5minutes on4518 with default analytics, including delayed reading, parsing and actual painting, stale failures,20x10/40x100-page rejection with dates, valid date-free images and80x160 dated output. Synthetic PDF artifacts are retained privately. This resolves the reproduced source-level hold; full artifact and production checks remain separate. Rotated/cropped signing pages and arbitrary scripts remain unverified.
