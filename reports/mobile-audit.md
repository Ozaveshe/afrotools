# Mobile Audit

Generated: 2026-05-02T10:22:42.220Z

## Scope

- HTML pages audited: 6695
- Pages with issues: 1160
- Pages without issues: 5535
- Pages using shared CSS foundation: 6444
- Pages using shared navbar: 6385

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | sw / zana: Multi-column layout stays multi-column too long | 151 | 3638 | shared early-collapse layout pattern<br>assets/css/climate.css<br>sw/zana/ada-za-mahakama/index.html<br>sw/zana/alama-za-html/index.html | `sw/zana/ada-za-mahakama/index.html`<br>`sw/zana/alama-za-html/index.html`<br>`sw/zana/athari-ya-ukataji-misitu/index.html` |
| 2 | sw / zana: Form controls likely below 16px | 84 | 1854 | shared mobile form sizing pattern<br>assets/css/african-workflow.css<br>sw/zana/alama-za-html/index.html<br>sw/zana/base64/index.html | `sw/zana/alama-za-html/index.html`<br>`sw/zana/base64/index.html`<br>`sw/zana/bei-mafuta/index.html` |
| 3 | sw / zana: Fixed-width sidebar around 320px+ compresses content | 72 | 1728 | shared sidebar collapse pattern<br>sw/zana/ada-za-mahakama/index.html<br>sw/zana/azimio-la-bodi/index.html<br>sw/zana/cron/index.html | `sw/zana/ada-za-mahakama/index.html`<br>`sw/zana/azimio-la-bodi/index.html`<br>`sw/zana/cron/index.html` |
| 4 | fr / tools: Multi-column layout stays multi-column too long | 31 | 770 | shared early-collapse layout pattern<br>assets/css/import-duty.css<br>assets/css/invoice-generator.css<br>assets/css/japa-calculator.css | `fr/tools/calculateur-hypothecaire/index.html`<br>`fr/tools/calculateur-japa/index.html`<br>`fr/tools/calculateur-paye/index.html` |
| 5 | tools / afrostream: Multi-column layout stays multi-column too long | 17 | 418 | shared early-collapse layout pattern<br>tools/afrostream/university/university.css<br>tools/afrostream/methodology.css<br>tools/afrostream/article.html | `tools/afrostream/afroscore/index.html`<br>`tools/afrostream/article.html`<br>`tools/afrostream/calendar.html` |
| 6 | pro: Multi-column layout stays multi-column too long | 10 | 302 | shared early-collapse layout pattern<br>pro/apps/books/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/books/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 7 | telecom: Form controls likely below 16px | 14 | 284 | shared mobile form sizing pattern<br>telecom/airtime-value/index.html<br>telecom/bulk-sms-pricing/index.html<br>telecom/business-internet/index.html | `telecom/airtime-value/index.html`<br>`telecom/bulk-sms-pricing/index.html`<br>`telecom/business-internet/index.html` |
| 8 | tools / afrostream: Tap targets likely below 44px | 11 | 266 | shared 44px tap target pattern<br>tools/afrostream/subnav.css<br>tools/afrostream/style.css<br>tools/afrostream/methodology.css | `tools/afrostream/admin.html`<br>`tools/afrostream/afroscore/index.html`<br>`tools/afrostream/article.html` |
| 9 | pro: Overlay or drawer uses 100vh without 100dvh/safe-area handling | 11 | 264 | shared dvh/safe-area overlay pattern<br>pro/apps/agri-farmops/index.html<br>pro/apps/beauty/index.html<br>pro/apps/clinic-desk/index.html | `pro/apps/agri-farmops/index.html`<br>`pro/apps/beauty/index.html`<br>`pro/apps/clinic-desk/index.html` |
| 10 | pro: Full page is not using the shared navbar foundation | 18 | 252 | assets/js/components/navbar.js adoption<br>pro | `pro/apps/agri-farmops/index.html`<br>`pro/apps/beauty/index.html`<br>`pro/apps/books/index.html` |
| 11 | telecom: Multi-column layout stays multi-column too long | 10 | 238 | shared early-collapse layout pattern<br>assets/css/telecom-hub-polish.css<br>telecom/airtime-value/index.html<br>telecom/bulk-sms-pricing/index.html | `telecom/airtime-value/index.html`<br>`telecom/bulk-sms-pricing/index.html`<br>`telecom/business-internet/index.html` |
| 12 | crypto: Multi-column layout stays multi-column too long | 9 | 202 | shared early-collapse layout pattern<br>assets/css/crypto.css<br>crypto/address-validator/index.html<br>crypto/dca-calculator/index.html | `crypto/address-validator/index.html`<br>`crypto/dca-calculator/index.html`<br>`crypto/exchange-ratings/index.html` |
| 13 | tools / africa conflict: Tap targets likely below 44px | 9 | 182 | shared 44px tap target pattern<br>tools/africa-conflict/style.css<br>tools/africa-conflict/dashboard.css | `tools/africa-conflict/actors.html`<br>`tools/africa-conflict/conflicts.html`<br>`tools/africa-conflict/detail.html` |
| 14 | pro: Tap targets likely below 44px | 9 | 180 | shared 44px tap target pattern<br>pro/apps/books/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/books/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 15 | fr / tools: Fixed-width sidebar around 320px+ compresses content | 7 | 168 | shared sidebar collapse pattern<br>fr/tools/contrat-location/index.html<br>fr/tools/convertisseur-devises/index.html<br>fr/tools/cout-renovation/index.html | `fr/tools/calculateur-gpa/index.html`<br>`fr/tools/calculateur-waec/index.html`<br>`fr/tools/contrat-location/index.html` |
| 16 | tools / afrostream: Form controls likely below 16px | 6 | 154 | shared mobile form sizing pattern<br>tools/afrostream/style.css<br>tools/afrostream/admin.html<br>tools/afrostream/community.html | `tools/afrostream/admin.html`<br>`tools/afrostream/community.html`<br>`tools/afrostream/index.html` |
| 17 | Country PAYE pages: Multi-column layout stays multi-column too long | 6 | 132 | shared early-collapse layout pattern<br>assets/css/paye-calculation-sync.css<br>nigeria/ng-salary-tax.html | `ghana/gh-paye.html`<br>`kenya/ke-paye.html`<br>`nigeria/ng-salary-tax.html` |
| 18 | fr / compare: Multi-column layout stays multi-column too long | 5 | 130 | shared early-collapse layout pattern<br>fr/compare/egypt-vs-south-africa-tax/index.html<br>fr/compare/ghana-vs-nigeria-tax/index.html<br>fr/compare/kenya-vs-tanzania-tax/index.html | `fr/compare/egypt-vs-south-africa-tax/index.html`<br>`fr/compare/ghana-vs-nigeria-tax/index.html`<br>`fr/compare/kenya-vs-tanzania-tax/index.html` |
| 19 | tools / africa conflict: Multi-column layout stays multi-column too long | 5 | 122 | shared early-collapse layout pattern<br>tools/africa-conflict/style.css<br>tools/africa-conflict/dashboard.css<br>tools/africa-conflict/index.html | `tools/africa-conflict/detail.html`<br>`tools/africa-conflict/displacement.html`<br>`tools/africa-conflict/economy.html` |
| 20 | Country PAYE pages: Form controls likely below 16px | 6 | 120 | shared mobile form sizing pattern<br>assets/css/paye-calculation-sync.css<br>nigeria/ng-salary-tax.html | `ghana/gh-paye.html`<br>`kenya/ke-paye.html`<br>`nigeria/ng-salary-tax.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/engineering/afrodraft/app.html` | 124 | engineering | Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 2 | `/fr/` | 112 | fr / index.html | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 3 | `/tools/idea-board/` | 110 | tools / idea board | Sub-16 controls, Tap targets, Late collapse, 100vh overlay |
| 4 | `/dashboard/` | 108 | dashboard | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 5 | `/tools/boq-builder/app.html` | 108 | tools / boq builder | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 6 | `/tools/retirement-planner/` | 106 | tools / retirement planner | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 7 | `/tools/side-hustle-tax/` | 106 | tools / side hustle tax | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 8 | `/tools/car-loan/` | 104 | tools / car loan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 9 | `/tools/susu-tracker/` | 104 | tools / susu tracker | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 10 | `/tools/africa-conflict/` | 102 | tools / africa conflict | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 11 | `/tools/african-meal-plan/` | 102 | tools / african meal plan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 12 | `/tools/csection-vs-natural/` | 102 | tools / csection vs natural | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 13 | `/tools/electrical-load/` | 102 | tools / electrical load | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 14 | `/tools/rental-yield/` | 102 | tools / rental yield | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 15 | `/tools/shipping-calc/` | 102 | tools / shipping calc | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 16 | `/tools/ajo-tracker/app.html` | 100 | tools / ajo tracker | Sub-16 controls, Tap targets, Late collapse, Fixed header |
| 17 | `/tools/brideprice-advisor/` | 100 | tools / brideprice advisor | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 18 | `/tools/cash-flow-forecast/` | 100 | tools / cash flow forecast | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 19 | `/tools/child-growth/` | 100 | tools / child growth | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 20 | `/tools/ke-nssf/` | 100 | tools / ke nssf | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 21 | `/tools/pdf-password/` | 100 | tools / pdf password | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 22 | `/tools/pension-proj/` | 100 | tools / pension proj | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 23 | `/tools/blood-group/` | 98 | tools / blood group | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 24 | `/tools/cac-cost/` | 98 | tools / cac cost | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 25 | `/tools/dental-cost/` | 98 | tools / dental cost | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 26 | `/tools/genotype-checker/` | 98 | tools / genotype checker | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 27 | `/tools/pdf-find-replace/` | 98 | tools / pdf find replace | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 28 | `/tools/traditional-vs-western/` | 98 | tools / traditional vs western | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 29 | `/tools/blood-pressure/` | 96 | tools / blood pressure | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 30 | `/tools/cipc-cost/` | 96 | tools / cipc cost | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 879 | 21458 |
| shared mobile form sizing pattern | 590 | 13420 |
| shared 44px tap target pattern | 526 | 11260 |
| shared sidebar collapse pattern | 306 | 7344 |
| sw/zana/alama-za-html/index.html | 235 | 5492 |
| sw/zana/ada-za-mahakama/index.html | 223 | 5366 |
| assets/css/climate.css | 167 | 4018 |
| assets/css/african-workflow.css | 123 | 2824 |
| sw/zana/base64/index.html | 84 | 1854 |
| sw/zana/azimio-la-bodi/index.html | 72 | 1728 |
| sw/zana/cron/index.html | 72 | 1728 |
| assets/css/legal-enhancements.css | 71 | 1580 |

## Recommended Next-Fix Order

1. sw / zana: Multi-column layout stays multi-column too long
   151 pages / 3638 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/climate.css, sw/zana/ada-za-mahakama/index.html, sw/zana/alama-za-html/index.html
2. sw / zana: Form controls likely below 16px
   84 pages / 1854 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, assets/css/african-workflow.css, sw/zana/alama-za-html/index.html, sw/zana/base64/index.html
3. sw / zana: Fixed-width sidebar around 320px+ compresses content
   72 pages / 1728 score; strong shared lever through shared sidebar collapse pattern.
   Primary levers: shared sidebar collapse pattern, sw/zana/ada-za-mahakama/index.html, sw/zana/azimio-la-bodi/index.html, sw/zana/cron/index.html
4. fr / tools: Multi-column layout stays multi-column too long
   31 pages / 770 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/import-duty.css, assets/css/invoice-generator.css, assets/css/japa-calculator.css
5. tools / afrostream: Multi-column layout stays multi-column too long
   17 pages / 418 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/university/university.css, tools/afrostream/methodology.css, tools/afrostream/article.html
6. pro: Multi-column layout stays multi-column too long
   10 pages / 302 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/books/index.html, pro/apps/grants-tenders/index.html, pro/apps/hr/index.html
7. telecom: Form controls likely below 16px
   14 pages / 284 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, telecom/airtime-value/index.html, telecom/bulk-sms-pricing/index.html, telecom/business-internet/index.html
8. tools / afrostream: Tap targets likely below 44px
   11 pages / 266 score; strong shared lever through shared 44px tap target pattern.
   Primary levers: shared 44px tap target pattern, tools/afrostream/subnav.css, tools/afrostream/style.css, tools/afrostream/methodology.css
9. pro: Overlay or drawer uses 100vh without 100dvh/safe-area handling
   11 pages / 264 score; strong shared lever through shared dvh/safe-area overlay pattern.
   Primary levers: shared dvh/safe-area overlay pattern, pro/apps/agri-farmops/index.html, pro/apps/beauty/index.html, pro/apps/clinic-desk/index.html
10. pro: Full page is not using the shared navbar foundation
   18 pages / 252 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, pro

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
