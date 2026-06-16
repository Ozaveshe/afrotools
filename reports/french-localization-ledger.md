# French Localization Ledger

Generated: 2026-06-16

This is an audit-only ledger. It does not translate or edit French pages. English source inventory follows the skip logic in `scripts/build-i18n.js`.

## Headline Metrics

- Total English source pages: 5836
- Total French pages: 3440
- Raw page-count completion: 58.94%
- English-backed route-mapping completion: 56.36%
- Indexable mapped French route owners: 3289
- French registry coverage: 100% of registry-eligible French tool/money/PDF routes (699/699)
- French registry entries: 1141
- English-backed French routes: 3397
- French-only routes: 34
- Generated output routes: 2343
- Hand-authored French pages: 1097
- Unclear source-of-truth routes: 0

## Coverage By Section

| Section | English source pages | French pages | Unique English mapped | Raw coverage | Mapped coverage | Registry coverage |
|---|---:|---:|---:|---:|---:|---:|
| tools | 2579 | 1041 | 1025 | 40.36% | 39.74% | 100% |
| cars | 1582 | 1081 | 1081 | 68.33% | 68.33% | n/a |
| agriculture | 645 | 636 | 636 | 98.6% | 98.6% | n/a |
| blog | 204 | 156 | 153 | 76.47% | 75% | 100% |
| salary-tax | 66 | 97 | 62 | 146.97% | 93.94% | 100% |
| vat-business-tax | 56 | 91 | 54 | 162.5% | 96.43% | 100% |
| document-pdf | 1 | 1 | 1 | 100% | 100% | 100% |
| widgets | 226 | 145 | 144 | 64.16% | 63.72% | n/a |
| pro | 0 | 2 | 0 | n/a | n/a | n/a |
| auth | 2 | 1 | 0 | 50% | 0% | n/a |
| telecom | 15 | 11 | 11 | 73.33% | 73.33% | n/a |
| country hubs | 56 | 67 | 54 | 119.64% | 96.43% | n/a |

## Top 20 Blockers

1. French pages with no English-backed source mapping (34)
   - Recommendation: Decide whether each route is intentional French-only content or should be mapped/canonicalized to an English source before translation work expands.
   - Examples: /fr/404, /fr/api/docs, /fr/blog/frais-orange-money-guide-2026, /fr/blog/guide-irpp-senegal-2026, /fr/blog/wave-vs-orange-money-senegal-2026, /fr/comparer/senegal-vs-cote-divoire-impots, /fr/dashboard/api, /fr/dashboard
2. French aliases or bridge routes (101)
   - Recommendation: Keep aliases out of registry/search promotion unless they are deliberate bridge pages.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/algeria, /fr/benin/bj-paye, /fr/benin/bj-vat, /fr/burkina-faso/bf-paye, /fr/burkina-faso/bf-vat, /fr/burkina-faso/bf-vat
3. English source pages without a mapped French route (2546)
   - Recommendation: Use high-value section counts to choose the next implementation batch instead of translating randomly.
   - Examples: afrowork, afrowork/api, afrowork/whatsapp, agriculture/crop-planning-yield, agriculture/equipment-infrastructure, agriculture/farm-finance-roi, agriculture/farm-payroll/_template, agriculture/inputs-feed-operations
4. Hand-authored French pages that need owner confirmation (1097)
   - Recommendation: Treat hand-authored pages as source-sensitive and avoid regeneration until ownership is clear.
   - Examples: /fr/404, /fr/algerie/calculateur-salaire-net, /fr/algerie/calculateur-tva, /fr/algerie, /fr/api/docs, /fr/benin/calculateur-salaire-net, /fr/benin/calculateur-tva, /fr/blog/frais-orange-money-guide-2026
5. salary-tax raw French count materially exceeds mapped coverage (35)
   - Recommendation: Resolve salary-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-paye, /fr/car/cf-paye, /fr/dr-congo/cd-paye, /fr/dr-congo/cd-paye
6. vat-business-tax raw French count materially exceeds mapped coverage (37)
   - Recommendation: Resolve vat-business-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-vat, /fr/car/cf-vat, /fr/docs/api/vat/calculate, /fr/docs/api/vat, /fr/dr-congo/cd-vat, /fr/dr-congo/cd-vat
7. auth has no English-backed French route coverage (2)
   - Recommendation: Create a discovery-only auth source/route map before translating this section.
   - Examples: auth, auth/login
8. country hubs raw French count materially exceeds mapped coverage (13)
   - Recommendation: Resolve country hubs aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: none

## Finding Counts

- Duplicate French canonicals: 0
- English sources mapped to multiple French routes: 0
- Missing reciprocal hreflang pairs involving French pages: 0
- French pages with English title/H1/UI labels: 0
- Registry-eligible French pages not represented in registry: 0
- Registry entries pointing to non-preferred French routes: 0
- Registry entries pointing to missing French routes: 0

## Recommended Next Implementation Batch

1. Optional wrapper-stabilization batch for remaining generated cc-paye/cc-vat aliases: use the existing redirect-wrapper pattern only where a preferred semantic route is live, and preserve custom wrappers that already noindex or redirect.
2. Registry closeout for PAYE/TVA temporary cc owners only where no semantic /fr/<country>/calculateur-* route exists; do not add registry rows for aliases.
3. Semantic route creation decision for temporary VAT/PAYE exceptions such as Djibouti VAT and the remaining registry-missing cc routes before any discovery expansion.
4. French route-owner re-gate: rerun the ledger, build:i18n validation, hreflang validation, check-links, and audit after the next money-route batch.

## Notes

- Raw page count overstates product readiness because it includes French-only, alias, generated, and hand-authored pages together.
- The English-backed route mapping percentage counts indexable, non-alias French route owners only.
- The safer completion number is the English-backed route mapping percentage plus registry coverage for tool-discovery surfaces.
- Detailed per-route classification and full finding lists are in `reports/french-localization-ledger.json`.
