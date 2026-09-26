# Next free-app language batch: integrated source proof, 2026-09-26

## Scope

Three bounded improvements are integrated on the language release source `a9821c33`, which includes main `22c93812`. They remain separate from the current release under validation. No production or full-catalogue parity claim is made.

- Mobile money: native transaction type, comparison inclusion/exclusion and calculation/expiry times in visible, copied and JSON human summaries. Machine schema, engine, fees and tariff data are unchanged.
- PDF Repair: native guest workflow, source/settings revision guards, unique ZIP names, physical page size and orientation after raster recovery, including custom PDF UserUnit values. Rasterization intentionally removes text/link/form semantics; large logical pages can still exceed browser resources.
- Document recommendations: native French/Swahili SSR text, accessible names and destinations on59 pages, native Swahili component labels, and bounded observation of late metadata. English artwork and mixed vocabulary in unchanged lazy fallback data remain separate limitations.

## Integration

Reviewed candidates b30d5749, b1eb4f23, 1d959ca3 and5063e353 were integrated as a4500a48,5fc9fec1,75d0d764 and5132a9c6. Independent reviews found no remaining actionable blocker in the bounded scope after the UserUnit correction.

The Swahili generator conflict was resolved by preserving both existing page-number repairs and the new PDF Repair entry. The generated PDF Repair page was regenerated through its owner. An extra trailing blank line in the new test was removed; the resulting append-only UserUnit test conflict retained the reviewed tests. No files were deleted, and the worktree was clean before and after browser execution.

## Tests and evidence

- Exact lockfile dependencies installed with npm ci in this worktree.
- French recommendation owner:0 stale outputs across32 selected rows.
- Swahili recommendation owner:0 stale outputs; full Swahili document contract31/31 passed.
- Quote-engine and tariff-source tests:6 checks passed.
- Integrated source Chromium run: **62/62 passed in6.2minutes**, covering six specs: mobile-money market parity, copy feedback, export-time expiry, native output context, PDF Repair and related-document localization. Port4570 served this checkout; no existing server was reused. Private artifacts contain synthetic inputs only.
- Actual output checks include independently reopened quote JSON, PDF pages and ZIP members; custom units0.5/2/25 with four rotations and nonzero CropBox; bitmap allocation independent of physical unit scaling; late source/settings/ZIP cancellation; both localizer/component script orders and metadata escaping/lifecycle.
- git diff --check passed; no deletions against the integration base.

Private coordinator log: language-next-source-20260926.log; output directory: language-next-source-artifacts, under the existing September15 language-programme evidence folder. Per-tool reports retain detailed source-review and earlier test limitations.

## Remaining release work

This proves integrated source behavior only. Final main reconciliation, full build and artifact verification, security/locale checks, exact-candidate CI, deployment identity and live verification remain required. Main22c also requires the publisher's separate one-line blog-reading correction; preserve its finalized corrective commit before publishing this batch. Pro remains deferred until the free-app programme is complete.
