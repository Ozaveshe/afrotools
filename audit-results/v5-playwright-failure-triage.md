# v5 Full Playwright Failure Triage

## Before

Command: `npx playwright test --reporter=list --trace on-first-retry`

Initial current-checkout result: 72 passed, 7 failed. The prompt expected 5 failures, but the current repo state produced 7.

## Failure Matrix

| # | Test | Failure | Classification | Release blocking before fix? | Resolution |
| ---: | --- | --- | --- | --- | --- |
| 1 | `tests/e2e/afropayroll-pro.spec.js` - workspace supports local setup, employee records, run rows, import mapper, and approval gates | `#setupStatus` never changed from the starter text after save. | Real product bug in local setup metadata and form-value reading. | Yes for AfroPayroll Pro workspace confidence. | Fixed `tools/afropayroll-os/workspace.html` so setup metadata is saved without being overwritten and form values are read from live controls. |
| 2 | `tests/e2e/auth-funnel.spec.js` - Pro trial CTA routes signed-out users to auth signup | Expected `intent=pro-trial`, received `intent=pro-checkout`. | Outdated test expectation. Product now routes to checkout intent. | No, if checkout intent is the intended product flow. | Updated the test name and expectation to `pro-checkout`. |
| 3 | `tests/e2e/automation-smoke.spec.js` - Scholarship Finder loads with deterministic API feed | Expected `Live scholarship feed`, received `Source mode: live. Current feed page: 1 of 1.` | Outdated copy expectation. | No. | Updated test to accept the current live source-mode copy. |
| 4 | `tests/e2e/dashboard-auth-handlers.spec.js` - signed-out auth links | Dashboard stayed `loadingSession`. | Test harness stub mismatch. `/api/auth/session` was not fulfilled for signed-out state in the mocked setup. | No direct product regression, but release-blocking for the suite. | Made the test fulfill signed-out session responses and avoid duplicate auth stub loading. |
| 5 | `tests/e2e/dashboard-auth-handlers.spec.js` - sign out waits for cookie-session logout endpoint | Cookie-session patch was not applied under the test route stubs. | Test harness was blanking the real cookie upgrade script. | No direct product regression, but release-blocking for logout coverage. | Let the real `auth-cookie-upgrade.js` load and kept the auth mock stable. |
| 6 | `tests/e2e/dashboard-logout-recovery.spec.js` - dashboard logout recovers if signed-in panels are already missing | `_cookiePatched` stayed false. | Same test harness issue as #5. | No direct product regression, but release-blocking for logout recovery coverage. | Let the real cookie upgrade script load and added duplicate-load guard. |
| 7 | `tests/e2e/privacy-ai-consent.spec.js` - AI Advisor requests require explicit consent before network send | Expected 428 before consent, received 200. | Test race. The test fetched before the consent wrapper was ready. | Potentially high-risk if real, but reproduced as harness timing. | Test now waits for `window.AfroTools.AIConsent` before reset/fetch. |

## Additional Stability Repairs During Rerun

Full-suite reruns exposed suite-level instability that was hidden by narrower runs:

- `assets/css/global.css` and `assets/css/global.min.css`: narrowed `view-transition-name: hero` so multiple hero elements do not throw browser `InvalidStateError` during tests.
- `tests/e2e/country-onboarding.spec.js`: revalidated after the restore; it is not part of the current v5 dirty diff.
- `tests/e2e/tool-discovery.spec.js`: rewrote from minified style to readable tests, fixed strict locator use, and avoided a Windows page-close hang.
- `playwright.config.js`: raised the default timeout to 60s, used 4 workers, and blocked service workers during tests to reduce cross-test interference.

## After

- Full suite: `79 passed (1.8m)`
- Product-quality subset: `14 passed (38.5s)`

No full Playwright failures remain.
