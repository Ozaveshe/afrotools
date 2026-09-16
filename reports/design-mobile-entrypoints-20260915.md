# Mobile Audit

Generated: 2026-09-15T16:23:21.417Z

## Scope

- HTML pages audited: 7
- Pages with issues: 4
- Pages without issues: 3
- Pages using shared CSS foundation: 7
- Pages using shared navbar: 7

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | nigeria: Multi-column layout stays multi-column too long | 1 | 28 | assets/css/country-intelligence-hub.css<br>shared early-collapse layout pattern | `nigeria/index.html` |
| 2 | fr / index.html: Multi-column layout stays multi-column too long | 1 | 26 | assets/css/fr-homepage.css<br>shared early-collapse layout pattern | `fr/index.html` |
| 3 | sw / index.html: Multi-column layout stays multi-column too long | 1 | 26 | assets/css/fr-homepage.css<br>shared early-collapse layout pattern | `sw/index.html` |
| 4 | tools / index.html: Multi-column layout stays multi-column too long | 1 | 22 | shared early-collapse layout pattern<br>tools/index.html | `tools/index.html` |
| 5 | fr / index.html: Tap targets likely below 44px | 1 | 20 | assets/css/fr-homepage.css<br>shared 44px tap target pattern | `fr/index.html` |
| 6 | nigeria: Tap targets likely below 44px | 1 | 20 | assets/css/country-hub-ui-refresh.css<br>shared 44px tap target pattern | `nigeria/index.html` |
| 7 | sw / index.html: Tap targets likely below 44px | 1 | 20 | assets/css/fr-homepage.css<br>shared 44px tap target pattern | `sw/index.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/nigeria/` | 48 | nigeria | Tap targets, Late collapse |
| 2 | `/fr/` | 46 | fr / index.html | Tap targets, Late collapse |
| 3 | `/sw/` | 46 | sw / index.html | Tap targets, Late collapse |
| 4 | `/tools/` | 22 | tools / index.html | Late collapse |
| 5 | `/ha/` | 0 | ha |  |
| 6 | `/salary-tax/` | 0 | salary tax |  |
| 7 | `/yo/` | 0 | yo |  |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 4 | 102 |
| assets/css/fr-homepage.css | 4 | 92 |
| shared 44px tap target pattern | 3 | 60 |
| assets/css/country-intelligence-hub.css | 1 | 28 |
| tools/index.html | 1 | 22 |
| assets/css/country-hub-ui-refresh.css | 1 | 20 |

## Recommended Next-Fix Order

1. nigeria: Multi-column layout stays multi-column too long
   1 pages / 28 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/country-intelligence-hub.css, shared early-collapse layout pattern
2. fr / index.html: Multi-column layout stays multi-column too long
   1 pages / 26 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/fr-homepage.css, shared early-collapse layout pattern
3. sw / index.html: Multi-column layout stays multi-column too long
   1 pages / 26 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/fr-homepage.css, shared early-collapse layout pattern
4. tools / index.html: Multi-column layout stays multi-column too long
   1 pages / 22 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: shared early-collapse layout pattern, tools/index.html
5. fr / index.html: Tap targets likely below 44px
   1 pages / 20 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/fr-homepage.css, shared 44px tap target pattern
6. nigeria: Tap targets likely below 44px
   1 pages / 20 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/country-hub-ui-refresh.css, shared 44px tap target pattern
7. sw / index.html: Tap targets likely below 44px
   1 pages / 20 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/fr-homepage.css, shared 44px tap target pattern

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
