# Day 3 source recovery — 24 July 2026

## Outcome

- Recovered **391 non-generated JavaScript and CSS source files** that had been destructively minified in place.
- Regenerated **12 generated engine outputs** from their readable `engines/src/*.js` owners.
- Total affected files reconciled: **403**.
- No files were staged, committed, or pushed by this recovery lane.

## Cause

`scripts/minify.js` performs two broad in-place passes after its normal
source-to-output pairs:

- PASS 2 minifies remaining JavaScript files in place.
- PASS 3 minifies remaining CSS files in place.

Those passes overwrote readable source and did not retain a backup or source
map. The recovery cutoff was `2026-07-24T01:08:00.000Z`, immediately before
the destructive build pass.

## Reconstruction evidence

- Parsed Codex `patch_apply_end` receipts from the 21–24 July session logs.
- Deduplicated forked-session receipts by call id, file, change type, and
  content hash.
- Replayed receipts chronologically through the pre-build cutoff.
- Replayed formatting where Prettier output was part of the original edit
  sequence.
- Before replacing each source, minified the recovered candidate with the
  same current minifier behavior and compared it to the overwritten file.

Recovery proof:

- First pass: **355** source files reproduced the overwritten bytes exactly.
- Second pass: **32** additional source files reproduced the overwritten bytes
  exactly after formatting-aware replay.
- Exception reconciliation: **4** source files reproduced the overwritten
  bytes exactly after deterministic replay of their final edits.
- Final non-generated total: **391 / 391**.

Three source files were originally produced by deterministic copy/transform
commands rather than patch-add receipts. Their commands were replayed:

- `assets/css/rwanda-vat-vip.css` from the Ghana VAT stylesheet plus the
  recorded Rwanda token replacements.
- `assets/js/pages/uganda-vat-vip.js` from the Rwanda VAT controller plus the
  recorded Uganda replacements.
- `assets/css/uganda-vat-vip.css` from the Rwanda VAT stylesheet plus the
  recorded Uganda token replacements.

The four final exceptions were:

- `assets/css/startup-valuation-vip.css`: replayed the two compact dark-theme
  patches whose context depended on the then-minified source.
- `assets/css/uganda-vat-vip.css`: replayed the recorded compact token
  transformations after formatting.
- `assets/js/data/crypto-quiz-bank.js`: preserved the post-build English and
  French privacy-answer correction.
- `tools/maternity-leave/verified-planner.js`: preserved the post-build removal
  of local-storage saving and the matching status copy.

All four then matched their overwritten minified bytes exactly.

## Generated engines

The following outputs were regenerated with targeted
`node scripts/minify.js --only=engines/src/<name>.js` calls:

- `crypto-cgt-engine.js`
- `forex-profit-statement-engine.js`
- `investment-return-engine.js`
- `ke-stamp-duty-engine.js`
- `microfinance-offer-engine.js`
- `ng-land-use-engine.js`
- `p2p-quote-comparator-engine.js`
- `pension-projection-planner.js`
- `remittance-quote-comparator-engine.js`
- `staff-cost-planner.js`
- `startup-valuation-engine.js`
- `za-transfer-duty-engine.js`

Each of the 12 generated outputs was independently minified from its
`engines/src` owner with `getEngineTerserOptions()` and matched exactly.
The targeted `--only` path returns before the destructive broad in-place
passes.

## Validation

- Exact current-minifier reproduction: **391 / 391 source files**.
- Generated-owner equality: **12 / 12 engine outputs**.
- `node --check` across all 640 currently untracked JavaScript files:
  **640 passed, 0 failed**.
- `git diff --check`: **failed on 13 pre-existing HTML trailing-whitespace
  findings** outside this recovery lane. No recovery JavaScript or CSS file
  was named by the check.

## Root-cause fix

The release caution identified during recovery is now resolved:

- `scripts/minify.js` generates only explicit source-to-output pairs and no
  longer performs broad in-place source passes.
- `scripts/build-dist.js` optimizes eligible unpaired JavaScript and CSS only
  after copying it into `dist`.
- `tests/source-safe-minification.test.js` locks the source-immutability and
  deploy-optimization contract.

The real minification step preserved the SHA-256 hashes of four representative
recovered sources. The real deploy-artifact build then optimized 1,108
JavaScript and 415 CSS files while preserving those source hashes, and
`npm run audit:dist` passed.
