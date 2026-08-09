# Swahili Transport remaining-15 evidence

Date: 2026-08-09

Frozen coordinator base: `89d1f820fc26d1a54cfcc762765f6961ecb19008`

Lane: `codex/sw-transport-remaining15`

Decision: **14 accepted, 1 fail-closed blocker**

## Accepted English app owners

1. `car-import-cost`
2. `ride-fare`
3. `boda-income`
4. `matatu-fare`
5. `delivery-cost`
6. `car-loan-vs-cash`
7. `vehicle-registration`
8. `roadworthiness`
9. `vehicle-depreciation`
10. `last-mile-delivery`
11. `parking-fee`
12. `route-cost`
13. `toll-calc`
14. `vehicle-tracker-roi`

The 13 planning tools now use one maintained DOM-free engine with per-owner validation and a local-only controller. Invalid inputs clear stale output. Their forms retain user-supplied rates and fees rather than presenting mutable operator or authority rates as current facts. Obvious English form-label remnants were translated, and all 13 social previews use their existing dedicated tool artwork.

`car-import-cost` retains the existing production engine, country rule packs, visible source-review boundary, local AI fallback and route-only sharing. Its CSV was parsed as rows and its PDF was signature-checked and reopened with `pdf-parse`. The Swahili PDF path is now explicitly ungated and local.

## Fail-closed blocker

- `car-price-intelligence`: no physical Swahili owner or maintained Swahili generator exists. The English owner is the multi-country `/cars/` directory rather than a single calculator route, and the Transport source ledger currently marks this owner `changed`. Creating a thin page would neither translate the directory product nor establish current market/source correctness. No route was fabricated.

## Browser and product proof

- Chromium: **14/14 passed** in one worker on isolated port 43821.
- All 14 physical owners: calculation, invalid/reset behavior, 320px, 375px, 200% reflow, light/dark themes, keyboard focus, canonical, English hreflang peer, dedicated artwork, console and local-resource checks.
- Privacy: no raw-marker request body escaped any tool. The 13 planning tools have no network or persistence API in their controller.
- Exports: the 13 planning tools advertise copy only and no file exports. `car-import-cost` advertises CSV and PDF; both were downloaded and parsed/reopened.

## Gates

- PASS `node scripts/build-sw-transport-remaining-parity.js`
- PASS `node tests/sw-transport-remaining-engine.test.js`
- PASS `node tests/sw-transport-remaining-parity.test.js`
- PASS `node tests/car-import-cost-engine.test.js`
- PASS `node tests/car-import-cost-rule-packs.test.js`
- PASS `node tests/car-import-cost-routes.test.js`
- PASS `node tests/swahili-transport-static-candidate.test.js`
- PASS `node scripts/update-transport-source-ledger.js --check`: 41 sources, 4 changed, 11 blocked/manual, **0 broken**
- PASS `npm run lint`
- PASS `npm run type-check`
- PASS `git diff --check`
- PASS zero deleted files
- PASS focused canonical/hreflang assertions for every accepted owner

Full-site `validate:hreflang` and `check-links` are not release receipts from this disk-light sparse checkout: both enumerate large unrelated/missing-sparse-tree backlogs. The focused owner assertions and browser metadata checks are green. Central acceptance, AI route maps, localization coverage, global directories, sitemaps and service worker were intentionally not edited.
