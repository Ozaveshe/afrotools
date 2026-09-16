# PDF reorder source identity follow-up — 2026-09-17

## Scope and baseline

EN `/tools/pdf-reorder/`, FR `/fr/tools/reorganiser-pdf/`, SW `/sw/zana/kupanga-kurasa-pdf/`.
Parent candidate: `d0d55ec4bfc3ff6f19cb9a493b0d453acd97265f`; verified origin/base: `db561f908080fac7aa6ad4da27307dbbc8293678`. Isolated branch only; no deployment.

Real synthetic PDF baseline reproduction on d0d delayed A.pdf loading, completed B.pdf, then released A. Actual downloaded B_managed.pdf contained SOURCE ALPHA. A separately delayed export still downloaded after file replacement. Peer also reproduced Space selection moving focus to BODY.

## Repair

`assets/js/pages/pdf-reorder.js` now invalidates asynchronous work on source/layout/reset/Undo changes. Upload and add commit only to their current generation; additions commit atomically. Export/extract capture page, document and filename snapshots and suppress stale success/error/download. Loading clears and disables stale controls. Keyboard selection restores replacement-card focus. Successful additions invalidate any pending export of the prior layout.

The earlier report's exact unchanged buildPdfBytes hash is historical. This follow-up changes its signature/source lookup to use explicit snapshot documents; PDFLib page copy and rotation operations remain intact. Final diff review caught and removed an accidental guard insertion into duplication; three actual duplicate-output tests cover that existing workflow.

## Verification

Browser command (NODE_PATH points to existing language-director-20260915/afrotools/node_modules; CI=1; PORT=4434):

`node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-reorder-source-identity.spec.js tests/e2e/pdf-reorder-language-parity.spec.js --project=chromium --workers=1`

Terminal result: **18 passed (1.5 minutes), exit 0**. Tests use real PDFLib synthetic PDFs and real PdfUtils/PDFLib operations delayed by controlled promises. Actual downloaded PDF bytes are parsed, not inferred from download events. Cases cover replacement races, cancelled add, committed add invalidating pending export, Undo invalidation/zero rotation, retained keyboard focus, duplication, original page order/rotation/dimensions/rendered vector fidelity and native validation. Default analytics remain enabled.

Other checks passed: `node --check assets/js/pages/pdf-reorder.js`; `node --test tests/pdf-reorder-runtime.test.js` (1 pass); `node scripts/build-french-document-pdf-parity.js --check --app=pdf-reorder` (0 stale); `node scripts/build-swahili-document-pdf-parity.js --check --apps=pdf-reorder`; `git diff --check`.

Private actual download evidence: `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/pdf-reorder-source-identity/`, with manifest linking copied PDFs to test output directories.

## Limits

Bounded source/browser evidence, not production or full-build proof. Synthetic fixtures do not cover every possible interleaving, very large PDFs, encrypted PDFs, forms or annotations. No account, external upload, cryptographic or entitlement changes. No new rates or factual source claims. No generated route edits required because existing routes already reference this readable controller and owner checks pass.

## Coordinator integration
Integrated on94af89b7 through c131e81a/b1868c1a. Shared locale-generator conflicts were resolved by retaining both form-filler and reorder installers and the existing signing-runtime synchronization. Both installer unit tests and scoped locale checks passed. Root actual-source run96858 passed all31 selected reorder/compressor cases in2.9minutes on4518 with normal analytics; eighteen cover reorder, including current-source outputs, stale suppression, keyboard focus, duplicate pages and independent rendered fidelity. No next-batch build or production claim.
