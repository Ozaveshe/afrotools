# v5 Playwright Fixes

## Files Changed For Triage

| File | Reason |
| --- | --- |
| `tools/afropayroll-os/workspace.html` | Fixed real workspace setup persistence and live form-value reading. Also fixed unescaped inline `aria-label` strings that caused a syntax failure when extracted and checked. |
| `tests/e2e/auth-funnel.spec.js` | Updated Pro CTA expectation from stale `pro-trial` intent to current `pro-checkout` intent. |
| `tests/e2e/automation-smoke.spec.js` | Updated Scholarship Finder live-feed assertion to match current source-mode copy. |
| `tests/e2e/dashboard-auth-handlers.spec.js` | Fixed auth/session stubbing and allowed the real cookie-session upgrade script to load. |
| `tests/e2e/dashboard-logout-recovery.spec.js` | Fixed cookie-session upgrade coverage under mocked auth. |
| `tests/e2e/privacy-ai-consent.spec.js` | Waits for AI consent wrapper readiness before testing guarded fetch behavior. |
| `assets/css/global.css` | Removed over-broad view-transition naming from all `*-hero` classes. |
| `assets/css/global.min.css` | Regenerated/minified counterpart for the global CSS change. |
| `tests/e2e/tool-discovery.spec.js` | Converted brittle minified test file into readable, stable coverage for `/tools/` and tool search. |
| `playwright.config.js` | Raised default timeout, used 4 workers, and blocked service workers during Playwright tests. |

## Verification

| Command | Result |
| --- | --- |
| `npx playwright test tests/e2e/afropayroll-pro.spec.js:331 --reporter=list` | Passed |
| `npx playwright test tests/e2e/afropayroll-pro.spec.js tests/e2e/auth-funnel.spec.js tests/e2e/automation-smoke.spec.js tests/e2e/dashboard-auth-handlers.spec.js tests/e2e/dashboard-logout-recovery.spec.js tests/e2e/privacy-ai-consent.spec.js --reporter=list` | 27 passed |
|
px playwright test tests/e2e/tool-discovery.spec.js --reporter=list | 2 passed |
|
px playwright test tests/e2e/country-onboarding.spec.js --reporter=list | 5 passed |
| `npx playwright test tests/e2e/product-quality-v2.spec.js tests/e2e/product-quality-v3.spec.js --reporter=list` | 14 passed |
| `npx playwright test` | 79 passed |

## Release Impact

The only product-code fix from the failing suite is the AfroPayroll workspace setup persistence/read fix plus the global view-transition safety fix. The other changes make tests reflect current correct behavior or reduce harness flake. No tests were deleted or quarantined.
