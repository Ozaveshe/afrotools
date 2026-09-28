# PDF filename and signing user-text boundaries — 2026-09-26

## Identity and scope

- Base: `53e1482b8874cc00f419567742a9a7ec9ce244e4`.
- Fresh `git fetch origin main` before work verified `origin/main` at `b9591cd19424eee477db576b6d95459da686e4ec`.
- Isolated branch: `codex/pdf-user-text-boundaries-20260926`.
- Tree: `C:/Users/Oza/.codex/worktrees/pdf-user-text-boundaries-20260926/afrotools`.
- Prior artwork tree/commit `73096e875bdedd7e91d917f1db021732cc648eaa` preserved. No coordinator/canonical edits, full build, push, or deployment.

## Changed files and behavior

Readable sources:

- `assets/js/pages/pdf-merge-split.js`: protects the page-range input and merge summary with `translate=no`. Both already supply native English/French/Swahili copy. Their embedded filenames now remain exact in accessible names and invalid-range messages; native labels, placeholders, valid/recovery summaries and surrounding controls remain localized.
- `tools/pdf-sign/index.html`: protects uploaded-filename and typed-preview fields. Empty-preview prompts are explicitly native (`Your Name`, `Votre nom`, `Jina Lako`) so protecting user text does not leave the empty state in English.

Owner-generated files:

- `tools/pdf-merge-split/app.js`, through `scripts/minify.js --only=assets/js/pages/pdf-merge-split.js`.
- `fr/tools/signer-pdf/index.html`, through the French parity generator with `--app=pdf-sign`.
- `sw/zana/kusaini-pdf/index.html`, through the Swahili parity generator with `--apps=pdf-sign`.

`tests/e2e/pdf-user-text-boundaries.spec.js` adds six actual browser/output cases. No formula, PDF-generation algorithm, file content, privacy policy, account gate, route, canonical, analytics event or tariff change. Shared translators remain unchanged. Protection is confined to fields owned by these runtimes; native UI translation is not globally suppressed.

Generated signing pages retain normal owner changes to metadata order and unstamped asset references. Later full build/version owners must stamp assets. A preliminary Swahili invocation used unsupported singular `--app`; its unrelated generated changes were restored from this initially clean branch, with a private patch preserved. Correct `--apps=pdf-sign` was then run; no unrelated page changes remain.

## Verification

**12/12 focused Chromium cases passed in 1.3 minutes**, one worker, zero retries, effective reduced motion, private local server port 4524:

| Checks | EN | FR | SW |
|---|---:|---:|---:|
| Collision filenames, native accessible name, invalid range and recovery, actual merged/extracted downloads | pass | pass | pass |
| Typed preview collisions, native empty-state recovery, exact independently expected signature pixels reopened from actual PDF | pass | pass | pass |
| Existing merge selected-order and every split-output journey | pass | pass | pass |
| Existing typed-signature fidelity, positioning/date, stale-output invalidation journey | pass | pass | pass |

The new cases use actual synthetic PDFs named `Upload PDF.pdf` and `Clear.pdf`. Native invalid-range messages preserve both names. Correcting ranges re-enables the merge action. The downloaded `Upload PDF_merged.pdf` reopens as two 600×800-point pages containing exactly `Upload PDF 2` and `Clear 1`. Extracted output reopens as one page containing `Upload PDF 2`.

Signing tests type `Upload PDF`, `Clear`, clear the field, then type `Upload PDF` again. Visible preview and input match; the empty prompt remains native. The uploaded filename assertion is deliberately DOM-only because successful upload hides the first step. The input PDF text survives the signed export. These are distinct preview and export assertions: an independent canvas draws the literal fixture string, the product overlay must match it, and the exported PDF's embedded image RGB and alpha bytes must then match that independent reference exactly.

All three native exports have a 450×180 signature image with:

- RGB SHA-256: `9e1f3c04b2895a425f50589cf4e1addbd945780f3577762497f7a61533e97067`
- Alpha SHA-256: `9b66a710e074b3ff6f1769c682eb545c89806441f8c0b4852b9181a5dcc11b0b`

Three native typed-preview screenshots and the Swahili output screenshot were visually inspected. Fixtures are synthetic; external fonts were blocked, so the pixel check establishes consistency with the browser's available font rendering, not availability/appearance of hosted font files. New cases block all non-local HTTP requests. Save-on-device remains unchecked and no signature is stored. Existing regression cases retain their own fixture/network policies.

Other successful checks:

- `git diff --check` and deletion-summary review (no deletions).
- `node --check assets/js/pages/pdf-merge-split.js`.
- `node --check tests/e2e/pdf-user-text-boundaries.spec.js`.
- `node scripts/build-french-document-pdf-parity.js --check --app=pdf-sign` (zero stale).
- `node scripts/build-swahili-document-pdf-parity.js --check --apps=pdf-sign` (1/1 reconciled).
- Independent extraction/comparison: authored signing runtime is byte-equivalent after newline normalization across all three generated/native pages.

## Evidence and initial failures

Private evidence parent: `C:/Users/Oza/.codex/worktrees/pdf-user-text-boundaries-20260926/`.

- `baseline-evidence/`: the new tests failed on the unchanged source's actual Swahili filename mutations (`Upload` became `Pakia`) before the fixes.
- `candidate-evidence/`: initial fixed-source run passed all three signing cases and all merge UI assertions, but its merge PDF parser calls failed.
- `parser-probe.cjs`: the exact saved 1,812-byte PDF was supplied as a pooled Node Buffer at offset 8 in an 8,192-byte backing buffer; the legacy pdf-parse adapter rejected it. A copied Uint8Array of identical bytes parsed `Upload PDF 2` / `Clear 1`. Tests now use the copied view; no product bytes or expected content were changed.
- `final.config.cjs`, `final-test.log`, `final-evidence/`: successful 12-case run, actual PDF downloads, pixel hashes and native screenshots. Configuration explicitly selects the six new cases plus three existing merge and three existing typed-signature cases. CLI: canonical installed `node_modules/@playwright/test/cli.js test --config ../final.config.cjs --project chromium`, with `NODE_PATH=C:/Users/Oza/Documents/afrotools/node_modules`, `PORT=4524`, `AFROTOOLS_TEST_DISABLE_ANALYTICS=1`.
- An initial anchored grep selected no tests; corrected selection then produced the preserved baseline failures. No forced clicks or retries-to-green.

## Carried separate blocker: Swahili translator terminal-key collision

A generic error toast seen during screenshot review was investigated with one private diagnostic replay, not hidden. It originates in unchanged `assets/js/pages/sw-document-pdf-localizer.js:735`. Its phrase trie stores translated terminal text at `node.$`, but the loaded lexicon contains the literal source phrase `Page $1`. For `Page 2`, the trie treats the `$` child object as a translation and throws `TypeError: Cannot convert object to primitive value`. `Page 1` succeeds because it has an exact phrase entry. This also leaves the thumbnail label `Page 2` untranslated.

The replay still passed all scoped filename/output assertions but captured three page-error stacks. `diagnostic.log`, `diagnostic-evidence/`, and `localizer-diagnostic.cjs` preserve the browser and direct-source reproduction. The localizer/lexicon are unchanged from the base. This separate defect was reported to the coordinator and is **not repaired by this commit**; the 12 passing cases do not imply a console-clean Swahili route or complete language parity.

## Release limits

Source-runtime and downloaded-artifact checks only. No full source build, publish-artifact audit, broad suite, production verification, push, or deploy was run under this bounded assignment. No complete accessibility/SEO audit is claimed. The coordinator must reconcile the current frozen build, handle the carried localizer defect, integrate/rebuild and validate the publish artifact before release. Rollback is a revert of this scoped commit followed by normal owner regeneration.
