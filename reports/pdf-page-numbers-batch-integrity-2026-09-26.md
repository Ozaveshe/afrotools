# PDF numbering batch integrity follow-up — 2026-09-26

## Problem and repair

Independent review of `1ccae15eb51c859361d0638519c45d1d76a6a18c` confirmed two inherited defects:

1. Numbering controls remained editable while asynchronous file processing used a captured options snapshot. Editing a prefix during the first file's delayed read replaced the results array; a two-file probe then offered only the second file, stamped `OLD-1` while the visible prefix was `NEW-`.
2. Names such as `a b.pdf` and `a_b.pdf` normalized to the same ZIP member name. Case-only differences also risk overwriting files when extracted on a case-insensitive filesystem.

`assets/js/pages/pdf-page-numbers.js` now disables all 17 numbering options, the upload input, four presets, positions, and file removal/clear controls until processing finishes. Keyboard upload also respects the busy state. One shared option-control list is used for both listeners and locking. Users can change settings immediately afterward; such changes continue to invalidate the previous download.

Successful results receive unique names using a case-insensitive set before either the result list or ZIP is built. Collisions receive deterministic `_2`, `_3`, and subsequent suffixes. The result list and archive use the same resolved names. `tools/pdf-page-numbers/app.js` was regenerated with its existing minification owner.

No numbering arithmetic, CropBox/rotation geometry, translation strings, source pages, account gates, network calls, storage or analytics changed in this follow-up.

## Source isolation

Fresh fetch observed `origin/main` `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009`. Branch `codex/pdf-numbering-followup-20260926` preserves the completed fuel commit, then applies original numbering as local commit `545e3b0c`. Two cherry-pick context conflicts were reconciled only for the numbering row and generated Swahili guest-download page. Those original changes are outside this follow-up commit; the coordinator should integrate original numbering plus this follow-up, not the local reconciliation commit.

Untracked `fuel-peer.cjs` and `reorder-peer.cjs` remain untouched. No canonical checkout edits, main push or deployment.

## Validation

- PASS: three new EN/FR/SW delayed-batch tests in `tests/e2e/pdf-page-numbers-batch-integrity.spec.js`.
- Each locale uploads three two-page PDFs named `a b.pdf`, `a_b.pdf`, and `A_B.pdf`, each with a distinct original text marker. A real `File.arrayBuffer()` call for the first file is held pending while every affecting control and preset is checked as disabled. A native click on a disabled preset cannot change the captured settings; keyboard upload cannot open the picker mid-batch.
- Six actual ZIP downloads: initial `OLD-` numbering and a second generation after changing to `NEW-`. JSZip independently reads the central directory and verifies CRCs. All 18 PDF members reopen through PDF.js; all 36 pages retain the matching original marker and expected new numbers. No member is dropped or overwritten; names remain unique after case folding.
- Result names match archive names; controls unlock after completion; changing settings hides the old download. Tested 320px layouts do not overflow.
- PASS: original nine-case numbering suite, including subsets, native formats, actual rotated CropBox rasters, preview/export pixel equality, invalid ranges/PDFs, oversized and unsupported text. Combined final run: **12/12 tests in 2.8 minutes**, terminal exit 0, Chromium, one worker, actual isolated source server on port 4524, default analytics behavior.
- PASS: source/test syntax and `git diff --check`; no deleted files.

Private evidence: `C:/Users/Oza/.codex/worktrees/cover-letter-parity-20260916/numbering-followup-browser.log` and `numbering-followup-evidence/`.

## Release limits

Source/browser proof only. Combined build, security, deployment artifact, CI and production checks remain with the coordinator. Large-file duration and all ZIP readers were not measured. The fix serializes user interaction during processing; it does not add cancellation. Other numbering acceptance limits from the original report remain.
