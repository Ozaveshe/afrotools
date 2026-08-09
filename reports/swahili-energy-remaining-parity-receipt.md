# Swahili Energy & Utilities remaining parity receipt

Status: **17 BROWSER-VERIFIED ACCEPTED CANDIDATES — COORDINATOR LEDGER UNCHANGED**

## Exact reconciliation

- Central English-free denominator: **20** Energy & Utilities apps.
- Previously accepted and preserved byte-for-byte: **3** (`solar-sizing`, `battery-sizing`, `backup-duration`).
- Newly implemented native Swahili candidates: **17**.
- Newly browser-verified accepted candidates in this lane: **17**. The coordinator-owned central acceptance ledger remains unchanged.
- Remaining blocked within this Energy assignment: **0**.

The 17 candidates are: `electricity-tariff`, `solar-roi`, `prepaid-meter`, `solar-vs-generator`, `electricity-bill-verify`, `water-bill`, `gas-lpg-cost`, `paygo-solar`, `outage-cost`, `energy-audit`, `appliance-power`, `diesel-vs-solar-farm`, `mini-grid-feasibility`, `carbon-footprint-energy`, `ev-charging`, `biogas-roi`, and `generator-fuel`.

## Implementation boundary

- `scripts/build-sw-energy-remaining-parity.js` owns exactly the 17 candidate pages, the Swahili Energy hub and the static planning snapshot.
- `scripts/lib/sw-energy-remaining-contract.js` defines the exact denominator, routes, app-specific fields, metrics, shared-engine owners and metadata.
- Every page executes its existing English-owned DOM-free engine. No calculation formula was copied into Swahili code.
- The shared Swahili controller provides valid/invalid clearing, local-only processing, JSON reopen, and JSON/CSV/TXT/PDF export paths.
- Four explicit English fallback declarations were removed only after their pages became native owners.
- Three incorrectly classified registry rows were reconciled to Energy and their source/artwork ids.
- The 3 previously accepted pages were not regenerated or edited; SHA-256 preservation is asserted in the focused test.

## Source, freshness and confidence

- The underlying Energy dataset is stamped **2026-03** and is stale for decision-grade use.
- The official source ledger binds regulator URLs for only **12 of 54** markets; **42** market gaps remain.
- Every candidate visibly says it is a planning snapshot, not live/current price data, and marks confidence low until locally verified.
- Pages use `data/energy/sw-energy-planning-snapshot.js`, a network-free source-owned projection of `country-energy-index.js`. This prevents the original dataset's optional live overlay from contradicting the visible no-live-data contract.
- The snapshot normalizes the existing LPG `perKg` field to the shared engine's `pricePerKg` input without changing the source value.
- No candidate claims an official bill, quote, design, safety approval or professional recommendation.

## Static proof

Passed:

- `node --test tests/swahili-energy-remaining-static.test.js` — **6/6**, including exact 20/3/17 reconciliation, prior-page hashes, all 17 native page contracts, all 17 valid and invalid engine oracles, exports/reopen and privacy.
- `node scripts/build-sw-energy-remaining-parity.js` — current, changed 0.
- `npm run lint` — passed, 49 JavaScript files.
- `npm run type-check` — passed.
- `npm run audit` — completed; the two reported missing pages are carried non-Energy routes.
- `npm run check-links` — passed, 137,954 internal links across 11,488 HTML files.
- `npm run validate:hreflang` — passed, 33,328 relationships and 5,340 equivalence groups.
- `node --check assets/js/pages/sw-energy-remaining-parity.js` — passed.
- `node --check scripts/build-sw-energy-remaining-parity.js` — passed.
- `git diff --check` — passed.
- `git diff --diff-filter=D --summary` — empty; zero physical deletions.
- Artwork — **17/17 present**, zero missing.

Browser proof completed:

- Pinned system Chrome, isolated port 4198, one worker: **17/17** deep Energy tests passed. Each app covered valid calculation, invalid clearing, reset, theme, keyboard focus, no unexpected input network request, JSON parse/reopen, CSV/TXT parse and PDF reopen with the repository-vendored PDF.js 3.11 parser.
- The complementary lane run passed **55/55** route and boundary checks, including 320px, 375px and 200% reflow for every physical assigned route.
- No central acceptance-ledger or AI-map edit, sitemap generation, dist build, redirect change, other-locale edit, PR, merge or deployment occurred.
- Broad localization coverage artifacts remain intentionally stale for coordinator-owned reconciliation.

## Acceptance boundary

This is a lane candidate receipt only. Central acceptance, generated localization coverage and AI-route reconciliation remain coordinator-owned. See `reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.*` for the exact 55-row aggregate outcome and blockers.
