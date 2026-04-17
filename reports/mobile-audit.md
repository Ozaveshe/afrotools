# Mobile Audit

Generated: 2026-04-17T01:28:22.664Z

## Scope

- HTML pages audited: 5745
- Pages with issues: 1589
- Pages without issues: 4156
- Pages using shared CSS foundation: 5510
- Pages using shared navbar: 5492

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | agriculture: Multi-column layout stays multi-column too long | 425 | 9376 | shared early-collapse layout pattern<br>assets/css/agriculture.css<br>agriculture/cocoa-tracker/index.html<br>agriculture/coffee-calculator/index.html | `agriculture/cocoa-tracker/index.html`<br>`agriculture/coffee-calculator/index.html`<br>`agriculture/commodity-prices/index.html` |
| 2 | fr / tools: Form controls likely below 16px | 62 | 1272 | shared mobile form sizing pattern<br>assets/css/invoice-generator.css<br>assets/css/japa-calculator.css<br>assets/css/vat-calculator.css | `fr/tools/apport-eau/index.html`<br>`fr/tools/bac-a-sable-sql/index.html`<br>`fr/tools/calculateur-age/index.html` |
| 3 | sw / zana: Multi-column layout stays multi-column too long | 34 | 840 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>sw/zana/ada-lc/index.html<br>sw/zana/ada-pesa-simu/index.html | `sw/zana/ada-lc/index.html`<br>`sw/zana/ada-pesa-simu/index.html`<br>`sw/zana/barua-ombi/index.html` |
| 4 | fr / tools: Multi-column layout stays multi-column too long | 31 | 770 | shared early-collapse layout pattern<br>assets/css/import-duty.css<br>assets/css/invoice-generator.css<br>assets/css/japa-calculator.css | `fr/tools/calculateur-hypothecaire/index.html`<br>`fr/tools/calculateur-japa/index.html`<br>`fr/tools/calculateur-paye/index.html` |
| 5 | sw / zana: Form controls likely below 16px | 29 | 668 | shared mobile form sizing pattern<br>assets/css/invoice-generator.css<br>sw/zana/ada-lc/index.html<br>sw/zana/ada-pesa-simu/index.html | `sw/zana/ada-lc/index.html`<br>`sw/zana/ada-pesa-simu/index.html`<br>`sw/zana/bei-mafuta/index.html` |
| 6 | Creator app shells: Custom mobile nav/search pattern looks inconsistent | 21 | 420 | shared app shell mobile pattern<br>tools/creator-* | `tools/creator-analytics/app.html`<br>`tools/creator-brand/app.html`<br>`tools/creator-captions/app.html` |
| 7 | sw / kilimo: Multi-column layout stays multi-column too long | 15 | 390 | assets/css/agriculture.css<br>shared early-collapse layout pattern<br>sw/kilimo/mavuno/burundi/index.html<br>sw/kilimo/mavuno/kenya/index.html | `sw/kilimo/mavuno/burundi/index.html`<br>`sw/kilimo/mavuno/kenya/index.html`<br>`sw/kilimo/mavuno/rwanda/index.html` |
| 8 | tools / afrostream: Multi-column layout stays multi-column too long | 14 | 326 | shared early-collapse layout pattern<br>tools/afrostream/university/university.css<br>tools/afrostream/calendar.html<br>tools/afrostream/creator.html | `tools/afrostream/calendar.html`<br>`tools/afrostream/creator.html`<br>`tools/afrostream/index.html` |
| 9 | telecom: Form controls likely below 16px | 14 | 302 | shared mobile form sizing pattern<br>telecom/airtime-value/index.html<br>telecom/bulk-sms-pricing/index.html<br>telecom/business-internet/index.html | `telecom/airtime-value/index.html`<br>`telecom/bulk-sms-pricing/index.html`<br>`telecom/business-internet/index.html` |
| 10 | fr / tools: Tap targets likely below 44px | 13 | 274 | shared 44px tap target pattern<br>assets/css/design-system.css<br>assets/css/invoice-generator.css<br>assets/css/legal.css | `fr/tools/commission-agent/index.html`<br>`fr/tools/comparateur-prets/index.html`<br>`fr/tools/convertisseur-devises/index.html` |
| 11 | sw / mshahara na kodi: Multi-column layout stays multi-column too long | 9 | 216 | shared early-collapse layout pattern<br>assets/css/salary-tax-hub.css<br>assets/css/salary-tax.css | `sw/mshahara-na-kodi/business-tax/index.html`<br>`sw/mshahara-na-kodi/crypto/index.html`<br>`sw/mshahara-na-kodi/francophone/index.html` |
| 12 | telecom: Multi-column layout stays multi-column too long | 9 | 210 | shared early-collapse layout pattern<br>telecom/airtime-value/index.html<br>telecom/bulk-sms-pricing/index.html<br>telecom/business-internet/index.html | `telecom/airtime-value/index.html`<br>`telecom/bulk-sms-pricing/index.html`<br>`telecom/business-internet/index.html` |
| 13 | tools / afrostream: Tap targets likely below 44px | 9 | 208 | shared 44px tap target pattern<br>tools/afrostream/style.css<br>tools/afrostream/admin.html<br>tools/afrostream/article.html | `tools/afrostream/admin.html`<br>`tools/afrostream/article.html`<br>`tools/afrostream/calendar.html` |
| 14 | crypto: Multi-column layout stays multi-column too long | 9 | 202 | shared early-collapse layout pattern<br>assets/css/crypto.css<br>crypto/address-validator/index.html<br>crypto/dca-calculator/index.html | `crypto/address-validator/index.html`<br>`crypto/dca-calculator/index.html`<br>`crypto/exchange-ratings/index.html` |
| 15 | sw / zana: Tap targets likely below 44px | 9 | 192 | shared 44px tap target pattern<br>sw/zana/ada-lc/index.html<br>sw/zana/gharama-usafirishaji/index.html<br>sw/zana/jikoni/index.html | `sw/zana/ada-lc/index.html`<br>`sw/zana/gharama-usafirishaji/index.html`<br>`sw/zana/jikoni/index.html` |
| 16 | salary tax: Multi-column layout stays multi-column too long | 8 | 192 | shared early-collapse layout pattern<br>assets/css/salary-tax-hub.css<br>assets/css/salary-tax.css | `salary-tax/business-tax/index.html`<br>`salary-tax/crypto/index.html`<br>`salary-tax/fx/index.html` |
| 17 | tools / africa conflict: Tap targets likely below 44px | 9 | 182 | shared 44px tap target pattern<br>tools/africa-conflict/style.css<br>tools/africa-conflict/dashboard.css | `tools/africa-conflict/actors.html`<br>`tools/africa-conflict/conflicts.html`<br>`tools/africa-conflict/detail.html` |
| 18 | sw / mshahara na kodi: Form controls likely below 16px | 9 | 180 | shared mobile form sizing pattern<br>assets/css/salary-tax-hub.css<br>assets/css/salary-tax.css | `sw/mshahara-na-kodi/business-tax/index.html`<br>`sw/mshahara-na-kodi/crypto/index.html`<br>`sw/mshahara-na-kodi/francophone/index.html` |
| 19 | sw / mshahara na kodi: Tap targets likely below 44px | 9 | 180 | shared 44px tap target pattern<br>assets/css/salary-tax-hub.css<br>assets/css/salary-tax.css | `sw/mshahara-na-kodi/business-tax/index.html`<br>`sw/mshahara-na-kodi/crypto/index.html`<br>`sw/mshahara-na-kodi/francophone/index.html` |
| 20 | fr / tools: Fixed-width sidebar around 320px+ compresses content | 7 | 168 | shared sidebar collapse pattern<br>fr/tools/contrat-location/index.html<br>fr/tools/convertisseur-devises/index.html<br>fr/tools/cout-renovation/index.html | `fr/tools/calculateur-gpa/index.html`<br>`fr/tools/calculateur-waec/index.html`<br>`fr/tools/contrat-location/index.html` |

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
| 17 | `/tools/rental-yield/` | 104 | tools / rental yield | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 18 | `/tools/packing-list/` | 102 | tools / packing list | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 19 | `/tools/shipping-calc/` | 102 | tools / shipping calc | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 20 | `/tools/boq-builder/app.html` | 100 | tools / boq builder | Missing CSS foundation, Sub-16 controls, Tap targets, Late collapse, Fixed header |
| 21 | `/tools/cash-flow-forecast/` | 100 | tools / cash flow forecast | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 22 | `/tools/pension-proj/` | 100 | tools / pension proj | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 23 | `/tools/receipt-generator/` | 100 | tools / receipt generator | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 24 | `/tools/susu-tracker/` | 100 | tools / susu tracker | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 25 | `/tools/african-meal-plan/` | 98 | tools / african meal plan | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 26 | `/tools/afrorates/` | 98 | tools / afrorates | Sub-16 controls, Late collapse, Fixed sidebar, Overflow risk |
| 27 | `/tools/csection-vs-natural/` | 98 | tools / csection vs natural | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 28 | `/tools/eac-cet/` | 98 | tools / eac cet | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 29 | `/tools/htaccess-gen/` | 98 | tools / htaccess gen | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |
| 30 | `/tools/savings-goal/` | 98 | tools / savings goal | Sub-16 controls, Tap targets, Late collapse, Fixed sidebar |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 1268 | 30104 |
| shared mobile form sizing pattern | 680 | 15700 |
| assets/css/agriculture.css | 440 | 9766 |
| agriculture/cocoa-tracker/index.html | 425 | 9376 |
| agriculture/coffee-calculator/index.html | 425 | 9376 |
| shared 44px tap target pattern | 398 | 8388 |
| shared sidebar collapse pattern | 270 | 6480 |
| assets/css/invoice-generator.css | 177 | 4004 |
| assets/css/japa-calculator.css | 96 | 2124 |
| assets/css/design-system.css adoption | 96 | 1344 |
| sw/zana/ada-lc/index.html | 72 | 1700 |
| assets/css/energy.css | 65 | 1524 |

## Recommended Next-Fix Order

1. agriculture: Multi-column layout stays multi-column too long
   425 pages / 9376 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/agriculture.css, agriculture/cocoa-tracker/index.html, agriculture/coffee-calculator/index.html
2. fr / tools: Form controls likely below 16px
   62 pages / 1272 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, assets/css/invoice-generator.css, assets/css/japa-calculator.css, assets/css/vat-calculator.css
3. sw / zana: Multi-column layout stays multi-column too long
   34 pages / 840 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, sw/zana/ada-lc/index.html, sw/zana/ada-pesa-simu/index.html
4. fr / tools: Multi-column layout stays multi-column too long
   31 pages / 770 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/import-duty.css, assets/css/invoice-generator.css, assets/css/japa-calculator.css
5. sw / zana: Form controls likely below 16px
   29 pages / 668 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, assets/css/invoice-generator.css, sw/zana/ada-lc/index.html, sw/zana/ada-pesa-simu/index.html
6. Creator app shells: Custom mobile nav/search pattern looks inconsistent
   21 pages / 420 score; strong shared lever through shared app shell mobile pattern.
   Primary levers: shared app shell mobile pattern, tools/creator-*
7. sw / kilimo: Multi-column layout stays multi-column too long
   15 pages / 390 score; strong shared lever through assets/css/agriculture.css.
   Primary levers: assets/css/agriculture.css, shared early-collapse layout pattern, sw/kilimo/mavuno/burundi/index.html, sw/kilimo/mavuno/kenya/index.html
8. tools / afrostream: Multi-column layout stays multi-column too long
   14 pages / 326 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/university/university.css, tools/afrostream/calendar.html, tools/afrostream/creator.html
9. telecom: Form controls likely below 16px
   14 pages / 302 score; strong shared lever through shared mobile form sizing pattern.
   Primary levers: shared mobile form sizing pattern, telecom/airtime-value/index.html, telecom/bulk-sms-pricing/index.html, telecom/business-internet/index.html
10. fr / tools: Tap targets likely below 44px
   13 pages / 274 score; strong shared lever through shared 44px tap target pattern.
   Primary levers: shared 44px tap target pattern, assets/css/design-system.css, assets/css/invoice-generator.css, assets/css/legal.css

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
