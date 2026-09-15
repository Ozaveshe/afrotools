# Mobile Audit

Generated: 2026-09-15T16:17:45.197Z

## Scope

- HTML pages audited: 3
- Pages with issues: 2
- Pages without issues: 1
- Pages using shared CSS foundation: 3
- Pages using shared navbar: 3

## Top 20 Highest-Leverage Issue Clusters

| # | Cluster | Pages | Score | Shared levers | Sample pages |
| --- | --- | ---: | ---: | --- | --- |
| 1 | document pdf: Multi-column layout stays multi-column too long | 1 | 26 | document-pdf/index.html<br>shared early-collapse layout pattern | `document-pdf/index.html` |
| 2 | Root pages: Multi-column layout stays multi-column too long | 1 | 24 | assets/css/homepage-hero.css<br>assets/css/homepage-refine.css<br>shared early-collapse layout pattern | `index.html` |

## Top 30 Worst Files/Templates

| # | Route | Score | Family | Issues |
| --- | --- | ---: | --- | --- |
| 1 | `/document-pdf/` | 26 | document pdf | Late collapse |
| 2 | `/` | 24 | Root pages | Late collapse |
| 3 | `/tools/naira-to-words/` | 0 | tools / naira to words |  |

## Shared Files Or Patterns That Fix The Most Pages

| Lever | Pages | Score |
| --- | ---: | ---: |
| shared early-collapse layout pattern | 2 | 50 |
| document-pdf/index.html | 1 | 26 |
| assets/css/homepage-hero.css | 1 | 24 |
| assets/css/homepage-refine.css | 1 | 24 |

## Recommended Next-Fix Order

1. document pdf: Multi-column layout stays multi-column too long
   1 pages / 26 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: document-pdf/index.html, shared early-collapse layout pattern
2. Root pages: Multi-column layout stays multi-column too long
   1 pages / 24 score; repeated family pattern worth fixing before one-off pages.
   Primary levers: assets/css/homepage-hero.css, assets/css/homepage-refine.css, shared early-collapse layout pattern

## Assumptions And Blind Spots

- This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.
- Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.
- Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.
- Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.
- Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.
