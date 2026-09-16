# Remittance export state review — 2026-09-16

Base: 2dd1a348. Fetched origin/main: 7e422c194f6ef126fef13d3d1eec2666c1de216c.

Routes tested: /tools/remittance-compare/, /fr/tools/transfert-argent/, /sw/zana/ulinganisho-uhamishaji-pesa/.

The shared runtime reused the last calculation for export. At the exact expiry boundary it downloaded a quote as not-expired although the engine correctly excludes it on recalculation. All three baseline browser cases failed this assertion (remittance-state-before-utc). Exports now recalculate before copying/downloading. Editing clears the stale validation message; rejected or absent clipboard APIs with an unsuccessful local fallback now announce native failure instead of leaving calculation success as feedback.

Validation: three Chromium cases passed, covering exact-boundary copy, reopened JSON, invalid input followed by correction, successful/rejected/missing clipboard, and no requests containing synthetic quote labels. Pure engine tests passed. No engine, fees, data, registry, generated pages or acceptance records changed. These are user-entered quotes, not live provider quotations.

Remaining audit: field-specific validation and focus, native payout labels, copied context completeness, grouping assumptions, third-quote reset, mobile/dark accessibility and discoverability claims. This scoped fix is not whole-app acceptance. Initial test run used host timezone and was corrected to explicit UTC before recording baseline expiry proof.
