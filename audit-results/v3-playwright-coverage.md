# V3 Playwright Product Coverage

## Before

- Product-quality suite: 6 tests.
- Coverage was useful but thin for the release blocker criteria.

## After

Command:

`npx playwright test tests/e2e/product-quality-v2.spec.js tests/e2e/product-quality-v3.spec.js --reporter=line`

Evidence:

- `audit-results/v3-final-playwright-product-quality.txt`

Result:

- 14 tests passed.
- 0 failed.
- Runtime: 16.2s.

## Files

- `tests/e2e/product-quality-v2.spec.js`
- `tests/e2e/product-quality-v3.spec.js`

## Flows Covered

- Homepage render, mobile navigation, dark mode.
- VAT empty state and normal calculation.
- English and Swahili unit converters.
- Nigeria salary calculator.
- Finance, property, business, and health representative calculators.
- Category, search, policy, and 404 pages.
- Search flow without full registry payload.
- Salary hub search without full registry payload.
- Mobile money fee comparison on a phone viewport.
- Market-stall business calculator profit summary.
- Rent-vs-buy and rent-affordability mobile result views.
- Swahili localized tool labelled controls.
- Dark VAT calculator readable form/result section.
- Representative content/error pages with no console errors and no mobile overflow.

## Remaining Untested High-Risk Flows

- Auth/session/dashboard flows.
- Pro app workflows beyond static/mobile smoke.
- Live Supabase-backed data flows.
- Payment/account upgrades.
- Runtime axe checks for modal/focus states.
- Real mobile device or carrier-network tests.
