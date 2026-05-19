# AfroTools Comprehensive Audit Summary

Generated: 2026-05-18T18:30:04.924Z

## Crawl Totals

- Sitemap URLs discovered: 7439
- Source HTML files discovered: 8501
- Unique routes discovered: 8501
- Pages audited: 8501
- Broken pages: 0
- Broken internal links: 0
- Broken images: 0
- Metadata issues: 3356
- Accessibility issues: 2632
- Dark-mode risks: 456
- Copy-quality issues: 137
- Mobile issues: 988
- Render risks: 0

## Top Issue Types

| Issue | Count |
| --- | ---: |
| input_label | 2604 |
| hard_wide_css | 986 |
| description_length | 937 |
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
| jargon_copy | 38 |
| button_name | 25 |
| mojibake_signal | 23 |
| 100vw_overflow_risk | 2 |
| iframe_title | 2 |

## Highest-Signal Pages

| Route | Metadata | A11y | Dark | Copy | Mobile | Broken links |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/tools/japa-calculator/` | 0 | 23 | 0 | 0 | 0 | 0 |
| `/tools/property-tax/` | 1 | 20 | 0 | 0 | 1 | 0 |
| `/tools/business-plan-builder/` | 1 | 18 | 0 | 0 | 1 | 0 |
| `/tools/ng-nhf/` | 1 | 17 | 0 | 0 | 1 | 0 |
| `/tools/side-hustle-ranker/` | 1 | 17 | 0 | 0 | 0 | 0 |
| `/tools/creator-kit/app` | 0 | 17 | 0 | 0 | 0 | 0 |
| `/tools/creator-team/app` | 1 | 16 | 0 | 0 | 0 | 0 |
| `/tools/creator-club/app` | 2 | 14 | 0 | 0 | 0 | 0 |
| `/tools/rental-agreement/` | 1 | 14 | 0 | 0 | 1 | 0 |
| `/tools/afrostream/admin` | 2 | 13 | 0 | 0 | 0 | 0 |
| `/pro/apps/books/` | 0 | 13 | 0 | 0 | 1 | 0 |
| `/tools/personal-brand-audit/` | 0 | 14 | 0 | 0 | 0 | 0 |
| `/tools/scholarship-finder/` | 0 | 13 | 0 | 0 | 1 | 0 |
| `/sw/zana/kikokotoo-mfuko-wa-nyumba/` | 0 | 12 | 0 | 0 | 1 | 0 |
| `/tools/creator-course/app` | 2 | 11 | 0 | 0 | 0 | 0 |
| `/tools/malaria-risk/` | 0 | 13 | 0 | 0 | 0 | 0 |
| `/tools/proforma-invoice/` | 0 | 12 | 0 | 0 | 1 | 0 |
| `/fr/tools/calculateur-japa/` | 0 | 11 | 1 | 0 | 0 | 0 |
| `/tools/afrostream/community` | 2 | 10 | 0 | 0 | 0 | 0 |
| `/tools/creator-mail/app` | 2 | 10 | 0 | 0 | 0 | 0 |
| `/tools/debt-snowball/` | 0 | 12 | 0 | 0 | 0 | 0 |
| `/tools/employment-contract/` | 2 | 9 | 0 | 0 | 1 | 0 |
| `/tools/event-decoration-cost/` | 4 | 8 | 0 | 0 | 0 | 0 |
| `/tools/passport-photo/` | 2 | 10 | 0 | 0 | 0 | 0 |
| `/tools/rent-affordability/` | 2 | 9 | 0 | 0 | 1 | 0 |
| `/tools/side-hustle-tax/` | 1 | 10 | 0 | 0 | 1 | 0 |
| `/tools/tenancy-agreement/` | 2 | 9 | 0 | 0 | 1 | 0 |
| `/tools/art-commission/` | 4 | 7 | 0 | 0 | 0 | 0 |
| `/tools/building-materials/` | 2 | 9 | 0 | 0 | 0 | 0 |
| `/tools/diabetes-risk/` | 0 | 10 | 0 | 0 | 1 | 0 |

## Notes

- This is a static source crawl. It complements `npm run check-links`, `npm run seo:report`, and browser smoke tests.
- Dark-mode and mobile findings are risk signals from source, not computed-pixel failures.
- Copy findings are intentionally conservative and should be fixed at shared source/templates first.
