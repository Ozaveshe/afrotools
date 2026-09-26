# Burkina Faso payroll: temporary review-required guardrail

Reference date: 2026-09-26. Isolated baseline: `b9591cd19424eee477db576b6d95459da686e4ec` (fetched origin/main).

## Scope and reason

English, French and Swahili payroll implementations disagree and do not collect enough inputs to substantiate all applicable regimes. This change makes automatic payroll temporarily unavailable. It does not validate or correct the old arithmetic and is not completed payroll parity.

- Native page titles, descriptions, results and source panels explain the review requirement. Unsupported current-year, all-deductions and rate-table claims are withdrawn.
- Automatic net pay, employer cost, reverse calculation, AI analysis, result sharing and PDF/result exports cannot run. Legacy controllers and PDF templates remain byte-for-byte as inactive script text; the active runtime only edits inputs and explains unavailability.
- The form remains editable. No storage deletion or migration occurs. Canonicals and hreflang are unchanged. Existing AI and lead-form entry fields are withdrawn with their unsupported output workflows; existing local storage is untouched.
- The existing `paye-bf-source` record supplies its stale state and historical `2025-07-01` review date to all three native source panels. No source registry dates, rates, caps, formulas or historical proof receipts change. Native panels retain DGI/CNSS links and the existing error-report route.
- No verified-deductions-entry workflow exists here, so the page honestly explains unavailability instead of adding another calculator or silently assuming base salary, professional category, allowances or RAMU applicability.

## Owners and build impact

`scripts/build-bf-payroll-review.js` owns the bounded three-page transform and runs at the end of `build:surfaces`. `assets/js/pages/bf-payroll-review.js` is the non-calculating input/status runtime. The Swahili local-export normalizer explicitly preserves this BF review state; its test requires the gate and absence of an export button, while the other 25 routes retain their export assertions.

The three HTML pages are committed outputs from the owner. The large markup reduction is intentional removal of unsupported results, rate tables, claims, export controls, AI cards and obsolete lead modal. No files are deleted. Rollback is a revert of this commit; resuming payroll instead requires a separately reviewed engine and scope, not removal of the guard alone.

## Validation

PASS:

- `node scripts/build-bf-payroll-review.js` (zero drift) and `node tests/bf-payroll-review.test.js`.
- Nine Chromium cases in `tests/e2e/bf-payroll-review.spec.js`: EN/FR/SW normal use, JavaScript disabled, runtime request blocked. Normal cases exercise retained synthetic inputs/local storage, old export/share/AI entry points with an injected stale result, no downloads/popups/submissions, no page errors, native source state/date and 320px overflow. Three actual mobile screenshots were captured and reviewed.
- Exact pristine-baseline regeneration matches all three current pages. Six inline controller bodies, salary input tags, canonical/hreflang links remain unchanged; source registry has no diff. Private receipt: `../evidence/preservation-proof.json`.
- `node tests/swahili-paye-26-parity.test.js` (historical controller-hash preservation only, not present payroll availability), `node tests/swahili-paye-local-exports.test.js`, `node scripts/normalize-sw-paye-local-exports.js`, `node tests/swahili-paye-report-language.test.js`.
- `node tests/french-finance-parity.test.js` (6 static contracts; historical export receipts are not new runtime certification).
- `node tests/tool-verification.test.js` (183 pages), runtime syntax check and `git diff --check`.

Browser evidence is in `../evidence/final-browser/`. Known analytics requests are blocked by the synthetic test harness; other POSTs are observed and blocked, with none emitted by the exercised output paths. No live financial records or Supabase access were used.

## Limits / next stages

No full build, deploy artifact, main push, merge or production validation was performed. The coordinator must verify the final generated artifact during release; later generator/SEO passes must preserve this review-required state. Existing historical parity/export receipts remain historical and do not override this temporary withdrawal. Shared related-tool artwork/copy, footer and other inherited page styling are outside this change.

Stage 2 remains a shared pure engine with verified reference rules and explicit inputs/contributions. Stage 3 remains proof of latest amendments, rounding, regimes and RAMU applicability before any current-law claim. The primary-source investigation is preserved separately under `burkina-salary-research-20260926/evidence/REPORT.md`; this stage adds no legal certification or freshness claim.

