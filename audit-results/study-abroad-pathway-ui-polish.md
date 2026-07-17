# Study Abroad Pathway UI Polish and Coverage Check

Generated: 2026-05-22

## Verdict

Ready with warnings for this UI pass.

The page now behaves more like a route planner:
- Brighter travel-led hero using the Study Abroad visual asset.
- Popular pathway starter cards with icon-style markers.
- The five deeper destination cards are visible again for comparison.
- Single-route mode and comparison mode no longer show two competing result panels.
- The heavy trust/source panels stay hidden from the main customer flow.

## What Changed

- `tools/study-abroad-cost/index.html`
  - Added a Route Pathways section before the calculator.
  - Added six starter routes:
    - Nigeria to Germany, Master's STEM
    - Ghana to Canada, Master's business
    - Nigeria to Tunisia, Bachelor's business
    - Kenya to Australia, Master's health
    - South Africa to USA, PhD STEM
    - Rwanda to Morocco, Bachelor's health
  - Reworded internal confidence language into customer-facing route language.

- `tools/study-abroad-cost/study-abroad-customer-simplify.css`
  - Reworked the page toward a brighter travel/education feel.
  - Added icon-style visual treatment to chips, route cards, and destination comparison cards.
  - Kept source/trust clutter hidden from the main flow.
  - Preserved mobile-first spacing and no-horizontal-overflow behavior.

- `tools/study-abroad-cost/study-abroad-customer-simplify.js`
  - Added single-route vs comparison mode handling.
  - Pathway cards now use `data-route-destination` so the old five-destination comparison engine does not mistake Tunisia/Morocco/etc. for legacy comparison cards.
  - Single route shows the upgraded planner result only.
  - Comparing two or three deeper destination cards shows the comparison result only.

## Current Pathway Coverage

Current model dimensions:
- 20 home/budget origins
- 100 destination countries
- 3 study levels
- 5 field groups

Modeled route-level pathways:
- 20 x 100 x 3 = 6,000

Modeled route-field pathways:
- 20 x 100 x 3 x 5 = 30,000

Deeper hero-model route-field pathways:
- 20 x 5 hero destinations x 3 levels x 5 fields = 1,500

Non-hero planning route-field pathways:
- 28,500

Strict "fully done" pathway count:
- 0 if "fully done" means every cost field is current, source-backed, destination-specific, university-aware, and FX-timestamped.

Practical current production answer:
- 1,500 stronger modeled pathways using the five deeper destinations.
- 28,500 wider planning-estimate pathways that should not be sold as fully verified.

## Tunisia Example

Nigeria to Tunisia for BSc is available as a planning route, not a fully finished pathway.

Current app status for Tunisia:
- `ready_for_planning_estimate`
- Missing country-specific tuition source in the calculator data.
- Missing official visa/proof-of-funds source in the calculator data.
- Missing official/institution living-cost and insurance sources in the calculator data.
- FX is still static-estimate unless a timestamped provider is wired.

Research note:
- A Tunisia foreign-student fee schedule appears in the JORT 2019-086 text mirrored by 9anoun, with public-university annual fees such as 5,000 TND for licence, 6,000 TND for master's, 7,000 TND for doctorate, 9,000 TND for engineering/architecture-style tracks, and 15,000 TND for medicine-related tracks.
- This should be treated as an enrichment candidate only until verified against the official IORT/JORT publication/PDF and mapped by study level/field.

Candidate sources checked:
- 9anoun mirror of JORT 2019-086: https://9anoun.tn/fr/kb/jorts/jort-2019-086-7916b/arrete-du-ministre-de-l-enseignement-superieur-et-de-la-recherche-scientifique-du-16-octobre-2019-fixant-les-frais-d-etudes-imputes-aux-etudiants-etrangers-36-7013d48ef168cecf23a9d7d762b187d2
- JORT archive/search surface: https://www.jort.tn/

Recommended next data step:
- Create a Tunisia destination override only after the official JORT/IORT source is captured with source URL, source title, last checked date, and confidence metadata.

## Screenshots

- `audit-results/study-abroad-ui-pathway-polish/desktop-start.png`
- `audit-results/study-abroad-ui-pathway-polish/desktop-tunisia-single.png`
- `audit-results/study-abroad-ui-pathway-polish/desktop-compare.png`
- `audit-results/study-abroad-ui-pathway-polish/mobile-start.png`
- `audit-results/study-abroad-ui-pathway-polish/post-build-mobile-tunisia.png`
- `audit-results/study-abroad-ui-pathway-polish/post-build-desktop-compare.png`

## Browser Smoke Results

Saved to:
- `audit-results/study-abroad-ui-pathway-polish/browser-smoke.json`
- `audit-results/study-abroad-ui-pathway-polish/post-build-browser-smoke.json`

Summary:
- Desktop start: 6 pathway cards, 5 destination comparison cards, no horizontal overflow.
- Tunisia route: destination `tunisia`, level `bachelors`, field `business`, budget `9000000`, single enhanced result visible, comparison result hidden.
- Compare route: UK, Canada, and Germany selected, comparison result visible, enhanced single result hidden.
- Mobile 390px: no horizontal overflow.
- Console errors: none.
- Post-build Tunisia mobile smoke: single enhanced result visible, comparison result hidden, no horizontal overflow, no console errors.
- Post-build desktop comparison smoke: UK, Canada, and Germany selected, comparison result visible, enhanced single result hidden, no horizontal overflow, no console errors.

## Validation Commands

- `node --check tools/study-abroad-cost/study-abroad-customer-simplify.js`
- `node tests/study-abroad-confidence-gate.test.js`
- `node tests/study-abroad-data-trust.test.js`
- `node tests/study-abroad-conversion-layer.test.js`
- `node tests/study-abroad-fx-policy.test.js`
- `npm test`
- `cmd /c "npm run build > audit-results\study-abroad-ui-pathway-polish\npm-build-cmd.log 2>&1"` returned `exit=0`

## Remaining Product Work

- Add source-backed overrides for high-demand non-hero routes, starting with Tunisia, Morocco, France, Ireland, Netherlands, Malaysia, China, UAE, Mexico, and South Africa.
- Define a formal pathway as `home country + destination + level + field + tuition source + visa/proof source + living/insurance source + FX timestamp`.
- Add a pathway coverage dashboard so the product can show:
  - Deep route
  - Planning route
  - Needs data
- Avoid calling any route "accurate" or "complete" until all required fields are source-backed.
