# Swahili phrase-trie terminal collision — 2026-09-26

Separate follow-up to boundary commit `46880b314d0f3b65a6552890abfe45438cfdd0e9`, on its preserved isolated branch `codex/pdf-user-text-boundaries-20260926`. Original base/fresh-main evidence is in `pdf-user-text-boundaries-2026-09-26.md`. Coordinator and current build remain untouched.

## Change

`assets/js/pages/sw-document-pdf-localizer.js` used the character key `$` both for trie edges and translated terminal values. The real lexicon contains literal `Page $1`. A partial `Page 2` lookup reached the dollar child and tried to concatenate its object value, throwing `Cannot convert object to primitive value`. Inserting `Example` before `Example$1` could instead traverse a translated string and throw; reversed insertion could silently lose the longer mapping.

A private `Symbol('phraseTranslation')` now owns the terminal value. All three terminal reads/writes use it. Character children retain their existing null-prototype objects; dictionary inputs, exact matching, minimum partial-phrase length, longest-match traversal, observer behavior, `exactOnly` state and protected-user-content boundaries are unchanged. Symbol is compatible with the modern ES2015+ browser baseline already required by these document tools. No lexicon edits or template substitution were introduced; literal `Page $1` retains its literal mapping, and unmatched `Page 2` remains `Page 2` until a separate native label-owner change.

## Proof

- `node --test tests/sw-document-pdf-trie.test.js`: **7/7 pass**. Before the repair, **5/7 failed** on the real lexicon, both insertion orders, adjacent dollar keys and unmatched suffixes. The two unaffected tests (ordinary longest match and exact/unknown mapping) passed before and after.
- Unit fixtures include terminal `Example`, direct dollar continuation `Example$1`, spaced `Example $1`, adjacent `Example $1$2`, unmatched suffixes and unknown `filename-$9.pdf`.
- Actual Chromium workflows: **6/6 pass in 51.9s**, EN/FR/SW merge and signing; no page errors and no `#afro-error-banner` in any case. Tests still assert collision filenames, validation recovery, protected signature text and exact reopened output bytes/pixels. The SW multi-page workflow explicitly verifies unchanged `Page 2` at this intermediate commit, demonstrating that the fix removes the exception without changing literal dictionary semantics.
- `node --check assets/js/pages/sw-document-pdf-localizer.js`, `git diff --check`, terminal-read/write review: pass.
- No generated counterpart belongs to this runtime; no minified, dictionary, build or route owner needed regeneration for this change.

Private evidence under `C:/Users/Oza/.codex/worktrees/pdf-user-text-boundaries-20260926/`: `trie-before.log`, `trie-after-corrected.log`, `trie-final-browser.log`, `trie-final-evidence/`, `trie-final.config.cjs`. The earlier `diagnostic.log` reproduces actual browser exceptions. A preliminary edit-script string-replacement error was caught by syntax/unit checks; its browser job was interrupted, the isolated source was repaired from committed HEAD, and final evidence uses a different directory. No test expectation was relaxed to conceal it.

## Limits

Scoped source/browser proof, synthetic local-first fixtures and blocked external HTTP; no full build, broad suite, publish artifact, production proof, push or deployment. The separate English thumbnail-label gap remains at this commit and requires its actual merge/split runtime owner, not generic dollar-placeholder substitution. Rollback is a revert of this commit; boundary repair remains independent.
