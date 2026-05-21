# v7 HTML cache-bust analysis

- HTML files changed (name-only): 7942
- HTML files parsed from patch: 7941
- Cache-bust-only global CSS diffs: 7940 (corrected for BOM-prefixed 404.html name-list entry)
- global.min.css cache-bust diffs: 7889
- global.css non-min cache-bust-only diffs: 50
- Non-cache-bust outliers: 2
- Outlier files: `tools/cv-builder/index.html`, `tools/study-abroad-cost/index.html`

## Version patterns

- global.min.css versions observed: 98898086 (7891), e7ad73c8 (7891)
- global.css versions observed: 4b86b610 (50), 8ba19bad (50)

## Samples

| Path | Changed | Cache-bust only | Before | After | Non-cache sample |
|---|---:|---:|---|---|---|
| index.html | yes | yes | global.min=98898086 | global.min=e7ad73c8 | - |
| tools/vat-calculator/index.html | yes | yes | global.min=98898086 | global.min=e7ad73c8 | - |
| tools/unit-converter/index.html | no | n/a | - | - | - |
| financial/index.html | no | n/a | - | - | - |
| sw/zana/index.html | no | n/a | - | - | - |
| nigeria/index.html | yes | yes | global.min=98898086 | global.min=e7ad73c8 | - |
| privacy/index.html | yes | yes | global.min=98898086 | global.min=e7ad73c8 | - |
| 404.html | no | n/a | - | - | - |
| tools/cv-builder/index.html | yes | no | global.min=98898086 | global.min=e7ad73c8 | <link rel="stylesheet" href="/assets/css/global.min.css?v=e7ad73c8"> / <link rel="stylesheet" href="/tools/cv-builder/css/cv-layout-decongestion.css?v=e98749ac"> / <script src="/tools/cv-builder/js/cv-sponsors.js?v=f5192b90"></script> / <script src="/tools/cv-builder/js/cv-layout-decongestion.js?v=ada43aac"></script> / <link rel="stylesheet" href="/assets/css/global.min.css?v=98898086"> / <script src="/tools/cv-builder/js/cv-sponsors.js?v=b1b570f7"></script> |
| tools/study-abroad-cost/index.html | yes | no | global.min=98898086 | global.min=e7ad73c8 | <title>Study Abroad Cost Calculator for African Students 2026 \| AfroTools</title> / <meta name="description" content="Estimate tuition, living costs, visa fees, setup costs, funding gaps, and source confidence across 100 study abroad destinations. Use as a planning estimate and confirm final figures from official sources."> / <meta property="og:title" content="Study Abroad Cost Calculator for African Students \| AfroTools"> / <meta property="og:description" content="Estimate study abroad costs, funding gaps, and destination confidence across 100 planning routes, then move into scholarships and official-source checks."> / <meta name="twitter:title" content="Study Abroad Cost Calculator for African Students \| AfroTools"> / <meta name="twitter:description" content="Estimate study abroad costs, funding gaps, and destination confidence across 100 planning routes, then move into scholarships and official-source checks."> / <link rel="stylesheet" href="/assets/css/global.min.css?v=e7ad73c8"> / <link rel="stylesheet" href="study-abroad-conversion-layer.css?v=9890a8f2"> / <script src="study-abroad-conversion-layer.js?v=a164d701" defer></script> / <script src="study-abroad-conversion-auto.js?v=680e8ea3" defer></script> |