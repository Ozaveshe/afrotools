# Accessibility Review V2

## Checks Run

- `node scripts/comprehensive-quality-crawl.js`
- `node scripts/tool-functionality-audit-v2.js`
- `npx playwright test tests/e2e/product-quality-v2.spec.js --workers=1`
- Dark-mode visual contrast sampling through `scripts/dark-mode-visual-audit.js`

## Fixes Applied

| File | Accessibility fix |
|---|---|
| `tools/home-loan-eligibility/index.html` | Added missing `for` links on select labels. |
| `tools/vat-calculator/index.html` | Added accessible names for generated line-item VAT type selects. |
| `agriculture/farm-budget/index.html` | Added accessible names for crop selection controls, including dynamic rows. |
| `telecom/data-usage-calc/index.html` | Added accessible names for generated quality selects. |
| `tools/car-loan/index.html` | Linked select labels to controls. |
| `tools/pdf-workspace/index.html` | Added names for icon-only zoom/download buttons. |
| `privacy/index.html` | Fixed mobile table layout to avoid horizontal overflow on policy content. |

## Current Accessibility Counters

The final comprehensive crawl still reports:

- Accessibility issues: 2,406
- Input label issues: 2,381
- Button-name issues: 22
- Iframe-title issues: 2
- Missing language attribute: 1

The 30-tool matrix now has no hard failures, but seven sampled tools still show label warnings:

- `/tools/loan-compare/`
- `/tools/profit-margin/`
- `/tools/minimum-wage/`
- `/tools/social-security/`
- `/tools/pension-projection/`
- `/tools/mobile-money-fees/`
- `/ha/kayan-aiki/kalkuletan-vat/`

## Verdict

Accessibility is improved but not release-clean. The biggest remaining opportunity is a shared form-rendering or form-postprocessor fix for generated calculators, because the crawl shows thousands of repeated label issues rather than isolated one-off mistakes.
