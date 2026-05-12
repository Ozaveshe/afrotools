# Mobile Audit

Generated: 2026-05-12T00:37:01.708Z

## Scope

- HTML pages audited: 8286
- Pages with issues: 1486
- Pages without issues: 6800
- Pages using shared CSS foundation: 7912
- Pages using shared navbar: 7849

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | Widget iframes: financial family: Custom mobile nav/search pattern looks inconsistent | 79 | 1896 | assets/js/components/navbar.js adoption<br>widgets/iframe/financial-* | `widgets/iframe/financial-algeria-paye.html`<br>`widgets/iframe/financial-angola-paye.html`<br>`widgets/iframe/financial-benin-paye.html` |
| 2 | sw / zana: Multi-column layout stays multi-column too long | 74 | 1784 | shared early-collapse layout pattern<br>sw/zana/barua-ombi/index.html<br>sw/zana/bei-mafuta/index.html<br>sw/zana/cron/index.html | `sw/zana/barua-ombi/index.html`<br>`sw/zana/bei-mafuta/index.html`<br>`sw/zana/cron/index.html` |
| 3 | pro: Custom mobile nav/search pattern looks inconsistent | 25 | 600 | assets/js/components/navbar.js adoption<br>pro | `pro/apps/agri-farmops/index.html`<br>`pro/apps/beauty/index.html`<br>`pro/apps/books/index.html` |
| 4 | Creator app shells: Custom mobile nav/search pattern looks inconsistent | 27 | 540 | shared app shell mobile pattern<br>tools/creator-* | `tools/creator-analytics/app.html`<br>`tools/creator-bios/app.html`<br>`tools/creator-calendar/app.html` |
| 5 | pro: Multi-column layout stays multi-column too long | 18 | 534 | shared early-collapse layout pattern<br>pro/apps/books/index.html<br>pro/apps/creator-studio/index.html<br>pro/apps/events/index.html | `pro/apps/books/index.html`<br>`pro/apps/creator-studio/index.html`<br>`pro/apps/events/index.html` |
| 6 | ha: Multi-column layout stays multi-column too long | 21 | 522 | shared early-collapse layout pattern<br>ha/assets/health-ha.css<br>assets/css/global.css<br>assets/css/invoice-generator.css | `ha/harshe-da-fassara/index.html`<br>`ha/index.html`<br>`ha/jamb/index.html` |
| 7 | French country PAYE pages: Custom mobile nav/search pattern looks inconsistent | 20 | 480 | assets/js/components/navbar.js adoption<br>fr/country-paye | `fr/algeria/dz-paye.html`<br>`fr/burkina-faso/bf-paye.html`<br>`fr/burundi/bi-paye.html` |
| 8 | fr / tools: Multi-column layout stays multi-column too long | 18 | 436 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>assets/css/japa-calculator.css<br>assets/css/legal.css | `fr/tools/calculateur-japa/index.html`<br>`fr/tools/calculateur-paye/index.html`<br>`fr/tools/calculateur-tva/index.html` |
| 9 | tools / afrostream: Multi-column layout stays multi-column too long | 17 | 418 | shared early-collapse layout pattern<br>tools/afrostream/university/university.css<br>tools/afrostream/methodology.css<br>tools/afrostream/article.html | `tools/afrostream/afroscore/index.html`<br>`tools/afrostream/article.html`<br>`tools/afrostream/calendar.html` |
| 10 | French country PAYE pages: Tap targets likely below 44px | 20 | 400 | shared 44px tap target pattern<br>fr/algeria/dz-paye.html<br>fr/burkina-faso/bf-paye.html<br>fr/burundi/bi-paye.html | `fr/algeria/dz-paye.html`<br>`fr/burkina-faso/bf-paye.html`<br>`fr/burundi/bi-paye.html` |
| 11 | fr / tools: Tap targets likely below 44px | 19 | 380 | shared 44px tap target pattern<br>fr/tools/apport-eau/index.html<br>fr/tools/calculateur-japa/index.html<br>fr/tools/calculateur-solaire/index.html | `fr/tools/apport-eau/index.html`<br>`fr/tools/calculateur-japa/index.html`<br>`fr/tools/calculateur-solaire/index.html` |
| 12 | sw / zana: Form controls likely below 16px | 18 | 380 | shared mobile form sizing pattern<br>sw/zana/bei-mafuta/index.html<br>sw/zana/kichwa-na-kijachini-pdf/index.html<br>sw/zana/kifuatiliaji-alama/index.html | `sw/zana/bei-mafuta/index.html`<br>`sw/zana/kichwa-na-kijachini-pdf/index.html`<br>`sw/zana/kifuatiliaji-alama/index.html` |
| 13 | pro: Tap targets likely below 44px | 17 | 348 | shared 44px tap target pattern<br>pro/apps/books/index.html<br>pro/apps/creator-studio/index.html<br>pro/apps/events/index.html | `pro/apps/books/index.html`<br>`pro/apps/creator-studio/index.html`<br>`pro/apps/events/index.html` |
| 14 | pro: Full page is not using the shared navbar foundation | 24 | 336 | assets/js/components/navbar.js adoption<br>pro | `pro/apps/agri-farmops/index.html`<br>`pro/apps/beauty/index.html`<br>`pro/apps/books/index.html` |
| 15 | Widget iframes: agriculture family: Custom mobile nav/search pattern looks inconsistent | 14 | 336 | assets/js/components/navbar.js adoption<br>widgets/iframe/agriculture-* | `widgets/iframe/agriculture-crop-insurance-premium.html`<br>`widgets/iframe/agriculture-crop-yield-estimator.html`<br>`widgets/iframe/agriculture-farm-budget-estimator.html` |
| 16 | Widget iframes: developer family: Custom mobile nav/search pattern looks inconsistent | 13 | 312 | assets/js/components/navbar.js adoption<br>widgets/iframe/developer-* | `widgets/iframe/developer-base64.html`<br>`widgets/iframe/developer-color-picker.html`<br>`widgets/iframe/developer-cron-builder.html` |
| 17 | telecom: Form controls likely below 16px | 14 | 284 | shared mobile form sizing pattern<br>telecom/airtime-value/index.html<br>telecom/bulk-sms-pricing/index.html<br>telecom/business-internet/index.html | `telecom/airtime-value/index.html`<br>`telecom/bulk-sms-pricing/index.html`<br>`telecom/business-internet/index.html` |
| 18 | tools / afrostream: Tap targets likely below 44px | 11 | 266 | shared 44px tap target pattern<br>tools/afrostream/subnav.css<br>tools/afrostream/style.css<br>tools/afrostream/methodology.css | `tools/afrostream/admin.html`<br>`tools/afrostream/afroscore/index.html`<br>`tools/afrostream/article.html` |
| 19 | Widget iframes: education family: Custom mobile nav/search pattern looks inconsistent | 11 | 264 | assets/js/components/navbar.js adoption<br>widgets/iframe/education-* | `widgets/iframe/education-boarding-school-cost.html`<br>`widgets/iframe/education-classroom-capacity.html`<br>`widgets/iframe/education-exam-countdown-widget.html` |
| 20 | Widget iframes: health family: Custom mobile nav/search pattern looks inconsistent | 11 | 264 | assets/js/components/navbar.js adoption<br>widgets/iframe/health-* | `widgets/iframe/health-blood-pressure.html`<br>`widgets/iframe/health-bmi-calculator.html`<br>`widgets/iframe/health-calorie-calculator.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/pro/apps/seller/` | 136 | pro | Missing navbar, Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 2 | `/engineering/afrodraft/app.html` | 124 | engineering | Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 3 | `/pro/apps/events/` | 120 | pro | Missing navbar, Sub-16 controls, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 4 | `/tools/ajo-tracker/app.html` | 120 | tools / ajo tracker | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 5 | `/fr/` | 112 | fr / index.html | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 6 | `/pro/apps/hr/` | 112 | pro | Missing navbar, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 7 | `/pro/apps/books/` | 110 | pro | Missing navbar, Tap targets, Late collapse, Overflow risk, Custom nav/search |
| 8 | `/tools/idea-board/` | 110 | tools / idea board | Sub-16 controls, Tap targets, Late collapse, 100vh overlay |
| 9 | `/dashboard/` | 108 | dashboard | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 10 | `/tools/boq-builder/app.html` | 108 | tools / boq builder | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 11 | `/tools/meeting-minutes/app.html` | 106 | tools / meeting minutes | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 12 | `/tools/retirement-planner/` | 106 | tools / retirement planner | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 13 | `/tools/side-hustle-tax/` | 106 | tools / side hustle tax | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 14 | `/tools/car-loan/` | 104 | tools / car loan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 15 | `/tools/cover-letter-generator/app.html` | 104 | tools / cover letter generator | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 16 | `/tools/susu-tracker/` | 104 | tools / susu tracker | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 17 | `/tools/africa-conflict/` | 102 | tools / africa conflict | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 18 | `/tools/african-meal-plan/` | 102 | tools / african meal plan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 19 | `/tools/csection-vs-natural/` | 102 | tools / csection vs natural | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 20 | `/tools/electrical-load/` | 102 | tools / electrical load | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 21 | `/tools/rental-yield/` | 102 | tools / rental yield | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 22 | `/tools/shipping-calc/` | 102 | tools / shipping calc | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 23 | `/tools/brideprice-advisor/` | 100 | tools / brideprice advisor | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 24 | `/tools/cash-flow-forecast/` | 100 | tools / cash flow forecast | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 25 | `/tools/child-growth/` | 100 | tools / child growth | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 26 | `/tools/ke-nssf/` | 100 | tools / ke nssf | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 27 | `/tools/pdf-password/` | 100 | tools / pdf password | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 28 | `/tools/pension-proj/` | 100 | tools / pension proj | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 29 | `/ha/kayan-aiki/kirkiro-invoice/` | 98 | ha | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 30 | `/tools/blood-group/` | 98 | tools / blood group | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 807 | 19996 |
| shared 44px tap target pattern | 634 | 13378 |
| shared mobile form sizing pattern | 526 | 11970 |
| assets/js/components/navbar.js adoption | 415 | 9680 |
| shared sidebar collapse pattern | 240 | 5762 |
| sw/zana/bei-mafuta/index.html | 92 | 2164 |
| widgets/iframe/financial-* | 79 | 1896 |
| sw/zana/barua-ombi/index.html | 74 | 1784 |
| sw/zana/cron/index.html | 74 | 1784 |
| assets/css/legal-enhancements.css | 71 | 1580 |
| pro | 49 | 936 |
| assets/css/african-workflow.css | 46 | 1124 |

## Recommended Next-Fix Order

1. Widget iframes: financial family: Custom mobile nav/search pattern looks inconsistent
   79 pages / 1896 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, widgets/iframe/financial-*
2. sw / zana: Multi-column layout stays multi-column too long
   74 pages / 1784 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, sw/zana/barua-ombi/index.html, sw/zana/bei-mafuta/index.html, sw/zana/cron/index.html
3. pro: Custom mobile nav/search pattern looks inconsistent
   25 pages / 600 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, pro
4. Creator app shells: Custom mobile nav/search pattern looks inconsistent
   27 pages / 540 score; strong shared lever through shared app shell mobile pattern.
   Primary levers: shared app shell mobile pattern, tools/creator-*
5. pro: Multi-column layout stays multi-column too long
   18 pages / 534 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/books/index.html, pro/apps/creator-studio/index.html, pro/apps/events/index.html
6. ha: Multi-column layout stays multi-column too long
   21 pages / 522 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, ha/assets/health-ha.css, assets/css/global.css, assets/css/invoice-generator.css
7. French country PAYE pages: Custom mobile nav/search pattern looks inconsistent
   20 pages / 480 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, fr/country-paye
8. fr / tools: Multi-column layout stays multi-column too long
   18 pages / 436 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, assets/css/japa-calculator.css, assets/css/legal.css
9. tools / afrostream: Multi-column layout stays multi-column too long
   17 pages / 418 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/university/university.css, tools/afrostream/methodology.css, tools/afrostream/article.html
10. French country PAYE pages: Tap targets likely below 44px
   20 pages / 400 score; strong shared lever through shared 44px tap target pattern.
   Primary levers: shared 44px tap target pattern, fr/algeria/dz-paye.html, fr/burkina-faso/bf-paye.html, fr/burundi/bi-paye.html

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
