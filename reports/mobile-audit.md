# Mobile Audit

Generated: 2026-04-16T13:19:24.169Z

## Scope

- HTML pages audited: 5611
- Pages with issues: 2562
- Pages without issues: 3049
- Pages using shared CSS foundation: 5383
- Pages using shared navbar: 5367

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | agriculture: Multi-column layout stays multi-column too long | 425 | 9376 | shared early-collapse layout pattern<br>assets/css/agriculture.css<br>agriculture/cocoa-tracker/index.html<br>agriculture/coffee-calculator/index.html | `agriculture/cocoa-tracker/index.html`<br>`agriculture/coffee-calculator/index.html`<br>`agriculture/commodity-prices/index.html` |
| 2 | Country PAYE pages: Multi-column layout stays multi-column too long | 54 | 1722 | assets/css/paye-tool.css<br>shared early-collapse layout pattern<br>assets/css/calculator.css<br>algeria/dz-paye.html | `algeria/dz-paye.html`<br>`angola/ao-paye.html`<br>`benin/bj-paye.html` |
| 3 | Swahili country PAYE pages: Multi-column layout stays multi-column too long | 48 | 1492 | shared early-collapse layout pattern<br>assets/css/calculator.css<br>assets/css/paye-tool.css<br>sw/algeria/kikokotoo-kodi-mshahara/index.html | `sw/algeria/kikokotoo-kodi-mshahara/index.html`<br>`sw/angola/kikokotoo-kodi-mshahara/index.html`<br>`sw/benin/kikokotoo-kodi-mshahara/index.html` |
| 4 | fr / tools: Form controls likely below 16px | 70 | 1448 | shared mobile form sizing pattern<br>assets/css/tool-landing.css<br>assets/css/global.css<br>assets/css/invoice-generator.css | `fr/tools/apport-eau/index.html`<br>`fr/tools/bac-a-sable-sql/index.html`<br>`fr/tools/calculateur-age/index.html` |
| 5 | tools / employment contract: Multi-column layout stays multi-column too long | 55 | 1428 | shared early-collapse layout pattern<br>assets/css/multi-country.css<br>tools/employment-contract/algeria.html<br>tools/employment-contract/angola.html | `tools/employment-contract/algeria.html`<br>`tools/employment-contract/angola.html`<br>`tools/employment-contract/benin.html` |
| 6 | tools / tenancy agreement: Multi-column layout stays multi-column too long | 55 | 1428 | shared early-collapse layout pattern<br>assets/css/multi-country.css<br>tools/tenancy-agreement/algeria.html<br>tools/tenancy-agreement/angola.html | `tools/tenancy-agreement/algeria.html`<br>`tools/tenancy-agreement/angola.html`<br>`tools/tenancy-agreement/benin.html` |
| 7 | tools / visa checker: Multi-column layout stays multi-column too long | 55 | 1428 | shared early-collapse layout pattern<br>assets/css/multi-country.css<br>tools/visa-checker/algeria.html<br>tools/visa-checker/angola.html | `tools/visa-checker/algeria.html`<br>`tools/visa-checker/angola.html`<br>`tools/visa-checker/benin.html` |
| 8 | French country PAYE pages: Multi-column layout stays multi-column too long | 42 | 1328 | shared early-collapse layout pattern<br>assets/css/calculator.css<br>assets/css/paye-tool.css<br>fr/algeria/dz-paye.html | `fr/algeria/dz-paye.html`<br>`fr/algerie/calculateur-salaire-net.html`<br>`fr/benin/bj-paye.html` |
| 9 | tools / employment contract: Form controls likely below 16px | 55 | 1320 | shared mobile form sizing pattern<br>tools/employment-contract/algeria.html<br>tools/employment-contract/angola.html<br>tools/employment-contract/benin.html | `tools/employment-contract/algeria.html`<br>`tools/employment-contract/angola.html`<br>`tools/employment-contract/benin.html` |
| 10 | tools / tenancy agreement: Form controls likely below 16px | 55 | 1320 | shared mobile form sizing pattern<br>tools/tenancy-agreement/algeria.html<br>tools/tenancy-agreement/angola.html<br>tools/tenancy-agreement/benin.html | `tools/tenancy-agreement/algeria.html`<br>`tools/tenancy-agreement/angola.html`<br>`tools/tenancy-agreement/benin.html` |
| 11 | Country PAYE pages: Fixed-width sidebar around 320px+ compresses content | 53 | 1272 | shared sidebar collapse pattern<br>assets/css/calculator.css<br>assets/css/paye-tool.css | `algeria/dz-paye.html`<br>`angola/ao-paye.html`<br>`benin/bj-paye.html` |
| 12 | tools / employee cost: Multi-column layout stays multi-column too long | 55 | 1210 | assets/css/hr-payroll.css<br>shared early-collapse layout pattern | `tools/employee-cost/algeria/index.html`<br>`tools/employee-cost/angola/index.html`<br>`tools/employee-cost/benin/index.html` |
| 13 | tools / car insurance: Multi-column layout stays multi-column too long | 54 | 1188 | assets/css/insurance.css<br>shared early-collapse layout pattern | `tools/car-insurance/algeria.html`<br>`tools/car-insurance/angola.html`<br>`tools/car-insurance/benin.html` |
| 14 | Creator app shells: Multi-column layout stays multi-column too long | 45 | 1112 | shared early-collapse layout pattern<br>assets/css/tool-landing.css<br>tools/creator-analytics/style.css<br>tools/creator-invoice/style.css | `tools/creator-analytics/app.html`<br>`tools/creator-analytics/index.html`<br>`tools/creator-brand/app.html` |
| 15 | Swahili country PAYE pages: Fixed-width sidebar around 320px+ compresses content | 46 | 1104 | shared sidebar collapse pattern<br>assets/css/calculator.css<br>assets/css/paye-tool.css | `sw/algeria/kikokotoo-kodi-mshahara/index.html`<br>`sw/angola/kikokotoo-kodi-mshahara/index.html`<br>`sw/benin/kikokotoo-kodi-mshahara/index.html` |
| 16 | tools / car insurance: Tap targets likely below 44px | 54 | 1080 | assets/css/insurance.css<br>shared 44px tap target pattern | `tools/car-insurance/algeria.html`<br>`tools/car-insurance/angola.html`<br>`tools/car-insurance/benin.html` |
| 17 | tools / contractor vs employee: Tap targets likely below 44px | 54 | 1080 | assets/css/hr-payroll.css<br>shared 44px tap target pattern | `tools/contractor-vs-employee/algeria/index.html`<br>`tools/contractor-vs-employee/angola/index.html`<br>`tools/contractor-vs-employee/benin/index.html` |
| 18 | tools / employee cost: Tap targets likely below 44px | 54 | 1080 | assets/css/hr-payroll.css<br>shared 44px tap target pattern | `tools/employee-cost/algeria/index.html`<br>`tools/employee-cost/angola/index.html`<br>`tools/employee-cost/benin/index.html` |
| 19 | tools / health contribution: Tap targets likely below 44px | 54 | 1080 | assets/css/insurance.css<br>shared 44px tap target pattern | `tools/health-contribution/algeria.html`<br>`tools/health-contribution/angola.html`<br>`tools/health-contribution/benin.html` |
| 20 | tools / maternity leave: Tap targets likely below 44px | 54 | 1080 | assets/css/hr-payroll.css<br>shared 44px tap target pattern | `tools/maternity-leave/algeria/index.html`<br>`tools/maternity-leave/angola/index.html`<br>`tools/maternity-leave/benin/index.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/engineering/afrodraft/app.html` | 136 | engineering | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 2 | `/tools/ke-nssf/` | 120 | tools / ke nssf | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar, Overflow risk |
| 3 | `/tools/za-uif/` | 116 | tools / za uif | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar, Overflow risk |
| 4 | `/fr/tools/generateur-factures/` | 114 | fr / tools | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 5 | `/tools/invoice-generator/` | 114 | tools / invoice generator | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 6 | `/fr/` | 112 | fr / index.html | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 7 | `/tools/idea-board/` | 110 | tools / idea board | Sub-16 controls, Tap targets, Late collapse, 100vh overlay |
| 8 | `/dashboard/` | 108 | dashboard | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 9 | `/tools/meeting-minutes/app.html` | 108 | tools / meeting minutes | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Fixed header |
| 10 | `/sw/zana/mpango-wa-kustaafu-mapema/` | 106 | sw / zana | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 11 | `/tools/bol-generator/` | 106 | tools / bol generator | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 12 | `/tools/retirement-planner/` | 106 | tools / retirement planner | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 13 | `/tools/side-hustle-tax/` | 106 | tools / side hustle tax | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 14 | `/tools/ajo-tracker/app.html` | 104 | tools / ajo tracker | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Fixed header |
| 15 | `/tools/car-loan/` | 104 | tools / car loan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 16 | `/tools/electrical-load/` | 104 | tools / electrical load | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 17 | `/tools/packing-list/` | 104 | tools / packing list | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 18 | `/tools/rental-yield/` | 104 | tools / rental yield | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 19 | `/tools/shipping-calc/` | 102 | tools / shipping calc | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 20 | `/tools/agent-commission/` | 100 | tools / agent commission | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 21 | `/tools/boq-builder/app.html` | 100 | tools / boq builder | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Fixed header |
| 22 | `/tools/cash-flow-forecast/` | 100 | tools / cash flow forecast | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 23 | `/tools/pension-proj/` | 100 | tools / pension proj | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 24 | `/tools/receipt-generator/` | 100 | tools / receipt generator | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 25 | `/tools/susu-tracker/` | 100 | tools / susu tracker | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 26 | `/sw/zana/kikokotoo-muda-wa-ziada/` | 98 | sw / zana | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 27 | `/tools/african-meal-plan/` | 98 | tools / african meal plan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 28 | `/tools/afrorates/` | 98 | tools / afrorates | Sub-16 controls, Late collapse, Fixed sidebar, Overflow risk |
| 29 | `/tools/csection-vs-natural/` | 98 | tools / csection vs natural | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 30 | `/tools/eac-cet/` | 98 | tools / eac cet | Sub-16 controls, Tap targets, Late collapse, Overflow risk |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 1806 | 44384 |
| shared 44px tap target pattern | 1079 | 22048 |
| shared mobile form sizing pattern | 961 | 21884 |
| shared sidebar collapse pattern | 465 | 11160 |
| assets/css/agriculture.css | 440 | 9766 |
| assets/css/calculator.css | 428 | 11526 |
| agriculture/cocoa-tracker/index.html | 425 | 9376 |
| agriculture/coffee-calculator/index.html | 425 | 9376 |
| assets/css/insurance.css | 380 | 7802 |
| assets/css/hr-payroll.css | 362 | 7364 |
| assets/css/tool-landing.css | 338 | 7806 |
| assets/css/paye-tool.css | 286 | 7958 |

## Recommended Next-Fix Order

1. agriculture: Multi-column layout stays multi-column too long
   425 pages / 9376 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/agriculture.css, agriculture/cocoa-tracker/index.html, agriculture/coffee-calculator/index.html
2. Country PAYE pages: Multi-column layout stays multi-column too long
   54 pages / 1722 score; strong shared lever through assets/css/paye-tool.css.
   Primary levers: assets/css/paye-tool.css, shared early-collapse layout pattern, assets/css/calculator.css, algeria/dz-paye.html
3. Swahili country PAYE pages: Multi-column layout stays multi-column too long
   48 pages / 1492 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/calculator.css, assets/css/paye-tool.css, sw/algeria/kikokotoo-kodi-mshahara/index.html
4. fr / tools: Form controls likely below 16px
   70 pages / 1448 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, assets/css/tool-landing.css, assets/css/global.css, assets/css/invoice-generator.css
5. tools / employment contract: Multi-column layout stays multi-column too long
   55 pages / 1428 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/multi-country.css, tools/employment-contract/algeria.html, tools/employment-contract/angola.html
6. tools / tenancy agreement: Multi-column layout stays multi-column too long
   55 pages / 1428 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/multi-country.css, tools/tenancy-agreement/algeria.html, tools/tenancy-agreement/angola.html
7. tools / visa checker: Multi-column layout stays multi-column too long
   55 pages / 1428 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/multi-country.css, tools/visa-checker/algeria.html, tools/visa-checker/angola.html
8. French country PAYE pages: Multi-column layout stays multi-column too long
   42 pages / 1328 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/calculator.css, assets/css/paye-tool.css, fr/algeria/dz-paye.html
9. tools / employment contract: Form controls likely below 16px
   55 pages / 1320 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, tools/employment-contract/algeria.html, tools/employment-contract/angola.html, tools/employment-contract/benin.html
10. tools / tenancy agreement: Form controls likely below 16px
   55 pages / 1320 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, tools/tenancy-agreement/algeria.html, tools/tenancy-agreement/angola.html, tools/tenancy-agreement/benin.html

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
