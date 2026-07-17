# Mobile Audit

Generated: 2026-07-13T19:58:27.351Z

## Scope

- HTML pages audited: 10345
- Pages with issues: 641
- Pages without issues: 9704
- Pages using shared CSS foundation: 10006
- Pages using shared navbar: 9900

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | fr / tools: Multi-column layout stays multi-column too long | 197 | 4484 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>fr/tools/ajo-chama/index.html<br>fr/tools/assurance-auto/algeria.html | `fr/tools/ajo-chama/index.html`<br>`fr/tools/assurance-auto/algeria.html`<br>`fr/tools/assurance-auto/benin.html` |
| 2 | tools / fuel tracker: Multi-column layout stays multi-column too long | 54 | 1188 | shared early-collapse layout pattern<br>tools/fuel-tracker/algeria/index.html<br>tools/fuel-tracker/angola/index.html<br>tools/fuel-tracker/benin/index.html | `tools/fuel-tracker/algeria/index.html`<br>`tools/fuel-tracker/angola/index.html`<br>`tools/fuel-tracker/benin/index.html` |
| 3 | tools / solar roi: Multi-column layout stays multi-column too long | 54 | 1188 | shared early-collapse layout pattern<br>tools/solar-roi/algeria/index.html<br>tools/solar-roi/angola/index.html<br>tools/solar-roi/benin/index.html | `tools/solar-roi/algeria/index.html`<br>`tools/solar-roi/angola/index.html`<br>`tools/solar-roi/benin/index.html` |
| 4 | fr / tools: Tap targets likely below 44px | 57 | 1140 | shared 44px tap target pattern<br>fr/tools/conformite-donnees/index.html<br>fr/tools/encodeur-url/index.html<br>fr/tools/montant-lettres-ke/index.html | `fr/tools/conformite-donnees/index.html`<br>`fr/tools/encodeur-url/index.html`<br>`fr/tools/montant-lettres-ke/index.html` |
| 5 | ha: Multi-column layout stays multi-column too long | 22 | 484 | shared early-collapse layout pattern<br>ha/jamb/adabi/index.html<br>ha/jamb/cbt/index.html<br>ha/jamb/crk/index.html | `ha/jamb/adabi/index.html`<br>`ha/jamb/cbt/index.html`<br>`ha/jamb/crk/index.html` |
| 6 | fr / tools: Fixed-width sidebar around 320px+ compresses content | 20 | 480 | shared sidebar collapse pattern<br>fr/tools/calculateur-ielts/index.html<br>fr/tools/calculateur-offrande/index.html<br>fr/tools/calculatrice-scientifique/index.html | `fr/tools/calculateur-ielts/index.html`<br>`fr/tools/calculateur-offrande/index.html`<br>`fr/tools/calculatrice-scientifique/index.html` |
| 7 | pro: Multi-column layout stays multi-column too long | 8 | 194 | shared early-collapse layout pattern<br>pro/apps/creator-studio/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/creator-studio/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 8 | yo: Multi-column layout stays multi-column too long | 7 | 154 | shared early-collapse layout pattern<br>yo/awon-ise/alawus-na-nysc/index.html<br>yo/awon-ise/duba-genotype/index.html<br>yo/awon-ise/kalkuletan-jamb/index.html | `yo/awon-ise/alawus-na-nysc/index.html`<br>`yo/awon-ise/duba-genotype/index.html`<br>`yo/awon-ise/kalkuletan-jamb/index.html` |
| 9 | fr / business: Custom mobile nav/search pattern looks inconsistent | 4 | 96 | assets/js/components/navbar.js adoption<br>fr/business | `fr/business/break-even/index.html`<br>`fr/business/invoice/index.html`<br>`fr/business/payroll/index.html` |
| 10 | fr / education: Custom mobile nav/search pattern looks inconsistent | 4 | 96 | assets/js/components/navbar.js adoption<br>fr/education | `fr/education/fees/index.html`<br>`fr/education/loans/index.html`<br>`fr/education/scholarships/index.html` |
| 11 | fr / health: Custom mobile nav/search pattern looks inconsistent | 4 | 96 | assets/js/components/navbar.js adoption<br>fr/health | `fr/health/costs/index.html`<br>`fr/health/insurance/index.html`<br>`fr/health/medical-aid/index.html` |
| 12 | tools / afrostream: Multi-column layout stays multi-column too long | 4 | 92 | shared early-collapse layout pattern<br>tools/afrostream/creator.html<br>tools/afrostream/index.html<br>tools/afrostream/news.html | `tools/afrostream/creator.html`<br>`tools/afrostream/index.html`<br>`tools/afrostream/news.html` |
| 13 | fr / tools: Horizontal overflow risk from 100vw or hard widths | 4 | 80 | shared overflow guard pattern<br>fr/tools/ajo-chama/index.html<br>fr/tools/convertisseur-devises/index.html<br>fr/tools/interet-tontine/index.html | `fr/tools/ajo-chama/index.html`<br>`fr/tools/convertisseur-devises/index.html`<br>`fr/tools/interet-tontine/index.html` |
| 14 | audit results: Missing viewport meta | 2 | 76 | audit-results/pdf-workspace-online-check/local-inline-render.html<br>audit-results/pdf-workspace-online-check/render-output.html | `audit-results/pdf-workspace-online-check/local-inline-render.html`<br>`audit-results/pdf-workspace-online-check/render-output.html` |
| 15 | fr / tools: Custom mobile nav/search pattern looks inconsistent | 3 | 68 | fr/tools<br>assets/js/components/navbar.js adoption<br>shared app shell mobile pattern | `fr/tools/contraste-couleurs/index.html`<br>`fr/tools/document-pdf/index.html`<br>`fr/tools/plan-affaires/app.html` |
| 16 | sw / ghana: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/ghana/kikokotoo-gharama-ya-mfanyakazi/index.html<br>sw/ghana/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/ghana/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/ghana/kikokotoo-gharama-ya-mfanyakazi/index.html`<br>`sw/ghana/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/ghana/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 17 | sw / nigeria: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/nigeria/kikokotoo-gharama-ya-mfanyakazi/index.html<br>sw/nigeria/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/nigeria/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/nigeria/kikokotoo-gharama-ya-mfanyakazi/index.html`<br>`sw/nigeria/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/nigeria/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 18 | sw / south africa: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/south-africa/kikokotoo-kiinua-mgongo/index.html<br>sw/south-africa/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/south-africa/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/south-africa/kikokotoo-kiinua-mgongo/index.html`<br>`sw/south-africa/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/south-africa/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 19 | sw / zana: Horizontal overflow risk from 100vw or hard widths | 3 | 60 | shared overflow guard pattern<br>sw/zana/kilinganisha-tv-na-streaming/index.html<br>sw/zana/kulinganisha-hosting/index.html<br>sw/zana/orodha-vifaa/index.html | `sw/zana/kilinganisha-tv-na-streaming/index.html`<br>`sw/zana/kulinganisha-hosting/index.html`<br>`sw/zana/orodha-vifaa/index.html` |
| 20 | engineering: Horizontal overflow risk from 100vw or hard widths | 2 | 50 | shared overflow guard pattern<br>engineering/afrodraft/assets/css/app.css<br>engineering/floor-planner/css/fp-3d-polish.css<br>engineering/floor-planner/css/fp-layout-access.css | `engineering/afrodraft/app.html`<br>`engineering/floor-planner/index.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/fr/tools/contraste-couleurs/` | 122 | fr / tools | Missing CSS foundation, Missing navbar, Sub-16 controls, Late collapse, Fixed sidebar, Custom nav/search |
| 2 | `/tools/ajo-tracker/app.html` | 114 | tools / ajo tracker | Sub-16 controls, Tap targets, Late collapse, Custom nav/search, Fixed header |
| 3 | `/fr/blog/calculer-salaire-net-senegal/` | 100 | fr / blog | Missing CSS foundation, Missing navbar, Late collapse, Fixed sidebar, Custom nav/search |
| 4 | `/engineering/afrodraft/app.html` | 90 | engineering | Sub-16 controls, Tap targets, Late collapse, Overflow risk |
| 5 | `/tools/cover-letter-generator/app.html` | 90 | tools / cover letter generator | Sub-16 controls, Late collapse, Custom nav/search, Fixed header |
| 6 | `/tools/meeting-minutes/app.html` | 86 | tools / meeting minutes | Sub-16 controls, Late collapse, Custom nav/search, Fixed header |
| 7 | `/engineering/floor-planner/` | 76 | engineering | Fixed sidebar, 100vh overlay, Overflow risk |
| 8 | `/artifacts/scholarship-card-redesign/preview.html` | 72 | artifacts | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets |
| 9 | `/tools/afrostream/admin.html` | 68 | tools / afrostream | Sub-16 controls, Tap targets, Custom nav/search |
| 10 | `/tools/boq-builder/app.html` | 68 | tools / boq builder | Sub-16 controls, Late collapse, Fixed header |
| 11 | `/tools/contract-generator/app.html` | 68 | tools / contract generator | Sub-16 controls, Late collapse, Custom nav/search |
| 12 | `/audit-results/pdf-workspace-online-check/local-inline-render.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 13 | `/audit-results/pdf-workspace-online-check/render-output.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 14 | `/fr/tools/montant-lettres-ke/` | 66 | fr / tools | Tap targets, Late collapse, Fixed sidebar |
| 15 | `/tools/student-loan/` | 60 | tools / student loan | Sub-16 controls, Tap targets, Overflow risk |
| 16 | `/tools/import-duty/` | 52 | tools / import duty | Late collapse, Fixed sidebar |
| 17 | `/fr/ai/` | 48 | fr / ai | Late collapse, Fixed sidebar |
| 18 | `/fr/angola/ao-vat.html` | 48 | fr / angola | Late collapse, Fixed sidebar |
| 19 | `/fr/egypt/eg-vat.html` | 48 | fr / egypt | Late collapse, Fixed sidebar |
| 20 | `/fr/south-africa/za-vat.html` | 48 | fr / south africa | Late collapse, Fixed sidebar |
| 21 | `/fr/tanzania/tz-vat.html` | 48 | fr / tanzania | Late collapse, Fixed sidebar |
| 22 | `/fr/tools/compte-a-rebours/` | 48 | fr / tools | Late collapse, Fixed sidebar |
| 23 | `/fr/tools/cout-funerailles/` | 48 | fr / tools | Late collapse, Fixed sidebar |
| 24 | `/sw/ai/` | 48 | sw / ai | Late collapse, Fixed sidebar |
| 25 | `/fr/ghana/gh-vat.html` | 46 | fr / ghana | Late collapse, Fixed sidebar |
| 26 | `/fr/kenya/ke-vat.html` | 46 | fr / kenya | Late collapse, Fixed sidebar |
| 27 | `/fr/nigeria/ng-vat.html` | 46 | fr / nigeria | Late collapse, Fixed sidebar |
| 28 | `/fr/tools/calculateur-offrande/` | 46 | fr / tools | Late collapse, Fixed sidebar |
| 29 | `/fr/tools/calculatrice-scientifique/` | 46 | fr / tools | Late collapse, Fixed sidebar |
| 30 | `/fr/tools/chiffres-arabes/` | 46 | fr / tools | Late collapse, Fixed sidebar |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 479 | 10830 |
| fr/tools/ajo-chama/index.html | 201 | 4564 |
| assets/css/invoice-generator.css | 197 | 4484 |
| fr/tools/assurance-auto/algeria.html | 197 | 4484 |
| shared 44px tap target pattern | 160 | 3212 |
| fr/tools/conformite-donnees/index.html | 57 | 1140 |
| fr/tools/encodeur-url/index.html | 57 | 1140 |
| fr/tools/montant-lettres-ke/index.html | 57 | 1140 |
| tools/fuel-tracker/algeria/index.html | 54 | 1188 |
| tools/fuel-tracker/angola/index.html | 54 | 1188 |
| tools/fuel-tracker/benin/index.html | 54 | 1188 |
| tools/solar-roi/algeria/index.html | 54 | 1188 |

## Recommended Next-Fix Order

1. fr / tools: Multi-column layout stays multi-column too long
   197 pages / 4484 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, fr/tools/ajo-chama/index.html, fr/tools/assurance-auto/algeria.html
2. tools / fuel tracker: Multi-column layout stays multi-column too long
   54 pages / 1188 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/fuel-tracker/algeria/index.html, tools/fuel-tracker/angola/index.html, tools/fuel-tracker/benin/index.html
3. tools / solar roi: Multi-column layout stays multi-column too long
   54 pages / 1188 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/solar-roi/algeria/index.html, tools/solar-roi/angola/index.html, tools/solar-roi/benin/index.html
4. fr / tools: Tap targets likely below 44px
   57 pages / 1140 score; strong shared lever through shared 44px tap target pattern.
   Primary levers: shared 44px tap target pattern, fr/tools/conformite-donnees/index.html, fr/tools/encodeur-url/index.html, fr/tools/montant-lettres-ke/index.html
5. ha: Multi-column layout stays multi-column too long
   22 pages / 484 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, ha/jamb/adabi/index.html, ha/jamb/cbt/index.html, ha/jamb/crk/index.html
6. fr / tools: Fixed-width sidebar around 320px+ compresses content
   20 pages / 480 score; strong shared lever through shared sidebar collapse pattern.
   Primary levers: shared sidebar collapse pattern, fr/tools/calculateur-ielts/index.html, fr/tools/calculateur-offrande/index.html, fr/tools/calculatrice-scientifique/index.html
7. pro: Multi-column layout stays multi-column too long
   8 pages / 194 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/creator-studio/index.html, pro/apps/grants-tenders/index.html, pro/apps/hr/index.html
8. yo: Multi-column layout stays multi-column too long
   7 pages / 154 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, yo/awon-ise/alawus-na-nysc/index.html, yo/awon-ise/duba-genotype/index.html, yo/awon-ise/kalkuletan-jamb/index.html
9. fr / business: Custom mobile nav/search pattern looks inconsistent
   4 pages / 96 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, fr/business
10. fr / education: Custom mobile nav/search pattern looks inconsistent
   4 pages / 96 score; strong shared lever through assets/js/components/navbar.js adoption.
   Primary levers: assets/js/components/navbar.js adoption, fr/education

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
