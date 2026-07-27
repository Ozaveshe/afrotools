# Day 6 Agriculture, Transport and Trade evidence

Branch base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`

Proof boundary: this file records local source and browser evidence only. It does not edit the master readiness ledger and does not claim generated-artifact, preview, deployment or live production proof.

## Reproducible inventory contract

The maintained inventory selects registry rows whose category is `agriculture`, `transport` or `trade`, whose status is `live` or `new`, and whose href is not under `/fr/`, `/sw/`, `/ha/` or `/yo/`.

| Category | English live/new registry routes | Hub | Hub-visible contract |
|---|---:|---|---|
| Agriculture | 447 | `/agriculture/` | Registry-backed taxonomy covers all 447 explicit routes |
| Transport & Logistics | 18 | `/transport/` | 23 cards: 18 category routes plus five cross-category planning routes |
| Trade & Import | 22 | `/trade/` | 22 cards, matching the current live/new registry slice |

The prior master-ledger snapshot lists Transport 17 and Trade 13 because it predates the current `phase: NEW` rows. Those rows remain separate acceptance targets here.

The full app-specific inventory, file ownership, metadata, control count and artwork receipt is maintained in `reports/day6-agriculture-transport-trade-route-inventory.json`.

## Agriculture family reconciliation

Programmatic country pages are explicit route credits, not one collapsed app:

| Family | Explicit registry routes | Proof shape |
|---|---:|---|
| Crop yield | 55 | family entry plus 54 country routes |
| Fertilizer | 55 | family entry plus 54 country routes |
| Irrigation | 55 | family entry plus 54 country routes |
| Farm profit | 55 | family entry plus 54 country routes |
| Seed rate | 55 | family entry plus 54 country routes |
| Farm payroll | 55 | family entry plus 54 country routes |
| Fish farming | 16 | family entry plus 15 country routes |
| Greenhouse | 16 | family entry plus 15 country routes |
| Cassava processing | 16 | family entry plus 15 country routes |
| Livestock feed | 16 | family entry plus 15 country routes |
| Input prices | 16 | family entry plus 15 country routes |
| Farm loans | 16 | family entry plus 15 country routes |

The remaining Agriculture rows are individually enumerated in the route inventory and taxonomy report rather than hidden inside a family multiplier.

## Functional repairs and independent fixtures

Seven family entry apps previously reused the same generic quantity/unit-cost/buffer form and returned an input echo. They now own job-specific deterministic calculations, invalid-input failure, stale-result clearing, reset and live output:

| Route | Independent fixture |
|---|---|
| `/agriculture/crop-yield/` | 2 ha × 3.5 t/ha × 88% = 6.16 t marketable |
| `/agriculture/fertilizer/` | 2 ha × 200 kg/ha ÷ 50 kg = 8 bags; NGN 280,000 |
| `/agriculture/irrigation/` | 1.5 ha × 25 mm × 4 ÷ 75% = 2,000 m3 |
| `/agriculture/farm-profit/` | NGN 2,250,000 revenue − NGN 1,500,000 cost = NGN 750,000; 33.3% |
| `/agriculture/seed-rate/` | 2 ha × 25 kg/ha ÷ 90% × 105% = 58.3 kg |
| `/agriculture/fish-farming/` | 1,000 × 85% × 1.2 kg = 1,020 kg; NGN 644,000 profit |
| `/agriculture/greenhouse/` | 240 m2 × NGN 18,000 × 112% = NGN 4,838,400 |

All changing agronomy, buyer-price and construction assumptions remain user-entered planning inputs. The repair adds no rate, official-status, integration, live-data or AI claim.

## Source receipts

- `npm run transport:sources:check`: 41 sources; six changed; 11 blocked/manual; zero broken. Changed and blocked sources remain review queues and did not trigger factual rate edits.
- `npm run trade:sources:check`: 21 sources; source ledger valid; the May 2026 dataset is 87 days old and nine markets lack a bound customs-authority URL. Trade duty/CET figures therefore remain planning-grade.

## Maintained proof

- `npm run test:day6-category` reproduces category counts, unique ids/routes, route-file ownership, major Agriculture family counts and the seven independent formulas.
- `npm run test:day6-category:browser` first verifies the three category hubs and their reconciled 447/23/22 visible contracts, then traverses every current English live/new route at 320px and 375px, checks 200% text reflow at a 640px viewport, exercises manual/system dark-mode contracts, and validates canonical/description/schema/layout. Its workflow tests execute all seven repaired family-entry fixtures including invalid/reset behavior and app-owned controls across every Transport and Trade route.
- The workflow harness verifies visible control names, keyboard reachability, focusability and live results. It blocks external dependencies, asserts that synthetic workflows make no external state-changing requests, and reopens/parses the JSON, CSV or text exports exposed by the proforma invoice, packing list, bill of lading and trade-finance apps.

## Final local validation receipt

| Gate | Result |
|---|---|
| `npm run test:day6-category` | Pass: 487 explicit routes and seven independent Agriculture formulas |
| Day 6 category hub browser contract | Pass: Agriculture 447, Transport 23, Trade 22; route, focus, mobile, 200% reflow, theme, canonical and schema |
| Day 6 exhaustive browser route contract | Pass: all 487 routes; 320px, 375px, 200% reflow, theme, metadata and schema |
| Day 6 Agriculture browser fixtures | Pass: seven workflows with deterministic result, invalid input, stale-result clearing, reset, labels, focus and live output |
| Day 6 Transport/Trade browser workflows | Pass: all 40 routes; primary workflows, named/focusable controls, local export parsing and no external write requests |
| `npm run category-workflow:verify` | Pass |
| `npm run agriculture:taxonomy` | Pass: 447/447 bucketed, no duplicate or missing assignments |
| `npm run transport:sources:check` | Pass: 41 sources, six changed, 11 blocked/manual, zero broken |
| `npm run trade:sources:check` | Pass with advisory warnings recorded above |
| `npm run audit` | Pass; repository-wide carried backlog still reports three unrelated missing external pages |
| `npm run check-links` | Pass: 124,762 internal links across 10,836 HTML files |
| `npm run seo:report` | Pass for missing canonical/title/description/hreflang issues; report-only mode identifies carried auto-fix candidates outside this scoped pass |
| `npm run ai:tool-context:check` | Pass: context current for 568 tools |
| `npm run test:privacy-ai-consent` | Pass: server test and three browser consent tests |
| `npm run pdf:verify` | Pass: 31 registry tools and 34 HTML/app surfaces |
| `npm run audit:public-claims` | Pass; repository-wide source-registry warnings remain carried backlog |
| `npm run lint` / `npm run type-check` / `npm run security:scan` | Pass |
| `git diff --check` | Pass |

The broad deploy build was intentionally not run under the Day 6 contract. No deployment or live-production claim is made.

## Artwork

Missing artwork is intentionally maintained separately in `reports/day6-agriculture-transport-trade-image-needs.md`.
