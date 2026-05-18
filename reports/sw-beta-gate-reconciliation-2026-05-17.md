# Swahili Beta Gate Reconciliation

Date: 2026-05-17

Prompt: 121 - Prompt 120 Gate Reconciliation

## Verdict

Swahili itself is beta-complete with carried debt. The checkout is not clean, but the remaining red proof from the last completed gate is not a Swahili product blocker.

The final Prompt 120 gate report was not present in `reports/` at this reconciliation point. The previous run was interrupted before a Prompt 120 report was written, so this reconciliation uses the latest completed milestone proof: `reports/sw-release-candidate-proof-2026-05-16.md` and `.json`, plus the production-readiness, specialist queue, source-layer, and strategy reports.

## Current Evidence

- Latest completed proof report: `reports/sw-release-candidate-proof-2026-05-16.*`.
- Swahili routes: `852` total, `850` indexable.
- Direct one-level `/sw/zana/` routes: `465`.
- Swahili registry hrefs: `700/700` resolving, `0` broken.
- `/sw/zana/` registry hrefs including nested routes: `469/469` resolving, `0` broken.
- Direct `/sw/zana/` registry coverage: `415/465`, or `89.25%`.
- Hreflang warnings after the completed full proof: `0`.
- Broken internal links by `check-links`: `0`.
- Search QA: `21` query buckets, `0` broken or English-only results in the latest search tuning report.

## Issue Classification

| Issue | Classification | Swahili blocker? | Notes |
| --- | --- | --- | --- |
| Missing final Prompt 120 report | Proof-tooling issue | No | The gate was interrupted before a report was committed; Prompt 119 is the latest complete proof artifact. |
| `reports/hausa-visible-copy-ledger.md` EOF blank-line failure | Non-Swahili dirty-tree blocker | No | This keeps `git diff --check` red but is a Hausa report hygiene issue, not Swahili page/source debt. |
| Broad dirty-tree churn in French, Hausa, cars, generated output, and reports | Non-Swahili dirty-tree blocker | No | Must be preserved and separated before any deploy packaging decision. |
| 20 JSON-LD auto-fix candidates | Non-Swahili carried debt | No | Prompt 103 classified these as French/non-Swahili. |
| Specialist queue: 22 health/legal/religious/finance/education/admin routes | Swahili carried debt | No | Safe as labeled planning/bridge surfaces; not all are registry candidates without specialist review. |
| Blog bridge to English articles | Swahili carried debt | No | Bridge is honest; future work can create Swahili article stubs. |
| API docs and pricing remain English-only | Swahili carried debt | No | Bridge is honest; future work can add Swahili overview/explainer surfaces. |
| Source-layer migration blocked for real writes | Future enhancement | No | Dry-run planning is alias-aware, but real Swahili page-pack writing is not route-safe yet. |
| Remaining direct `/sw/zana/` registry gap | Future enhancement | No | Registry coverage is high and quality-screened; remaining gap should not be filled blindly. |

## Decision

For Swahili product readiness: beta complete.

For this dirty checkout as a deployment package: shippable only with carried-debt awareness or after separating Swahili changes from unrelated French/Hausa/cars/generated churn.

Future Swahili work should focus on specialist review, selected blog/API stubs, source-layer safety, and carefully screened final registry coverage rather than reopening the core beta gate.
