# Mobile Audit Workflow

Use `node scripts/mobile-audit.js` to build a repo-wide mobile risk audit without editing page sources.

## Outputs

- `reports/mobile-audit.json`
- `reports/mobile-audit.md`

## Scope

- Scans public HTML pages and their linked local CSS and JS.
- Excludes hidden/system folders, generated deploy artifacts such as `dist`, `node_modules`, `tests`, `docs`, `scripts`, `reports`, and generated body partials such as `lang/pages/**/fr.body.html`.
- Treats widget iframes and app-like tool subviews differently from full pages so missing shared navbar usage is not over-reported on intentional utility shells.

## Current Heuristics

- Missing viewport meta
- Form controls likely below `16px`
- Tap targets likely below `44px`
- Multi-column layouts that collapse too late
- Fixed sidebars around `320px+`
- Overlay or drawer usage of `100vh` without `100dvh` or safe-area handling
- Horizontal overflow risks from `100vw`, `min-width`, or hard widths
- Missing shared CSS foundation usage
- Missing shared navbar usage on full pages
- Custom mobile nav/search shells
- Sticky or fixed headers without scroll-padding compensation

## Reading The Report

- Start with the top issue clusters in `reports/mobile-audit.md`.
- Use the shared levers section to find CSS or page-family changes that unlock the most surfaces.
- Use the worst-files list only after a shared fix path is clear.

## Limits

- This is a static source audit, not a browser render audit.
- Scores are heuristic and should guide prioritization, not replace manual mobile spot-checks on the highest-risk clusters.
