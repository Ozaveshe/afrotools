# French Health & Wellness parity receipt

Date: 28 July 2026
Scope: French Health & Wellness hub plus the exact 42 canonical English free applications assigned to Health in `reports/french-free-app-parity-inventory.json`.

## Fail-closed acceptance

- Category hub: 1/1 accepted for inventory, navigation, reflow, theme, keyboard and route ownership.
- Canonical applications: 42/42 accepted with executed owner workflows; 0/42 remain unaccepted.
- Deep-accepted routes additionally include blood-pressure measurement, hospital quote, clinic quote, pharmacy quote, sickle-cell inheritance, diabetes screening, BMI, single-food calories, due-date range, haemoglobin-result verification, blood-component compatibility and maternal-risk workflows.
- Medical Report Interpreter now passes the English-owner two-marker lab-range fixture in French, retains the critical-result safety boundary, keeps the raw sentinel out of requests, and reopens its local PDF by signature.
- No canonical Health route remains unaccepted.
- Registry ownership: 42/42 French rows have one unique English `sourceId` and one unique French owner route.
- Product implementation: 42/42 are native French pages. No iframe, English-page fetch, bridge, or handoff remains.
- Engine identity: 42/42 load the same app-owned engine/controller files as the English route. This is not, by itself, functional acceptance.
- French experience: static interface, fields, help, privacy text, sources, safety boundaries, related-tool labels, and export-action labels are translated. Dynamic-result acceptance covers all 42 routes.
- Search ownership: 42/42 have French title and description, canonical, reciprocal English/French hreflang, x-default, Open Graph, Twitter metadata, French WebApplication schema, and French FAQ schema.
- Medical safety: 42/42 retain the English application-specific boundaries and add a French fail-closed medical, privacy, source, and emergency boundary.
- Artwork: 42/42 Open Graph assets exist; see `reports/french-health-wave3-missing-artwork.md`.

The generator `scripts/build-french-health-parity.js` is the focused source owner for this lane. It clones accepted English application structure, preserves exact engine/controller paths, applies the durable public-copy dictionary in `data/i18n/fr-health-parity-translations.json`, and generates the French hub and application owners deterministically.

## Exact 42-row implementation ledger

The status column below records generator implementation, not deep acceptance. The fail-closed acceptance totals above supersede the earlier blanket claim.

| English ID | Accepted English route | French owner route | Status |
|---|---|---|---|
| medical-report | /tools/medical-report | /fr/tools/rapport-medical | Accepted |
| bmi-calculator | /health/bmi-calculator | /fr/health/bmi-calculator | Accepted |
| due-date | /health/pregnancy-due-date | /fr/health/pregnancy-due-date | Accepted |
| calorie-counter | /health/calorie-counter | /fr/health/calorie-counter | Accepted |
| malaria-risk | /tools/malaria-risk | /fr/tools/risque-paludisme | Accepted |
| ovulation-calc | /tools/ovulation-calc | /fr/tools/calculateur-ovulation | Accepted |
| drug-dosage | /tools/drug-dosage | /fr/tools/dosage-medicament | Accepted |
| water-quality | /tools/water-quality | /fr/tools/qualite-eau | Accepted |
| water-intake | /tools/water-intake | /fr/tools/apport-eau | Accepted |
| vaccine-schedule | /tools/vaccine-schedule | /fr/tools/calendrier-vaccinal | Accepted |
| waist-hip-ratio | /tools/waist-hip-ratio | /fr/tools/ratio-taille-hanches | Accepted |
| blood-pressure | /tools/blood-pressure | /fr/tools/tension-arterielle | Accepted |
| hospital-cost | /tools/hospital-cost | /fr/tools/cout-hospitalier | Accepted |
| clinic-costs | /tools/clinic-costs | /fr/tools/couts-clinique | Accepted |
| pharmacy-prices | /tools/pharmacy-prices | /fr/tools/prix-pharmacie | Accepted |
| sickle-cell | /tools/sickle-cell | /fr/tools/drepanocytose | Accepted |
| diabetes-risk | /tools/diabetes-risk | /fr/tools/risque-diabete | Accepted |
| bmi-calc-tools | /tools/bmi-calculator | /fr/tools/calculateur-imc | Accepted |
| calorie-counter-tools | /tools/calorie-counter | /fr/tools/compteur-calories | Accepted |
| due-date-tools | /tools/due-date | /fr/tools/date-accouchement | Accepted |
| genotype-checker | /tools/genotype-checker | /fr/tools/verificateur-genotype | Accepted |
| blood-group | /tools/blood-group | /fr/tools/compatibilite-groupe-sanguin | Accepted |
| maternal-mortality | /tools/maternal-mortality | /fr/tools/risque-mortalite-maternelle | Accepted |
| childbirth-cost | /tools/childbirth-cost | /fr/tools/cout-accouchement | Accepted |
| csection-vs-natural | /tools/csection-vs-natural | /fr/tools/cout-cesarienne-voie-basse | Accepted |
| dental-cost | /tools/dental-cost | /fr/tools/cout-soins-dentaires | Accepted |
| drug-price-compare | /tools/drug-price-compare | /fr/tools/comparateur-prix-medicaments | Accepted |
| traditional-vs-western | /tools/traditional-vs-western | /fr/tools/cout-medecine-traditionnelle-moderne | Accepted |
| african-meal-plan | /tools/african-meal-plan | /fr/tools/plan-repas-africain | Accepted |
| child-growth | /tools/child-growth | /fr/tools/croissance-enfant | Accepted |
| hiv-treatment-cost | /tools/hiv-treatment-cost | /fr/tools/cout-traitement-vih | Accepted |
| tb-tracker | /tools/tb-tracker | /fr/tools/suivi-traitement-tuberculose | Accepted |
| cholera-risk | /tools/cholera-risk | /fr/tools/risque-cholera | Accepted |
| ebola-checklist | /tools/ebola-checklist | /fr/tools/checklist-ebola | Accepted |
| hep-b-screening | /tools/hep-b-screening | /fr/tools/cout-depistage-hepatite-b | Accepted |
| medical-tourism | /tools/medical-tourism | /fr/tools/comparateur-tourisme-medical | Accepted |
| eye-care-cost | /tools/eye-care-cost | /fr/tools/cout-soins-oculaires | Accepted |
| mental-health-cost | /tools/mental-health-cost | /fr/tools/cout-sante-mentale | Accepted |
| pregnancy-nutrition | /tools/pregnancy-nutrition | /fr/tools/nutrition-grossesse | Accepted |
| breastfeeding-tracker | /tools/breastfeeding-tracker | /fr/tools/suivi-allaitement | Accepted |
| gym-cost-compare | /tools/gym-cost-compare | /fr/tools/comparateur-cout-salle-sport | Accepted |
| home-workout | /tools/home-workout | /fr/tools/entrainement-maison | Accepted |

## Verification evidence

- `node scripts/build-french-health-parity.js --write` — generated 42 apps with 2,969 translated public strings and 0 missing strings.
- `node scripts/build-french-health-parity.js` — deterministic check passed with 0 changed pages and no hub drift.
- `node --test tests/french-health-parity.test.js` — 3/3 contract tests passed.
- The shallow Playwright layout suite previously passed 43/43 hub/routes, but it did not execute app-specific output oracles and is not counted as deep acceptance.
- `reports/french-health-wave3-deep-evidence-final-42.json` is the authoritative contiguous run: 42/42 owner workflows accepted, 42 workflows executed, 82 advertised exports reopened or parsed, 0 blocked routes and 0 private-marker leaks.
- That final run uses the strengthened dynamic-English oracle and explicitly rechecks drinking-water, fluid-intake, waist-to-hip, haemoglobin-result and hepatitis-B dynamic outputs after their French presentation repairs.
- `reports/french-health-wave3-deep-evidence-shard-1.json` and `reports/french-health-wave3-deep-evidence-medical.json` preserve the initial fail-closed checkpoint and Medical Report repair history.
- Existing Health engine, workflow, privacy, source-freshness, and runtime snapshot suites — 34/34 checks passed after supplying the canonical dependency path to the worktree.
- Static browser coverage included the hub and all 42 apps at 320px and 375px, dark mode, reduced motion, keyboard focus, accessible controls, no horizontal overflow, no iframe, no page/console errors, and no local missing assets. It is kept separate from executed-workflow acceptance.
- The generated French AI route map resolves all 42 accepted English routes to the exact French owner routes.
- `npm run validate:hreflang`, `npm run ai:french-routes:check`, `npm run test:ai-i18n`, `npm run fr:surface:check`, `npm run test:fr-surface`, `npm run localization:check`, `npm run test:localization`, `npm run audit`, `npm run check-links`, `npm run lint`, `npm run type-check`, and the privacy/AI-consent server and browser checks passed.

## Product and risk boundaries

- These are education, organisation, calculation, and question-preparation tools. They do not diagnose, prescribe, confirm a medical condition, replace emergency care, or make an official health decision.
- Sensitive entries stay in the browser for the primary workflow. Network-assisted behavior, where an accepted English app already offers it, remains optional and subject to explicit consent.
- Existing application-specific source links and review statements are preserved from the accepted English owners and exposed in French. This lane did not re-scrape every external medical authority; external availability and future policy changes remain a monitored freshness responsibility.
- `npm run fr:parity:check` correctly reports the shared cross-session inventory as stale because these 42 pages changed. This lane intentionally did not regenerate that shared aggregate; the director must serialize one final inventory build after all French category lanes land.
- This receipt proves local source and browser behavior. It does not claim merge, preview, production deployment, or live-route verification.
