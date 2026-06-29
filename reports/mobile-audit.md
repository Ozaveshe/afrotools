# Mobile Audit

Generated: 2026-06-29T09:29:13.783Z

## Scope

- HTML pages audited: 10293
- Pages with issues: 472
- Pages without issues: 9821
- Pages using shared CSS foundation: 9922
- Pages using shared navbar: 9852

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | fr / tools: Multi-column layout stays multi-column too long | 144 | 3318 | shared early-collapse layout pattern<br>assets/css/invoice-generator.css<br>fr/tools/ajo-chama/index.html<br>fr/tools/assurance-auto/algeria.html | `fr/tools/ajo-chama/index.html`<br>`fr/tools/assurance-auto/algeria.html`<br>`fr/tools/assurance-auto/benin.html` |
| 2 | fr / tools: Tap targets likely below 44px | 84 | 1680 | shared 44px tap target pattern<br>assets/css/business-plan.css<br>fr/tools/calculateur-engrais/index.html<br>fr/tools/compresser-image/index.html | `fr/tools/calculateur-engrais/index.html`<br>`fr/tools/compresser-image/index.html`<br>`fr/tools/conformite-donnees/index.html` |
| 3 | tools / fuel tracker: Multi-column layout stays multi-column too long | 54 | 1188 | shared early-collapse layout pattern<br>tools/fuel-tracker/algeria/index.html<br>tools/fuel-tracker/angola/index.html<br>tools/fuel-tracker/benin/index.html | `tools/fuel-tracker/algeria/index.html`<br>`tools/fuel-tracker/angola/index.html`<br>`tools/fuel-tracker/benin/index.html` |
| 4 | fr / tools: Fixed-width sidebar around 320px+ compresses content | 21 | 504 | shared sidebar collapse pattern<br>fr/tools/calculateur-ielts/index.html<br>fr/tools/calculateur-offrande/index.html<br>fr/tools/calculatrice-scientifique/index.html | `fr/tools/calculateur-ielts/index.html`<br>`fr/tools/calculateur-offrande/index.html`<br>`fr/tools/calculatrice-scientifique/index.html` |
| 5 | ha: Multi-column layout stays multi-column too long | 21 | 462 | shared early-collapse layout pattern<br>ha/jamb/adabi/index.html<br>ha/jamb/cbt/index.html<br>ha/jamb/crk/index.html | `ha/jamb/adabi/index.html`<br>`ha/jamb/cbt/index.html`<br>`ha/jamb/crk/index.html` |
| 6 | pro: Multi-column layout stays multi-column too long | 8 | 194 | shared early-collapse layout pattern<br>pro/apps/creator-studio/index.html<br>pro/apps/grants-tenders/index.html<br>pro/apps/hr/index.html | `pro/apps/creator-studio/index.html`<br>`pro/apps/grants-tenders/index.html`<br>`pro/apps/hr/index.html` |
| 7 | yo: Multi-column layout stays multi-column too long | 7 | 154 | shared early-collapse layout pattern<br>yo/awon-ise/alawus-na-nysc/index.html<br>yo/awon-ise/duba-genotype/index.html<br>yo/awon-ise/kalkuletan-jamb/index.html | `yo/awon-ise/alawus-na-nysc/index.html`<br>`yo/awon-ise/duba-genotype/index.html`<br>`yo/awon-ise/kalkuletan-jamb/index.html` |
| 8 | tools / afrostream: Multi-column layout stays multi-column too long | 4 | 92 | shared early-collapse layout pattern<br>tools/afrostream/creator.html<br>tools/afrostream/index.html<br>tools/afrostream/news.html | `tools/afrostream/creator.html`<br>`tools/afrostream/index.html`<br>`tools/afrostream/news.html` |
| 9 | fr / tools: Horizontal overflow risk from 100vw or hard widths | 4 | 80 | shared overflow guard pattern<br>fr/tools/ajo-chama/index.html<br>fr/tools/convertisseur-devises/index.html<br>fr/tools/interet-tontine/index.html | `fr/tools/ajo-chama/index.html`<br>`fr/tools/convertisseur-devises/index.html`<br>`fr/tools/interet-tontine/index.html` |
| 10 | audit results: Missing viewport meta | 2 | 76 | audit-results/pdf-workspace-online-check/local-inline-render.html<br>audit-results/pdf-workspace-online-check/render-output.html | `audit-results/pdf-workspace-online-check/local-inline-render.html`<br>`audit-results/pdf-workspace-online-check/render-output.html` |
| 11 | sw / ghana: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/ghana/kikokotoo-gharama-ya-mfanyakazi/index.html<br>sw/ghana/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/ghana/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/ghana/kikokotoo-gharama-ya-mfanyakazi/index.html`<br>`sw/ghana/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/ghana/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 12 | sw / nigeria: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/nigeria/kikokotoo-gharama-ya-mfanyakazi/index.html<br>sw/nigeria/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/nigeria/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/nigeria/kikokotoo-gharama-ya-mfanyakazi/index.html`<br>`sw/nigeria/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/nigeria/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 13 | sw / south africa: Multi-column layout stays multi-column too long | 3 | 66 | shared early-collapse layout pattern<br>sw/south-africa/kikokotoo-kiinua-mgongo/index.html<br>sw/south-africa/kikokotoo-malipo-ya-kuachishwa-kazi/index.html<br>sw/south-africa/kilinganisha-mkandarasi-na-mfanyakazi/index.html | `sw/south-africa/kikokotoo-kiinua-mgongo/index.html`<br>`sw/south-africa/kikokotoo-malipo-ya-kuachishwa-kazi/index.html`<br>`sw/south-africa/kilinganisha-mkandarasi-na-mfanyakazi/index.html` |
| 14 | sw / zana: Horizontal overflow risk from 100vw or hard widths | 3 | 60 | shared overflow guard pattern<br>sw/zana/kilinganisha-tv-na-streaming/index.html<br>sw/zana/kulinganisha-hosting/index.html<br>sw/zana/orodha-vifaa/index.html | `sw/zana/kilinganisha-tv-na-streaming/index.html`<br>`sw/zana/kulinganisha-hosting/index.html`<br>`sw/zana/orodha-vifaa/index.html` |
| 15 | engineering: Horizontal overflow risk from 100vw or hard widths | 2 | 50 | shared overflow guard pattern<br>engineering/afrodraft/assets/css/app.css<br>engineering/floor-planner/css/fp-3d-polish.css<br>engineering/floor-planner/css/fp-layout-access.css | `engineering/afrodraft/app.html`<br>`engineering/floor-planner/index.html` |
| 16 | matchday os: Multi-column layout stays multi-column too long | 2 | 48 | assets/css/matchday-os.css<br>shared early-collapse layout pattern<br>assets/css/matchday-navigation.css<br>assets/css/matchday-worldcup-pages.css | `matchday-os/index.html`<br>`matchday-os/share-cards/index.html` |
| 17 | tools / afropayroll os: Multi-column layout stays multi-column too long | 2 | 48 | shared early-collapse layout pattern<br>tools/afropayroll-os/index.html<br>tools/afropayroll-os/workspace.html | `tools/afropayroll-os/index.html`<br>`tools/afropayroll-os/workspace.html` |
| 18 | engineering: Multi-column layout stays multi-column too long | 2 | 46 | shared early-collapse layout pattern<br>engineering/afrodraft/assets/css/app.css<br>engineering/afrodraft/assets/css/templates.css | `engineering/afrodraft/app.html`<br>`engineering/afrodraft/index.html` |
| 19 | fr / blog: Multi-column layout stays multi-column too long | 2 | 46 | shared early-collapse layout pattern<br>fr/blog/calculer-salaire-net-senegal/index.html<br>fr/blog/salaire-moyen-rdc-2026/index.html | `fr/blog/calculer-salaire-net-senegal/index.html`<br>`fr/blog/salaire-moyen-rdc-2026/index.html` |
| 20 | fr / tools: Form controls likely below 16px | 2 | 42 | shared mobile form sizing pattern<br>assets/css/business-plan.css<br>fr/tools/contraste-couleurs/index.html | `fr/tools/contraste-couleurs/index.html`<br>`fr/tools/plan-affaires/app.html` |

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
| 12 | `/engineering/floor-planner/` | 76 | engineering | Fixed sidebar, 100vh overlay, Overflow risk |
| 13 | `/artifacts/scholarship-card-redesign/preview.html` | 72 | artifacts | Missing CSS foundation, Missing navbar, Sub-16 controls, Tap targets |
| 14 | `/audit-results/pdf-workspace-online-check/local-inline-render.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 15 | `/audit-results/pdf-workspace-online-check/render-output.html` | 66 | audit results | Viewport, Missing CSS foundation, Missing navbar |
| 16 | `/fr/tools/montant-lettres-ke/` | 66 | fr / tools | Tap targets, Late collapse, Fixed sidebar |
| 17 | `/fr/tools/projection-retraite/` | 66 | fr / tools | Tap targets, Late collapse, Fixed sidebar |
| 18 | `/fr/tools/plan-affaires/app.html` | 62 | fr / tools | Sub-16 controls, Tap targets, Custom nav/search |
| 19 | `/tools/business-plan/app.html` | 62 | tools / business plan | Sub-16 controls, Tap targets, Custom nav/search |
| 20 | `/tools/afrostream/admin.html` | 56 | tools / afrostream | Sub-16 controls, Tap targets |
| 21 | `/tools/import-duty/` | 52 | tools / import duty | Late collapse, Fixed sidebar |
| 22 | `/fr/ai/` | 48 | fr / ai | Late collapse, Fixed sidebar |
| 23 | `/fr/angola/ao-vat.html` | 48 | fr / angola | Late collapse, Fixed sidebar |
| 24 | `/fr/egypt/eg-vat.html` | 48 | fr / egypt | Late collapse, Fixed sidebar |
| 25 | `/fr/south-africa/za-vat.html` | 48 | fr / south africa | Late collapse, Fixed sidebar |
| 26 | `/fr/tanzania/tz-vat.html` | 48 | fr / tanzania | Late collapse, Fixed sidebar |
| 27 | `/fr/tools/compte-a-rebours/` | 48 | fr / tools | Late collapse, Fixed sidebar |
| 28 | `/fr/tools/cout-funerailles/` | 48 | fr / tools | Late collapse, Fixed sidebar |
| 29 | `/sw/ai/` | 48 | sw / ai | Late collapse, Fixed sidebar |
| 30 | `/fr/ghana/gh-vat.html` | 46 | fr / ghana | Late collapse, Fixed sidebar |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 343 | 7820 |
| shared 44px tap target pattern | 187 | 3774 |
| fr/tools/ajo-chama/index.html | 148 | 3398 |
| assets/css/invoice-generator.css | 144 | 3318 |
| fr/tools/assurance-auto/algeria.html | 144 | 3318 |
| assets/css/business-plan.css | 88 | 1764 |
| fr/tools/calculateur-engrais/index.html | 84 | 1680 |
| fr/tools/compresser-image/index.html | 84 | 1680 |
| tools/fuel-tracker/algeria/index.html | 54 | 1188 |
| tools/fuel-tracker/angola/index.html | 54 | 1188 |
| tools/fuel-tracker/benin/index.html | 54 | 1188 |
| assets/css/country-hub-ui-refresh.css | 52 | 1040 |

## Recommended Next-Fix Order

1. fr / tools: Multi-column layout stays multi-column too long
   144 pages / 3318 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, assets/css/invoice-generator.css, fr/tools/ajo-chama/index.html, fr/tools/assurance-auto/algeria.html
2. fr / tools: Tap targets likely below 44px
   84 pages / 1680 score; strong shared lever through shared 44px tap target pattern.
   Primary levers: shared 44px tap target pattern, assets/css/business-plan.css, fr/tools/calculateur-engrais/index.html, fr/tools/compresser-image/index.html
3. tools / fuel tracker: Multi-column layout stays multi-column too long
   54 pages / 1188 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/fuel-tracker/algeria/index.html, tools/fuel-tracker/angola/index.html, tools/fuel-tracker/benin/index.html
4. fr / tools: Fixed-width sidebar around 320px+ compresses content
   21 pages / 504 score; strong shared lever through shared sidebar collapse pattern.
   Primary levers: shared sidebar collapse pattern, fr/tools/calculateur-ielts/index.html, fr/tools/calculateur-offrande/index.html, fr/tools/calculatrice-scientifique/index.html
5. ha: Multi-column layout stays multi-column too long
   21 pages / 462 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, ha/jamb/adabi/index.html, ha/jamb/cbt/index.html, ha/jamb/crk/index.html
6. pro: Multi-column layout stays multi-column too long
   8 pages / 194 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, pro/apps/creator-studio/index.html, pro/apps/grants-tenders/index.html, pro/apps/hr/index.html
7. yo: Multi-column layout stays multi-column too long
   7 pages / 154 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, yo/awon-ise/alawus-na-nysc/index.html, yo/awon-ise/duba-genotype/index.html, yo/awon-ise/kalkuletan-jamb/index.html
8. tools / afrostream: Multi-column layout stays multi-column too long
   4 pages / 92 score; strong shared lever through shared early-collapse layout pattern.
   Primary levers: shared early-collapse layout pattern, tools/afrostream/creator.html, tools/afrostream/index.html, tools/afrostream/news.html
9. fr / tools: Horizontal overflow risk from 100vw or hard widths
   4 pages / 80 score; strong shared lever through shared overflow guard pattern.
   Primary levers: shared overflow guard pattern, fr/tools/ajo-chama/index.html, fr/tools/convertisseur-devises/index.html, fr/tools/interet-tontine/index.html
10. audit results: Missing viewport meta
   2 pages / 76 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: audit-results/pdf-workspace-online-check/local-inline-render.html, audit-results/pdf-workspace-online-check/render-output.html

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
