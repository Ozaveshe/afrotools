# AfroTools Comprehensive Audit Summary

Generated: 2026-05-19T20:43:14.114Z

## Crawl Totals

- Sitemap URLs discovered: 7439
- Source HTML files discovered: 8501
- Unique routes discovered: 8501
- Pages audited: 8501
- Broken pages: 0
- Broken internal links: 0
- Broken images: 0
- Metadata issues: 3354
- Accessibility issues: 0
- Dark-mode risks: 456
- Copy-quality issues: 135
- Mobile issues: 988
- Render risks: 0

## Top Issue Types

| Issue | Count |
| --- | ---: |
| hard_wide_css | 986 |
| description_length | 935 |
| missing_h1 | 666 |
| title_length | 531 |
| missing_og_description | 343 |
| missing_twitter_card | 313 |
| missing_description | 275 |
| many_inline_light_backgrounds | 185 |
| many_inline_dark_text_colors | 179 |
| missing_og_image | 112 |
| no_dark_mode_loader_signal | 92 |
| missing_og_title | 91 |
| multiple_h1 | 85 |
| placeholder_copy | 76 |
| jargon_copy | 36 |
| mojibake_signal | 23 |
| 100vw_overflow_risk | 2 |
| missing_canonical | 2 |
| invalid_json_ld | 1 |

## Highest-Signal Pages

| Route | Metadata | A11y | Dark | Copy | Mobile | Broken links |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/sw/botswana/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/eswatini/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/lesotho/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/mozambique/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/namibia/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/tools/` | 4 | 0 | 2 | 0 | 1 | 0 |
| `/sw/zimbabwe/` | 4 | 0 | 2 | 1 | 0 | 0 |
| `/sw/algeria/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/angola/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/burundi/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/cameroon/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/cote-divoire/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/kenya/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/libya/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/malawi/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/mali/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/rwanda/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/senegal/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/tanzania/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/tunisia/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/uganda/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/sw/zambia/` | 4 | 0 | 2 | 0 | 0 | 0 |
| `/tools/doc-generator/generate` | 5 | 0 | 0 | 0 | 1 | 0 |
| `/jobs/salary-benchmarks/` | 5 | 0 | 0 | 0 | 0 | 0 |
| `/start/` | 4 | 0 | 0 | 0 | 1 | 0 |
| `/tools/afropayroll-os/flow` | 4 | 0 | 0 | 0 | 1 | 0 |
| `/tools/car-import-cost/ghana/` | 5 | 0 | 0 | 0 | 0 | 0 |
| `/tools/car-import-cost/uganda/` | 5 | 0 | 0 | 0 | 0 | 0 |
| `/tools/car-import-cost/zambia/` | 5 | 0 | 0 | 0 | 0 | 0 |
| `/tools/compliance-calendar/calendar` | 4 | 0 | 0 | 0 | 1 | 0 |

## Notes

- This is a static source crawl. It complements `npm run check-links`, `npm run seo:report`, and browser smoke tests.
- Dark-mode and mobile findings are risk signals from source, not computed-pixel failures.
- Copy findings are intentionally conservative and should be fixed at shared source/templates first.
