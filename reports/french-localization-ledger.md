# French Localization Ledger

Generated: 2026-07-13

This is an audit-only ledger. It does not translate or edit French pages. English source inventory follows the skip logic in `scripts/build-i18n.js`.

## Headline Metrics

- Total English source pages: 5867
- Total French pages: 3753
- Raw page-count completion: 63.97%
- English-backed route-mapping completion: 59.26%
- Indexable mapped French route owners: 3604
- French registry coverage: 100% of registry-eligible French tool/money/PDF routes (1013/1013)
- French registry entries: 1452
- English-backed French routes: 3711
- French-only routes: 32
- Generated output routes: 2215
- Hand-authored French pages: 1538
- Unclear source-of-truth routes: 0

## Coverage By Section

| Section | English source pages | French pages | Unique English mapped | Raw coverage | Mapped coverage | Registry coverage |
|---|---:|---:|---:|---:|---:|---:|
| tools | 2593 | 1354 | 1338 | 52.22% | 51.6% | 100% |
| cars | 1582 | 1081 | 1081 | 68.33% | 68.33% | n/a |
| agriculture | 645 | 636 | 530 | 98.6% | 82.17% | n/a |
| blog | 218 | 156 | 153 | 71.56% | 70.18% | 100% |
| salary-tax | 66 | 112 | 77 | 169.7% | 116.67% | 100% |
| vat-business-tax | 56 | 91 | 55 | 162.5% | 98.21% | 100% |
| document-pdf | 1 | 2 | 1 | 200% | 100% | 100% |
| widgets | 226 | 145 | 144 | 64.16% | 63.72% | n/a |
| pro | 0 | 2 | 0 | n/a | n/a | n/a |
| auth | 2 | 1 | 0 | 50% | 0% | n/a |
| telecom | 15 | 11 | 11 | 73.33% | 73.33% | n/a |
| country hubs | 56 | 67 | 54 | 119.64% | 96.43% | n/a |

## Top 20 Blockers

1. French pages with no English-backed source mapping (32)
   - Recommendation: Decide whether each route is intentional French-only content or should be mapped/canonicalized to an English source before translation work expands.
   - Examples: /fr/404, /fr/api/docs, /fr/blog/frais-orange-money-guide-2026, /fr/blog/guide-irpp-senegal-2026, /fr/blog/wave-vs-orange-money-senegal-2026, /fr/comparer/senegal-vs-cote-divoire-impots, /fr/dashboard/api, /fr/dashboard
2. French pages with English title/H1/UI labels (7)
   - Recommendation: Use this as a QA queue after the ledger, starting with money and discovery surfaces.
   - Examples: /fr/tools/generateur-meta-tags, /fr/tools/conformite-donnees, /fr/tools/compte-a-rebours, /fr/tools/cout-cac, /fr/tools/formateur-json, /fr/tools/generateur-qr, /fr/tools/lien-whatsapp
3. English sources mapped to multiple French routes (11)
   - Recommendation: Choose one preferred French URL per English source and demote or redirect the rest.
   - Examples: agriculture/crop-yield/algeria (54), agriculture/fertilizer/algeria (54), african (5), data-productivity (5), education (5), legal (5), document-pdf (2), health (2)
4. Missing reciprocal hreflang pairs involving French pages (485)
   - Recommendation: Fix bidirectional alternates in a targeted hreflang pass after canonical decisions.
   - Examples: /fr/agriculture/crop-yield/angola -> /agriculture/crop-yield/algeria, /fr/agriculture/crop-yield/angola -> /fr/agriculture/crop-yield/algeria, /fr/agriculture/crop-yield/angola -> /sw/kilimo/mavuno/burundi, /fr/agriculture/crop-yield/angola -> /ha/noma/amfanin-gona-najeriya, /fr/agriculture/crop-yield/benin -> /agriculture/crop-yield/algeria, /fr/agriculture/crop-yield/benin -> /fr/agriculture/crop-yield/algeria, /fr/agriculture/crop-yield/benin -> /sw/kilimo/mavuno/burundi, /fr/agriculture/crop-yield/benin -> /ha/noma/amfanin-gona-najeriya
5. French aliases or bridge routes (77)
   - Recommendation: Keep aliases out of registry/search promotion unless they are deliberate bridge pages.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/algeria, /fr/benin/bj-paye, /fr/burkina-faso/bf-paye, /fr/burkina-faso/bf-vat, /fr/burkina-faso/bf-vat, /fr/burundi/bi-paye
6. English source pages without a mapped French route (2389)
   - Recommendation: Use high-value section counts to choose the next implementation batch instead of translating randomly.
   - Examples: afrowork, afrowork/api, afrowork/whatsapp, agriculture/crop-planning-yield, agriculture/crop-yield/angola, agriculture/crop-yield/benin, agriculture/crop-yield/botswana, agriculture/crop-yield/burkina-faso
7. Hand-authored French pages that need owner confirmation (1538)
   - Recommendation: Treat hand-authored pages as source-sensitive and avoid regeneration until ownership is clear.
   - Examples: /fr/404, /fr/agriculture/crop-yield/angola, /fr/agriculture/crop-yield/benin, /fr/agriculture/crop-yield/botswana, /fr/agriculture/crop-yield/burkina-faso, /fr/agriculture/crop-yield/burundi, /fr/agriculture/crop-yield/cabo-verde, /fr/agriculture/crop-yield/cameroon
8. salary-tax raw French count materially exceeds mapped coverage (35)
   - Recommendation: Resolve salary-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-paye, /fr/car/cf-paye, /fr/dr-congo/cd-paye, /fr/dr-congo/cd-paye
9. vat-business-tax raw French count materially exceeds mapped coverage (36)
   - Recommendation: Resolve vat-business-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-vat, /fr/car/cf-vat, /fr/docs/api/vat/calculate, /fr/docs/api/vat, /fr/dr-congo/cd-vat, /fr/dr-congo/cd-vat
10. document-pdf raw French count materially exceeds mapped coverage (1)
   - Recommendation: Resolve document-pdf aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: none
11. auth has no English-backed French route coverage (2)
   - Recommendation: Create a discovery-only auth source/route map before translating this section.
   - Examples: auth, auth/login
12. country hubs raw French count materially exceeds mapped coverage (13)
   - Recommendation: Resolve country hubs aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: none

## Finding Counts

- Duplicate French canonicals: 0
- English sources mapped to multiple French routes: 11
- Missing reciprocal hreflang pairs involving French pages: 485
- French pages with English title/H1/UI labels: 7
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
