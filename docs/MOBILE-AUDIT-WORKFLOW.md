# Mobile Audit Workflow

Use `node scripts/mobile-audit.js` to build a repo-wide mobile risk audit without editing page sources.

## Outputs

- `reports/mobile-audit.json`
- `reports/mobile-audit.md`
- `reports/mobile-network-smoke.json`
- `reports/mobile-network-smoke.md`

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
- Treat widget iframe search and filter controls as embedded utility controls, not full shared-navbar debt, unless they also carry real nav, drawer, or menu chrome.

## Network Smoke

Use `npm run mobile:network` after shared mobile changes to test a small representative route set with the `africa-mobile` profile:

- `900 Kbps` download
- `350 Kbps` upload
- `220ms` round-trip latency
- `4x` CPU throttle
- `390px` mobile viewport

This is a local browser smoke, not a carrier field measurement. Use it to catch oversized mobile architecture, horizontal overflow, sub-16px controls, and slow first-render risks before doing analytics-led follow-up.

## Search Route Performance

- Keep `/search/` on the lightweight `data/search-index.json` feed instead of the full `assets/js/components/tool-registry.min.js` bundle.
- Regenerate the index with `node scripts/build-search-index.js`; `npm run build`, `npm run tools:directory`, and `npm run counts:sync` already include it.
- For an empty `/search/` landing page, keep useful default content visible before hydration. Load the index immediately only for query/filter states or after the first user search interaction.

## Salary And Tax Performance

- Keep `/salary-tax/` and the salary-tax subhubs on `data/salary-tax-index.json` through `assets/js/salary-tax-data-loader.js`, not the full registry bundle.
- Regenerate the index with `node scripts/build-salary-tax-index.js`; `npm run build`, `npm run tools:directory`, and `npm run counts:sync` include it.
- The top-level `/salary-tax/` route should hydrate the index only after search interaction or post-load idle. Subhubs can fetch it immediately because their route-specific grid is primary content.
- Keep below-fold related-tool payloads and external analytics off the critical path on salary detail routes. Use the lazy loaders before reintroducing large shared data files in the head.

## Limits

- This is a static source audit, not a browser render audit.
- Scores are heuristic and should guide prioritization, not replace manual mobile spot-checks on the highest-risk clusters.
