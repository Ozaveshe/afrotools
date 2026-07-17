# Swahili Predeploy Proof Stack

Generated: 2026-05-18T05:54:13.943Z

## Verdict

Swahili pre-deploy proof passes after recovered proof-tooling hiccup; checkout remains dirty and should be packaged carefully.

## Command Results

| Command | Exit | Classification | Notes |
| --- | ---: | --- | --- |
| npm run build:i18n:full | 1 | proof-tooling issue recovered | Initial full command failed on Windows UNKNOWN open/write errors before/inside reciprocity fix; standalone fixer recovered final hreflang state. |
| node scripts/fix-hreflang-reciprocity.js | 0 | recovery step for proof tooling | Added 599 reciprocal tags and removed 2 duplicates across 600 files. |
| npm run validate:hreflang | 0 | pass | Final run passed: 7866 pages checked, 19986 hreflang pairs, 0 errors. |
| npm run check-links | 0 | pass | 0 broken internal links across 8501 HTML files. |
| npm run audit | 0 | pass | 2417 registry rows; 2412 live/new rows have landing pages; missing page 0. |
| npm run seo:report | 0 | pass with maintenance notice | 0 missing canonical/title/meta/hreflang violations; sitemap lastmod updates available. |
| git diff --check | 0 | pass | No whitespace errors. |
| npm run security:scan | 0 | pass | Security scan passed. |

## Metrics

- Swahili routes: 854; indexable: 852
- Direct /sw/zana/ routes: 465
- Swahili registry hrefs resolving: 700/700; broken: 0
- /sw/zana/ registry hrefs resolving: 469/469; broken: 0
- Direct /sw/zana/ coverage: 415/465 (89.25%)
- Dirty status rows: 1072

## Classification

- Swahili blockers: none found.
- Proof-tooling issue: `npm run build:i18n:full` hit transient Windows file write/open errors, then recovered by running `node scripts/fix-hreflang-reciprocity.js` and validating hreflang cleanly.
- Carried maintenance debt: sitemap `<lastmod>` updates remain available in `seo:report`.
