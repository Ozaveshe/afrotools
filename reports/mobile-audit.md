# Mobile Audit

Generated: 2026-06-13T08:41:52.027Z

## Scope

- HTML pages audited: 8538
- Pages with issues: 111
- Pages without issues: 8427
- Pages using shared CSS foundation: 8168
- Pages using shared navbar: 8100

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | pro: Multi-column layout stays multi-column too long | 7 | 166 | shared early-collapse layout pattern<br>pro/apps/creator-studio/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/creator-studio/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 2 | tools / afrostream: Multi-column layout stays multi-column too long | 4 | 92 | shared early-collapse layout pattern<br>tools/afrostream/creator.html<br>tools/afrostream/index.html<br>tools/afrostream/news.html | `tools/afrostream/creator.html`<br>`tools/afrostream/index.html`<br>`tools/afrostream/news.html` |
| 3 | audit results: Missing viewport meta | 2 | 76 | audit-results/pdf-workspace-online-check/local-inline-render.html<br>audit-results/pdf-workspace-online-check/render-output.html | `audit-results/pdf-workspace-online-check/local-inline-render.html`<br>`audit-results/pdf-workspace-online-check/render-output.html` |
| 4 | sw / zana: Horizontal overflow risk from 100vw or hard widths | 3 | 60 | shared overflow guard pattern<br>sw/zana/kilinganisha-tv-na-streaming/index.html<br>sw/zana/kulinganisha-hosting/index.html<br>sw/zana/orodha-vifaa/index.html | `sw/zana/kilinganisha-tv-na-streaming/index.html`<br>`sw/zana/kulinganisha-hosting/index.html`<br>`sw/zana/orodha-vifaa/index.html` |
| 5 | fr / tools: Multi-column layout stays multi-column too long | 2 | 50 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>fr/tools/contraste-couleurs/index.html | `fr/tools/contraste-couleurs/index.html`<br>`fr/tools/generateur-factures/index.html` |
| 6 | matchday os: Multi-column layout stays multi-column too long | 2 | 48 | assets/css/matchday-os.css<br>shared early-collapse layout pattern<br>assets/css/matchday-navigation.css<br>assets/css/matchday-worldcup-pages.css | `matchday-os/index.html`<br>`matchday-os/share-cards/index.html` |
| 7 | engineering: Multi-column layout stays multi-column too long | 2 | 46 | shared early-collapse layout pattern<br>engineering/afrodraft/assets/css/app.css<br>engineering/afrodraft/assets/css/templates.css | `engineering/afrodraft/app.html`<br>`engineering/afrodraft/index.html` |
| 8 | tools / afropayroll os: Multi-column layout stays multi-column too long | 2 | 46 | shared early-collapse layout pattern<br>tools/afropayroll-os/index.html<br>tools/afropayroll-os/workspace.html | `tools/afropayroll-os/index.html`<br>`tools/afropayroll-os/workspace.html` |
| 9 | engineering: Horizontal overflow risk from 100vw or hard widths | 2 | 44 | shared overflow guard pattern<br>engineering/afrodraft/assets/css/app.css<br>engineering/floor-planner/css/fp-layout-access.css | `engineering/afrodraft/app.html`<br>`engineering/floor-planner/index.html` |
| 10 | tools / contract generator: Tap targets likely below 44px | 2 | 42 | shared 44px tap target pattern<br>assets/css/legal-enhancements.css<br>tools/contract-generator/app.html | `tools/contract-generator/app.html`<br>`tools/contract-generator/index.html` |
| 11 | pro: Horizontal overflow risk from 100vw or hard widths | 2 | 40 | shared overflow guard pattern<br>pro/apps/events/index.html<br>pro/apps/seller/index.html | `pro/apps/events/index.html`<br>`pro/apps/seller/index.html` |
| 12 | audit results: Full page is not using the shared navbar foundation | 2 | 28 | assets/js/components/navbar.js adoption<br>audit-results | `audit-results/pdf-workspace-online-check/local-inline-render.html`<br>`audit-results/pdf-workspace-online-check/render-output.html` |
| 13 | audit results: Page is not using the shared CSS foundation | 2 | 28 | assets/css/design-system.css adoption<br>audit-results | `audit-results/pdf-workspace-online-check/local-inline-render.html`<br>`audit-results/pdf-workspace-online-check/render-output.html` |
| 14 | French country PAYE pages: Full page is not using the shared navbar foundation | 2 | 28 | assets/js/components/navbar.js adoption<br>fr/country-paye | `fr/guinea-bissau/gw-paye.html`<br>`fr/sao-tome/st-paye.html` |
| 15 | engineering: Tap targets likely below 44px | 1 | 28 | assets/css/engineering-enhancements.css<br>engineering/afrodraft/assets/css/app.css<br>shared 44px tap target pattern | `engineering/afrodraft/app.html` |
| 16 | tools / afrostream: Form controls likely below 16px | 1 | 28 | shared mobile form sizing pattern<br>tools/afrostream/admin.html | `tools/afrostream/admin.html` |
| 17 | tools / afrostream: Tap targets likely below 44px | 1 | 28 | shared 44px tap target pattern<br>tools/afrostream/admin.html | `tools/afrostream/admin.html` |
| 18 | tools / ajo tracker: Form controls likely below 16px | 1 | 28 | assets/css/african-workflow.css<br>shared mobile form sizing pattern<br>tools/ajo-tracker/app.html | `tools/ajo-tracker/app.html` |
| 19 | tools / ajo tracker: Multi-column layout stays multi-column too long | 1 | 28 | shared early-collapse layout pattern<br>tools/ajo-tracker/app.html | `tools/ajo-tracker/app.html` |
| 20 | tools / cover letter generator: Form controls likely below 16px | 1 | 28 | shared mobile form sizing pattern<br>tools/cover-letter-generator/app.html | `tools/cover-letter-generator/app.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/tools/ajo-tracker/app.html` | 120 | tools / ajo tracker | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 2 | `/fr/tools/contraste-couleurs/` | 118 | fr / tools | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 3 | `/tools/faraid-inheritance/` | 118 | tools / faraid inheritance | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar, Overflow risk |
| 4 | `/engineering/afrodraft/app.html` | 116 | engineering | Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 5 | `/tools/boq-builder/app.html` | 108 | tools / boq builder | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 6 | `/tools/meeting-minutes/app.html` | 106 | tools / meeting minutes | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 7 | `/tools/zakat-calculator/` | 98 | tools / zakat calculator | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar |
| 8 | `/fr/blog/calculer-salaire-net-senegal/` | 96 | fr / blog | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar |
| 9 | `/tools/cover-letter-generator/app.html` | 90 | tools / cover letter generator | Sub-16 controls, Late collapse, Custom nav/search, Fixed header |
| 10 | `/tools/contract-generator/app.html` | 88 | tools / contract generator | Sub-16 controls, Tap targets, Late collapse, Custom nav/search |
| 11 | `/tools/freelance-invoice/` | 80 | tools / freelance invoice | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse |
| 12 | `/artifacts/scholarship-card-redesign/preview.html` | 72 | artifacts | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets |
| 13 | `/engineering/floor-planner/` | 70 | engineering | Fixed sidebar, 100vh overlay, Overflow risk |
| 14 | `/audit-results/pdf-workspace-online-check/local-inline-render.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 15 | `/audit-results/pdf-workspace-online-check/render-output.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 16 | `/tools/business-plan/app.html` | 62 | tools / business plan | Sub-16 controls, Tap targets, Custom nav/search |
| 17 | `/tools/afrostream/admin.html` | 56 | tools / afrostream | Sub-16 controls, Tap targets |
| 18 | `/tools/import-duty/` | 48 | tools / import duty | Late collapse, Fixed sidebar |
| 19 | `/tools/pdf-workspace/` | 46 | tools / pdf workspace | Late collapse, 100vh overlay |
| 20 | `/trade/` | 44 | trade | Tap targets, Late collapse |
| 21 | `/tools/employment-contract/` | 42 | tools / employment contract | Tap targets, Late collapse |
| 22 | `/tools/personal-brand-audit/` | 42 | tools / personal brand audit | Sub-16 controls, Tap targets |
| 23 | `/tools/tenancy-agreement/` | 42 | tools / tenancy agreement | Tap targets, Late collapse |
| 24 | `/tools/fuel-tracker/` | 28 | tools / fuel tracker | Sub-16 controls |
| 25 | `/tools/landed-cost/` | 28 | tools / landed cost | Late collapse |
| 26 | `/pro/apps/hr/` | 26 | pro | Late collapse |
| 27 | `/pro/apps/property-projects/` | 26 | pro | Late collapse |
| 28 | `/tools/university-ranking/` | 26 | tools / university ranking | Late collapse |
| 29 | `/ask/` | 24 | ask | Fixed sidebar |
| 30 | `/dashboard/` | 24 | dashboard | Tap targets |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 66 | 1532 |
| shared 44px tap target pattern | 34 | 714 |
| shared mobile form sizing pattern | 14 | 338 |
| shared overflow guard pattern | 14 | 286 |
| assets/js/components/navbar.js adoption | 14 | 196 |
| assets/css/design-system.css adoption | 8 | 112 |
| shared sidebar collapse pattern | 7 | 168 |
| pro/apps/creator-studio/index.html | 7 | 166 |
| pro/apps/grants-tenders/index.html | 7 | 166 |
| pro/apps/hr/index.html | 7 | 166 |
| shared app shell mobile pattern | 7 | 140 |
| engineering/afrodraft/assets/css/app.css | 6 | 142 |

## Recommended Next-Fix Order

1. pro: Multi-column layout stays multi-column too long
   7 pages / 166 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/creator-studio/index.html, pro/apps/grants-tenders/index.html, pro/apps/hr/index.html
2. tools / afrostream: Multi-column layout stays multi-column too long
   4 pages / 92 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/creator.html, tools/afrostream/index.html, tools/afrostream/news.html
3. audit results: Missing viewport meta
   2 pages / 76 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: audit-results/pdf-workspace-online-check/local-inline-render.html, audit-results/pdf-workspace-online-check/render-output.html
4. sw / zana: Horizontal overflow risk from 100vw or hard widths
   3 pages / 60 score; strong shared lever through shared overflow guard pattern.
   Primary levers: shared overflow guard pattern, sw/zana/kilinganisha-tv-na-streaming/index.html, sw/zana/kulinganisha-hosting/index.html, sw/zana/orodha-vifaa/index.html
5. fr / tools: Multi-column layout stays multi-column too long
   2 pages / 50 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, fr/tools/contraste-couleurs/index.html
6. matchday os: Multi-column layout stays multi-column too long
   2 pages / 48 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/matchday-os.css, shared early-collapse layout pattern, assets/css/matchday-navigation.css, assets/css/matchday-worldcup-pages.css
7. engineering: Multi-column layout stays multi-column too long
   2 pages / 46 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared early-collapse layout pattern, engineering/afrodraft/assets/css/app.css, engineering/afrodraft/assets/css/templates.css
8. tools / afropayroll os: Multi-column layout stays multi-column too long
   2 pages / 46 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared early-collapse layout pattern, tools/afropayroll-os/index.html, tools/afropayroll-os/workspace.html
9. engineering: Horizontal overflow risk from 100vw or hard widths
   2 pages / 44 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared overflow guard pattern, engineering/afrodraft/assets/css/app.css, engineering/floor-planner/css/fp-layout-access.css
10. tools / contract generator: Tap targets likely below 44px
   2 pages / 42 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared 44px tap target pattern, assets/css/legal-enhancements.css, tools/contract-generator/app.html

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
