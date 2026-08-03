# Swahili Energy & Utilities remaining parity receipt

Status: **STATIC CANDIDATE — BROWSER PENDING — FAIL CLOSED**

## Exact reconciliation

- Central English-free denominator: **20** Energy & Utilities apps.
- Previously accepted and preserved byte-for-byte: **3** (`solar-sizing`, `battery-sizing`, `backup-duration`).
- Newly implemented native Swahili candidates: **17**.
- Newly accepted in this lane: **0**. Chromium was deliberately not started because another lane owns the browser slot.
- Remaining unaccepted after this static lane: **17**, all blocked on real-browser workflow/export/reopen/mobile/theme/a11y proof.

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

Not accepted / not run:

- Playwright/Chromium proof was not run by instruction; Climate retained the browser slot. The repository `test:privacy-ai-consent` command completed its static server test, then could not start Playwright in this environment. This is not counted as a pass.
- No central acceptance-ledger or AI-map edit, sitemap generation, dist build, redirect change, other-locale edit, push, PR, merge or deployment occurred.
- Broad localization coverage artifacts remain intentionally stale for coordinator-owned reconciliation.

## Required browser closeout

Before any of these 17 receive acceptance credit, run every physical route at 320px, 375px and 200% reflow in light and dark modes; verify keyboard/focus/labels, valid calculation, invalid-state clearing, JSON download and reopen, CSV/TXT content, parsed PDF output, zero unexpected network requests, canonical/OG/hreflang, console cleanliness and local artwork. PayGo unavailable-country behavior and the 12/54 regulator-link boundary need explicit browser checks.
