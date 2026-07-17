# Engineering Section Improvement Pass - 2026-04-27

## Scope

Reviewed the English engineering section at `/engineering/` and improved every engineering app surfaced by the registry, with AfroDraft handled last as the special CAD surface. The pass keeps each app distinct by adding a tailored Engineering Pack instead of a generic batch banner.

## Implemented

- Added `assets/js/engineering-toolkit.js` as the shared per-route enhancement layer.
- Added `assets/css/engineering-enhancements.css` for the new field-pack UI, responsive layout, print output and floating app drawer.
- Wired the pack into the engineering hub, all 25 existing registry-backed engineering tools, AfroPlan Floor Planner, BOQ Builder app and AfroDraft app.
- Added `afroplan-floor-planner` to `assets/js/components/tool-registry.js` and regenerated `assets/js/components/tool-registry.min.js`.
- Updated `engineering/index.html` metadata, ItemList JSON-LD and SEO internal links to reflect 26 engineering tools from the live registry.

## Research Inputs

- Autodesk AutoCAD Web feature set: command line, layers, measurements, dimensions, trace, blocks, cloud sharing and mobile/offline workflows.
  Source: https://www.autodesk.com/products/autocad-web/features
- RoomSketcher floor plan app feature set: 2D drawing, measurements, room names, symbols, 3D view, tracing/importing sketches, exports and cross-device/offline workflows.
  Source: https://www.roomsketcher.com/features/roomsketcher-app/
- NLR/NREL PVWatts V8 inputs: system capacity, module type, losses, array type, tilt, azimuth, soiling, albedo and monthly/annual output fields.
  Source: https://developer.nrel.gov/docs/solar/pvwatts/v8/
- RICS construction standards and NRM: cost management, project planning, measurement rules, cost prediction, tendering, interim valuation and risk management.
  Source: https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/construction-standards
- RICS NRM 2: detailed measurement for building works and bill-of-quantities preparation.
  Source: https://www.rics.org/content/dam/ricsglobal/documents/standards/nrm_2_detailed_measurement_for_building_works_1st_edition_rics.pdf
- EPA septic systems guidance: design and maintenance framing, decentralized wastewater funding, care, maintenance and water-source protection.
  Source: https://www.epa.gov/septic
- OSHA scaffolding topic page: scaffold hazards, controls, construction references, standards and safety checklists.
  Source: https://www.osha.gov/scaffolding

## Per-App Improvements

| App | Improvement |
| --- | --- |
| Engineering hub | Adds a control board for choosing the right tool, documenting assumptions and moving into companion tools. |
| Solar Panel Calculator | Adds PV site pack checks for roof shade, tilt, azimuth, losses, autonomy, inverter surge, battery chemistry and generator comparison. |
| Building Cost Estimator | Adds scope, finish tier, external works, contingency and QS handoff notes. |
| AfroPlan Floor Planner | Adds Plan QA for room schedule, openings, ventilation, export readiness and copyable handoff. |
| BOQ Builder | Adds RICS/NRM-style tender readiness QA, PDF QA notes, save-state repair and source links. |
| BOQ Builder app | Adds the working Tender QA modal inside the BOQ app. |
| Structural Calculator | Adds a structural review pack for load path, span, support, deflection, code basis, engineer review and revision control. |
| Electrical Load Calculator | Adds load schedule checks for diversity, motor starts, breaker/wire coordination, earthing, voltage drop and generator link-out. |
| Concrete Mix Calculator | Adds site batch notes for grade, water control, aggregate moisture, slump, curing, bag count and waste. |
| Paint Coverage Calculator | Adds surface prep, coats, primer, sheen, brand coverage, wastage and room handoff notes. |
| Tiles & Flooring Calculator | Adds tile module, grout, breakage, slope, skirting, adhesive and shade-batch checks. |
| Water Tank Sizing Calculator | Adds demand, reserve days, pump head, inlet, overflow, base, pipe and dry-season checks. |
| Roofing Material Calculator | Adds pitch, sheet length, laps, purlins, fixings, valleys, gutters, transport and safety notes. |
| Borehole Cost Estimator | Adds hydrogeology, depth, casing, pump, water test, platform, permit and maintenance reminders. |
| Rebar Calculator | Adds bar bending schedule notes for diameter, spacing, covers, laps, hooks, cut waste and delivery bundles. |
| Generator Size Calculator | Adds surge, continuous load, phase, fuel, acoustic, ventilation, ATS, maintenance and solar comparison checks. |
| Bill of Quantities Generator | Adds measurement rules, missing categories, tender exclusions, alternates and Excel/PDF handoff notes. |
| Renovation Cost Calculator | Adds demolition, protection, live-occupancy, hidden defects, contingency and phase planning notes. |
| Septic Tank Size Calculator | Adds household demand, sludge storage, soakaway, soil test, setback, vent, access and maintenance checks. |
| Fence Cost Calculator | Adds perimeter survey, gate count, foundation, security topping, soil, corner post and boundary risk checks. |
| Swimming Pool Cost Estimator | Adds filtration, waterproofing, pump room, drainage, safety, landscaping and maintenance notes. |
| Architectural Drawing Fee Calculator | Adds fee basis, deliverables, approvals, revisions, site visits, consultant exclusions and milestone payment checks. |
| Site Clearing Cost Estimator | Adds vegetation, haulage, topsoil, access, erosion, tree approvals, disposal and equipment notes. |
| Road Construction Cost Estimator | Adds subgrade, drainage, shoulders, compaction, traffic management, testing and maintenance notes. |
| Scaffolding Calculator | Adds OSHA-inspired access, platform, guardrail, tie, inspection, load and dismantling safety checks. |
| Window & Door Sizing Guide | Adds opening schedule, egress, ventilation, lintel, frame, hardware, mosquito screen and security grille checks. |
| Plumbing Material Calculator | Adds fixture count, pipe route, pressure, valves, cleanouts, venting, water heater and leak-test checks. |
| AfroDraft 2D CAD | Handled last. Adds a special CAD QA drawer for layers, snaps, blocks, dimensions, title block, export readiness, revision notes and companion construction tools. |

## App-Specific Deep Passes

### Solar Panel Calculator - 2026-04-28

Research checked PVWatts V8 and DOE home solar planning guidance. The solar page already sized panels, batteries, inverter, MPPT and generator ROI, but it hid major PV assumptions behind one fixed 25% loss and recommended batteries even in grid-tied mode.

Changes:

- Added panel direction, shade loss, dust/soiling and usable roof area inputs.
- Replaced the fixed loss shortcut with a PVWatts-style derating profile using base system factor, orientation, shade and soiling.
- Added effective sun and roof area result cards.
- Added a Site QA tab for derate, load discipline, roof fit, system mode and installer handoff checks.
- Made on-grid mode disable battery inputs and return 0 batteries / 0.0 kWh instead of a backup bank.
- Added a compact source card linking PVWatts V8, the PVWatts calculator and DOE solar planning guidance.
- Removed long-dash punctuation from the updated solar page copy.

Validation:

- Inline solar scripts parsed with `new Function`: passed.
- Chrome DevTools Protocol smoke: passed. Test set grid-tied mode, roof area 12 m2, shade 20%, dust 12%, then ran `calculate()`. Output confirmed visible results, 0 batteries, 0.0 kWh battery bank, effective sun, roof area, 5 Site QA cards, source card and disabled battery controls.

### Building Cost Estimator - 2026-04-28

Research checked RICS NRM and the RICS cost prediction professional standard. The existing estimator only multiplied room area by a city rate, buried project scope assumptions in fixed percentages, and had a broken print/export function after the shared engineering script was accidentally injected into the print-window HTML string.

Changes:

- Fixed the inline script parse failure in `exportPDF()` and moved the Engineering Pack script include back onto the actual page.
- Fixed a runtime bug where `calculate()` filled totals but left the results panel hidden because CSS still applied `display:none`.
- Added scope controls for estimate stage, site difficulty, preliminaries, external works, professional fees, contingency, price escalation and circulation/wall allowance.
- Reworked the model so measured room area is grossed up to project floor area, direct building works are separated from project allowances, and totals show a blended cost per m2.
- Added a budget confidence and assumptions panel with expected range, gross floor area, confidence band, scope notes and exclusions.
- Expanded the breakdown table to show measured building works separately from project allowances.
- Added RICS method links and a BOQ handoff source card.
- Updated SEO and FAQ copy so it no longer claims a fixed contingency or fixed professional fee allowance.
- Removed long-dash punctuation and non-ASCII area/times symbols from the edited page copy.

Validation:

- Inline Building Cost scripts parsed with `new Function`: passed.
- Chrome DevTools Protocol smoke: passed. Test set measured-design stage, difficult site, 12% preliminaries, 15% external works, 15% professional fees, 20% contingency, 10% escalation and 25% grossing-up, then ran `calculate()`. Output confirmed visible results, grand total, blended cost per m2, 4 summary cards, 4 assumption notes, allowance rows, confidence width, 3 source links and the Engineering Pack.

### AfroPlan Floor Planner - 2026-04-28

Research checked current floor-planner and CAD app patterns from RoomSketcher and Autodesk: useful plans are not only drawings, they carry room names, measurements, openings, export readiness and review handoff. AfroPlan already had canvas drawing, templates, furniture, cost estimate, exports and the shared Engineering Pack, so the deep improvement focused on review after drawing rather than adding another drawing primitive.

Changes:

- Added `engineering/floor-planner/js/fp-qa.js`, a Plan QA layer that reads the live `FPApp.exportPlanData()` canvas state.
- Added a Plan QA action button to the app toolbar.
- Added a modal with key metrics for rooms, area, wall length, openings and furniture.
- Added room-by-room QA for area, approximate size, doors, windows and naming.
- Added review checks for room schedule, measurable area, ventilation openings, access points, wet-core labels, bedroom privacy, furniture fit and export readiness.
- Added a copyable client/site handoff summary for the current plan.
- Added `engineering/floor-planner/css/fp-qa.css` for compact modal layout and mobile-friendly report tables.
- Added source links in the QA panel to RoomSketcher app features and Autodesk Web help.

Validation:

- `node --check engineering/floor-planner/js/fp-qa.js`: passed.
- Inline AfroPlan page scripts parsed with `new Function`: passed.
- Chrome DevTools Protocol smoke: passed. Test loaded the first built-in template, opened Plan QA and confirmed the button, modal, 5 metrics, 8 checks, 7 room rows, 2 source links, 7 report rooms, 95 m2 report area, Engineering Pack and nonblank canvas dimensions with no runtime exceptions.

### BOQ Builder - 2026-04-28

Research checked RICS NRM and NRM 2, with focus on detailed measurement, bill-of-quantities preparation, tender use, descriptions, units, preliminaries and pricing basis. The BOQ app already had categories, templates, editable line items, VAT, markup, CSV and PDF, but runtime validation exposed two concrete faults: the PDF exporter still contained an injected HTML meta tag inside JavaScript, and `save-state.js` was loaded as a classic script even though it is an ES module.

Changes:

- Fixed the BOQ app PDF exporter parse/runtime issue by removing the injected meta tag from the print-window HTML builder.
- Removed the broken classic `save-state.js` include from the BOQ landing and app pages.
- Added a local `SaveState` fallback in the app so save/load works without depending on module execution timing.
- Added a topbar Tender QA button and modal.
- Added Tender QA metrics for readiness score, active line items, fully priced items, used categories and grand total.
- Added checks for missing rates, missing quantities, missing descriptions, measurement units, preliminaries, external works, project metadata, country/VAT basis and contingency.
- Fixed `shareBOQ()` so “Grand Total” uses the actual grand total including contingency, VAT and markup instead of subtotal.
- Added Tender QA data into PDF export so the generated document carries readiness score, line item completeness, open risks and method note.
- Added RICS NRM and NRM 2 source links in the QA panel.
- Removed long-dash punctuation from the BOQ pages touched in this pass.

Validation:

- Inline BOQ app and landing scripts parsed with `new Function`: passed.
- Chrome DevTools Protocol app smoke: passed. Test loaded the 3-bedroom bungalow template, set project metadata and country, filled rates, opened Tender QA and stubbed PDF export. Output confirmed active QA modal, 5 metrics, 10 checks, 2 source links, 100% readiness on the completed test data, 51 active/priced items, grand total, SaveState fallback, PDF QA content, no injected meta in PDF HTML and Engineering Pack.
- Chrome DevTools Protocol landing smoke: passed. Output confirmed the BOQ landing title, app CTA, saved-work container, Engineering Pack and no runtime exceptions.

## Validation Results

- `node --check assets/js/engineering-toolkit.js`: passed.
- Registry parse check: passed with 26 English engineering tools and no missing required IDs.
- Toolkit route coverage: passed for the hub, 26 tool routes, BOQ app and AfroDraft app.
- Include coverage: passed with one engineering CSS include and one engineering toolkit script include per wired file.
- `npm run check-links`: passed on final run with no broken internal links.
- `npm run audit`: passed. Engineering now reports 26 tools.
- `npm test`: passed. Final combined output reported 1324 registry tools, 1319 landing pages and 41 full app pages in the current dirty tree.
- Headless Chrome DOM smoke: passed for `/engineering/`, `/tools/solar-calculator/`, `/tools/septic-tank/`, `/engineering/floor-planner/`, `/tools/boq-builder/app.html` and `/engineering/afrodraft/app.html`.

## Continuation Pass - 2026-04-28

Scope:

- Reworked `/engineering/` from a static tool directory into an Engineering Project Desk.
- Kept the visible hub aligned to the full 26-app Engineering surface, including the routes that can lag behind registry-card rendering.
- Added per-app market-check notes to the shared Engineering Pack layer so every Engineering app gets a specific competitor-informed improvement prompt, not a generic category banner.
- Added local dashboard persistence for Engineering Packs and Engineering Workflows through `afro_engineering_packs` and `afro_engineering_workflows`.
- Added optional account workspace sync through `AfroWorkspace.upsert()` when the user is signed in.
- Added reusable Engineering PDF/email gate handling around export, download and print actions so report-style outputs can capture lead details.
- Added dashboard rendering for Engineering workspace items.
- Fixed a rebar PDF export regression where a previous injected script/meta fragment had broken the export function and removed the actual Engineering Toolkit include from the page.

Research inputs:

- Procore platform workflow framing for connected drawings, documents and project controls.
  Source: https://www.procore.com/platform
- Autodesk Build workflow framing for drawing and construction management coordination.
  Source: https://construction.autodesk.com/products/autodesk-build/
- Bluebeam takeoff and estimation workflow framing for measured quantities and PDF-based review.
  Source: https://www.bluebeam.com/workflows/takeoffs-and-estimation/
- NREL PVWatts framing for solar inputs, losses and production assumptions.
  Source: https://pvwatts.nrel.gov/
- SkyCiv beam calculator framing for member assumptions and structural review checks.
  Source: https://skyciv.com/free-beam-calculator/
- PERI scaffold estimator framing for component planning and temporary-works safety.
  Source: https://www.peri-usa.com/products/scaffold-estimation-tool.html

Validation:

- `node --check assets/js/engineering-toolkit.js`: passed.
- Inline JS syntax check for `engineering/index.html`, `dashboard/index.html` and `tools/rebar-calculator/index.html`: passed after excluding JSON-LD.
- Toolkit route coverage: passed for 28 Engineering surfaces, including the hub, 26 tool routes, BOQ app and AfroDraft app.
- Headless Chrome smoke: passed. `/engineering/` rendered the Project Desk, 26 cards, 6 default workflow steps, saved a local workflow item and exposed the `AfroEngineering.saveWorkflow` API.
- Headless Chrome smoke: passed. `/tools/rebar-calculator/` rendered the Engineering Pack, market-check note, Save Dashboard button and gated PDF button.
- `npm run audit`: passed. Engineering reports 26 tools.
- `npm run check-links`: passed with no broken internal links.
- `npm test`: passed. Final combined output reported 1339 registry tools, 1334 landing pages, 41 full app pages and 26 Engineering tools in the current dirty tree.
