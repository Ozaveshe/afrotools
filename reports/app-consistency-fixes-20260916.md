# App consistency repair pass — 16 September 2026

## User-facing fixes

- Uganda PAYE: native keyboard controls and pressed/expanded states for residence, deductions, period selection and rate panels; correct monthly/annual labels on recalculation; readable dark-mode labels; no 320px guide overflow; currency formatting retained in reverse-calculation results.
- Shared net-to-gross control: preserves the desired take-home input after calculation in every locale, preventing repeated clicks from increasing the target. Readable source changed and the owned generated asset rebuilt with the targeted minifier.
- Lobola: negotiation-brief savings round upward, consistently with the savings cards.
- Contact: shows success only after a successful server response; failures retain the message and enable retry. Added live status feedback and theme-aware cards/help content.
- Uganda PDF: announced preparation/error feedback, duplicate-request protection, and a filename using the generation date.

## Completion evidence

| Requirement | Evidence | Scope |
| --- | --- | --- |
| Uganda keyboard/accessibility | Space/Enter exercise residence, NSSF and rate panels; exclusive residence and expanded state verified; period controls expose pressed state | Local browser and source |
| Mobile/theme | Uganda checked at 320/390/1280px; Lobola at 390px; contact at 390/1280px; no document overflow in sampled states. Dark label/card colors and focus visually checked; contact light theme checked | Sampled routes/states, not whole-site certification |
| Calculator consistency | Uganda 1,500,000 monthly gross gives 1,073,000 monthly and 12,876,000 annual net; Annual survives recalculation. Reverse input 1,500,000 remains unchanged on repeated calculation, required gross stays 2,156,922, annual gross 25,883,064 | Browser plus engine and interaction tests |
| Lobola rounding | Synthetic total 14,300 gives 2,384 for both six-month savings displays; copy-summary reports success | Local browser and cluster contract |
| 39 repair-first records | Every flagged route joined to locale policy: 19 English fallback, 20 unavailable. Per-route source owner and readiness classification in repair-first-triage-20260916.md. No noindex protections or audit score caps removed | Complete source triage; runtime certification not claimed |
| Fallback handoff | Swahili AfroPayroll notice explicitly labels the English destination; following it renders the English tool. Yoruba invoice shows an unavailable notice with a Yoruba directory link; underlying form is still present, so policy classification is not proof the workflow is broken | Two browser samples |
| Form behavior | Empty contact submission focuses invalid name. Mocked successful response, rejected response and network exception verify success/retry and preservation of input | Browser validation and isolated handler tests; no real message sent |
| PDF export | Full Edge browser downloaded `afrotools-ug-paye-uganda-2026-09-16 (2).pdf`. Actual 13,200-byte file parsed as one page with Uganda PAYE Summary, monthly/annual sections and matching 1,073,000 / 12,876,000 / 352,000 values | Actual browser download plus PDF parser; synthetic data |

## Tests run — all passed

- node tests/uganda-paye-shared-engine.test.js
- node tests/uganda-paye-interactions.test.js
- node tests/net-to-gross-repeat.test.js (English, French and Swahili; source and generated asset)
- node tests/lobola-cluster-contract.test.js
- node tests/contact-form-feedback.test.js
- node tests/tool-quality-integrity-caps.test.js
- git diff --check
- Targeted regeneration: node scripts/minify.js --only=assets/js/lib/src/net-to-gross.js (using existing canonical dependency installation)

## Risks and release boundary

Local source and browser verification only; not deployed. Tax law and calculation engines were not changed or independently re-researched. No sensitive real input, actual contact/newsletter message, account, database, or payment operation was used. Contact delivery to a real inbox remains unverified; handler tests used an isolated fake provider. Production acceptance still requires normal build, publish-artifact and security gates; these were not run because this batch is not a deployment. Routes, canonical URLs, analytics event names and locale launch policy were preserved. The only regenerated product asset is the shared net-to-gross output.

Prior tool-quality report changes and the untracked website-health report remain preserved separately. Rollback is by reverting the scoped repair commits; no feature flag is required.
