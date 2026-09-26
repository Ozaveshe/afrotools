# PDF reorder parity repair — 2026-09-17

Base and freshly fetched origin/main: `db561f908080fac7aa6ad4da27307dbbc8293678`. Isolated branch `codex/pdf-reorder-parity-20260917`. Separate next-batch candidate; no coordinator writes, push or deployment.

## Changed source

- Recovered EN inline controller into readable, directly served `assets/js/pages/pdf-reorder.js`. The EN source and both generated locale pages now reference it. `scripts/lib/pdf-reorder-runtime.js` installs it only for pdf-reorder, including SW preserved-existing pages; both locale generators call that boundary.
- Only the SW pdf-reorder registry row gains localFirstDownloads, removing its primary account gate while retaining review confirmation.
- Card keyboard handlers ignore nested action buttons, allowing Enter/Space rotate/delete; keyboard rotation restores focus after rebuilding cards.
- Page selection now requires complete integer/range tokens, valid bounds and ascending ranges. Invalid input leaves selection unchanged; duplicates still coalesce. No partial parse/clamping or reversed-range reinterpretation.
- EN/FR/SW native templates cover result counts, processing/review/reset messages and readable PDF failure guidance. User filenames and native result text are protected from substring translation.

PDF serialization remains identical to the original controller: `buildPdfBytes` normalized-source SHA256 `c0607d37e9acc5712908ec634c584c8828857762baf2da87c24f5e2cf647a605`. It copies original pages and adds requested rotation to their existing rotation. `assets/js/lib/pdf-utils.js` and vendor PDF libraries are unchanged.

## Verification

Shared dependency path: `NODE_PATH=C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules`.

- `node scripts/build-french-document-pdf-parity.js --write --app=pdf-reorder`
- `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-reorder`
- Both corresponding `--check` commands PASS; FR zero stale files.
- `node --test tests/pdf-reorder-runtime.test.js` —1PASS: scoped replacement, metadata/other-script preservation and idempotence.
- `node --check assets/js/pages/pdf-reorder.js` —PASS.
- With `PORT=4428`, `CI=1`, default analytics: `node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-reorder-language-parity.spec.js --project=chromium --workers=1` —**6PASS**.

For every locale, actual guest download reopens with GAMMA340×460 at180° followed by ALPHA300×400 at0°, after keyboard reorder, keyboard rotate and confirmed BETA deletion. Original GAMMA rotation90° plus requested90° is preserved. Parsed text matches exact page order. Every rendered RGBA channel matches independently rendered original source pages at expected rotations, retaining text/vector marks (zero differences). SW rendered GAMMA output visually reviewed.

Tests also prove valid `1-2, 3` selection; nine malformed/out-of-bounds/reversed selections leave the existing choice unchanged; nested Enter rotation/focus, Enter/Space delete, cancel focus/Escape, review-checkbox enforcement, native download status and native invalid-PDF recovery. 320px horizontal-overflow checks pass. No account bypass or sensitive real files used.

## Evidence / scope limits

Private files: `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/pdf-reorder-repair/`: actual en/fr/sw-managed.pdf, page1/2 render PNGs, UI/error screenshots and JSON. Reviewed SW render: `sw-page-1.png`.

Read-only baseline remains in sibling `pdf-reorder-audit/`: confirmed SW gate, nested-key handling failure, permissive parse and untranslated errors.

No full build/release/production proof or blanket app acceptance. This bounded regression does not establish all add/insert, duplication, extraction, undo/reset, touch/drag, complex forms/annotations, encrypted/huge PDFs, async replacement races, every keyboard/a11y path or privacy behavior. Those existing functions remain in the shared controller; only the stated core workflow and source serialization equivalence are proven here. Default analytics was not bypassed; no new network functionality was added.
