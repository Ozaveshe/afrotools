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

## Export context follow-up

Copied summaries previously omitted fee, effective rate, payout, delivery and checked/expiry timestamps. They now retain these values with native labels, both currency units and ISO timestamps including timezone; actual expiry state remains separately labeled. Result cards now show payout, delivery and actual expiry too. User labels remain text content and are not translated. JSON retains the existing complete machine-readable schema unchanged.

Combined final browser run: 15/15 passed in 27.4s (remittance-context-final), including native copied context, exact timestamp/fee/currency preservation and the full mobile/dark/reset matrix after the longer result cards. Syntax and diff checks pass. French-only theme button is emitted only by pageFr; its French labels match that existing control. EN/SW use the shared navbar theme control.

## Native controls, validation and discovery

Swahili payout options now read Benki, Pochi ya simu, Taslimu and Nyingine, preserving stable enum values. The generator template owns these labels. Its explicit --sync-payout-labels mode updates exactly three uniquely identified selects per SW route and preserves every other byte; missing/duplicate controls fail. Full generation still composes its existing source owners normally. A trial full regeneration removed release metadata/footer additions, so that trial output was discarded before the scoped synchronization.

Shared validation now identifies the first HTML-invalid field or the exact engine-invalid quote field, focuses it, adds aria-invalid and a description linking the native alert, and removes stale field errors on editing/reset. Tests exercise excessive fees, expiry before observation, future observation and zero recipient amount in all three languages. The French legacy helper remains compatible in the browser evidence.

Registry descriptions no longer advertise eleven named providers, cheapest transfers or available country corridors. EN/FR/SW descriptions state the actual user-entered quote workflow and absence of live provider tariffs.

Checks: six focused Chromium cases passed in 14.9s; payout synchronization owner positive/negative tests passed; repeat synchronization found zero drift; pure engine test passed; registry audit passed; check-links found no broken links (141852 links,11793 HTML files). No provider freshness was verified.

## Corridor gap remains unresolved

Independent synthetic engine reproduction: USD100→XOF58000 labelled Senegal and USD100→XOF59000 labelled Côte d’Ivoire form the same USD|XOF|100 group; the second is marked highest. Supplying receiveCountry SN/CI is ignored. The UI has no explicit country controls. Thus equal currency and debit alone do not prove an interchangeable route. No engine change is included here. Proposed separate correction requires explicit normalized origin/destination context per quote before comparison; missing context should not silently establish route equivalence. Payout service equivalence also needs an explicit grouping decision.

## Confirmed corridor contract

The comparator now requires a recognized sending and receiving country on each quote. Its shared runtime owns visible, required, native country fields; inputs are preserved separately from normalized codes. The engine uses EN/FR/SW region names from Intl.DisplayNames plus two-letter codes and UK→GB alias. Unknown names fail at the corresponding field; UI help explains codes and country names. Different country pairs never rank together even with matching currencies/debit. Payout methods can differ within one corridor, and native help explicitly says services may not be equivalent.

The engine contract is opt-in requireCorridor:true, enabled by this EN/FR/SW comparator (including retired aliases). The separate crypto-remittance caller retains legacy behavior and needs its own reviewed corridor migration; this commit does not establish route equivalence there. JSON includes requireCorridor so replay retains the same grouping contract. Country recognition relies on browser Intl/CLDR language data, not a current provider eligibility database. It does not certify provider service availability or political/legal country status. Unknown/unavailable country recognition blocks calculation.

Independent fixtures: same USD/XOF/debit with SN versus CI produces no comparison; SN/Sénégal and GB/Royaume-Uni compare; original names survive; unknown/missing country fails; different origin separates; different payout remains comparable with context. Initial test caught UK alias overwriting GB; corrected before final source validation. Final21-case browser suite passed42.4s, including all3 country cases and exact downloaded JSON engine replay plus prior export/error/mobile/dark/reset cases. Both original arithmetic suite and new corridor node suite passed. The intermediate mixed-source run is not final evidence.

Existing historical French/native fixture suites have not yet been migrated to fill newly required country fields; their old fixed metric-index assertion also needs semantic lookup after result context additions. These are follow-up test-contract work, not acceptance proof. No deployment/full build/calculation-quality recertification has been performed in this candidate tree.
