# App consistency repair pass — 16 September 2026

## Changed

- `uganda/ug-paye.html`: native keyboard-operable buttons for residency,
  deductions, and rate panels; pressed/expanded state exposed to assistive
  technology. Residency choices are mutually exclusive, including saved-scenario
  restoration. Corrected gross-salary period label, readable slider name, and
  source-check date. Fixed 320px guide overflow and dark-mode toggle-label contrast.
- `tools/lobola-calculator/index.html`: the negotiation brief now rounds monthly
  savings upward, matching the existing savings cards and covering the budget.
- `reports/repair-first-triage-20260916.md`: all 39 repair-first flags classified
  against their HTML and score evidence. Every flagged route is noindex; these
  are indexing/locale-readiness review items, not 39 established runtime failures.
  No indexing restrictions or locale launch policies were changed.

## Verified

- PASS: Uganda shared-engine tests and Lobola cluster contract tests.
- PASS: whitespace check.
- Browser: Space/Enter operate Uganda's controls; only one residency choice stays
  selected; rate panel reports its expanded state. Monthly and annual gross
  labels match their period. Synthetic resident input 1,500,000 still yields
  1,073,000 net with the existing default deductions.
- Browser: Uganda has no document overflow at 320, 390, and 1280px in the checked
  states. Dark toggle labels now resolve to a light foreground, and focused
  controls remain outlined. No captured console errors.
- Browser: Lobola synthetic 10,000 cash + 1,000 gifts + 2,000 ceremony has total
  14,300 including the default buffer; both six-month targets and the brief now
  show 2,384. Copy-family-summary action reports success. No document overflow at
  390px and no captured console errors.

## Limits and release

Local verification only; not deployed. Tax law was not changed or independently
re-researched. Engine behavior is guarded by existing tests. The 39 metadata
flags do not constitute browser certification. No real contact/newsletter
message was sent, and server email delivery remains unverified. No account,
payment, or database operation was performed. PDF export was not reverified in
this pass. Full release build, artifact, and security gates remain for shipping.

Prior audit output changes in `reports/tool-quality-ranking.*` remain preserved
separately from this repair commit. Prior three-tool UX commit is also preserved.

## Next quality work

Use the locale readiness policy to decide whether each noindex surface is a
finished tool, a partial translation, or an intentional fallback. Verify actual
input-to-output and export journeys before changing availability claims. Run a
controlled form-delivery test separately from the already-verified required-field
checks, then release the validated UX fixes through the normal release gates.
