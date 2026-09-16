# Remittance export state review — 2026-09-16

Base: 2dd1a348. Fetched origin/main: 7e422c194f6ef126fef13d3d1eec2666c1de216c.

Routes tested: /tools/remittance-compare/, /fr/tools/transfert-argent/, /sw/zana/ulinganisho-uhamishaji-pesa/.

The shared runtime reused the last calculation for export. At the exact expiry boundary it downloaded a quote as not-expired although the engine correctly excludes it on recalculation. All three baseline browser cases failed this assertion (remittance-state-before-utc). Exports now recalculate before copying/downloading. Editing clears the stale validation message; rejected or absent clipboard APIs with an unsuccessful local fallback now announce native failure instead of leaving calculation success as feedback.

Validation: three Chromium cases passed, covering exact-boundary copy, reopened JSON, invalid input followed by correction, successful/rejected/missing clipboard, and no requests containing synthetic quote labels. Pure engine tests passed. No engine, fees, data, registry, generated pages or acceptance records changed. These are user-entered quotes, not live provider quotations.

Remaining audit: field-specific validation and focus, native payout labels, copied context completeness, grouping assumptions, third-quote reset, mobile/dark accessibility and discoverability claims. This scoped fix is not whole-app acceptance. Initial test run used host timezone and was corrected to explicit UTC before recording baseline expiry proof.

## Mobile and dark-mode follow-up

All six initial light cases passed; all six manual-dark cases failed axe serious violations at 320/390px. Compare button contrast was 2.37:1. English injected source notice/badge contrast was 1.05–1.65:1; source links lacked distinguishing underline in all locales. Scoped selectors under data-remittance-parity now use existing theme variables and underline source links. Money comparator styles are unaffected.

Final matrix: 12/12 Chromium cases passed in 21.3s (remittance-mobile-after), across EN/FR/SW, 320/390px, initial light and manually switched dark. Each exercises keyboard third-quote selection and calculation, three visible result rows, no horizontal overflow, axe serious/critical checks over hero/main, then reset clearing results and disabling the third quote. Gradient heading contrast, complete screen-reader navigation and every field validation branch are not established by this test.

No current quote or provider freshness is established by these tests. The unchanged pure engine test is baseline arithmetic evidence only.
