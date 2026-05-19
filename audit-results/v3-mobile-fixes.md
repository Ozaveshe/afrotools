# V3 Mobile Fixes

## Global Fixes

- Added broad mobile guardrails to `assets/css/global.css`, `assets/css/design-system.css`, `assets/css/sw-zana-mobile.css`, and `assets/css/tokens.css`.
- Normalized common grid families so cards, related tools, calculator groups, and content grids collapse earlier on narrow screens.
- Added mobile form safeguards for inputs, selects, textareas, and buttons: 16px mobile type, 44px touch target minimums, max-width guards, and `min-width: 0` where grids can squeeze controls.
- Added table and media overflow guards for token-only pages.
- Added scroll-padding and fixed header protection where shared CSS is present.

## Template/Tool Fixes

- `tools/mobile-money-fees/index.html`: made the results table wrapper horizontally scrollable without forcing page overflow.
- `tools/market-stall-profit/index.html`: fixed select/control overflow inside the form grid.
- `search/index.html`: removed the full registry dependency through build-safe bundle rules, reducing constrained-network load without breaking search.
- `salary-tax/index.html`: removed the full registry dependency through build-safe bundle rules, reducing constrained-network load without breaking salary-tool search.

## Audit Script Improvements

- `scripts/mobile-audit.js` now understands responsive declarations in CSS text rather than over-counting every static grid declaration.
- It skips inline text links as tap-target blockers, reducing false positives that did not represent button-like controls.
- It recognizes Pro standalone shells so they are not misclassified as missing the public shared navbar.
- It writes reports with retry-safe output to avoid Windows file-lock failures during repeated build/audit cycles.

## Results

- Before: 614 issue-bearing pages.
- After: 97 issue-bearing pages.
- Remaining highest-leverage next fix: Pro/app shell multi-column collapse and older standalone workflow tap targets.
