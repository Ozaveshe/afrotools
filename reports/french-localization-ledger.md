# French Localization Ledger

Generated: 2026-06-14

This is an audit-only ledger. It does not translate or edit French pages. English source inventory follows the skip logic in `scripts/build-i18n.js`.

## Headline Metrics

- Total English source pages: 5828
- Total French pages: 2131
- Raw page-count completion: 36.56%
- English-backed route-mapping completion: 33.58%
- Indexable mapped French route owners: 1957
- French registry coverage: 42.95% of registry-eligible French tool/money/PDF routes (378/880)
- French registry entries: 397
- English-backed French routes: 2064
- French-only routes: 57
- Generated output routes: 1291
- Hand-authored French pages: 840
- Unclear source-of-truth routes: 21

## Coverage By Section

| Section | English source pages | French pages | Unique English mapped | Raw coverage | Mapped coverage | Registry coverage |
|---|---:|---:|---:|---:|---:|---:|
| tools | 2579 | 783 | 744 | 30.36% | 28.85% | 34.81% |
| cars | 1582 | 164 | 164 | 10.37% | 10.37% | n/a |
| agriculture | 645 | 636 | 636 | 98.6% | 98.6% | n/a |
| blog | 204 | 156 | 153 | 76.47% | 75% | 100% |
| salary-tax | 66 | 96 | 61 | 145.45% | 92.42% | 100% |
| vat-business-tax | 56 | 91 | 54 | 162.5% | 96.43% | 96.43% |
| document-pdf | 1 | 1 | 1 | 100% | 100% | 100% |
| widgets | 225 | 11 | 10 | 4.89% | 4.44% | n/a |
| pro | 0 | 2 | 0 | n/a | n/a | n/a |
| auth | 2 | 1 | 0 | 50% | 0% | n/a |
| telecom | 15 | 11 | 11 | 73.33% | 73.33% | n/a |
| country hubs | 56 | 67 | 54 | 119.64% | 96.43% | n/a |

## Top 20 Blockers

1. French pages with no English-backed source mapping (57)
   - Recommendation: Decide whether each route is intentional French-only content or should be mapped/canonicalized to an English source before translation work expands.
   - Examples: /fr/404, /fr/api/docs, /fr/blog/frais-orange-money-guide-2026, /fr/blog/guide-irpp-senegal-2026, /fr/blog/wave-vs-orange-money-senegal-2026, /fr/comparer/senegal-vs-cote-divoire-impots, /fr/dashboard/api, /fr/dashboard
2. Unclear source-of-truth French routes (21)
   - Recommendation: Assign each route to lang/pages generation, registry, or a hand-authored canonical owner.
   - Examples: /fr/tools/francais-africain, /fr/tools/guide-diaspora, /fr/tools/montant-lettres-gh, /fr/tools/montant-lettres-ke, /fr/tools/outils-image, /fr/tools/palette-couleurs, /fr/tools/photo-identite, /fr/tools/pitch-nollywood
3. French pages with English title/H1/UI labels (424)
   - Recommendation: Use this as a QA queue after the ledger, starting with money and discovery surfaces.
   - Examples: /fr/tools/plan-affaires/app, /fr/tools/contrat-travail/nigeria, /fr/tools/contrat-travail/algeria, /fr/tools/contrat-travail/angola, /fr/tools/contrat-travail/benin, /fr/tools/contrat-travail/botswana, /fr/tools/contrat-travail/burkina-faso, /fr/tools/contrat-travail/burundi
4. French registry-eligible pages missing from tool-registry.js (502)
   - Recommendation: Add or repoint registry entries only after route/source truth is settled.
   - Examples: /fr/docs/api/vat, /fr/docs/api/vat/calculate, /fr/tools/africa-conflict/actors, /fr/tools/africa-conflict/conflicts, /fr/tools/africa-conflict/detail, /fr/tools/africa-conflict/displacement, /fr/tools/africa-conflict/economy, /fr/tools/africa-conflict/forecasts
5. Missing reciprocal hreflang pairs involving French pages (423)
   - Recommendation: Fix bidirectional alternates in a targeted hreflang pass after canonical decisions.
   - Examples: /fr/tools/assurance-auto/algeria -> /tools/car-insurance/algeria, /fr/tools/assurance-auto/angola -> /tools/car-insurance/angola, /fr/tools/assurance-auto/benin -> /tools/car-insurance/benin, /fr/tools/assurance-auto/botswana -> /tools/car-insurance/botswana, /fr/tools/assurance-auto/burkina-faso -> /tools/car-insurance/burkina-faso, /fr/tools/assurance-auto/burundi -> /tools/car-insurance/burundi, /fr/tools/assurance-auto/cabo-verde -> /tools/car-insurance/cabo-verde, /fr/tools/assurance-auto/cameroon -> /tools/car-insurance/cameroon
6. French aliases or bridge routes (101)
   - Recommendation: Keep aliases out of registry/search promotion unless they are deliberate bridge pages.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/algeria, /fr/benin/bj-paye, /fr/benin/bj-vat, /fr/burkina-faso/bf-paye, /fr/burkina-faso/bf-vat, /fr/burkina-faso/bf-vat
7. English source pages without a mapped French route (3870)
   - Recommendation: Use high-value section counts to choose the next implementation batch instead of translating randomly.
   - Examples: afrowork, afrowork/api, afrowork/whatsapp, agriculture/crop-planning-yield, agriculture/equipment-infrastructure, agriculture/farm-finance-roi, agriculture/farm-payroll/_template, agriculture/inputs-feed-operations
8. Generated French outputs with weak registry discovery (18)
   - Recommendation: For generated tool pages, connect generation output to registry discovery in the same small batch.
   - Examples: /fr/tools/africa-conflict/actors, /fr/tools/africa-conflict/conflicts, /fr/tools/africa-conflict/detail, /fr/tools/africa-conflict/displacement, /fr/tools/africa-conflict/economy, /fr/tools/africa-conflict/forecasts, /fr/tools/africa-conflict/map, /fr/tools/africa-conflict/methodology
9. Hand-authored French pages that need owner confirmation (840)
   - Recommendation: Treat hand-authored pages as source-sensitive and avoid regeneration until ownership is clear.
   - Examples: /fr/404, /fr/algerie/calculateur-salaire-net, /fr/algerie/calculateur-tva, /fr/algerie, /fr/api/docs, /fr/benin/calculateur-salaire-net, /fr/benin/calculateur-tva, /fr/blog/frais-orange-money-guide-2026
10. tools mapped French coverage is below 30% (1835)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value tools pages before copy translation.
   - Examples: tools/afcon-predictor, tools/affidavit-generator, tools/africa-conflict/conflicts/burkina-faso-insurgency, tools/africa-conflict/conflicts/cameroon-anglophone, tools/africa-conflict/conflicts/car-civil-war, tools/africa-conflict/conflicts/drc-eastern-conflict, tools/africa-conflict/conflicts/ethiopia-amhara, tools/africa-conflict/conflicts/ethiopia-eritrea-tigray
11. cars mapped French coverage is below 30% (1418)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value cars pages before copy translation.
   - Examples: cars/algeria/ford, cars/algeria/ford/ranger/2018, cars/algeria/ford/ranger, cars/algeria/honda/accord/2014, cars/algeria/honda/accord, cars/algeria/honda/cr-v/2016, cars/algeria/honda/cr-v/2020, cars/algeria/honda/cr-v
12. salary-tax raw French count materially exceeds mapped coverage (35)
   - Recommendation: Resolve salary-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-paye, /fr/car/cf-paye, /fr/dr-congo/cd-paye, /fr/dr-congo/cd-paye
13. vat-business-tax raw French count materially exceeds mapped coverage (37)
   - Recommendation: Resolve vat-business-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-vat, /fr/car/cf-vat, /fr/docs/api/vat/calculate, /fr/docs/api/vat, /fr/dr-congo/cd-vat, /fr/dr-congo/cd-vat
14. widgets mapped French coverage is below 30% (215)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value widgets pages before copy translation.
   - Examples: widgets/iframe/african-japa-calculator, widgets/iframe/african-public-holidays, widgets/iframe/agriculture-crop-insurance-premium, widgets/iframe/agriculture-fertilizer-rate, widgets/iframe/agriculture-fish-farm-stocking, widgets/iframe/agriculture-greenhouse-area, widgets/iframe/agriculture-harvest-date-planner, widgets/iframe/agriculture-input-price-checker
15. auth has no English-backed French route coverage (2)
   - Recommendation: Create a discovery-only auth source/route map before translating this section.
   - Examples: auth, auth/login
16. country hubs raw French count materially exceeds mapped coverage (13)
   - Recommendation: Resolve country hubs aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: none

## Finding Counts

- Duplicate French canonicals: 0
- English sources mapped to multiple French routes: 0
- Missing reciprocal hreflang pairs involving French pages: 423
- French pages with English title/H1/UI labels: 424
- Registry-eligible French pages not represented in registry: 502
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
