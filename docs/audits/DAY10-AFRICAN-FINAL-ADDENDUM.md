# Day 10 African category final acceptance addendum

Date: 2026-07-27  
Branch: `codex/day10-african-final`  
Base: `305705374837b707557a15cad133063283c0dc0b`

## Acceptance result

- Hub: accepted on the Day 10 base and revalidated against the exact registry inventory.
- Canonical English African destinations: **35/35 accepted**.
- Product proof: every destination has its own deterministic browser oracle in `tests/e2e/day10-african-contracts.spec.js`; this is not a generic click-only smoke.
- Responsive proof: all 35 contracts run at 375 px in dark mode, reject horizontal overflow, repeat the overflow check at 200% root text size, and fail on unhandled runtime errors.
- Privacy proof: external requests are blocked during the deterministic run and the suite fails if its synthetic marker leaves the browser.
- Exports: CSV, TXT, and JSON downloads are reopened and inspected on the apps that expose those formats.

## Exact 35-app ledger

| # | Canonical destination | Independent product oracle and adverse-state proof |
|---:|---|---|
| 1 | `/tools/japa-calculator/` | Fixed relocation total and local conversion; destination change recalculates. |
| 2 | `/tools/generator-fuel/` | Fuel, litres, and unit-cost arithmetic; invalid price clears stale output; CSV download. |
| 3 | `/tools/mobile-money-fees/` | Kenya transfer fee table; invalid amount clears stale comparison. |
| 4 | `/tools/fintech-fee-watch/` | Evidence-quality score changes from 100 to 75 when a source is removed. |
| 5 | `/tools/ajo-tracker/` | Canonical landing reaches `app.html`; two-member pool and payout schedule; high-zoom mobile repaired. |
| 6 | `/tools/electricity-estimator/` | Appliance consumption arithmetic and usage-slider recalculation. |
| 7 | `/tools/fuel-cost/` | Distance, route condition, reserve, litres, and cost arithmetic; invalid input clears. |
| 8 | `/tools/hawala-tracker/` | Fixed corridor fee and effective-cost comparison; zero amount clears. |
| 9 | `/tools/burial-cost/` | Nigeria 100-guest planning total and funding-response change. |
| 10 | `/tools/staple-basket/` | Complete local evidence submission scores 6/6; removing evidence reduces the score. |
| 11 | `/tools/wholesale-retail-spread/` | Margin, markup, and target-price arithmetic; blank cost clears output. |
| 12 | `/tools/land-size/` | Area, valuation, sellable area, and buffer; missing dimension clears valuation. |
| 13 | `/tools/naira-to-words/` | NGN major/subunit wording; empty input clears output. |
| 14 | `/tools/amount-words-ke/` | KES major/subunit wording; empty input clears output. |
| 15 | `/tools/amount-words-gh/` | GHS major/subunit wording; empty input clears output. |
| 16 | `/tools/susu-tracker/` | Four-member rotation, net pool, named schedule; CSV download; invalid member count clears. |
| 17 | `/tools/whatsapp-link/` | Nigerian number normalization and URL encoding; Clear removes result. |
| 18 | `/tools/remittance-compare/` | Recipient-value comparison and savings; empty amount clears stale results. |
| 19 | `/tools/informal-fx-watch/` | Midpoint, spread, and quote arithmetic; blank quote clears. |
| 20 | `/tools/remittance-v2/` | Editable quote scenario and action plan; zero amount clears rather than defaulting. |
| 21 | `/tools/cost-of-living/` | Nairobi/Johannesburg totals and household budget response. |
| 22 | `/tools/afroatlas/` | Nigeria GDP/population investment brief; unknown selection clears and no longer reports false success. |
| 23 | `/tools/afropoints/` | Points gap, report count, and weekly timeline; input change recalculates. |
| 24 | `/tools/afrokitchen/` | Three distinct recipe days; TXT export reopened; impossible filters produce bounded empty state. |
| 25 | `/tools/africa-conflict/` | Bounded research brief; JSON export reopened and parsed. |
| 26 | `/tools/brideprice-advisor/` | Kenya planning target, family contribution, and instalment arithmetic with non-pricing framing. |
| 27 | `/tools/ajo-interest/` | Pool, fee, payout position, and reserve; invalid contribution clears. |
| 28 | `/tools/diaspora-guide/` | Nigeria-UK treaty checklist and official links; missing residence now returns guidance instead of crashing. |
| 29 | `/tools/nollywood-pitch/` | Budget buckets, funding gap, and shoot-day cost; funding change recalculates. |
| 30 | `/tools/okada-income/` | Daily-to-monthly rider arithmetic; invalid trips clear result. |
| 31 | `/tools/market-days/` | 2026 four-day cycle and named-market trip date. |
| 32 | `/tools/ajo-chama/` | Four rounds, pool, reserve, schedule, and Reset; invalid inputs clear schedule data. |
| 33 | `/tools/afroprices/` | Rice fixture ranking and local price; empty search now clears the previous result. |
| 34 | `/tools/ankara-kente-cost/` | Fabric, wastage, and three-piece production quote; invalid yards clear. |
| 35 | `/tools/fabric-cost/` | Fabric, notions, and wastage quote; invalid yards clear. |

## Defects closed in this final pass

- Removed stale results after invalid input from generator fuel, mobile money, fuel cost, Hawala, Susu, remittance compare, remittance v2, Ajo interest, Okada, Ajo-Chama, Ankara/Kente, and fabric-cost workflows.
- Corrected AfroAtlas so an unknown country cannot announce “Brief generated”.
- Corrected Diaspora Guide so an invalid residence selection cannot throw.
- Corrected AfroPrices so an empty query cannot leave an earlier price result visible.
- Hardened Ajo Tracker mobile layout at 375 px and 200% text size.
- Hardened Japa long labels at mobile/high text zoom.
- Refreshed the AfroKitchen planner test to the current result structure and actual “Copy shopping list” contract.

## Validation evidence

- `tests/e2e/day10-african-contracts.spec.js`: **35/35 passed** on deterministic workflows; final mobile/dark/200%-text run passed as 5/5 plus 30/30.
- `tests/e2e/afrokitchen-weekly-plan.spec.js`: **1 passed**.
- `tests/e2e/diaspora-inline-authority-links.spec.js`: **1 passed**.
- `node tests/day10-category-contract.test.js`: passed; exact Day 10 inventory and metadata contract.
- `node tests/day10-shared-export-privacy.test.js`: passed.
- `node tests/market-days-engine.test.js`: passed.
- `node tests/remittance-v2-engine.test.js`: passed.
- `node tests/generator-fuel-root.test.js`: passed.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run check-links`: passed; 124,782 internal links checked with no broken internal links.
- `npm run audit`: passed; its three reported missing external `africa-tools.com` destinations are carried registry backlog, not African-category regressions.
- `git diff --check`: passed.

## Artwork

No artwork was generated or replaced in this pass. Image needs remain a separate evidence lane in `reports/day10-african-religious-data-productivity-missing-artwork.md`.
