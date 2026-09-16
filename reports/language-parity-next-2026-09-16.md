# Language parity — next free-app batch

Status: in progress; not released. English, French and Swahili free apps remain the scope. Pro follows free-app work. This report does not certify catalog-wide or whole-app parity.

## Integrated improvements

- CV Builder: local JSON backup review/restoration, consistent template resolution and saved fields, native headings, user-text protection, portable project/reference visibility, additional enabled fields, mobile paper columns and padding.
- Mobile Money: comparable market identity and expiry recalculation, complete copied quote context, native clipboard failures, native expiry/field validation, third-quote reset, stale tariff result invalidation, and source-qualified tariff outputs.
- Leave Calculator: French planning workflows, native reports and restorable scenario inputs; Swahili active summaries; UTC-stable calendar dates; exact parental duration; invalid payout rejection; source-qualified Côte d’Ivoire annual reference and conditional birth-permission planning.

## Coordinator evidence

- CV: 30 focused node checks passed. Combined backup, portable-field and visibility run passed 12 cases; two trace-recording timeouts subsequently passed with identical assertions/timeouts and tracing disabled. The final combined backup/paper/tariff run passed all 12 cases.
- Mobile Money: 12 focused engine/configuration/source-reference tests passed. Combined state/copy run passed all 18 cases. Manual/expiry/copy integration passed 16 cases and exposed two outdated display-label expectations; all six expiry/comparison cases passed after updating only native display expectations, preserving machine-code assertions.
- Leave: integration run passed 15 cases and found three ambiguous result selectors. All six affected French/base cases passed after scoping selectors to the rights panel. Three node checks and the holiday-reference owner check passed.
- Existing lint and type checks passed. Money runtime configuration and table owner checks report zero drift. CV registry resolves its advertised templates. These checks have their existing limited scope and do not substitute for actual output review.

- Link check passed: 141,852 internal links across 11,793 HTML files. Hreflang validation passed: 9,981 declaring pages, 32,532 relationships and 5,289 equivalence groups. These establish route integrity, not app behavior.

- Actual downloaded-PDF photo checks passed in all three locales (three browser cases); this does not resolve the separate clipping defect.

## Required remaining work

- The three cropped Nairobi PDFs are repaired. The coordinator independently verified hashes and physical image placement for all 120 superseding fixtures / 273 pages. This proves paper bounds for those fixtures, not unrestricted content or every export mode.
- CV manual-break and one-page repairs passed the combined 10-case browser run, including Senegal native exports and stale-PDF protection, in all three locales. Compact, print and long-string cases remain under review. Raster PDF validity does not establish selectable text, universal shaping or DOCX visual correctness.
- The conditional birth-leave engine is registered as a high-risk legal calculation with independent fixtures. Including the Senegal conditional planner and cross-year review cases, the integrated quality check passes 793 artifacts and 354/354 fixtures; existing records were preserved. Source authority, current-law support and effective dates remain review-required.
- Country leave sources still contain unresolved current-law, effective-date, eligibility and unit differences. The Côte d’Ivoire workflow is conditional planning; Senegal’s adopted 2026 bill must not be called current law without commencement proof.
- Airtel's reviewed reference is labelled January–March 2026; September validity is unconfirmed. MTN withdrawal tax is excluded from the published-fee subtotal and total debit remains unknown. Account eligibility requires separate confirmation.
- Full build:deploy, audit:dist, security:scan and the separate build:checks gate passed. Optimized-artifact browser runs passed 31 cases: 24 CV/mobile-money cases, four Senegal export/stale-result cases and three Côte d’Ivoire calendar/source-condition cases. A fresh full suite has not yet completed on this batch.

## Release separation

The preceding batch at `7e422c194f6ef126fef13d3d1eec2666c1de216c` passed all three jobs in CI run `35108553583` and was pushed to main. Its genuine Git production deployment `6aaaad6e97879b00088a9fde` failed with a hosting build timeout. Public release verification still identified `06e37ce57a8f8d705e032bee47768a98aa73371c`. The education release coordinator is preparing a combined, separately validated artifact deployment; no retry was initiated here. This next batch is isolated and is not part of that deployment. Further main publication is coordinated with the education release task.

## Broad baseline and repair follow-up

The full run at `8e87d731` finished with 1,095 test files enrolled, seven of seven audits passed, and no quarantines. It failed three CV section-heading fixture cases and the mobile-money owner fingerprint check. The CV fixture now explicitly enables and populates those sections; all 14 character-preservation checks pass. The scoped reviewed money fingerprints also pass their 20 oracle and 14 owner checks. This is targeted repair evidence, not a claim that a fresh full suite has passed after all subsequent integrations.
