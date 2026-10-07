# French CV country advice: source-only handoff

- Branch: `codex/fr-cv-country-advice-20261005`.
- Worktree: `C:/Users/Oza/.codex/worktrees/fr-cv-country-advice-20261005/afrotools`.
- Verified candidate base: `c3d33a060f5dd232914bc22c3b6de1a12b14d516`.
- Fresh `git fetch origin main` completed; verified `origin/main`: `719c0fa2fc5042d224096d74ca8e7c4e6e835fc3`.
- Prior French worktree and its commits were preserved; new worktree started clean.
- Status: source and focused Node contract repair. Generated/runtime/browser acceptance remains pending. No push, merge or deployment.

## Scope and source ownership

`data/localization/fr-cv-country-rules-copy.json` maintains names for all 54 African countries plus `INTL` and `OTHER`, every effective display-property value, privacy warnings, policy-label presentation, field controls, template display names and the compact summary. Its review metadata explicitly says AI editorial translation, native-human review pending and country facts not reviewed. Existing English country recommendations were translated; no country-policy values were changed or certified.

`scripts/build-french-cv-runtime.js` dispatches these two modules to a separate guarded AST translation path:

- `tools/cv-builder/js/cv-country-rules.js`.
- `tools/cv-builder/js/cv-country-advisor-compact.js`.

The dedicated path avoids generic string translation of country policy enums. A SHA-256 fingerprint of each English source, normalized only for CRLF, requires a maintained-copy review when the English owner changes. Missing profiles, display-property translations, privacy warnings or maintained policy/control labels fail compilation rather than silently producing partial French copy.

Hydration now receives native country names, origin labels and help prose when compiled in memory. Privacy controls say “Masquer les champs sensibles”; their existing action hides fields and does not delete retained personal values. “National ID” is translated as the identity-number field and remains separate from nationality. CV/résumé wording distinguishes the short application document from a professional summary.

No English, Hausa, Swahili, generated routes/modules/manifests, public claims or verification receipts were modified. The currently committed French country runtime remains the old output until authorized generation. The currently referenced compact module remains English until generation and route rewriting are completed.

## Verification

Dependencies were read through `NODE_PATH` from the parent candidate's existing `node_modules`; no installation or dependency writes.

- PASS: `node --test tests/french-cv-country-advice.test.js` — 9/9 after resolving the initial compiler guard's punctuation-only join-separator classification.
- PASS: country coverage and maintained display copy for all 56 effective profiles; native hydrated names/help/origin labels/phone suggestions and all rendered warnings; optional-field disclosure; native compact summary.
- PASS: canonical country codes/dial values, all policy enums, template IDs, storage keys and control expressions unchanged. A full AST comparison permits only maintained presentation literals to differ.
- PASS: actual module override/hide/country-change handlers under a pure Node adapter preserve synthetic authored values, match English state/storage updates and retain the original privacy behavior. These are contract checks, not browser/accessibility proof.
- PASS: changed English source fingerprint, missing profile, missing warning/table/policy/action copy and empty language copy fail closed; equivalent CRLF/LF sources are accepted.
- Combined adjacent run: `node --test tests/french-cv-country-advice.test.js tests/french-cv-completion.test.js tests/french-document-context.test.js` — 16/17 pass, one inherited generated-pack equality failure.
- Final focused source run: `node --test tests/french-cv-country-advice.test.js tests/french-document-context.test.js` — 13/13 pass after the final copy wording adjustment.
- PASS: `node -c scripts/build-french-cv-runtime.js`, `node -c tests/french-cv-country-advice.test.js`, `git diff --check`.

The inherited pack mismatch was verified using the base compiler loaded in memory from `c3d33a06`: its pack output is identical to this branch's pack output, and both differ from the committed French pack. Normalized expected SHA-256: `9b2275771ae53e9b87f00e8b2f6093074e5811cf42bc8a6933d030ccc9871a18`; committed output: `5c199f227302f47ccca9a55f64ae2922474182bf674123242f94b220b5364808`. The failing test was not changed or weakened. Parent applicant-letter generation remains pending.

Generators, builds, browser/server checks, i18n/hreflang commands, deployment and current source-bound workflow receipts were not run while CSS R7 held the heavy slot. No listening server or browser process was created by this batch. No sensitive real-user fixtures or raw sensitive logs were used.

## Required integration follow-up after heavy-slot clearance

1. Run `node scripts/build-french-cv-runtime.js` to generate both French country modules and the current pack copy; review the scoped output diff and manifest.
2. Run `node scripts/build-french-document-pdf-parity.js --write --app=cv-builder` so the French route loads the generated compact advisor.
3. Rerun the three focused Node files above; the inherited pack equality check must pass on the final generated bytes.
4. Verify native country panel hydration, disclosure and all override/hide actions in the actual French route at desktop and 390/320 widths; exercise compact summary and keyboard/focus behavior. Keep authored data intact, avoid sensitive screenshots and verify cookie/refusal boundaries as applicable.
5. Run the relevant i18n/hreflang checks and bind fresh workflow evidence to the final integrated source/output bytes, including this new maintained-copy file in the CV source-fingerprint contract. Do not upgrade current acceptance based on file existence or these Node checks alone.

Native-human French editorial review and factual/source review of the underlying country recommendations remain separate and outstanding. No full French parity, physical-print, provider or production proof is claimed.
