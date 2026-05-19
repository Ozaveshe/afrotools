# Mobile Root Cause Analysis V2

## Audit Baseline

- Command: `npm run mobile:audit`
- Pages audited: 8,461
- Issue-bearing pages before fixes: 1,067
- Total mobile issues before fixes: 1,850

## Root Cause Groups Before Fixes

| Issue | Before count | Main repeated cause | Example families |
|---|---:|---|---|
| Multi-column layout stays multi-column too long | 706 | Page-specific grids collapsed at 480-640px or did not define a mobile single-column rule. | `sw/zana`, `fr/tools`, `yo`, `pro`, `telecom`, `crypto` |
| Tap targets likely below 44px | 507 | Button/link selectors used small vertical padding or 14-15px control text. | country hubs, French tools, Pro apps, shared card links |
| Form controls likely below 16px | 269 | Inputs, selects, tabs, and custom button classes used sub-16px mobile text. | Swahili tools, dashboard, crypto tools, PDF/document tools |
| Custom mobile nav/search pattern | 189 | Pages with custom topbar/search/filter UI do not use the shared navbar foundation. | `pro`, creator shells, business/jobs/lifestyle clusters |
| Fixed sidebar around 320px+ | 120 | Two-column app/workbench shells kept 330-390px sidebars too long. | French tools, Swahili/Yoruba tools, property tools |
| Horizontal overflow risk | 13 | Wide tables, `100vw`, or hard fixed widths lacked mobile overflow guards. | Pro tables, Swahili comparison pages, engineering app shell |
| Missing shared navbar/foundation | 36 / 5 | Older standalone pages still bypass shared shell files. | Pro apps, selected French tools/blog pages, selected religious tools |

## High-Leverage Fix Strategy

The first safe repair target was shared CSS, because most affected pages already load either:

- `assets/css/design-system.css`
- `assets/css/design-system.min.css`
- `assets/css/global.css`
- `assets/css/global.min.css`

The fix added token-based mobile guardrails for repeated grid, form, button, link, sidebar, table, and overlay patterns instead of hand-editing individual generated pages.

## Remaining Root Causes After Fixes

- 614 pages still have at least one mobile warning after the shared CSS repair.
- Remaining warnings are concentrated in pages that do not fully use the shared navbar/foundation, Pro app shells, specialized French/Swahili tool templates, and custom app-like pages.
- Further reduction is still possible, but should be handled by adopting shared navbar/app-shell components in those families rather than adding increasingly broad CSS rules.

## Before/After Counts

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Pages audited | 8,461 | 8,461 | 0 |
| Issue-bearing pages | 1,067 | 614 | -453 |
| Total mobile issues | 1,850 | 943 | -907 |
| Multi-column collapse issues | 706 | 386 | -320 |
| Tap target issues | 507 | 224 | -283 |
| Sub-16 form/control issues | 269 | 88 | -181 |
| Fixed sidebar issues | 120 | 14 | -106 |
| Custom nav/search issues | 189 | 173 | -16 |
| Horizontal overflow risks | 13 | 13 | 0 |
| Missing shared navbar | 36 | 36 | 0 |
| Missing shared foundation CSS | 5 | 5 | 0 |

## Next Mobile Work

1. Move Pro app pages to a shared Pro mobile shell or shared navbar-compatible header.
2. Add shared foundation CSS/navbar to the five missing-foundation pages.
3. Repair the engineering/afrodraft and app-like tool shells with local overflow and scroll-padding fixes.
4. Create family CSS for remaining French tools and Swahili `zana` workbench pages.
5. Browser-test the highest-score pages at 360px and 390px before broadening any more global CSS.
