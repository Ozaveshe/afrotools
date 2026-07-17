# V3 Mobile Root Cause Analysis

## Before

- Command: `npm run mobile:audit`
- Evidence: `audit-results/v3-mobile-before.txt`, `audit-results/v3-mobile-before.csv`, `audit-results/v3-mobile-before.md`
- Pages audited: 8461
- Issue-bearing pages: 614
- Total issues: 943

Top root causes before fixes:

- `late_multicolumn_collapse`: 386 pages
- `tap_targets_below_44`: 224 pages
- `custom_mobile_nav_search`: 173 pages
- `sub16_form_controls`: 88 pages
- `missing_shared_navbar`: 36 pages
- `fixed_sidebar_320plus`: 14 pages
- `horizontal_overflow_risk`: 13 pages

## After

- Command: `npm run mobile:audit`
- Evidence: `audit-results/v3-final-mobile-audit.txt`, `audit-results/v3-final-mobile-audit.md`, `audit-results/v3-final-mobile-audit.csv`, `audit-results/v3-final-mobile-audit.json`
- Pages audited: 8461
- Issue-bearing pages: 97
- Total issues: 148
- Reduction: 614 to 97 issue-bearing pages

Remaining root causes:

| Issue type | Remaining count | Release impact |
|---|---:|---|
| `late_multicolumn_collapse` | 58 | Mostly Pro/app shells and standalone workflows. Low to medium risk, not core public calculator blocking. |
| `tap_targets_below_44` | 33 | Mostly isolated app shells and older standalone tools. Needs follow-up, but reusable calculator controls are not the blocker. |
| `horizontal_overflow_risk` | 13 | No known critical horizontal overflow on core templates after browser tests. Remaining static risks are isolated families. |
| `sub16_form_controls` | 12 | Remaining debt is isolated; core calculator test coverage now checks labelled mobile controls. |
| `missing_shared_navbar` | 12 | Mainly legacy/French country PAYE or standalone pages, not newly broken by v3. |
| `custom_mobile_nav_search` | 7 | Older app shell pattern. |
| `missing_shared_foundation_css` | 5 | Legacy standalone pages. |
| `fixed_header_without_scroll_padding` | 4 | Older app shells. |
| `fixed_sidebar_320plus` | 4 | Older standalone pages. |

## Highest Remaining Clusters

- `pro`: multi-column layouts stay multi-column too long, 7 pages.
- `tools/afrostream`: multi-column layouts stay multi-column too long, 3 pages.
- `sw/zana`: 100vw or hard-width overflow risk, 3 pages.
- `fr/tools`: multi-column layouts stay multi-column too long, 2 pages.
- `tools/contract-generator`: tap target debt, 2 pages.
- `pro`: hard-width overflow risk, 2 pages.
- French country PAYE pages: missing shared navbar foundation, 2 pages.

## Release Interpretation

The dedicated mobile audit is now below the preferred 100-page threshold. There are 0 known critical horizontal overflow issues on core templates and 0 known unreadable mobile form/result sections on the core calculators covered by Playwright.
