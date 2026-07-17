# AfroTools v6 v5 Fix Survival Check

Date: 2026-05-20

## Source reports read

- `audit-results/release-control-report-v5.md`
- `audit-results/v5-playwright-fixes.md`
- `audit-results/v5-playwright-failure-triage.md`
- `audit-results/v5-final-commands.md`
- `audit-results/v5-43e6f10-decision.md`

## Result

Most v5 fixes survived in current `HEAD` and are not dirty. One v5 fix was missing from the working tree and was re-applied exactly:

- `assets/css/global.css`
- `assets/css/global.min.css`

## Fix survival matrix

| v5 fix | Expected file | Current diff still present? | Current state | Test/coverage | Survived interrupted restore? | Re-applied? |
| --- | --- | --- | --- | --- | --- | --- |
| AfroPayroll setup metadata persistence and live form-value reading | `tools/afropayroll-os/workspace.html` | No dirty diff | Present in current file: `saveClientMetadata(clientMeta)`, `saveSetupMetadata()` passes metadata, `readClientForm()` reads live controls, inline `aria-label` strings are escaped. | `tests/e2e/afropayroll-pro.spec.js` | Yes, already in `HEAD`/current source | No |
| Pro CTA route expects checkout intent | `tests/e2e/auth-funnel.spec.js` | No dirty diff | Test expects `intent=pro-checkout`. | Full Playwright/auth funnel | Yes | No |
| Scholarship Finder live-feed copy expectation | `tests/e2e/automation-smoke.spec.js` | No dirty diff | Test accepts `Live scholarship feed` or `Source mode: live`. | Full Playwright/automation smoke | Yes | No |
| Dashboard signed-out auth/session harness | `tests/e2e/dashboard-auth-handlers.spec.js` | No dirty diff | Stub handles `/api/auth/session` signed-out response and duplicate auth loading guard. | Full Playwright/dashboard auth handlers | Yes | No |
| Dashboard logout recovery cookie-session harness | `tests/e2e/dashboard-logout-recovery.spec.js` | No dirty diff | Stub contains `_afroAuthLoaded` guard and `/api/auth/session` handling. | Full Playwright/dashboard logout recovery | Yes | No |
| AI consent test readiness wait | `tests/e2e/privacy-ai-consent.spec.js` | No dirty diff | Test waits for `window.AfroTools.AIConsent` before reset/fetch. | Full Playwright/privacy AI consent | Yes | No |
| Readable/stable tool discovery coverage | `tests/e2e/tool-discovery.spec.js` | No dirty diff | Test uses readable Playwright flow with `browser.newPage()` and checks PDF Workspace search. | Full Playwright/tool discovery | Yes | No |
| Playwright suite stability config | `playwright.config.js` | No dirty diff | Timeout 60s, 4 workers, service workers blocked. | Full Playwright | Yes | No |
| Narrow hero view-transition selector | `assets/css/global.css` and `assets/css/global.min.css` | Yes, after v6 re-application | Before v6 re-application, `global.css` still had `.hero, .compare-hero, [class*="-hero"] { view-transition-name: hero; }`. v6 restored `.hero, .compare-hero` only. | Full Playwright; guards against browser duplicate view-transition-name failures | No | Yes |

## Re-application performed

The only product code changed during v6 was the missing v5 global view-transition fix:

- `assets/css/global.css`
- `assets/css/global.min.css`

No CV Builder, Study Abroad, product-backbone, package-script, generated-output, or audit timestamp changes were modified for product purposes in v6.
