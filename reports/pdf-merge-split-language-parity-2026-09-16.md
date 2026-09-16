# PDF merge/split: bounded EN/FR/SW functional repair

Existing isolated pdf-image-parity-20260916 tree, basec488d8cb. Fresh fetch origin/main=bfca5b2763fc0dc12b267b152f738eb606752e47. Current main merge/split runtime is identical to base; HTML differences are analytics hashes. No coordinator/canonical edits or new dependencies/worktree.

## Exact app coverage
One app family, three routes: /tools/pdf-merge-split/, /fr/tools/fusionner-diviser-pdf/, /sw/zana/unganisha-na-gawanya-pdf/. Six output workflows: selected-file merge with reordered file/page selections; split-point ZIP; custom ranges ZIP; combined ranges PDF; extracted pages PDF; every-page ZIP.

## Source ownership and changes
Recovered bc2e3669:tools/pdf-merge-split/app.js as assets/js/pages/pdf-merge-split.js. Two default Terser normalization passes prove historical readable source byte-equivalent to current runtime before edits. Exact source/output pair added to scripts/minify.js.

Confirmed defects: SW alone inserted an account gate for local PDF/ZIP downloads; previous generated PDF remained downloadable after invalid page-selection edits. SW generator now uses the existing localFirstDownloads contract. Owner invalidates saved download/action state after relevant input/order/mode edits. Processing disables controls. Native EN/FR/SW validation, result counts, action labels and range hints replace partial English runtime copy; parser errors no longer expose raw library messages. User filenames carry translate=no. Extractable page thumbnails support Enter/Space with pressed state.

No page-loss/order defect reproduced in the tested valid synthetic workflows; copying/selection algorithm is unchanged. Text inputs also accept localized all-page keywords tous/toutes/zote alongside existing all/blank. No routes or canonicals changed.

## Actual output tests
Baseline2PASS/4FAIL on4400: EN/FR content/order workflows passed; SW gate failed; stale downloads visible across all3locales. Stale-test selectors were narrowed to actual download action because a shared share-image button appears asynchronously.

After initial repairs6PASS on4401. Expanded native/mobile tests then caught my overly broad change-event invalidator hiding a new error following a late text-field blur. Fixed before commit: invalidate text on input, checkbox on change, file changes through their source owner. Final visible-error assertion covers this regression.

Final command (shared NODE_PATH, PORT4404, CI1, AFROTOOLS_TEST_DISABLE_ANALYTICS1):
`node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-merge-split-language-fidelity.spec.js --project=chromium --workers=1`
**9PASS**. Two synthetic4page PDFs carry unique A/B labels, distinct page dimensions and vector rectangles. Every output PDF is parsed and rendered; exact text order/dimensions and independent expected rectangle RGB values are asserted. ZIP contents are reopened as PDFs. Merge expected B3,B1,A4,A2; cuts A1-A2/A3-A4; ranges A3-A4/A1; combined A3,A4,A1; extract A4,A2; every-page four one-page PDFs. Native out-of-bounds and invalid-PDF errors, disabled invalid actions, stale download hiding, keyboard page selection producing A3, and390px overflow also pass in3locales. Downloads really occur without accounts.

Targeted SW generator write/check, exact minification, source syntax, git diff --check pass. No fullbuild/dist/deploy. Analytics seam used here; this suite does not claim a complete network/privacy audit or full accessibility conformance.

## Visual evidence and limits
French invalid-file feedback visibly readable at390px:
`C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/merge-split/merge-split-fr-390.png`
English and Swahili screenshots also saved there. Synthetic test PDFs processed in memory; no large artifacts.

Unverified: forms/signatures/annotations/outlines, encrypted or malformed complex PDFs, >80thumbnail documents, cross-browser behavior, drag gestures, asynchronous overlapping/slow multi-file uploads and complete a11y. In particular source syncMergeButton filters ready files and does not explicitly withhold merging while another file is still loading; fast fixtures do not establish that pending-file case. No full app acceptance or universal preservation claim. This batch is frozen for coordinator review.
