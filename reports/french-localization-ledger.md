# French Localization Ledger

Generated: 2026-05-10

This is an audit-only ledger. It does not translate or edit French pages. English source inventory follows the skip logic in `scripts/build-i18n.js`.

## Headline Metrics

- Total English source pages: 5735
- Total French pages: 1651
- Raw page-count completion: 28.79%
- English-backed route-mapping completion: 26.77%
- French registry coverage: 55.6% of registry-eligible French tool/money/PDF routes (288/518)
- French registry entries: 295
- English-backed French routes: 1610
- French-only routes: 32
- Generated output routes: 1179
- Hand-authored French pages: 472
- Unclear source-of-truth routes: 40

## Coverage By Section

| Section | English source pages | French pages | Unique English mapped | Raw coverage | Mapped coverage | Registry coverage |
|---|---:|---:|---:|---:|---:|---:|
| tools | 2524 | 335 | 329 | 13.27% | 13.03% | 69.25% |
| cars | 1584 | 150 | 146 | 9.47% | 9.22% | 33.33% |
| agriculture | 645 | 636 | 636 | 98.6% | 98.6% | n/a |
| blog | 179 | 156 | 153 | 87.15% | 85.47% | 100% |
| salary-tax | 66 | 96 | 64 | 145.45% | 96.97% | 35.42% |
| vat-business-tax | 56 | 91 | 57 | 162.5% | 101.79% | 28.57% |
| document-pdf | 1 | 1 | 1 | 100% | 100% | 100% |
| widgets | 225 | 3 | 3 | 1.33% | 1.33% | n/a |
| pro | 0 | 2 | 0 | n/a | n/a | n/a |
| auth | 2 | 1 | 1 | 50% | 50% | n/a |
| telecom | 15 | 9 | 9 | 60% | 60% | n/a |
| country hubs | 56 | 67 | 55 | 119.64% | 98.21% | n/a |

## Top 20 Blockers

1. French pages with no English-backed source mapping (32)
   - Recommendation: Decide whether each route is intentional French-only content or should be mapped/canonicalized to an English source before translation work expands.
   - Examples: /fr/404, /fr/api/docs, /fr/blog/frais-orange-money-guide-2026, /fr/blog/guide-irpp-senegal-2026, /fr/blog/wave-vs-orange-money-senegal-2026, /fr/comparer/senegal-vs-cote-divoire-impots, /fr/dashboard/api, /fr/dashboard
2. Unclear source-of-truth French routes (40)
   - Recommendation: Assign each route to lang/pages generation, registry, or a hand-authored canonical owner.
   - Examples: /fr/404, /fr/api/docs, /fr/blog/frais-orange-money-guide-2026, /fr/blog/guide-irpp-senegal-2026, /fr/blog/wave-vs-orange-money-senegal-2026, /fr/car/cf-paye, /fr/car/cf-paye, /fr/car/cf-vat
3. French registry-eligible pages missing from tool-registry.js (230)
   - Recommendation: Add or repoint registry entries only after route/source truth is settled.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/angola/ao-paye, /fr/angola/ao-vat, /fr/benin/bj-paye, /fr/benin/bj-vat, /fr/botswana/bw-paye, /fr/botswana/bw-vat
4. English sources mapped to multiple French routes (12)
   - Recommendation: Choose one preferred French URL per English source and demote or redirect the rest.
   - Examples: benin/bj-paye (2), chad (2), chad/td-paye (2), comoros/km-paye (2), djibouti/dj-paye (2), madagascar/mg-paye (2), mauritania/mr-paye (2), tools/ecowas-levy (2)
5. Missing reciprocal hreflang pairs involving French pages (499)
   - Recommendation: Fix bidirectional alternates in a targeted hreflang pass after canonical decisions.
   - Examples: /fr/advertise -> /advertise, /fr/african -> /african, /fr/algerie -> /algeria, /fr/angola/ao-paye -> /angola/ao-paye, /fr/angola/ao-vat -> /angola/ao-vat, /fr/angola -> /angola, /fr/api -> /api, /fr/api/pricing -> /api/pricing
6. French aliases or bridge routes (87)
   - Recommendation: Keep aliases out of registry/search promotion unless they are deliberate bridge pages.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/algeria, /fr/benin/bj-vat, /fr/burkina-faso/bf-paye, /fr/burkina-faso/bf-vat, /fr/burkina-faso/bf-vat, /fr/burundi/bi-paye
7. English source pages without a mapped French route (4228)
   - Recommendation: Use high-value section counts to choose the next implementation batch instead of translating randomly.
   - Examples: afrowork, afrowork/api, afrowork/whatsapp, agriculture/crop-planning-yield, agriculture/equipment-infrastructure, agriculture/farm-finance-roi, agriculture/farm-payroll/_template, agriculture/inputs-feed-operations
8. Generated French outputs with weak registry discovery (144)
   - Recommendation: For generated tool pages, connect generation output to registry discovery in the same small batch.
   - Examples: /fr/algeria/dz-paye, /fr/algeria/dz-vat, /fr/angola/ao-paye, /fr/angola/ao-vat, /fr/benin/bj-paye, /fr/benin/bj-vat, /fr/botswana/bw-paye, /fr/botswana/bw-vat
9. Hand-authored French pages that need owner confirmation (472)
   - Recommendation: Treat hand-authored pages as source-sensitive and avoid regeneration until ownership is clear.
   - Examples: /fr/404, /fr/algerie/calculateur-salaire-net, /fr/algerie/calculateur-tva, /fr/algerie, /fr/api/docs, /fr/benin/calculateur-salaire-net, /fr/benin/calculateur-tva, /fr/blog/frais-orange-money-guide-2026
10. tools mapped French coverage is below 30% (2195)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value tools pages before copy translation.
   - Examples: tools/50-30-20-budget, tools/afcon-predictor, tools/affidavit-generator, tools/africa-conflict/conflicts/burkina-faso-insurgency, tools/africa-conflict/conflicts/cameroon-anglophone, tools/africa-conflict/conflicts/car-civil-war, tools/africa-conflict/conflicts/drc-eastern-conflict, tools/africa-conflict/conflicts/ethiopia-amhara
11. cars mapped French coverage is below 30% (1438)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value cars pages before copy translation.
   - Examples: cars/algeria/ford, cars/algeria/ford/ranger/2018, cars/algeria/ford/ranger, cars/algeria/honda/accord/2014, cars/algeria/honda/accord, cars/algeria/honda/cr-v/2016, cars/algeria/honda/cr-v/2020, cars/algeria/honda/cr-v
12. salary-tax raw French count materially exceeds mapped coverage (32)
   - Recommendation: Resolve salary-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-paye, /fr/car/cf-paye, /fr/dr-congo/cd-paye, /fr/dr-congo/cd-paye
13. vat-business-tax raw French count materially exceeds mapped coverage (34)
   - Recommendation: Resolve vat-business-tax aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/car/cf-vat, /fr/car/cf-vat, /fr/docs/api/vat/calculate, /fr/docs/api/vat, /fr/dr-congo/cd-vat, /fr/dr-congo/cd-vat
14. widgets mapped French coverage is below 30% (222)
   - Recommendation: Prioritize canonical route selection and registry wiring for the highest-value widgets pages before copy translation.
   - Examples: widgets/iframe/african-japa-calculator, widgets/iframe/african-mobile-money-fees, widgets/iframe/african-public-holidays, widgets/iframe/african-remittance-compare, widgets/iframe/agriculture-crop-insurance-premium, widgets/iframe/agriculture-crop-yield-estimator, widgets/iframe/agriculture-farm-budget-estimator, widgets/iframe/agriculture-fertilizer-rate
15. country hubs raw French count materially exceeds mapped coverage (12)
   - Recommendation: Resolve country hubs aliases and French-only routes before using raw page volume as completion evidence.
   - Examples: /fr/dr-congo

## Finding Counts

- Duplicate French canonicals: 0
- English sources mapped to multiple French routes: 12
- Missing reciprocal hreflang pairs involving French pages: 499
- French pages with English title/H1/UI labels: 0
- Registry-eligible French pages not represented in registry: 230
- Registry entries pointing to non-preferred French routes: 0
- Registry entries pointing to missing French routes: 0

## Recommended Next Implementation Batch

1. Discovery-only canonical decision batch for salary/PAYE and VAT French country routes: choose preferred URLs for normalized calculateur-* routes versus historical cc-paye/cc-vat routes, then document aliases before edits.
2. Registry repair batch for existing French money/tool routes only: fix missing or non-preferred registry hrefs after canonical decisions, with no translation copy edits.
3. Hreflang reciprocity batch on the same approved route set: repair en/fr self, x-default, and bidirectional links, then rerun validate:hreflang.
4. French UI leakage QA batch for top money/discovery pages: title, H1, buttons, placeholders, labels, and app result text, after the route ledger is accepted.

## Notes

- Raw page count overstates product readiness because it includes French-only, alias, generated, and hand-authored pages together.
- The safer completion number is the English-backed route mapping percentage plus registry coverage for tool-discovery surfaces.
- Detailed per-route classification and full finding lists are in `reports/french-localization-ledger.json`.
