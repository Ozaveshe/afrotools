# French Agriculture parity closeout

Status: **PASSED — 447/447 accepted**

Baseline: detached `8ce5cac175e42201968b1f7540752d6acf92d4ca`, matching `codex/fr-parity-wave1-integration-20260728`.

This receipt supersedes the historical stop checkpoint in `reports/fr-agriculture-parity-stop-receipt-2026-07-28.md`. It records local worktree proof only. Nothing was committed, pushed, opened as a PR, merged, deployed, or applied to production.

## Exact programme counts

| Contract | Final count |
|---|---:|
| Exact English canonical Agriculture rows | 447 |
| Manifest-generated French owners | 443 |
| Hand-authored semantic French owners | 4 |
| Native French runtimes | 447 |
| Legacy iframe/transplant runtimes | 0 |
| Accepted rows | 447 |
| Pending rows | 0 |
| Acceptance receipt files | 34 |
| Unique normalized receipt rows | 447 |
| Extra `/fr/agriculture/**` files, untouched and uncounted | 193 |
| Missing dedicated artwork, separate non-blocking queue | 146 |

Machine-checkable owners:

- `data/localization/fr-agriculture-parity-manifest.json`
- `data/localization/fr-agriculture-parity-manifest.schema.json`
- `reports/fr-agriculture-extra-route-queue.json`
- `reports/fr-agriculture-missing-artwork-queue.json`
- `reports/fr-agriculture-acceptance/*.json`

## Final singleton waves

### Export Documents

- Preserved 54 `country-index.js` country owners, six regions, top-crop identifiers, source order, and the accepted English hub's 108 rendered cards.
- Added `engines/src/export-docs-directory-engine.js`.
- Kept the 54 existing country checklist subroutes outside the manifest, untouched, unlinked from the new French runtime, and uncounted.
- French output is a native local planning directory with PDF, CSV, JSON, TXT, copy, share, local-save, and reset.
- Proof: 54 English owner profiles, 54 engine profiles, 54 French profiles, and isolated browser acceptance.

### Tractor Calculator

- Captured 35 country/equipment defaults, 420 arithmetic profiles, and 21 rendered workflows before extraction.
- Added `engines/src/tractor-calculator-engine.js` and migrated the English page to a thin controller.
- Preserved seven country/currency identities, five equipment types, purchase-price defaults, hire rates, fuel, maintenance, depreciation, residual value, amortizing finance, comparison winner, surface break-even, and contract-income behavior.
- French output owns native copy, errors, results, limitations, privacy, and all eight actions/exports.
- Proof: 476 English invariants, 420 engine profiles plus 35 default profiles, 420 French profiles, and isolated browser acceptance.

### Crop Insurance

- Established the exact boundary between the generic Day-6 hub formula and the separate 15-country static programme directory.
- Added `engines/src/crop-insurance-hub-engine.js` and delegated the maintained Day-6 English workflow to it without changing the other 15 shared entry workflows.
- Preserved 320 calculation profiles, four validation states, 15 country identities, five region groups, and static programme counts.
- The French hub does not turn static country programme data into current offers, rates, subsidies, eligibility, or payout claims. Its 15 country subroutes remain untouched and uncounted.
- Proof: 320 English calculations, four validation profiles, 15 directory rows, 320 French profiles, and isolated browser acceptance.

## Programme integrity proof

- Manifest build: 447 rows, 443 generated owners, four hand-authored owners.
- Manifest test: passed with 447 rows.
- Receipt normalization audit: 447 receipt rows, 447 unique, zero missing, zero outside-manifest, zero duplicates.
- Physical output audit across all 447 rows: zero iframe/transplant runtimes.
- Metadata audit across all 447 rows: zero failures for `lang=fr`, self-canonical, OG URL, English/French hreflang, `schema.inLanguage=fr`, and French AI route mapping.
- AI map freshness check: passed.
- Deletion review: zero deletions.
- `git diff --check`: passed.

The final three singleton suites were also rerun together on isolated port `42984` after verifying `tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt`: **6 passed (23.0s)**. No port-4173 process was used or stopped.

## Scope and carried queues

- No master ledger, sitemap, sitewide localization build, broad hash/build output, commit, push, PR, merge, Netlify deploy, or production action was performed.
- The 193 extra French Agriculture files remain a separate duplicate/noindex decision queue.
- The 146 missing dedicated artwork items remain a separate evidence queue and do not receive generic-artwork credit.
- Static rates, prices, programmes, providers, authorities, timelines, availability, and other changing assumptions remain explicitly non-live and require current source confirmation where each receipt states that limitation.
