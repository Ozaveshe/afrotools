# PDF compression: bounded EN / FR / SW fidelity audit

## Identity and ownership

- Branch `codex/pdf-compress-parity-20260916`, base `5c844fdd9b04b37370cb26785671f06b0a56d303`.
- Fresh fetch before creation recorded `origin/main` at `6e9cea8ae9d7bbc72e5ab059a76cbfde9769322e`.
- First repair commit: `6195b27d`; native progress and no-growth follow-up follows it.
- Shared readable owner: `assets/js/pages/pdf-compress.js`; exact minifier pair produces `tools/pdf-compress/app.js`.
- English markup: `tools/pdf-compress/index.html`. French output: `scripts/build-french-document-pdf-parity.js --app=pdf-compress`; Swahili output: `scripts/build-swahili-document-pdf-parity.js --apps=pdf-compress`.
- No canonical/coordinator changes, deployment, third-party service addition, source-data/rate changes or acceptance-ledger edits.

## Observed gaps and repairs

| Dimension | Observed evidence | Source-owned repair / current proof |
| --- | --- | --- |
| Guest workflow | EN/FR downloaded locally; SW waited for registration because its generator injected the account gate | Explicit `localFirstDownloads` flag for only SW pdf-compress; actual PDF and ZIP downloads now pass without account state |
| Stale results | Baseline English browser test failed: changing custom JPEG quality left the old download visible | Every custom control clears result and download state; controls are disabled while processing; preset resets also clear download state |
| Rejected inputs | Non-PDF message was inside a hidden result panel | Visible native rejection message; invalid PDF gets native guidance without exposing library error/stack/document fragments |
| French UI drift | Physical FR page lacked the newer file-size advice, processing label/detail, percentage and progressbar ARIA hooks present in EN/SW | Rebuilt through its existing English-owned generator; narrow build hook prevents repeat drift; completion reaches 100% in all three languages |
| Native output | Newly added English progress phases and runtime warnings had no FR/SW dictionary entries | Compressor-owned native phases, counts, file advice, savings, mode names, download labels and warnings; filename/content values are not translated |
| Size truth | Code could choose a clean fallback larger than the source when raster was larger still | Original bytes retained whenever neither candidate is smaller; a deterministic valid larger-rewrite seam proves exact original-byte retention and 0% saved |
| Accessibility | Checkbox machine identifiers overrode visible native labels | Removed those redundant ARIA names in the English owner; regenerated FR/SW labels; custom-panel WCAG A/AA axe and keyboard checks pass |

Parent authorization explicitly resolved the older generic PDF-workflow gate wording in favour of current EN/FR guest-local behavior and the user's feature-parity request. No paid capability was removed or reclassified.

## Actual output evidence

Synthetic fixtures contain two distinct pages, searchable marker text, vector rectangles and a deterministic high-frequency image. Tests download the actual PDFs/ZIP, reopen every page with PDF.js, extract text and render to PNG.

- **Clean:** both page markers recovered in order, 420 × 594 point dimensions retained, and rendered PNG pixels exactly equal the source. Recompressing the already compact output does not assume further gain and returns no larger file.
- **Strong:** two pages and dimensions retained. Source/output mean RGB error stays below the fixture threshold of 35/255; rendered images were visually inspected. Texture becomes softer, as expected for lossy compression. If searchable text is absent, a visible native raster warning is required. This is not a claim of lossless raster compression.
- **Balanced / High quality / Custom:** actual outputs reopened for both pages; no output larger than the input. Custom target-size attempts and grayscale run on the image fixture; rendered grayscale chroma is checked independently.
- **Batch:** two actual ZIP members reopened, each with both original page markers. No download-only acceptance.
- **Invalid:** malformed PDF produces a visible native error and recovery guidance, no downloadable stale output. Non-PDF selection leaves compression disabled with visible rejection.
- **Size selection:** a test supplies a valid clean rewrite with harmless trailing whitespace, forcing a larger candidate independently of library-version differences. When raster is also larger, the actual downloaded bytes equal the original exactly.

No general percentage-reduction claim is inferred from these synthetic files. Clean can keep the original unchanged. Target size is an attempt, not a guarantee.

## Commands and results

Dependencies used from `C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules` through `NODE_PATH`. Chromium tests used one worker, `CI=1`, and a dedicated port.

1. `node scripts/minify.js --only=assets/js/pages/pdf-compress.js` — PASS, one paired runtime generated; no unrelated source edits retained.
2. `node scripts/build-french-document-pdf-parity.js --write --app=pdf-compress` then `--check --app=pdf-compress` — PASS, one selected route, repeat check clean.
3. `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-compress` then `--check --apps=pdf-compress` — PASS, one selected route.
4. `npm run pdf:verify` — PASS (existing gate/workflow static contracts).
5. `node --test tests/french-document-pdf-parity.test.js` — 40 PASS. These remain static/historical contract checks, not new functional proof for all 32 apps.
6. `node .../@playwright/test/cli.js test tests/e2e/pdf-compress-language-fidelity.spec.js tests/e2e/pdf-compress-progress.spec.js --project=chromium --workers=1` — 9 PASS on port 4384, including the existing 85 MB progress and Strong mobile regressions. Analytics-disabled seam used for this fidelity run.
7. Same CLI, `test tests/e2e/pdf-compress-language-fidelity.spec.js --grep "keyboard and scoped" --project=chromium --workers=1` — 3 PASS on port 4385 with `AFROTOOLS_TEST_DISABLE_ANALYTICS` removed. Actual keyboard calculation/download, scoped axe, no page errors, and observed requests containing neither fixture filenames/text nor full base64 PDF; no PDF/multipart upload body observed.
8. French fidelity case rerun on port 4386 to preserve final representative images outside Playwright's disposable output folder.
9. `node -c assets/js/pages/pdf-compress.js` and `git diff --check` — PASS.

Initial failures were retained as findings, not counted as passes: custom-quality stale download was reproduced; first SW download hung at its account gate; after shared repair, French test exposed its missing processing-label markup, which was regenerated before the passing run.

## Visual evidence and limits

Final representative images are copied to `C:/Users/Oza/.codex/worktrees/pdf-compress-parity-20260916/evidence/`: `source-image-page-1.png`, `strong-page-1.png`, `clean-page-1.png`, and `compress-fr-390.png`.

This is repository/local-browser evidence, not production evidence. No full build/dist/release verification was run here. The coordinator must integrate the ordered commits and run release checks.

The fixtures do not establish fidelity for encrypted, signed, tagged/accessibility-rich, form-heavy, layered, unusual-font or very large multipage PDFs. Raster modes flatten pages to images and do not establish retained searchability or interactive features. The 85 MB case is a padded synthetic text PDF, not an image-heavy 85 MB workload. Axe coverage is the custom controls, not the whole site's shared navigation/footer. Real-device memory limits and geographies are not claimed.
