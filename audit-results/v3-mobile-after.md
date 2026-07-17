# Mobile Audit

Generated: 2026-05-19T06:38:28.131Z

## Scope

- HTML pages audited: 8461
- Pages with issues: 95
- Pages without issues: 8366
- Pages using shared CSS foundation: 8096
- Pages using shared navbar: 8027

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | pro: Multi-column layout stays multi-column too long | 7 | 166 | shared early-collapse layout pattern<br>pro/apps/creator-studio/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/creator-studio/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 2 | tools / afrostream: Multi-column layout stays multi-column too long | 3 | 68 | shared early-collapse layout pattern<br>tools/afrostream/creator.html<br>tools/afrostream/news.html<br>tools/afrostream/university/university.css | `tools/afrostream/creator.html`<br>`tools/afrostream/news.html`<br>`tools/afrostream/university/platforms/index.html` |
| 3 | sw / zana: Horizontal overflow risk from 100vw or hard widths | 3 | 60 | shared overflow guard pattern<br>sw/zana/kilinganisha-tv-na-streaming/index.html<br>sw/zana/kulinganisha-hosting/index.html<br>sw/zana/orodha-vifaa/index.html | `sw/zana/kilinganisha-tv-na-streaming/index.html`<br>`sw/zana/kulinganisha-hosting/index.html`<br>`sw/zana/orodha-vifaa/index.html` |
| 4 | fr / tools: Multi-column layout stays multi-column too long | 2 | 50 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>fr/tools/contraste-couleurs/index.html | `fr/tools/contraste-couleurs/index.html`<br>`fr/tools/generateur-factures/index.html` |
| 5 | tools / contract generator: Tap targets likely below 44px | 2 | 42 | shared 44px tap target pattern<br>assets/css/legal-enhancements.css<br>tools/contract-generator/app.html | `tools/contract-generator/app.html`<br>`tools/contract-generator/index.html` |
| 6 | pro: Horizontal overflow risk from 100vw or hard widths | 2 | 40 | shared overflow guard pattern<br>pro/apps/events/index.html<br>pro/apps/seller/index.html | `pro/apps/events/index.html`<br>`pro/apps/seller/index.html` |
| 7 | French country PAYE pages: Full page is not using the shared navbar foundation | 2 | 28 | assets/js/components/navbar.js adoption<br>fr/country-paye | `fr/guinea-bissau/gw-paye.html`<br>`fr/sao-tome/st-paye.html` |
| 8 | engineering: Tap targets likely below 44px | 1 | 28 | assets/css/engineering-enhancements.css<br>engineering/afrodraft/assets/css/app.css<br>shared 44px tap target pattern | `engineering/afrodraft/app.html` |
| 9 | tools / afrostream: Form controls likely below 16px | 1 | 28 | shared mobile form sizing pattern<br>tools/afrostream/admin.html | `tools/afrostream/admin.html` |
| 10 | tools / afrostream: Tap targets likely below 44px | 1 | 28 | shared 44px tap target pattern<br>tools/afrostream/admin.html | `tools/afrostream/admin.html` |
| 11 | tools / ajo tracker: Form controls likely below 16px | 1 | 28 | assets/css/african-workflow.css<br>shared mobile form sizing pattern<br>tools/ajo-tracker/app.html | `tools/ajo-tracker/app.html` |
| 12 | tools / ajo tracker: Multi-column layout stays multi-column too long | 1 | 28 | shared early-collapse layout pattern<br>tools/ajo-tracker/app.html | `tools/ajo-tracker/app.html` |
| 13 | tools / landed cost: Multi-column layout stays multi-column too long | 1 | 28 | shared early-collapse layout pattern<br>tools/landed-cost/index.html | `tools/landed-cost/index.html` |
| 14 | tools / ajo tracker: Tap targets likely below 44px | 1 | 26 | assets/css/african-workflow.css<br>shared 44px tap target pattern<br>tools/ajo-tracker/app.html | `tools/ajo-tracker/app.html` |
| 15 | tools / boq builder: Multi-column layout stays multi-column too long | 1 | 26 | shared early-collapse layout pattern<br>tools/boq-builder/app.html | `tools/boq-builder/app.html` |
| 16 | tools / contract generator: Form controls likely below 16px | 1 | 26 | shared mobile form sizing pattern<br>tools/contract-generator/app.html | `tools/contract-generator/app.html` |
| 17 | tools / university ranking: Multi-column layout stays multi-column too long | 1 | 26 | shared early-collapse layout pattern<br>tools/university-ranking/university-ranking.css | `tools/university-ranking/index.html` |
| 18 | tools / zakat calculator: Multi-column layout stays multi-column too long | 1 | 26 | shared early-collapse layout pattern<br>tools/zakat-calculator/index.html | `tools/zakat-calculator/index.html` |
| 19 | dashboard: Tap targets likely below 44px | 1 | 24 | dashboard/index.html<br>shared 44px tap target pattern | `dashboard/index.html` |
| 20 | engineering: Form controls likely below 16px | 1 | 24 | engineering/afrodraft/assets/css/app.css<br>shared mobile form sizing pattern | `engineering/afrodraft/app.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/tools/ajo-tracker/app.html` | 120 | tools / ajo tracker | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 2 | `/fr/tools/contraste-couleurs/` | 118 | fr / tools | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 3 | `/tools/faraid-inheritance/` | 118 | tools / faraid inheritance | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar, Overflow risk |
| 4 | `/engineering/afrodraft/app.html` | 116 | engineering | Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 5 | `/tools/boq-builder/app.html` | 108 | tools / boq builder | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 6 | `/tools/meeting-minutes/app.html` | 106 | tools / meeting minutes | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 7 | `/tools/cover-letter-generator/app.html` | 104 | tools / cover letter generator | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 8 | `/tools/zakat-calculator/` | 98 | tools / zakat calculator | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar |
| 9 | `/fr/blog/calculer-salaire-net-senegal/` | 96 | fr / blog | Missing CSS foundation, Missing navbar, Tap targets, Late collapse, Fixed sidebar |
| 10 | `/tools/contract-generator/app.html` | 88 | tools / contract generator | Sub-16 controls, Tap targets, Late collapse, Custom nav/search |
| 11 | `/tools/freelance-invoice/` | 80 | tools / freelance invoice | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse |
| 12 | `/tools/business-plan/app.html` | 62 | tools / business plan | Sub-16 controls, Tap targets, Custom nav/search |
| 13 | `/tools/afrostream/admin.html` | 56 | tools / afrostream | Sub-16 controls, Tap targets |
| 14 | `/trade/` | 44 | trade | Tap targets, Late collapse |
| 15 | `/tools/employment-contract/` | 42 | tools / employment contract | Tap targets, Late collapse |
| 16 | `/tools/personal-brand-audit/` | 42 | tools / personal brand audit | Sub-16 controls, Tap targets |
| 17 | `/tools/tenancy-agreement/` | 42 | tools / tenancy agreement | Tap targets, Late collapse |
| 18 | `/tools/landed-cost/` | 28 | tools / landed cost | Late collapse |
| 19 | `/pro/apps/hr/` | 26 | pro | Late collapse |
| 20 | `/pro/apps/property-projects/` | 26 | pro | Late collapse |
| 21 | `/tools/university-ranking/` | 26 | tools / university ranking | Late collapse |
| 22 | `/dashboard/` | 24 | dashboard | Tap targets |
| 23 | `/fr/tools/generateur-factures/` | 24 | fr / tools | Late collapse |
| 24 | `/pro/apps/legal/` | 24 | pro | Late collapse |
| 25 | `/pro/apps/trade-desk/` | 24 | pro | Late collapse |
| 26 | `/tools/afropayroll-os/workspace.html` | 24 | tools / afropayroll os | Late collapse |
| 27 | `/tools/afrostream/creator.html` | 24 | tools / afrostream | Late collapse |
| 28 | `/tools/burial-cost/` | 24 | tools / burial cost | Late collapse |
| 29 | `/tools/business-plan/` | 24 | tools / business plan | Late collapse |
| 30 | `/tools/gh-ssnit/` | 24 | tools / gh ssnit | Late collapse |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 57 | 1322 |
| shared 44px tap target pattern | 32 | 670 |
| shared overflow guard pattern | 13 | 264 |
| shared mobile form sizing pattern | 12 | 286 |
| assets/js/components/navbar.js adoption | 12 | 168 |
| pro/apps/creator-studio/index.html | 7 | 166 |
| pro/apps/grants-tenders/index.html | 7 | 166 |
| pro/apps/hr/index.html | 7 | 166 |
| shared app shell mobile pattern | 7 | 140 |
| fr/tools/contraste-couleurs/index.html | 5 | 114 |
| assets/css/legal-enhancements.css | 5 | 102 |
| assets/css/design-system.css adoption | 5 | 70 |

## Recommended Next-Fix Order

1. pro: Multi-column layout stays multi-column too long
   7 pages / 166 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/creator-studio/index.html, pro/apps/grants-tenders/index.html, pro/apps/hr/index.html
2. tools / afrostream: Multi-column layout stays multi-column too long
   3 pages / 68 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/creator.html, tools/afrostream/news.html, tools/afrostream/university/university.css
3. sw / zana: Horizontal overflow risk from 100vw or hard widths
   3 pages / 60 score; strong shared lever through shared overflow guard pattern.
   Primary levers: shared overflow guard pattern, sw/zana/kilinganisha-tv-na-streaming/index.html, sw/zana/kulinganisha-hosting/index.html, sw/zana/orodha-vifaa/index.html
4. fr / tools: Multi-column layout stays multi-column too long
   2 pages / 50 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, fr/tools/contraste-couleurs/index.html
5. tools / contract generator: Tap targets likely below 44px
   2 pages / 42 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared 44px tap target pattern, assets/css/legal-enhancements.css, tools/contract-generator/app.html
6. pro: Horizontal overflow risk from 100vw or hard widths
   2 pages / 40 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared overflow guard pattern, pro/apps/events/index.html, pro/apps/seller/index.html
7. French country PAYE pages: Full page is not using the shared navbar foundation
   2 pages / 28 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/js/components/navbar.js adoption, fr/country-paye
8. engineering: Tap targets likely below 44px
   1 pages / 28 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/engineering-enhancements.css, engineering/afrodraft/assets/css/app.css, shared 44px tap target pattern
9. tools / afrostream: Form controls likely below 16px
   1 pages / 28 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared mobile form sizing pattern, tools/afrostream/admin.html
10. tools / afrostream: Tap targets likely below 44px
   1 pages / 28 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared 44px tap target pattern, tools/afrostream/admin.html

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
