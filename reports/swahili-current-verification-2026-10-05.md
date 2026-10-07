# Swahili source-bound current verification

Date: 5 October 2026. Fresh fetched and verified `origin/main`: `4a47419a0a49dbb82f36e947d8f0de4adbef154f`. Branch: `codex/sw-current-verification-20261005`. Worktree: `C:/Users/Oza/.codex/worktrees/sw-cv-pack-20261005/afrotools`. The completed application-pack repair remains preserved separately on `codex/sw-cv-pack-language-20261005`, commit `0fc0737dd2ce00c2105bcbc2b5668908ce5767a8`.

This verification-only batch changes no English/French/Swahili public UI, routes, locale classification, calculations, storage behavior, analytics behavior or deployment configuration. French commit `0d874a945dd224368041bcf45713007105c354c7` supplies the design reference and the shared fingerprint prerequisite.

## Historical and current evidence

The 1,256 historical accepted records are preserved. `accepted`, `acceptanceEvidence` and `totals.accepted` remain historical compatibility fields; the inventory now states that meaning explicitly and adds `historicalAccepted`, `historicallyAccepted`, `currentlyVerified` and `currentVerification`. Old acceptance records and category-wide Document/PDF browser/export receipts were not rewritten or given current hashes.

Current full acceptance is **0**. There are **1,254 needs-revalidation rows** without source-bound contracts and **two blocked rows**, invoice and CV. This is an evidence backlog; it does not assert that 1,254 tools have newly broken. Both selected owners remain unambiguous `localized-shell-candidate` rows under the existing locale authority. Scoped engineering evidence can be recorded independently; full current/native acceptance requires native owner/editor review and complete workflow review.

| Owner | Final executed checks | Current engineering state | Remaining gates |
|---|---|---|---|
| Invoice | Served bytes and saved-state/native PDF/JSON/review/share/print-adapter workflow passed; cookie control failed | Failed required check; blocked | Parent sticky-action repair, rerun cookie control at 320/390, native editorial and complete invalid/draft/recovery/keyboard/theme/print review |
| CV | Served bytes, JSON reload/recovery with parsed PDF/DOCX, invalid backup/keyboard/mobile, TXT/CSV/print-window adapter passed; reopened ZIP PDF failed | Failed required check; blocked | Shared awaited ZIP PDF repair, separate Swahili application-pack language/Unicode repair, native editorial/full template/editor workflow review, tracker memory refresh |

The cookie case reproduced the baseline overlap at **320 px** using a normal pointer click. It failed before the 390 px iteration, so this receipt grants no 390 px cookie-control credit. The existing invoice workflow independently passed its 320 px saved-state, calculation, JSON, three PDF modes and explicit share-consent checks. The ZIP parser found non-PDF bytes where a PDF was advertised; an earlier download never overrides that final failure.

## Changed source and output owners

- `data/localization/sw-current-verification.json`: maintained two-app verification contracts naming exact checks, generators, direct/lazy/shared inputs, export coverage, pending native/full-workflow reviews and open defects. The historical registry is referenced without changing its dated entries.
- `scripts/lib/swahili-free-app-verification.js`: current evaluator and source inventory. Binds English/Swahili HTML, direct served JS/CSS, declared lazy assets/fonts, available readable owners, CV JS/CSS directory members, generators, source contracts, dependency lock and test harness. Optional first/second-wave localization owners participate when integrated. A missing required file blocks proof; named review evidence must exist and participates in the digest. This is an explicit dependency contract, not a universal JavaScript dependency analyzer; future lazy inputs must be declared.
- `scripts/lib/source-fingerprint.js`: **shared prerequisite, not included in this Swahili commit**. For local tests it was restored byte-for-byte from French commit `0d874a945dd224368041bcf45713007105c354c7`. Integrate that shared owner first; never fork it. The temporary file was removed from this isolated worktree after verification/commit preparation.
- `scripts/run-swahili-free-app-verification.js`: dedicated execution runner. Replaces selected previous passes with a running record before execution, preserves unrelated rows, parses exact file/title/final Playwright results, rejects zero matches, skipped/retried/flaky/global-error/malformed/missing/interrupted cases, and compares source fingerprints before/after. Failure does not falsify an independently passed case. Interrupted execution remains nonaccepted. It suppresses legacy category receipt writes and never stores raw assertion content or fixture document bytes.
- `scripts/build-swahili-free-app-parity-inventory.js` and `tests/swahili-free-app-parity-inventory.test.js`: explicit historical/current reconciliation in JSON, Markdown, category totals and CLI output. Existing mapping, denominator and historical evidence remain authoritative and unchanged.
- `tests/swahili-current-verification.test.js`: 11 meaningful regression cases for historical/current separation, actual source edits, selective dependency impact, missing inputs/review files, source contract changes, manifest drift, failures/timeouts/interruption/skips, duplicate/invalid receipts, ambiguous owners, unresolved defects, incomplete exports, exact browser result intake, invalid empty execution and selected-rerun invalidation.
- `tests/e2e/swahili-current-verification-source.spec.js`: GETs every direct declared served input and compares its raw SHA-256 with the source snapshot. The intentional local `lazy-analytics.js` test adapter is checked against its exact expected bytes; real analytics and server source bytes still participate in the source fingerprint.
- `tests/e2e/swahili-current-verification-workflows.spec.js`: natural cookie refusal, real downloaded TXT/CSV/ZIP bytes, reopened PDF/JSON data and prepared print window content. Existing invoice and CV backup cases provide the remaining workflow/parser proof.
- `package.json`: `sw:verification:run` and `test:sw-verification` commands.
- `docs/SWAHILI-LOCALIZATION-STRATEGY.md`: repeatable verification workflow and proof boundaries.
- Generated evidence: `reports/swahili-free-app-current-verification-receipts.json` and `reports/swahili-free-app-parity-inventory.{json,md}`. This report is descriptive evidence only.

Final fingerprints bound **71 invoice files** and **148 CV files**. Receipts record actual tested revision `4a47419a0a49dbb82f36e947d8f0de4adbef154f`, its real tree, `workspaceDirty: true`, timestamps, full path/hash manifests, final statuses and `sourceChangedDuringRun: false`. The implementation was tested from a dirty development workspace. The hashes bind those actual bytes; the receipt does not pretend that the new sources already existed in the recorded Git revision. These local receipts are not transferable to newer integrated/rebuilt source without a rerun.

## Tests run

- PASS: `node --test tests/swahili-current-verification.test.js` — all 11 cases, no skips/cancellation.
- EXPECTED FAIL-CLOSED: final `node scripts/run-swahili-free-app-verification.js`, with `PORT=4288`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4288` — eight required browser cases executed: **six passed, two failed**, process exit 1, completed receipts and no source drift. Failed cases are explicitly retained rather than called accepted.
- PASS: `node scripts/build-swahili-free-app-parity-inventory.js --write`, then `--check`; `node tests/swahili-free-app-parity-inventory.test.js` — deterministic current inventory and separate historical/current counts.
- PASS: `npm run build:i18n:validate`; `npm run validate:hreflang` — 11,695 public pages and 4,253 equivalence groups; no locale/public source changes.
- PASS: `npm run lint`, `npm run type-check`, changed source/browser-test syntax checks and `git diff --check`.

Early harness runs exposed Playwright's test-root-relative filenames and an editor fixture that needed to enter the standard build flow. Intake/fixture tests were corrected and the full final execution repeated on frozen sources. A print observer originally tried to infer native print completion; the final case uses the French design's prepared-window/content boundary and makes no native-print claim. Earlier failures or source-drifted attempts are not counted as final passes.

Broad `npm test`, deploy build, security/dist, live provider/database and exact-SHA production checks were not run here; the parent owns release validation. No push, merge, deploy, Supabase, external AI or real-user-data operation occurred.

## Privacy, accessibility and proof limits

All career/invoice fixtures were synthetic. Traces, videos and screenshots were disabled. Receipts store source hashes, check IDs/statuses and non-PII environment metadata; downloaded document contents and raw errors are not logged. The consent storage fixture is exactly `afrotools_cookie_consent=declined`; the cookie case clears that key to expose the banner and verifies the stored refusal after a successful click. The local server replaces `/assets/js/lazy-analytics.js` with the explicit owner-test adapter and browser tests stub external requests. These checks do not establish live analytics-consent or provider behavior; limited cookieless measurement under the current policy is a separate boundary. Synthetic private-content sends are checked separately.

CSV proof uses the tracker module's actual download button through a declared DOM adapter after reloading persisted synthetic leads. Natural navigation to that toolbar from the standard editor remains pending. Print proof verifies a prepared popup and authored content, not the OS print dialog, fonts/page readiness or printed layout. The complete 30-template outputs, all editor/empty/invalid/draft/recovery states, native-human Kiswahili approval, full accessibility review, native OS printing and production proof remain pending. The known tracker in-memory refresh gap is recorded as open.

## Integration prerequisites and rerun

1. Integrate the French shared `scripts/lib/source-fingerprint.js` owner from `0d874a945dd224368041bcf45713007105c354c7` before this verification commit. The Swahili commit intentionally does not duplicate it.
2. Integrate/regenerate the first-wave invoice/CV product sources, including the parent sticky-action repair and shared awaited application-ZIP PDF fix. The separate Swahili pack repair `0fc0737dd2ce00c2105bcbc2b5668908ce5767a8` remains a second-wave product change; regenerate it against final shared owners when integrated.
3. Resolve each contract defect only after its repair and corresponding actual acceptance case have passed. Do not close the tracker/native/full-workflow gaps without new evidence.
4. On a unique local server port, run `npm run sw:verification:run`, then `npm run sw:parity:build`, `npm run sw:parity:check` and `npm run test:sw-verification` on final integrated/rebuilt bytes. Every changed source/contract/generator/asset reopens the fingerprint. Never attach new hashes to old outcomes.

Rollback: revert this verification-only commit; the first-wave and separate application-pack product repair remain separate. No deleted source files or historical receipt replacements are included.
