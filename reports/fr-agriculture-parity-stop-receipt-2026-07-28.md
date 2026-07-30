# French Agriculture parity stop receipt

Baseline: detached `8ce5cac175e42201968b1f7540752d6acf92d4ca`, matching `codex/fr-parity-wave1-integration-20260728`.

Proof boundary: read-only inventory, source-owner inspection, focused Node tests and static parity audits. No product route, generator, registry, locale, sitemap, hash, master-ledger, commit, push, PR, merge or deploy change was made. No route receives French parity acceptance because the source-owner audit reached the requested stop condition before implementation and browser proof.

## Exact 447-row reconciliation

The source slice is every English `live` or `new` registry row in category `agriculture`, excluding `/fr/`, `/sw/`, `/ha/` and `/yo/`.

| Contract | Count |
|---|---:|
| English canonical Agriculture rows | 447 |
| English country-specific rows | 414 |
| Physical French counterpart files found | 447 |
| Same-path counterparts under `/fr/agriculture/**` | 443 |
| Semantic counterparts under `/fr/tools/**` | 4 |
| Native French counterparts without an iframe | 3 |
| English iframe/transplant counterparts | 444 |
| Physically correct French/English hreflang pairs | 331 |
| Incorrect or unresolved French/English hreflang pairs | 116 |
| French AI route-map entries | 327 |
| French AI route-map gaps | 120 |
| French Agriculture registry counterparts | 4 |
| Dedicated registry-id artwork present | 301 |
| Dedicated registry-id artwork missing | 146 |
| Accepted French parity rows | 0 |

The 636 files currently under `/fr/agriculture/` are not the acceptance denominator. Only 443 correspond to the 447 English registry rows; 193 are extra generated routes and cannot be counted toward this programme. The four semantic `/fr/tools/**` counterparts are:

- `/tools/planting-calendar/` -> `/fr/tools/calendrier-semis/` (iframe)
- `/tools/fertilizer-calc/` -> `/fr/tools/calculateur-engrais/` (native)
- `/tools/agric-profit/` -> `/fr/tools/profit-agricole/` (native)
- `/tools/crop-yield/` -> `/fr/tools/rendement-culture/` (native)

## Family receipt

| Family | English rows | French files | Native French | Acceptance |
|---|---:|---:|---:|---:|
| Crop yield | 55 | 55 | 0 | 0 |
| Fertilizer | 55 | 55 | 0 | 0 |
| Irrigation | 55 | 55 | 0 | 0 |
| Farm profit | 55 | 55 | 0 | 0 |
| Seed rate | 55 | 55 | 0 | 0 |
| Farm payroll | 55 | 55 | 0 | 0 |
| Fish farming | 16 | 16 | 0 | 0 |
| Greenhouse | 16 | 16 | 0 | 0 |
| Cassava processing | 16 | 16 | 0 | 0 |
| Livestock feed | 16 | 16 | 0 | 0 |
| Input prices | 16 | 16 | 0 | 0 |
| Farm loans | 16 | 16 | 0 | 0 |
| Remaining singleton routes | 21 | 21 | 3 | 0 |

The 21 singleton routes are the four `/tools/**` rows plus cocoa tracker, coffee calculator, commodity prices, cooperative calculator, crop insurance, crop rotation, export documents, farm budget, farm size converter, harvest date, pesticide dosage, poultry ROI, soil pH, storage loss, tractor calculator, vaccination schedule and warehouse receipt.

## Source-owner findings

The English route inventory owner is `assets/js/components/tool-registry.js`; each row resolves to its physical English HTML route.

Maintained English family owners found:

| Family | Page generator/source | Engine/data owner |
|---|---|---|
| Crop yield | `scripts/generate-crop-yield-pages.js` | `engines/src/crop-yield-engine.js`, `data/agriculture/*-agri-data.js` |
| Fertilizer | `scripts/generate-fertilizer-pages.js`, `scripts/expand-fertilizer.js` | `engines/src/fertilizer-engine.js`, `data/agriculture/*-agri-data.js` |
| Irrigation | `scripts/generate-irrigation-pages.js` | `engines/src/irrigation-engine.js`, `data/agriculture/*-agri-data.js` |
| Farm profit | `scripts/generate-farm-profit-pages.js` | `engines/src/farm-profit-engine.js`, `data/agriculture/farm-costs.js` |
| Seed rate | `scripts/generate-seed-rate-pages.js` | `engines/src/seed-rate-engine.js`, `data/agriculture/seed-data.js`, `data/agriculture/seed-data-extension.js` |
| Farm payroll | `agriculture/farm-payroll/_gen.py` and `agriculture/farm-payroll/_gen_pages.sh` both claim generation ownership | `engines/src/farm-payroll-engine.js`, `data/agriculture/farm-payroll-data.js` |
| Fish farming | `scripts/generate-fish-farming-pages.js` | `engines/src/aquaculture-roi-engine.js`, `data/agriculture/aquaculture-data.js` |
| Cassava processing | `scripts/generate-cassava-processing-pages.js` | `engines/src/cassava-processing-engine.js`, `data/agriculture/cassava-processing-data.js` |
| Greenhouse | physical HTML pages; no maintained country-page generator found | `engines/src/greenhouse-engine.js`, `data/agriculture/greenhouse-data.js` |
| Livestock feed | physical HTML pages plus `scripts/expand-livestock-feed.js`; no maintained country-page generator found | `engines/src/livestock-feed-engine.js`, `data/agriculture/livestock-feed-data.js` |
| Input prices | physical HTML pages; no maintained country-page generator found | `data/agriculture/input-prices-data.js` |
| Farm loans | physical HTML pages; no maintained country-page generator found | `engines/src/farm-loan-engine.js`, `data/agriculture/agri-loans-data.js` |

French route equivalence is owned by `data/registry/locale-page-coverage.json`, `scripts/lib/french-tool-route-map.js` and `scripts/lib/french-ai-route-map.js`. The four semantic `/fr/tools/**` rows are discovery-owned through `sourceId` links in `assets/js/components/tool-registry.js`.

The only broad French Agriculture page generator found is `scripts/gen-fr-agriculture.sh`. It cannot safely be used for this programme because it:

- hard-codes `C:/Users/Oza/Documents/afrotools` instead of the active worktree;
- declares that every generated page embeds the English tool in an iframe;
- uses one generic country-name/title/description substitution layer instead of family-owned French UI contracts;
- has no accepted mapping for labels, help, errors, results, empty states, privacy, actions or export controls;
- cannot preserve or validate country-specific crops, units, currencies, source/freshness/confidence contracts and every export surface;
- currently produces the wrong French self/en hreflang target on 116 programme rows;
- operates on 636 `/fr/agriculture/**` files rather than the exact 447-row acceptance slice.

`scripts/audit-fr-agriculture-quality.js` independently reports 636 audited `/fr/agriculture/**` files, 635 iframe wrappers, five pages with English UI signals and 116 pages whose French alternate is not self-referential.

## Required design decisions before implementation

1. Select a safe French generator architecture: extend each accepted English family generator with a French presentation contract, or establish one family-aware localized generator that consumes the English engine/data owners without transplanting English DOM/runtime.
2. Resolve the competing Farm Payroll page generators (`_gen.py` versus `_gen_pages.sh`) before adding a French output owner.
3. Assign maintained country-page generator ownership for Greenhouse, Livestock Feed, Input Prices and Farm Loans; physical generated-looking HTML alone is not a safe regeneration contract.
4. Confirm that this programme generates only the exact 447 semantic counterparts and leaves the 193 extra `/fr/agriculture/**` files outside the wave.
5. Decide whether the four semantic `/fr/tools/**` routes stay separate hand-authored owners or join the family-aware French generator.

## Focused proof run

- `npm run test:day6-category` passed: 447 routes, 16 maintained entry workflows, 414 country identities and the family fixtures.
- `npm run agriculture:taxonomy` passed: 447/447 assigned, zero duplicate assignments, zero missing assignments.
- `npm run ai:french-routes:check` passed as a freshness check, but its current generated map covers only 327 of the 447 Agriculture routes.
- `node scripts/audit-fr-agriculture-quality.js` completed with the blocking iframe/hreflang findings above.

Browser, responsive, reflow, theme, keyboard, console/network, export parsing, artwork rendering and French AI eval acceptance were not run after the stop condition. They remain required per route after the generator ownership decision.

## Artwork

Artwork remains separate from functional acceptance in `reports/day6-agriculture-transport-trade-image-needs.md`: Agriculture has 146 missing registry-id images. No artwork was generated or edited.
