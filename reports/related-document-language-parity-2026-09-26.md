# Document related-tool language repair — 2026-09-26

## Problem and result

French form-filler recommendation cards could keep English names, descriptions and accessible labels when the shared component rendered before the French localizer. The light-DOM metadata later became French while the rendered shadow content remained stale. Swahili document recommendations retained English metadata, section labels and the English all-tools target.

The document locale owners now emit native names, descriptions and destinations. French metadata comes from the existing document app catalog; Swahili names/routes come from its app catalog, with seven reviewed recommendation descriptions in `data/localization/sw-document-related-tools.json`. A shared owner helper escapes attributes and visible text and changes only known recommendation anchors inside related-tool elements. Both regular owner paths and the narrow `--related-tools-only` regeneration use it.

The shared component observes relevant light-DOM metadata and child/text changes, coalesces rerenders, and disconnects observation on removal. Shadow rendering cannot trigger the observer. Native Swahili heading, category, CTA and directory labels are included. Browse-all targets the existing `/sw/zana-zote/` and `/fr/all-tools/` directories; the former French `/fr/tools/` target was a Netlify redirect alias. Dynamic labels, descriptions, category text and link attributes are HTML-escaped.

## Scope and preservation

- Own branch: `codex/related-document-locale-20260926`, based on preserved watermark commit `24fd3f40b30fdf3e9edcaa7815d4d93e010bd3bd`.
- Verified fetched origin/main: `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009`. Initial discovery compared relevant owners and representative SSR fragments against this baseline. No main merge/reset/push or deployment.
- Generated output: shared minified component plus 31 French and 28 Swahili document pages. A normalized before/after comparison confirmed every HTML change is confined to its related-tool fragment.
- Preserved the prior dirty `test-results/.last-run.json` and all watermark/discovery evidence. New test output is outside the product worktree.
- English recommendations and lazy dataset paths remain covered. No registry or full dataset regeneration was needed.

## Validation

- PASS: `node scripts/build-french-document-pdf-parity.js --write --related-tools-only` (31 outputs), then matching `--check` (0 stale).
- PASS: `node scripts/build-swahili-document-pdf-parity.js --write --related-tools-only` (28 outputs), then matching `--check` (0 stale).
- PASS: `node scripts/minify.js --only=components/related-tools.js`.
- PASS: syntax checks for shared component, helper and both locale owners; `git diff --check`; no deleted files.
- PASS: `node scripts/build-swahili-document-pdf-parity.js --check` — 31/31 selected rows reconciled.
- PASS: `npm run validate:hreflang` — 11,561 public pages, 5,290 equivalence groups; native equivalents indexable, self-canonical, locale-correct and reciprocal.
- PASS: final Playwright `related-document-language-parity.spec.js` — **23/23 in 39.8 seconds**, Chromium, isolated static server port4528, canonical installed dependencies read-only. Private config `../related-document-repair.config.cjs`; output `../evidence/related-document-candidate-results`.
  - Actual form-filler and watermark routes in EN/FR/SW: six rendered cards, native metadata and accessible names, descriptions, category/CTA/heading, native destinations returning200, all-tools directory returning200, no related dataset request for SSR, and390px card/header bounds.
  - Real French and Swahili localizers in both component-first and localizer-first orders, for readable and minified component assets.
  - Late metadata replacement, literal escaped text, coalesced rerender, detach/reattach, text-only fallback, removal and reinsertion.
  - Lazy dataset operation in EN/FR/SW for both component assets.
- Initial19-case run had17 passes and two failures because the local static server does not follow the French directory's production redirect; the component now links directly to the real French directory. Preserved initial failure output separately.

## Limits and release notes

- **Artwork remains a separate limitation:** existing recommendation images can contain English text. This batch does not download or introduce the approximately1MB localized artwork, change image loading, or claim full visual language parity.
- No live/production verification or search-click improvement is claimed. These are local source/browser checks. Coordinator owns integrated build, dist/security checks and any deployment.
- No new sensitive-data handling, external sends, analytics changes, canonical/hreflang edits, Pro work or export behavior changes.
- Existing page localizers and their broader vocabulary outside these recommendations are unchanged. This is the document recommendation batch, not a claim that every app/category is fully localized.
- Rollback: revert this scoped candidate; retain the preceding watermark repair.
