# Invoice payment and currency truth repair — 2026-09-16

## Confirmed before state
Read-only Chromium reproduction on all three invoice-generator locales: USD 100 total, USD 25 recorded payment, net-30 terms. Selecting Receipt silently changed payment to USD 100, terms to due-receipt, and marked the document paid. Actual downloaded PDFs then recorded paid 100 / balance 0. Returning to Invoice retained those invented values. Estimate retained the payment but displayed conflicting paid/draft statuses. These persisted after a 500 ms settled-state probe.

A custom synthetic tax rate of 12.34 was replaced by 16 when currency changed to KES. This is evidence of user-value replacement, not verification of either tax rate. The old FAQ explicitly advertised country-based automatic rates.

Baseline evidence outside product source: `../invoice-mode-investigation.json`, `../invoice-mode-settled-investigation.json`; repaired actual PDF probes: `../invoice-mode-after.json`.

## Source-owned correction
- English invoice source: mode selection changes document type without mutating recorded payment or terms. Receipt preview no longer invents payments. Starting a new receipt no longer checks Paid automatically.
- Shared enhancement owner: payment status derives from the existing totals/payment/withholding results. Preview and PDF show unpaid, partial, paid or settled consistently. The existing checkbox explicitly records full payment; its native label explains that unchecking clears the recorded payment. Editing line items after recording payment preserves the recorded amount and recalculates status. Overdue warnings remain separate from payment status so UI/PDF payment labels agree.
- Currency selection preserves entered tax type, rate and amounts. Native FAQ/help explains that choosing currency does not convert amounts or determine tax rules. Existing rate data and initial defaults are untouched.
- Updated only invoice entries in FR/SW lexicon source and regenerated only their invoice routes through their owners.

## Validation
- Initial complete payment suite: 3 Chromium cases passed in 1.3 minutes. Strengthened final rerun: 3 passed in 1.1 minutes, including overdue-warning/payment-status consistency. The all-locale test covers four mode changes with actual parsed PDF downloads, tax preservation, JSON backup/restore, contradictory historical paid flag, explicit full payment with synthetic withholding, line-item edit after payment, explicit clear, saved-card restore after reload, mobile 320/390 and no fixture content in requests.
- Existing Unicode/font-failure, long-document parsed/raster geometry and standard invoice workflows: 11 Chromium cases passed in 3.8 minutes. The final overdue-status refinement is covered by the strengthened payment suite.
- Targeted FR generator check: 1 selected owner, 0 stale. SW: 1/1 reconciled.
- Shared numeric owners `h()` and `y()` compare byte-identical to the prior committed candidate.
- Syntax and diff checks pass. `npm run validate:hreflang` passed: 11,559 public pages, 5,288 equivalence groups.

## Limits
No statutory rate review or financial guidance. No source freshness, acceptance, route/canonical, analytics, or deployment changes. Currency conversion remains absent and is now stated explicitly. Existing saved invoices are restored by choosing a saved card; reload alone does not restore the active draft. The first test iteration assumed automatic restoration and was corrected to exercise that actual existing workflow.
