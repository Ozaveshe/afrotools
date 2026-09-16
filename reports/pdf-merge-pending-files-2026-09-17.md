# Pending selected PDF merge guard

Basef1514e90, same isolated tree. No other app scope.

## Reproduction
A synthetic File.arrayBuffer delay holds the final selected PDF before its metadata parser can finish. Delay applies only on the first read, allowing the actual merge to reread it later. Two selectedfiles already stayed disabled until both were ready. With3selectedfiles and2ready, baselinef1514e90 enabled Merge while the third remained loading: corrected baseline tests failed in EN/FR/SW on expected-disabled/received-enabled. The source merge routine filtered loading entries out, making this an omission risk. The baseline assertion stopped before downloading an incomplete result; an actual omitted-output download is not claimed.

The initial delay fixture also stalled the later merge reread; corrected with a per-file WeakSet before recording the baseline above. That harness error is separate from the reproduced enabled-button defect.

## Fix
syncMergeButton withholds Merge whenever any selected file is loading, with native EN/FR/SW waiting copy. mergePdfs also rejects loading/error entries defensively. Existing unreadable-file instructions remain: explicitly remove the failed file before merging the remaining files. No automatic removal or selection changes.

Source assets/js/pages/pdf-merge-split.js; matching tools/pdf-merge-split/app.js generated via exact minifier owner.

## Verification
PORT4407, CI1, AFROTOOLS_TEST_DISABLE_ANALYTICS1, shared NODE_PATH:
`node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-merge-pending-files.spec.js --project=chromium --workers=1`
**6PASS**. Everylocale tests2and3selectedfiles, disabled state while delayed, native waiting message, readiness after release, and actual downloaded PDF labels A,B or A,B,C in order. Delayed invalid thirdfile keeps Merge disabled after parsing, shows native remove-unreadable guidance without raw fixture text, and requires explicit removal before a downloaded A,B PDF is verified.

Syntax/minification/git diff --check pass. No fullbuild, new dependencies, new checkout or deployment. This resolves the specific pending-file omission lead; complex document/other concurrency limits from the prior report remain unverified.
