# PDF form-filler correctness follow-up — 2026-09-17

Scope: EN `/tools/pdf-form-filler/`, FR `/fr/tools/remplir-formulaire-pdf/`, SW `/sw/zana/kujaza-fomu-pdf/`. Candidate follows source-only `8e6becd7`; that parent follows `a27648bf66bc0aebf7b2f7fa7008a3181790d969`. Last fetched origin/main recorded in the parent audit: `bfca5b2763fc0dc12b267b152f738eb606752e47`; guest baseline reference `b027ff71`. No deployment or live-user data.

## Observed baseline and fix

Two three-locale runs produced twelve expected failures:
- Clear All unchecked the seeded radio in the browser, but the downloaded PDF retained `Paper`.
- Supported multi-select option list seeded with `Water, Road` displayed only `Road`.
- An invalid PDF replacement hid its error inside the hidden upload card and left the old workspace visible.
- An empty required field still produced a final download rather than focusing the missing field.

The original inline EN controller was first extracted unchanged to `assets/js/pages/pdf-form-filler.js`. Before behavioral changes, the existing three-locale guest suite passed all three cases: exact editable values, two retained pages, flattened field removal, parsed accented text and preview raster. This separates source consolidation from fixes.

The shared controller now clears original radio values, preserves multi-select arrays, validates required fields before final export, invalidates old forms on replacement, guards asynchronous source changes and gives native actionable errors without raw parser details. A field-write failure stops export rather than silently omitting that field. Upload/reset work by keyboard. User-provided field names and options remain untranslated.

`installFormFillerRuntime` is keyed exclusively to `pdf-form-filler` in both locale generators; other app controllers are unchanged. The readable shared asset is served directly, with no new dependency or minifier output. Generated FR/SW pages are deliberately excluded from this source-only commit: coordinator must run the two targeted owners below after integrating. EN source references the shared controller.

## Verification

Shared dependency path for all browser/generator commands:
`NODE_PATH=C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules`

- `node scripts/build-french-document-pdf-parity.js --write --app=pdf-form-filler`
- `node scripts/build-swahili-document-pdf-parity.js --write --apps=pdf-form-filler`
- `node scripts/build-french-document-pdf-parity.js --check --app=pdf-form-filler` — PASS, zero stale outputs.
- `node scripts/build-swahili-document-pdf-parity.js --check --apps=pdf-form-filler` — PASS.
- With `PORT=4414`, `CI=1`, default analytics (no disable seam): `node C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules/@playwright/test/cli.js test tests/e2e/pdf-form-filler-correctness.spec.js tests/e2e/pdf-form-filler-guest-output.spec.js --project=chromium --workers=1` — **18 PASS**.
- `node --test tests/pdf-form-filler-runtime.test.js` — **1 PASS**, exact unrelated-script/metadata preservation, other-app no-op and idempotence.
- `node --check assets/js/pages/pdf-form-filler.js` — PASS.
- `git diff --check` — PASS.

Independent expected outputs include empty exported seeded radio after reset, both option-list values retained, current replacement field alone in reopened output, and successful recovery after invalid replacement. Required-field cases assert focus/native error/no download. Enter/Tab/reset keyboard flow and 320/390px horizontal overflow checks pass. Existing guest tests reopen editable and flattened PDFs, parse text/page count, rasterize actual flattened output and check observed requests for synthetic fixture markers and lead-capture calls.

Private evidence: `C:/Users/Oza/.codex/worktrees/pdf-image-parity-20260916/evidence/form-filler-correctness/` contains `form-{en,fr,sw}-320.png`, `filled-{en,fr,sw}.pdf` and matching PNGs. SW320 screenshot visually reviewed: native download/status and controls fit. The screenshot also shows low-contrast text in the existing global analytics consent panel; this shared-site issue is outside the form-controller repair and not accepted as full accessibility proof.

## Limits

No universal PDF-form compatibility claim: XFA, signatures, password/encryption handling, arbitrary Unicode font coverage, rich text and every AcroForm flag are not proven. Multi-select artifact proof covers PDFOptionList; PDFDropdown uses the same isMultiselect/selectedOptions path, but only single-select dropdowns have separate existing artifact proof. Browser download/parser proof is local source proof, not production proof. No full build, release audit or whole-app acceptance ledger update was performed in this isolated task.
