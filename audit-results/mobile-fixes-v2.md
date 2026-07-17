# Mobile Fixes V2

## Files Changed

- `assets/css/design-system.css`
- `assets/css/design-system.min.css`
- `assets/css/global.css`
- `assets/css/global.min.css`

## Fixes Applied

1. Added shared mobile collapse rules at `max-width: 960px` for repeated grid and workbench selectors found across localized tools, country hubs, category hubs, Pro pages, and calculator pages.
2. Added shared 44px tap-target and 16px control-text rules at `max-width: 768px` for repeated button, tab, chip, link-list, bottom-nav, and custom action selectors.
3. Added mobile form-control guardrails for common input/select/textarea selectors that were still below 16px.
4. Added table and overlay safety rules for mobile: `min-width: 0px`, `max-width: 100%`, and `100dvh` overlay minimum height companions.
5. Regenerated minified CSS with `npm run minify`, then regenerated `assets/js/components/related-tools-data.js` to avoid keeping unrelated minifier churn in generated recommendation data.

## Verification

- Before: `npm run mobile:audit` found 1,067 issue-bearing pages and 1,850 total issues.
- After: `npm run mobile:audit` found 614 issue-bearing pages and 943 total issues.
- Reduction: 453 fewer issue-bearing pages and 907 fewer total mobile issues.

## Remaining Mobile Debt

The remaining mobile audit warnings are not all safely fixable with one more global CSS rule:

- `pro` pages need shared navbar/app-shell adoption.
- Some app-like tools need local scroll-padding, table overflow, and topbar fixes.
- Five older pages still miss the shared CSS foundation.
- Thirty-six pages still miss the shared navbar foundation.
- Thirteen horizontal overflow risks remain, mostly wide tables or `100vw` app shells that need local layout review.
