# Analytics-led UX review — 16 September 2026

## Evidence and priority

Read directly from the authenticated Google Analytics Pages and screens report for
AfroTools / afrotools.com (property 528083834). Period: 19 August–15 September 2026,
All Users, 100% available data. These are page views, not completed tool uses.

| Page | Views | Active users |
| --- | ---: | ---: |
| Homepage | 297 | 94 |
| Market Day Finder | 106 | 96 |
| Ghana amount-to-words | 90 | 58 |
| Naira-to-words | 86 | 26 |
| PDF category | 53 | 18 |
| Lobola calculator | 53 | 43 |
| Uganda PAYE | 53 | 42 |
| Salary and tax category | 45 | 35 |
| AFCON predictor | 35 | 26 |
| AI front door | 34 | 22 |

Site totals: 3,984 views and 1,820 active users. Report lists 1,008 page paths.
No device segment, funnel, session recording, or completion-event definition was
verified. Short engagement can indicate success on a quick-answer tool. No
conversion uplift or causal conclusion is claimed.

The first implementation batch covers the three highest-view individual tools.
Homepage and PDF discovery received a separate preceding design pass.

## Observed friction and changes

- At a 390 × 844 browser viewport, the live Market Day Finder answer heading was
  approximately 2,483px down the page. Long introductory content, a reference
  table, and a mobile sidebar placed above the tool delayed the answer.
- The live Ghana amount input was approximately 1,809px down the page. A second
  quick-answer block and examples preceded the calculator. Optional document
  fields separated amount entry from results.
- Both converters now place their reference tables below the working tool.
  Native expandable sections hold optional document details, text style, and
  review breakdowns. Their existing labels, fields, defaults, and calculations
  remain available.
- Market Day Finder has a concise introduction, with the reference anchor and
  explanation retained below the tool. Its mobile sidebar follows the calculator.
- Scoped CSS improves form text size, touch targets, focus outlines, result
  readability, and theme-aware surfaces. A shared mobile selector accidentally
  treating `selected-day-name` as a select control is overridden on this page.
- Ghana's visible result now respects the selected text case instead of forcing
  uppercase through CSS.
- SEO block ownership remains in `data/seo/priority-pages.json` and
  `scripts/build-seo-system.js`. Opt-in relocation survives regeneration; optional
  route arguments allow a focused rebuild without changing other priority pages.

Local after measurements at 390px: Market Day Finder answer heading approximately
444px down; Ghana amount input approximately 463px down. These are rendered
positions, not load-time or human task-completion measurements.

## Validation

- PASS: `node tests/amount-words-input.test.js` — four tests, including exact
  rounding, malformed input, and real-page wording for both converters.
- PASS: `node tests/market-days-engine.test.js` — reference dates, time zones,
  market filtering, and directory/source coverage.
- PASS: `node --check scripts/build-seo-system.js`.
- PASS: targeted three-route SEO regeneration and a second byte-identical run.
- PASS: `npm run check-links` — 141,825 internal links across 11,792 HTML files.
- PASS: `npm run seo:report` — no missing canonicals, titles, descriptions,
  remaining hreflang violations, or automatic fixes needed.
- PASS: `git diff --check`; no deleted files.
- Browser: all three routes checked at 320px and 1280px without document overflow;
  Market Day Finder and Ghana converter additionally checked at 390px.
- Browser: date selection (1 January 2026 → Orie), market search (Emene → one
  result), amount conversion, invalid negative input, copy status, clear behavior,
  keyboard expansion, and Ghana title-case output verified with synthetic inputs.
- Browser: Market Day Finder and Ghana converter checked visually in light and
  dark mode. No captured console errors on the exercised local routes.

This is local browser evidence, not a physical-device or all-browser matrix.
No production deployment or post-release analytics measurement is included.
Full deploy build and artifact/security audits are deferred to a release pass.

## Safety and scope

Calculation engines, date anchor, routes, canonicals, account gates, and analytics
event names were not changed. Sensitive document fields remain local; no new
network calls, storage, or telemetry were added. Existing SEO examples remain
server-rendered. Generated quick-answer blocks were regenerated through their
owner. Localized pages were not changed.

Base: `6183e6395a8168a55fdb1c1591113c368179edac` on isolated branch
`codex/analytics-ux-20260916`. Canonical checkout preserved.

## Recommended next UX batch

1. Uganda PAYE: inspect the salary-entry → take-home-pay → assumptions journey,
   particularly the visibility of the result and gross/net terminology.
2. Lobola calculator: inspect how assumptions and cultural variation are explained
   alongside the estimate, and whether users can revise inputs easily.
3. PDF and salary category hubs: inspect search → tool selection handoffs against
   the previous design changes before making further changes.
4. Review completion-event definitions before judging success from GA key events.
   After release, compare equivalent periods and device segments; do not use
   longer engagement as the goal for quick-answer utilities.

Rollback: revert this scoped UX change; no database migration or feature flag.
