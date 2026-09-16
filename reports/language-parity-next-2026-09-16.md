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

## Required remaining work

- Confirmed CV defect: three complete-form Nairobi PDFs in the earlier styled-export matrix extend below the A4 page. Repair and superseding physical-bound evidence are pending; the matrix must not be treated as unqualified visual acceptance.
- CV compact, one-page, manual-break, print and long-string cases remain under review. Raster PDF validity does not establish selectable text, universal shaping or DOCX visual correctness.
- Register the new conditional birth-leave engine as a high-risk legal calculation, with versioned provenance and independent fixtures. Current calculation-quality inventory is stale; no blanket digest refresh is authorized by this report.
- Country leave sources still contain unresolved current-law, effective-date, eligibility and unit differences. The Côte d’Ivoire workflow is conditional planning; Senegal’s adopted 2026 bill must not be called current law without commencement proof.
- Airtel's reviewed reference is labelled January–March 2026; September validity is unconfirmed. MTN withdrawal tax is excluded from the published-fee subtotal and total debit remains unknown. Account eligibility requires separate confirmation.
- A complete build, publish-artifact audit/security checks and artifact-level browser checks are still required for this next batch.

## Release separation

The preceding batch at `7e422c194f6ef126fef13d3d1eec2666c1de216c` passed all three jobs in CI run `35108553583` and was pushed to main. Its genuine Git production deployment `6aaaad6e97879b00088a9fde` was still building at the last provider check. This next batch is isolated and is not part of that deployment. Further main publication is coordinated with the education release task.
