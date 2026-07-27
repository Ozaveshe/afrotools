# Day 7 Government, Insurance, Mortgage & Property evidence receipt

Date: 2026-07-27

Branch: `codex/day7-government-insurance-property-20260727`

Base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`

State: local pass only; no deploy, merge, master-ledger edit, broad deploy generation, sitemap generation, localized-output generation or generated-hash rebuild.

## Acceptance accounting

| Scope | Canonical registry apps | Hub routes | Expanded experiences | Local result |
| --- | ---: | ---: | ---: | --- |
| Government & Civic | 15/15 | 16/16, including the separately owned Public Holidays adjunct | 123/123 | Accepted locally |
| Insurance | 16/16 | 16/16 | 322/322 actual HTML routes | Accepted locally |
| Mortgage & Property | 28/28 hub routes | 28/28 | 28/28 | Accepted locally |
| Day 7 total | 59/59 category-owned canonical apps | 60/60 tool routes, including one Government adjunct | 473/473 registry experiences | Accepted locally |

The three category hubs are accepted locally. Government's hub has 15 Government registry apps plus `/tools/public-holidays/`, whose registry owner remains `data-productivity`; it is not silently counted as a Government registry app.

Government's 123 expanded experiences are now reconciled as:

- Visa Route Verification: 55 experiences = one canonical planner plus 54 actual country HTML routes. All 54 country routes were rebuilt and browser-proved.
- Work Permit Cost: 55 experiences = one canonical worksheet plus 54 country selector contexts. The old four-country selector was expanded to 54. Four countries have a bound immigration authority; 50 show an explicit source gap.
- Other Government tools: 13 single canonical experiences.

Insurance's 322 experiences are 322 actual HTML route files across 16 families. Every route executes the same family contract with its own canonical, country context and source state; no family received blanket credit from the template alone.

Mortgage & Property is not equivalent to the Legal registry. The current English live/new Legal registry count is **67**, not the ledger prompt's older 66:

- 20 Legal registry rows are linked by the Mortgage & Property hub and accepted here.
- 8 Finance or Engineering adjunct rows are linked by the hub and accepted here under their real owners.
- 47 other Legal/compliance rows are outside the hub and receive **no Day 7 acceptance**.

## Implementation

### Government

- Rebuilt 15 Government canonical workflows and the Public Holidays adjunct around deterministic local planning, official-verification, source-gap and no-verdict boundaries.
- Rebuilt the 54 Visa destination routes from a maintained generator.
- Expanded Work Permit from four source choices to 54 country contexts without inventing authorities; source gaps are visible and the blank official link is hidden.
- Added parser-validated local TXT exports for FOI and Work Permit, and a parser-validated ICS export for Public Holidays.
- Fixed the scoped Government verification CSS so `[hidden]` authority links cannot be forced visible.

### Insurance

- Rebuilt the Insurance hub as a truthful 16-app router.
- Rebuilt all 322 route files from `scripts/build-day7-insurance-family.js`.
- All prices, rates, contributions, limits and contingencies now come from the user. The UI does not present live premiums, eligibility, provider rankings, official status or a coverage decision.
- Each country route binds a regulator directory only when one exists in `data/insurance/official-sources.json`; otherwise it presents a source gap.
- The dataset floor is shown as 29 March 2026 and dynamically labelled stale beyond the 60-day high-risk cadence.
- Insurance exports are N/A: the rebuilt primary workflows expose no file export.

### Mortgage & Property

- Rebuilt the hub with the exact 20 Legal + 8 Finance/Engineering ownership split.
- Preserved seven mature assumption-first Finance workflows and proved them with their existing parser-backed suites:
  - `/tools/mortgage-calculator/`
  - `/tools/rent-vs-buy/`
  - `/tools/mortgage-affordability/`
  - `/tools/home-loan-eligibility/`
  - `/tools/property-transfer-cost/`
  - `/tools/first-home-buyer/`
  - `/tools/property-roi/`
- Rebuilt the remaining 21 routes (20 property-specific Legal rows plus Engineering-owned Renovation Cost) as input-only arithmetic, comparison, drafting or checklist workflows.
- Rental Agreement now produces a local review draft with a parser-validated TXT export and an explicit legal-review boundary.
- No tool claims to approve a loan, verify title, value property, issue a permit, screen a tenant, forecast a market, provide a statutory rate or give legal advice.

## Changed-file inventory

The scoped product diff contains 415 changed HTML files:

- Government: the 15 Government canonical pages, `/tools/public-holidays/index.html`, and 54 `/tools/visa-checker/{country}.html` files.
- Insurance: `insurance/index.html` and all 322 HTML files under the 16 Insurance tool directories.
- Mortgage & Property: `mortgage-property/index.html` and 21 rebuilt tool `index.html` files.

Maintained source assets:

- `assets/css/government-verification-planner.css`
- `assets/css/insurance-assumption-workflow.css`
- `assets/css/property-assumption-workflow.css`
- `assets/css/property-workflow-hub.css`
- `assets/css/visa-family-verification.css`
- `assets/js/pages/government-verification-planner.js`
- `assets/js/pages/insurance-assumption-workflow.js`
- `assets/js/pages/property-assumption-workflow.js`
- `assets/js/pages/property-workflow-hub.js`
- `assets/js/pages/visa-family-verification.js`
- `scripts/build-day7-insurance-family.js`
- `scripts/build-day7-property-tool.js`
- `scripts/build-day7-visa-family.js`
- `scripts/build-day7-work-permit-options.js`

Harness/config changes:

- `playwright.config.js` now uses the same configurable port/base URL for both the browser and static server.
- `tests/e2e/day3-finance-mortgage-vip.spec.js` scopes the no-AI/network assertion to the mortgage app and separates permitted analytics metadata from entered financial values.
- Day 7 source contracts: every `tests/day7-*.test.js` file added by this branch.
- Day 7 browser harnesses:
  - `tests/e2e/day7-government-workflows.spec.js`
  - `tests/e2e/day7-insurance-workflows.spec.js`
  - `tests/e2e/day7-property-workflows.spec.js`
  - `tests/e2e/day7-visa-family.spec.js`
  - `tests/e2e/day7-work-permit-family.spec.js`

No navbar, global design-system, registry, source-ledger, localized, sitemap, minified, bundled, `dist/`, master-readiness-ledger or deploy file was changed.

## Browser proof

- Government canonical/hub/adjunct suite: 17/17 passed.
- Visa country family: 54/54 passed.
- Work Permit country contexts: 27/27 group A and 27/27 group B passed after the hidden-link repair.
- Insurance + rebuilt Property matrix: 345/345 passed serially in 15.6 minutes.
- Preserved Property workflow suites: 10/10 English browser/export cases passed across seven routes.
- Privacy/AI consent suite: 3/3 passed.

Coverage includes deterministic synthetic workflows, invalid or empty states, reset/focus, 320/375px widths, system and manual dark state, 200% text reflow, visible labels and live output, no raw input in network bodies or tool storage, and console/page-error checks.

Parser reopening includes mortgage, rent-vs-buy, mortgage budget, home-loan file, transfer quote, first-home readiness and property ROI PDF/JSON/TXT exports; Government FOI and Work Permit TXT; Public Holidays ICS; and Property Rental Agreement TXT.

## Repository gates

Passed:

- all `tests/day7-*.test.js`
- `git diff --check`
- `npm run insurance:sources:check` (advisory warnings remain)
- `npm run category-workflow:verify`
- `npm run registry:check`
- `npm run test:registry`
- `npm run audit`
- `npm run check-links`
- `npm run seo:dry`
- `node tests/ai-tool-context-drift.test.js`
- `node tests/ai-tool-context-invariants.test.js`
- `npm run audit:public-claims`
- `npm run pdf:verify`
- `npm run lint`
- `npm run type-check`
- `npm run test:privacy-ai-consent`

Known non-Day-7 or source-state failures/warnings:

- `npm run government:sources:check` fails: 67 sources, 10 changed, 26 blocked/manual and one broken source (`stp-cen`, HTTP 503). Route UI therefore does not present a live government verdict.
- `npm run insurance:sources:check` passes but reports the 29 March 2026 dataset floor as 120 days old, 29/54 markets without a bound regulator URL, eight unsourced claim classes and only five verified figures. The rebuilt workflows do not consume those premium/rate figures.
- `npm run legal-workflow:verify` fails on the pre-existing sitewide expectation that the Legal hub title say “69 Apps.” Current scoped inventory finds 67 English live/new Legal rows. This verifier is not used to grant Mortgage & Property acceptance.
- `npm run audit` passes but reports three unrelated missing career pages.
- `npm run seo:dry` passes with broad pre-existing suggested fixes (8 canonical attributes, 22 OG URLs and 681 JSON-LD blocks). Day 7 route contracts independently pass self-canonical, title, description and schema checks.
- The public-claims audit passes with a broad warning that 422 money tools lack a source-registry entry, including `property-cgt`; the rebuilt route therefore uses no bundled statutory rate and requires user input.

## Remaining risk and proof boundary

- This receipt is `LOCAL PASS`, not artifact, preview or live proof.
- No broad deploy build, `dist` audit, preview, deployment or production verification was run because the Day 7 delegation forbids deploy generation and deployment.
- Government and Insurance source freshness needs director/source-lane follow-up; it must not be “fixed” by copying unverified rates or changing timestamps.
- The sitewide Legal count/title contract needs separate owner reconciliation and must not be folded into this Property PR.
