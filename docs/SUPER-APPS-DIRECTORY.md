# AfroTools 100 Super Apps Directory

Last updated: 2026-05-24

This directory tracks the 100 Super Apps program. Matchday / World Cup Matchday OS is active but excluded from the Super 100 count until the tournament product is stable enough to graduate.

## Super App Standard

An app can be treated as S-class only when it has:

- A complete workflow for a real user problem, not only a calculator shell.
- Clear source, freshness, or assumption notes where data can drift.
- Local-first privacy for sensitive inputs.
- Mobile-first interaction with no horizontal overflow.
- Export, copy, save, or share output where useful.
- Analytics that avoid raw sensitive content.
- Passing targeted checks plus `npm run audit`, `npm run check-links`, and the relevant browser quality gate.

## Approved By Owner

These are approved for the Super 100 directory based on owner direction. The automated score snapshot is kept as a proof note, not as a blocker to the owner-approved status.

| Slot | App | Route | Owner status | Latest score snapshot | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Scholarship Finder | `/tools/scholarship-finder/` | Approved | B / 80 | Deadline and source-truth pass is complete. Keep live scholarship endpoints honest. |
| 2 | Import Duty | `/tools/import-duty/` | Approved | A / 93 | Planning-estimate wording and evidence pass complete. |
| 3 | PDF Workspace | `/tools/pdf-workspace/` | Approved | B / 82 | Workflow surface accepted. Keep PDF parser/export proof separate from browser download proof. |
| 4 | Study Abroad Cost | `/tools/study-abroad-cost/` | Approved | B / 83 | Education trust lane accepted. |
| 5 | AfroAtlas | `/tools/afroatlas/` | Approved | B / 80 | Country and route discovery surface accepted. |
| 6 | Cover Letter Generator | `/tools/cover-letter-generator/` | Approved | D / 64 | Owner-approved as done. Needs a future score refresh or report check because the current ledger still reads D. |

## Needs S-Class Touch

| Slot | App | Route | Current status | Latest score snapshot | Required finish |
| --- | --- | --- | --- | --- | --- |
| 7 | Floor Planner | `/engineering/floor-planner/` | Touch-up | B / 80 | Save/export reliability, mobile tool ergonomics, handoff packet, dashboard/workspace continuity. |
| 8 | AfroStream | `/tools/afrostream/` | Touch-up | C / 72 | Live freshness, snapshot automation, creator/news proof, visible trust state. |
| 9 | CV Builder | `/tools/cv-builder/` | Touch-up | A / 87 | ATS Plain parser confidence, production console/CSP cleanliness, template/export proof. |

## Next Three To Bring Up

These are selected from the current quality ledger plus market direction. They score strongly on real usefulness, SEO demand, shareability, and monetization potential.

| Slot | App | Route | Current score | Why this belongs in the Super 100 |
| --- | --- | --- | --- | --- |
| 10 | African Car Price Directory | `/cars/` | D / 55 | High search intent, high purchase value, import-duty adjacency, shareable local-currency price intelligence. |
| 11 | Remittance Comparator Pro | `/tools/remittance-v2/` | B / 82 | Money movement is highly useful and viral by corridor. Strong fit with mobile money and FX. |
| 12 | Solar Panel ROI Calculator | `/tools/solar-roi/` | D / 53 | Energy pain is broad, urgent, and recurring. Strong SEO for solar, battery, generator, and payback questions. |

Runner-up queue:

- Agri-Input Price Comparator, `/agriculture/input-prices/`, D / 64.
- Farm Worker Payroll Calculator, `/agriculture/farm-payroll/`, D / 64.
- Health Insurance Comparator, `/tools/health-insurance-compare/`, F / 47.

## Touch-Up Prompts

### Floor Planner

Work in `C:\Users\Oza\Documents\afrotools`. Upgrade `afroplan-floor-planner` at `/engineering/floor-planner/` from good to S-class. Inspect `engineering/floor-planner/index.html`, related assets, dashboard/workspace save paths, exports, and current quality ledger row first. Keep the route focused on real African room/building planning: room dimensions, wall/opening controls, furniture placement, material/BOQ estimate, print/PDF/export packet, share/save state, and mobile editing ergonomics. Verify keyboard/touch usability, no horizontal overflow at 360/390px, no console errors, and state restore after reload. Preserve unrelated dirty work. Run the narrowest checks, including inline script syntax if present, `npm run audit`, `npm run check-links`, and `npm run tools:quality:browser -- --concurrency=6 --timeout=7000`. Approve only if the target route is A-grade or better and the visible workflow feels production-ready.

### AfroStream

Work in `C:\Users\Oza\Documents\afrotools`. Bring `afrostream` at `/tools/afrostream/` to S-class, but use the configured AfroTools Supabase MCP first for live truth. Inspect live `public.as_*` tables, snapshot freshness, news freshness, stream freshness, source health, and the current repo functions before editing. The user problem is: discover African creators, see what is live or trending, trust freshness, and understand creator/news signals without fake claims. Fix only concrete gaps: stale snapshot states, missing freshness labels, weak empty/error states, unclear creator cards, source-health visibility, and any UI that implies automation is current when it is not. Keep public creator/news facts separate from private account/workspace data. Validate with live aggregate checks, route smoke, console check, mobile overflow, `npm run audit`, `npm run check-links`, and any AfroStream-specific tests or function checks available. Approve only if live freshness is truthful and the route no longer feels stale.

### CV Builder

Work in `C:\Users\Oza\Documents\afrotools`. Give `cv-builder` at `/tools/cv-builder/` the final S-class pass. Treat it as a sensitive local-first career-data tool. Inspect current CV Builder source, export helpers, ATS Plain path, template gallery, analytics events, and prior parser evidence before editing. Preserve primary exports with no account gate: PDF, ATS/plain export, Word/DOCX if present, TXT/JSON, copy, print, save/restore. Fix any production-risk gaps around ATS parser compatibility, template switching, mobile preview/export, console/CSP noise, local save/restore, and hidden toolbar actions. Do not log raw CV, job description, phone, email, LinkedIn, or cover-letter content. Test with synthetic fixtures only. Validation must include browser export smoke, strict parser check where possible, mobile overflow, console check, `npm run audit`, `npm run check-links`, and relevant CV/export tests. Approve only if downloads work and parser compatibility is separately proven.

## Next Candidate Prompts

### African Car Price Directory

Work in `C:\Users\Oza\Documents\afrotools`. Upgrade `car-price-intelligence` at `/cars/` to S-class. Treat this as a buyer decision app, not a static directory. Inspect current cars pages, local-currency FX lane, import-duty links, car assets, country pages, and quality ledger. Build a workflow that helps a buyer compare local price, import landed cost, fuel/maintenance risk, resale band, finance budget, and country-specific source confidence. Keep local currency first. Add clear source/freshness notes and avoid pretending dealer prices are live if they are not. Validate route rendering, mobile cards, filters, no broken images, no console errors, `npm run audit`, `npm run check-links`, and the browser quality gate.

### Remittance Comparator Pro

Work in `C:\Users\Oza\Documents\afrotools`. Upgrade `remittance-v2` at `/tools/remittance-v2/` to S-class. Benchmark against World Bank remittance price workflows, mobile money corridors, bank/fintech fee comparators, and FX calculators. The workflow should compare send amount, receive amount, corridor, provider type, FX margin, fees, speed, cash pickup vs wallet vs bank, and total recipient value. Include source/freshness notes, editable assumptions, copy/export summary, and privacy-safe analytics. Do not imply live provider quotes unless a verified data source exists. Run `npm run audit`, `npm run check-links`, browser quality gate, and any remittance/FX tests.

### Solar Panel ROI Calculator

Work in `C:\Users\Oza\Documents\afrotools`. Upgrade `solar-roi` at `/tools/solar-roi/` to S-class. Turn it into a complete solar, battery, generator, and outage-cost decision workbench for African homes and SMEs. Include daily load, tariff, outage frequency, generator spend, battery size, panel size, install cost, payback, affordability risk, maintenance, financing scenario, and copy/export summary. Add source/freshness notes for tariff and solar assumptions. Keep all assumptions editable. Validate mobile layout, calculation states, no console errors, `npm run audit`, `npm run check-links`, and browser quality gate.
