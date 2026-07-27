# Day 11 Telecom + Energy deep-improvement receipt

Date: 2026-07-27
Base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`
Branch: `codex/day11-telecom-energy`

## Proposed schedule correction

Add **Energy & Utilities** to Day 11 beside **Telecom**. This repairs the Energy omission in the prior 15-day schedule while keeping the implementation lane reviewable as one Day 11 receipt.

The master ledger was intentionally not edited. This receipt is the proposed correction and handoff evidence.

## Acceptance accounting

| Category | Canonical English owners | Canonical live/new experiences | Accepted | Left |
| --- | ---: | ---: | ---: | ---: |
| Telecom | 14 | 14 | 14 | 0 |
| Energy & Utilities | 20 | 287 | 287 | 0 |
| **Day 11 total** | **34** | **301** | **301** | **0** |

Counts were reproduced from `assets/js/components/tool-registry.js` and the route files on disk. They were not copied from a generated count or the scheduling prompt. Every physical route had to match its registry owner's declared `toolCount`; country variants received separate route credit.

Energy expands as follows:

- 55 routes each: Electricity Tariff, Solar ROI, and Prepaid Meter.
- 16 routes each: Solar vs Generator, Electricity Bill Verify, Water Bill, Gas/LPG Cost, PayGo Solar, Outage Cost, and Generator Fuel.
- 1 route each: Solar Sizing, Battery Sizing, Energy Audit, Appliance Power, Backup Duration, Diesel vs Solar Farm, Mini-Grid Feasibility, Carbon Footprint Energy, EV Charging, and Biogas ROI.

## Implementation completed

- Worked the Telecom hub before its 14 owners and preserved all existing canonical routes.
- Added a local-only Telecom freshness guard to the hub and every owner. It reads the existing dataset stamp, applies a 30-day high-risk review cadence, fails closed when missing or stale, and labels bundled operator prices, coverage, availability, roaming, TV, and USSD details as non-live planning inputs.
- Linked the guard to the existing Telecom official-source ledger. It performs no network request and writes no browser storage.
- Replaced unsupported Telecom hub certainty about portability, SIM registration, and exact roaming estimates with regulator/operator verification language.
- Reframed Airtime Value payout percentages as editable planning assumptions rather than observed operator offers or legal conclusions.
- Fixed the Energy Audit copy-action control after route-level 320px evidence found a 14px overflow. The action now wraps within its card without changing calculation logic.
- Added a deterministic browser harness with a dedicated port, offline API fixtures, owner-workflow and route sharding, 320/375px coverage, 200% reflow approximation, system/manual dark-mode checks, focus evidence, and independent Telecom arithmetic assertions.
- Added an inventory/contract test that verifies all 301 unique canonicals, titles, descriptions, H1s, structured data blocks, family disk counts, and Telecom freshness-guard coverage.

No shared navbar, shared design-system, localized generated output, broad generated hash, master-ledger, deployment, or live-project change was made.

## Workflow and formula evidence

- All 34 canonical owner workflows executed with deterministic synthetic inputs at 375px. Result surfaces were required to become non-empty and reject `NaN`, `Infinity`, and undefined output.
- All 301 physical routes loaded successfully at 320px with visible H1s and no document overflow after settling.
- Airtime Value independently verified a 5,000 NGN input against the page's editable 70–85% assumptions: 3,500–4,250 NGN.
- Roaming Cost independently verified Nigeria to Kenya for 7 days, 10 call minutes/day, 2 SMS/day, and 500 MB/day: 36,400 NGN.
- Thirty-one focused Energy engine/contract tests passed. These cover invalid and stale-result guards, reset behavior, country-family contracts, tariff/source provenance, privacy boundaries, and exposed TXT/CSV/JSON/copy exports, including tariff, prepaid, bill verification, solar, generator, LPG, PayGo, outage, backup, battery, mini-grid, EV, carbon, biogas, and appliance workflows.
- The existing AI Energy Advisor workflow and export contracts passed without adding an AI/provider or consent boundary.

## Source, freshness, and confidence

- Telecom ledger: valid with warnings. Dataset stamp `2026-03-01` was 148 days old; 9 of 12 markets with SIM/portability claims lack a bound regulator URL; 6 claim classes remain unsourced. The new UI therefore fails closed as an archived planning snapshot.
- Energy ledger: valid with warnings. Dataset stamp `2026-03` was 148 days old; 12 of 54 markets have a bound regulator source and 42 remain recorded gaps. Existing planning-grade and dated-source behavior was preserved.
- Fuel freshness: valid for 54 rows, with 0 rows marked official-verified. No current-price claim was added.
- Solar ROI data: all 54 countries passed assumptions, freshness, confidence, route, metadata, and adapter checks.

## Verification

Passed:

- `node tests/day11-telecom-energy-inventory.test.js`
- Day 11 Playwright harness: 12/12 route shards, 2/2 owner-workflow shards, exact Telecom arithmetic/freshness, and manual/system dark + focus + 200% reflow
- 31 focused Energy engine and route-contract test files
- `npm run telecom:sources:check` and `npm run energy:sources:check` (valid with the warnings recorded above)
- `npm run fuel:sources:check`
- `npm run solar-roi:data:check`
- `npm run category-workflow:verify`
- `npm run registry:check`
- `npm run audit`
- `npm run check-links`
- `npm run seo:report`
- `npm run ai:tool-context:check`
- `npm run audit:public-claims`
- `node tests/ai-consent-server.test.js`
- Privacy/AI-consent Playwright suite: 3/3
- Energy live-data Playwright cases: 2/2
- `node tests/ai-workflow-export.test.js`
- `npm run lint`
- `npm run type-check`
- `git diff --check`

Carried repository findings, not caused or broadened by this lane:

- `npm run source-registry:check` reports the committed global source registry is stale. Regenerating that broad artifact is outside the Day 11 generated-output boundary.
- `npm run audit` reports three unrelated registry routes with missing local pages.
- `npm run seo:report` reports existing auto-fix candidates but no missing canonical, title, description, or hreflang violations.
- Type-check reports the existing source-registry warning backlog for money tools.

## Risk and rollback

- Privacy: all new behavior is local-only; no raw inputs, storage, analytics payloads, or network sends were added.
- Accessibility: the guard is an announced status/alert, has a descriptive source link, supports keyboard focus, manual/system dark mode, reduced motion, and 320px/200% reflow. Existing focused Energy accessibility contracts remained green.
- SEO/AI search: all 301 routes retain unique canonical metadata and structured data. Unsupported live/current claims were reduced.
- Analytics: existing event names and wiring are unchanged.
- Exports: existing exports are unchanged; focused Energy export contracts and the AI workflow export test passed.
- Rollback: revert the Day 11 commit. There is no flag, migration, remote state, or generated artifact to unwind.

## Artwork

See the separate list at `reports/day11-telecom-energy-missing-artwork.md`.
