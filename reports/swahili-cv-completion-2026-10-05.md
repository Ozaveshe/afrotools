# Scoped Swahili CV completion candidate — 2026-10-05

Status: prepared source/test candidate; final browser verification is pending. This is not production proof or native-human acceptance. The coordinator requested that all owned browsers and the local server stop while the unchanged first-release production suite runs. No browser/verifier run will resume before clearance.

## Revision and ownership

- Fresh initial fetch verified `origin/main` at `4a47419a0a49dbb82f36e947d8f0de4adbef154f`.
- Isolated worktree: `C:/Users/Oza/.codex/worktrees/sw-cv-pack-20261005/afrotools`; branch `codex/sw-cv-completion-20261005`, created from integrated local wave2 `b7a50686575ad70c868c5f7c9ec4f14c293e798c`.
- Shared prerequisites are original commits `806a696992fb895333e647920bfc0d865c9cd1a8` (pack/tracker/design/export), `79427bbff6cce18c822f990a589a88842a8f1a90` (import keyboard), and coordinator `453543d1` (real-loader consent harness). They are separately committed in this worktree; the scoped candidate does not edit their English owners.
- Local prerequisite HEAD before the candidate: `6cb07fc2e75283bc23622fe9b377d2cd6f0c044f`. Diagnostic browser runs used this revision with evolving dirty source bytes, not a claimed clean final revision.
- Retains the coordinator's two resolved issue records from `08a315bd`: invoice cookie reachability and awaited ZIP PDF bytes. Their prior execution proof does not become fresh evidence for this candidate's changed hashes.

## Sources and generated outputs

Sources: `data/localization/sw-cv-application-pack-copy.json`, `data/localization/sw-document-pdf-lexicon-overrides.json`, `scripts/build-swahili-cv-application-pack-runtime.js`, `assets/css/sw-cv-application-pack.css`, and `assets/js/pages/sw-document-pdf-dom-stability.js`.

Verification owners: `data/localization/sw-current-verification.json`, `scripts/run-swahili-free-app-verification.js`, `tests/e2e/swahili-cv-application-pack.spec.js`, `tests/swahili-current-verification.test.js`, and `tests/swahili-cv-application-pack.test.js`.

Generated outputs: the cached JSON/browser lexicon, `sw/zana/mjenzi-cv/index.html`, its application-pack manifest, and its pack, pack-export and tracker modules. The compiler now records and prefers the maintained readable English owners. No French/Hausa/Yoruba page or shared English semantic change is included.

## Repairs and acceptance boundaries

- Localizes job-application tracker context and exact empty/stale/error/fallback labels through maintained copy owners. Canonical statuses, asset keys, IDs, tone values and authored facts stay unchanged.
- Protects authored tracker role/company/note/metadata and saved-document option slots from the generic DOM dictionary. The browser assertions compare literal stored and displayed values that deliberately collide with ordinary dictionary phrases.
- Inherits the shared immediate tracker refresh, attachment persistence, fresh-storage CSV, Unicode PDF writer, empty export guard, stale asynchronous PDF/ZIP guard and common import keyboard repairs. It adapts the native compiler to the new awaited writer without duplicating the shared implementation.
- A real mobile defect was reproduced after tracker rerender: focus loss restored the fixed command dock; the next pointer press moved the dock again, and the CSV/ZIP retry click was lost. Button identity and enabled state remained unchanged, and the module API retry succeeded. The new Swahili document-control context keeps dock positioning stable through focus loss and clears it on a main CV command. This fix has unit proof only until its actual 320/390 pointer rerun passes.
- Adds eight exact application-pack checks to the existing eight source/workflow checks. Mammoth's lazy DOCX parser bytes are included in the served-file fingerprint contract. Declared checks are test requirements, not accepted results.

## Validation actually completed

- PASS: `node --test tests/swahili-cv-application-pack.test.js tests/swahili-current-verification.test.js tests/swahili-document-editorial.test.js tests/swahili-redaction-review-owner.test.js` — 26 passed, 0 failed/skipped/cancelled on the prepared source bytes.
- PASS earlier in this batch: scoped cached override sync, CV route generation and pack generation checks; `npm run lint`, `npm run type-check`, `npm run build:i18n:validate` and `npm run validate:hreflang`. Those broad static checks preceded the final persistent mobile-context edit; syntax/unit/diff checks cover that edit separately.
- Diagnostic browser passes on intermediate bytes covered actual TXT/DOC/PDF/ZIP exports and reopened PDF/ZIP data; native validation and missing-font/unsupported-character fallback with parsed retry; native fallback generation; standalone stale PDF rejection/recovery; JSON save/import/reload with pack/tracker persistence. These are diagnostic observations, not a final aggregate receipt.
- Diagnostic failures remain explicit: natural post-edit tracker CSV click, natural stale-ZIP retry click, and the newly added DOCX review state assertion in a parallel run. The first two motivated the mobile-context repair. Subsequent text-only owner review found the DOCX test omitted the required Extract sections click after upload fills the textarea; the test now waits for authored text to load and clicks that real control. Its final keyboard/review rerun remains pending. No timeout or product assertion was weakened.
- PENDING: final eight pack cases and the full sixteen-check source-bound verifier on the committed/final bytes; inventory regeneration after that actual run. The previous current receipt and category-wide receipts are not rewritten or promoted by this candidate.

## Privacy, evidence and remaining work

Synthetic fixtures stay local; only safe failure category, phase and source-line metadata survive the sensitive spec's error sanitizer. Failure status/count/timing remain available. Screenshots, video, trace and automatic copy-prompt snapshots are disabled for this spec; accidental raw failure-context files were removed. The report preserves the diagnostic failures without reproducing private document text. The non-cookie local test adapter blocks foreign requests; the consent reachability case separately uses the real loader. Consent fixture key is `afrotools_cookie_consent`, value `declined`; this is not a claim that the local network adapter proves production analytics policy.

The historical 1,256 acceptance count remains dated historical evidence. The old 32-row document/category receipt is preserved. Full review of all thirty CV layouts, the remaining editor/empty/draft recovery states, native OS print, final-release light/dark/keyboard behavior, and native Kiswahili editorial review remain pending. Language/editorial, tracker completion, mobile click-loss and DOCX diagnostic defects remain open until their exact requirements pass.

No push, merge, deployment, Supabase/provider operation, new package or service was performed. The coordinator owns integration, final generation, build/security/dist checks and production proof. The owned server on port 4291 was stopped and the absence of a listener verified before preparing this commit.
