# Freelance invoice import safety — 16 September 2026

The English, French and Swahili freelance invoice importer previously accepted unrelated JSON such as `{}` as a successful invoice import. An actual browser reproduction replaced `IMPORT-KEEP-42` with a default draft number and reset the financial fields. Its recursive merge also traversed prototype-bearing keys.

The shared source now validates an entire invoice backup before replacing the current draft. It accepts the existing version-1 envelope and compatible bare invoice state, checks required record/text/numeric/choice fields and line items, and rejects unsupported versions, unrelated structures and prototype keys. Invalid imports show a native message that the current invoice is unchanged. The shared merge independently ignores `__proto__`, `constructor` and `prototype` keys, including nested records. No calculation formulas, storage keys, network behavior or export formats changed.

## Evidence

- Baseline browser failure retained in `freelance-import-before`: unrelated JSON reported success and reset the draft.
- Six Chromium cases passed in `freelance-import-after` (59.5 seconds): three locale import cases plus the full saved-state and parsed export regressions for all three locales.
- Strengthened import cases wait for the file handler to finish before asserting unchanged values/storage and no prototype pollution. All three pass in `invoice-wrapper-import-final`, together with the two independent French export-wrapper collision cases (five total, 29.4 seconds).
- `node tests/freelance-invoice-import.test.js` passes: isolated VM tests exercise the actual merge from both shared and generated French owners, preserving ordinary fields and rejecting nested prototype keys.
- Browser tests cover actual JSON export, invalid import, wrapped and bare valid reimport, preserved entered rates, current local draft and no synthetic invoice fields in network requests.
- `node --check` passes for both runtime files. The French runtime generator was rerun with no unrelated output changes. `git diff --check` passes.

No deployment, acceptance-ledger change, tax-source review or source-freshness claim is included. This does not certify every historical third-party JSON format; unsupported files leave the current draft intact.
