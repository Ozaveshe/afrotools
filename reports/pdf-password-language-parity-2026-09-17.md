# PDF password local/native parity repair — 2026-09-17

Base: `e06bb341e43e3cd1d351931e4b2ebe81114e0f98`. Fresh fetch succeeded before branch creation; recorded origin/main `db561f908080fac7aa6ad4da27307dbbc8293678`. Branch `codex/pdf-password-parity-20260917` uses the existing isolated pdf-image-parity worktree. No coordinator edits, push or deployment.

## Source and behavior

- `scripts/build-swahili-document-pdf-parity.js`: only `pdf-password` row gains `localFirstDownloads:true`. Generated SW route removes its account-only primary PDF/ZIP gate. EN/FR guest behavior remains.
- `assets/js/pages/pdf-password.js`: recovered the existing shared controller from minified `tools/pdf-password/app.js`, whose base blob is `6ccf816a19b8bb8b5d74a93b1e53dda3cc5ef048`. Terser `compress:false,mangle:false` normalized original and recovered source were identical BEFORE behavior edits. `scripts/minify.js` now owns this exact readable/output pair.
- Native EN/FR/SW message templates cover processing/counts, successful protection/unlock, permissions and security explanations, validation and failure feedback. Localized results and user filenames opt out of generic substring translation. A filename containing `Revenue {0}.pdf` is preserved in the file list; formatter does not reinterpret user braces.
- QPDF worker, WASM and wrapper are unchanged. Existing actual encryption/decryption calls and permission controls remain. Failures display useful native messages instead of raw QPDF error strings. No password recovery/bypass is added.

Baseline private audit at frozen298e6224 showed actual SW account gates on both workflows, English FR results, SW `Lindaed`/`Nenosiri accepted` results and raw library errors. Baseline artifacts/report remain at `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/pdf-password-audit/`.

## Verification

Set `NODE_PATH=C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules`.

- `node scripts/minify.js --only=assets/js/pages/pdf-password.js` — PASS; output regenerated from source. No unrelated navbar output diff.
- `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-password` — PASS, one row.
- `node scripts/build-swahili-document-pdf-parity.js --check --apps=pdf-password` — PASS.
- `node --check assets/js/pages/pdf-password.js`, `node --check scripts/minify.js`, `git diff --check` — PASS.
- `git diff e06bb341 --exit-code -- assets/js/lib/qpdf-aes.js assets/vendor/qpdf` — PASS, zero crypto-owner difference.
- With `PORT=4423`, `CI=1`, default analytics: `node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-password-language-parity.spec.js --project=chromium --workers=1` — **6 PASS**.

Each locale downloads an actual encrypted protected PDF. Independent PDF.js parsing rejects missing password (code1) and wrong password (code2), opens with both user/owner passwords and recovers exact synthetic text. With copying disabled and printing enabled, permission metadata excludes COPY16 and includes PRINT4. Correct-password unlock downloads an unencrypted PDF, reopened by PDFLib and parsed by PDF.js with exact text intact. Wrong-password and malformed-PDF workflows offer no output and display native errors. Native final summaries are asserted. 320px overflow checks pass. Observed network URL/body and browser console messages contain neither synthetic passwords nor document-text markers (including URL-encoded variants); this is scoped local observation, not a general proof for every external service.

An intermediate invalid-PDF assertion incorrectly matched `/on/` within `action-row`; fixed to an exact class-token regex. This was a test defect, not an app failure. Final six cases run with that correction.

## Evidence and limits

Private exact PDFs, PNGs and JSON: `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/pdf-password-repair/`.

SW rendered native result screenshot reviewed: `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/pdf-password-repair/sw-protect.png`.

No full build or production proof. Tests use a small text PDF, not every PDF version/font/security profile. Batch ZIP, non-Latin passwords, every permission combination/reader enforcement, interruption/cancellation and full keyboard/a11y coverage remain unproven. Permission flags are not DRM. Existing ancillary Share as Image localization is outside this primary protect/unlock repair. No acceptance ledger claim or universal encryption audit.

## Coordinator integration proof
Candidate802988ce integratedas051b0fee on77a72b53. Regenerated actual minifier output andcheckedSWowner, bothPASS. Independent gitdiff confirms QPDFwrapper/vendor unchanged.

Rootactualsourcebrowser74981 passed6/6cases in39.1seconds on4518/defaultanalytics/freshserver: realencryptedguestdownloads/wrongpasswordrejection/userandownerpasswordopens, permissionflags, exactdecryptedtext, nativeerrors/noinvalidoutput, observedprivacy andmobilechecks. This is integratedsourceproof, not rebuilt-dist or production acceptance.
