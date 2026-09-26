# Next free-app language batch: integrated source proof, 2026-09-26

## Scope

Three bounded improvements are integrated on the language release source `a9821c33`, which includes main `22c93812`. They remain separate from the current release under validation. No production or full-catalogue parity claim is made.

- Mobile money: native transaction type, comparison inclusion/exclusion and calculation/expiry times in visible, copied and JSON human summaries. Machine schema, engine, fees and tariff data are unchanged.
- PDF Repair: native guest workflow, source/settings revision guards, unique ZIP names, physical page size and orientation after raster recovery, including custom PDF UserUnit values. Rasterization intentionally removes text/link/form semantics; large logical pages can still exceed browser resources.
- Document recommendations: native French/Swahili SSR text, accessible names and destinations on 59 pages, native Swahili component labels, and bounded observation of late metadata. English artwork and mixed vocabulary in unchanged lazy fallback data remain separate limitations.

## Integration

Reviewed candidates b30d5749, b1eb4f23, 1d959ca3 and 5063e353 were integrated as a4500a48, 5fc9fec1, 75d0d764 and 5132a9c6. Independent reviews found no remaining actionable blocker in the bounded scope after the UserUnit correction.

The Swahili generator conflict was resolved by preserving both existing page-number repairs and the new PDF Repair entry. The generated PDF Repair page was regenerated through its owner. An extra trailing blank line in the new test was removed; the resulting append-only UserUnit test conflict retained the reviewed tests. No files were deleted, and the worktree was clean before and after browser execution.

## Tests and evidence

- Exact lockfile dependencies installed with npm ci in this worktree.
- French recommendation owner: 0 stale outputs across 32 selected rows.
- Swahili recommendation owner: 0 stale outputs; full Swahili document contract 31/31 passed.
- Quote-engine and tariff-source tests: 6 checks passed.
- Integrated source Chromium run: **62/62 passed in 6.2 minutes**, covering six specs: mobile-money market parity, copy feedback, export-time expiry, native output context, PDF Repair and related-document localization. Port 4570 served this checkout; no existing server was reused. Private artifacts contain synthetic inputs only.
- Actual output checks include independently reopened quote JSON, PDF pages and ZIP members; custom units 0.5/2/25 with four rotations and nonzero CropBox; bitmap allocation independent of physical unit scaling; late source/settings/ZIP cancellation; both localizer/component script orders and metadata escaping/lifecycle.
- git diff --check passed; no deletions against the integration base.

Private coordinator log: language-next-source-20260926.log; output directory: language-next-source-artifacts, under the existing September 15 language-programme evidence folder. Per-tool reports retain detailed source-review and earlier test limitations.

## Remaining release work

This proves integrated source behavior only. Final main reconciliation, full build and artifact verification, security/locale checks, exact-candidate CI, deployment identity and live verification remain required. Main 22c also requires the publisher's separate one-line blog-reading correction; preserve its finalized corrective commit before publishing this batch. Pro remains deferred until the free-app programme is complete.
## Completed optimized-artifact verification

The frozen source `b0b9359b` includes the reviewed one-line blog-reading correction `066ab548` locally. Blog verification passed before the build. `npm run build:deploy` passed: 18,171 copied files; 1,838 JS and 623 CSS assets optimized; 11,803 HTML pages checked with zero content blockers/warnings and three reviewed exceptions; 12,865 public-claim surfaces with zero errors; all 11,510 eligible analytics surfaces covered.

All **62/62 Chromium cases passed in 7.0 minutes against the optimized artifact**, with a fresh local server on port 4570 and a distinct output directory. This includes reopened PDF/ZIP/CSV/JSON outputs, page geometry and custom UserUnit checks, current source/settings safeguards, quote expiry/context, and native recommendation rendering in both script orders.

All six subsequent release gates passed: `audit:dist`, `security:scan`, `build:checks`, `build:i18n:validate`, `validate:hreflang`, and `data:fallbacks:check`. Whitespace and deletion checks passed. The regenerated source diff has 1,644 files: 1,640 contain only asset fingerprint replacements; one adds the fingerprint to the reviewed blog-reading include; two update the public-claim audit count from 46,041 to 45,813 with zero errors; and the Swahili PDF Repair page has generated head ordering/fingerprints normalized. No files were deleted.

These changes remain separate from the current language release. Publisher main has now finalized the same blog correction as `b9591cd1`; preserve that ancestry and the current language release before final candidate CI. Exact-candidate CI, production identity and live checks are still pending. The separate BOQ discovery candidate and Burkina Faso payroll investigation are not included here. No whole-app or catalogue-wide parity claim is made.
