# Day 6 Agriculture deep-improvement evidence

Branch base refreshed before handoff: `origin/main` at `24f6aeb22f8aad529cea1384f96db780dd08a611`

Proof boundary: local source, deterministic engine, static-discovery and Chromium evidence only. This pass does not edit the master readiness ledger, run the broad deploy build, generate sitewide localized output, deploy or claim live-production indexing.

## Reproducible acceptance counts

The source slice is every English `live` or `new` registry row whose category is `agriculture`.

| Contract | Count | Reproduction |
|---|---:|---|
| Explicit canonical Agriculture routes | 447 | `npm run test:day6-category` |
| Static descriptive links in `/agriculture/all-tools/` | 447, each exactly once | `npm run agriculture:discovery:check` |
| Farm-work areas | 8 | `npm run agriculture:discovery:check` |
| Task families | 32 | `node scripts/agriculture-taxonomy-report.js` |
| Maintained pan-African entry workflows | 16 | `node tests/day6-agriculture-family-calculators.test.js` |
| Country-specific Agriculture registry routes | 414 | `node tests/agriculture-deep-improvement.test.js` |
| Fertilizer country routes | 54 | same test |
| Irrigation country routes | 54 | same test |
| Seed-rate country routes | 54 | same test |
| Misleading generic duplicate panels removed | 218 | `node scripts/clean-agriculture-duplicate-panels.js --check` |

Local route acceptance: **447 accepted, 0 left**. This means every explicit registry route has local route ownership, public-language checks and a primary workflow or an intentionally navigational/static guide contract. It is not a deployment, ranking or Google-indexing claim.

## Index and discovery repair

- `/agriculture/` now presents user-facing farm tasks and links prominently to `/agriculture/all-tools/`.
- `/agriculture/all-tools/` is a static, crawlable `CollectionPage` with 447 descriptive links, grouped into eight farm-work areas and 32 task families. It does not depend on JavaScript or a load-more action.
- All eight work-area guides link to the complete directory.
- The hub and work-area pages no longer expose internal terms such as registry, taxonomy, bucket, thin page, QA status or decision workspace.
- The directory owns its canonical, title, description, social metadata, structured data and AI-search context. Existing AI tool context remains current for 568 tools.

Static internal links improve discovery, but neither internal links nor sitemap inclusion guarantees search-engine indexing or ranking.

## Product and correctness repairs

### Pan-African entry apps

The maintained deterministic helper now owns 16 distinct entry workflows:

1. Crop yield
2. Fertilizer
3. Irrigation
4. Farm profit
5. Seed rate
6. Fish farming
7. Greenhouse cost
8. Cassava processing
9. Farm-loan payment planning
10. Crop-insurance cost planning
11. Farm payroll
12. Livestock feed
13. Poultry ROI
14. Vaccination budget planning
15. Harvest-date estimation
16. Input-price comparison

Each fixture independently verifies its formula and invalid input. Browser proof also covers stale-result clearing, reset, visible labels, keyboard focus and live result status. Loan output does not claim eligibility or approval; vaccination output does not prescribe a medical schedule.

### Removed duplicate pseudo-workflows

The prior generic `quantity or area × unit cost × risk buffer` panel appeared on 218 unrelated routes and could be mistaken for each route's primary app. Those panels and their batch/QA prose were removed. Sixteen remaining `data-df-upgrade` forms are job-specific.

### Fertilizer country family

- All 54 pages now restrict crop choices to crops with a maintained nutrient-removal method.
- The Comoros default-crop failure is fixed.
- All 53 generated non-Nigeria pages use country-owned fertilizer narrative rather than inherited Nigeria-only PFI, FMARD, Dangote, ADP or BVN content.
- Results are labelled planning estimates and retain the local agronomist/extension boundary.

### Seed-rate country family

- Djibouti was the only country whose maintained crops had no seed-method intersection. A shared tomato method now uses disclosed FAO field-density/spacing guidance and a documented AGRIS thousand-seed-mass basis.
- Packet size is not invented: where no maintained packet size exists, packet/bag count is omitted.
- All 54 pages load the maintained extension, avoid “exact seed quantity” claims, own the correct country breadcrumb schema and remain within the description-length contract.

### Country identity

All 414 country-specific Agriculture routes now prove:

- exactly one `afrotools-country-id`;
- exactly one source jurisdiction;
- exactly one formula jurisdiction;
- exactly one correct currency;
- a canonical matching the explicit registry route.

The 54 fertilizer, 54 irrigation and 54 seed-rate pages additionally prove country-owned farming context, country breadcrumb schema and related-tool identity. This caught and repaired duplicate/conflicting Nigeria metadata, Nigeria farming facts on non-Nigeria seed pages, and Nigeria breadcrumb schema on non-Nigeria irrigation pages.

## Browser proof

The maintained browser harness executes primary controls rather than accepting render-only success:

- all 487 Day 6 English routes: status, canonical, description, JSON-LD, 320px, 375px, manual/system dark mode and 200% text reflow;
- all 16 maintained Agriculture entry apps: deterministic result, invalid input, stale result, reset, labels, focus and live status;
- all other 431 Agriculture routes: primary button/select/checkbox, named country navigation, or structured static-guide contract; no page errors or external state-changing requests;
- all 40 Transport and Trade routes: app-owned workflows plus local export reopen/parser checks where exposed.

The uninterrupted final suite initially found four seed descriptions at 183–187 characters. After the generator fix, the complete 487-route metadata/mobile contract passed. The full 431-route Agriculture workflow test passed in the same final suite.

## Source receipts

- Tomato planning basis: FAO crop information describes transplanted tomato spacing and about 40,000 plants/ha; AGRIS records a common tomato thousand-seed mass around 3 g. The UI tells users to confirm variety-label and seed-lot values locally.
- `npm run transport:sources:check`: 41 sources, six changed, 11 blocked/manual, zero broken.
- `npm run trade:sources:check`: 21 sources, valid ledger. The May 2026 dataset is 87 days old and nine duty-rate markets have no bound customs-authority URL, so affected Trade outputs remain planning-grade.
- No new live API, official-status, filing, integration or AI behavior was claimed.

## Validation receipt

| Gate | Result |
|---|---|
| `npm run test:day6-category` | Pass: 447 Agriculture routes, 16 entry formulas, 414 country identities |
| `npm run agriculture:discovery:check` | Pass: 447 static links, eight work areas, duplicate-panel cleanup current |
| `npm run agriculture:taxonomy` | Pass: 447/447 assigned; zero duplicate or missing |
| `npm run category-workflow:verify` | Pass |
| Day 6 hub and static-directory browser tests | Pass |
| Day 6 16-entry browser fixtures | Pass |
| Day 6 431-route Agriculture workflow browser test | Pass |
| Day 6 40-route Transport/Trade workflow and export test | Pass |
| Day 6 complete 487-route mobile/metadata contract rerun | Pass |
| `npm run check-links` | Pass: 125,017 internal links across 10,837 HTML files |
| `npm run audit` | Pass with three carried external `africa-tools.com` page findings |
| `npm run seo:report` | Pass for missing canonical/title/description/hreflang; report-only auto-fix candidates remain outside scope |
| `npm run ai:tool-context:check` | Pass: current for 568 tools |
| `npm run test:privacy-ai-consent` | Pass: server test and three browser tests |
| `npm run pdf:verify` | Pass: 31 registry tools, 34 HTML/app surfaces |
| `npm run audit:public-claims` | Pass; carried source-registration warnings remain |
| `npm run lint` / `npm run type-check` / `npm run security:scan` | Pass |
| `npm run transport:sources:check` / `npm run trade:sources:check` | Pass with the advisory source warnings above |
| `npm run calculation-quality:check` | External blocker inherited from current `origin/main`: generated formula registry is stale for multiple non-Day-6 routes. The scoped seed engine was restored unchanged so this branch adds no engine digest mismatch. The generated hash registry was not edited under the Day 6 contract. |
| `git diff --check` | Pass |

The broad deploy build was intentionally not run locally. The automatic Netlify PR preview failed during its build stage with exit code 2 and published no preview; GitHub Playwright smoke passed. Artwork remains separate in `reports/day6-agriculture-transport-trade-image-needs.md`.
