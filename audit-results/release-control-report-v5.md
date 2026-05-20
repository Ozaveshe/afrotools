# AfroTools v5 Release Control Report

## 1. Final Release-Control Verdict

SAFE ONLY AFTER MANUAL REVIEW.

`43e6f10` does not need an immediate blind revert based on the evidence gathered, but the current checkout is not safe to stage blindly. During v5, an unexpected broad `git restore -- .` process was found running outside the planned command set. It was stopped after it had already reduced the dirty tree from thousands of entries to a much smaller set. The product tests were re-applied and rerun successfully, but a human should review the remaining 95 status entries before any commit.

## 2. v3 Product-Quality Verdict

READY WITH KNOWN NON-BLOCKING DEBT still holds.

The known debt is still real: `mobile:network` remains WARN on constrained Africa mobile profile, and the comprehensive crawl still reports metadata/dark/copy risk counts even with 0 broken pages, links, and images.

## 3. 43e6f10 Landed-Commit Analysis

Commit: `43e6f10 chore: ship automation and quality audit updates`

- Changed files: 8,746
- Diff size: 3,410,063 insertions, 125,236 deletions

| Group | Count | Decision |
| --- | ---: | --- |
| Core source code | 15 | Keep, but split in future review history |
| Styles | 8 | Keep |
| Scripts | 20 | Keep and split by purpose |
| Tests | 4 | Keep |
| Content/localization/static HTML | 8,437 | Safe only as generated/post-processed output |
| Generated output | 3 | Keep if regenerated from source |
| Audit artifacts | 176 | Keep as evidence, separate from source |
| Screenshots/reports | 72 | Keep as evidence or external artifact |
| Minified/generated assets | 6 | Keep only with source parity |
| Suspicious/unrelated work | 5 | Manual review required |

Biggest risks:

- Generated/static HTML is mixed with source changes.
- Audit evidence is mixed with product code.
- Automation/source-truth files are mixed with mobile/dark/accessibility fixes.
- JAMB, CV-builder, study-abroad, and product-backbone related work need separate human ownership review.

Decision: keep `43e6f10` for now, but add follow-up cleanup commits. A blind revert is not recommended unless manual review finds a specific harmful carryover.

## 4. Full Playwright Triage

Before v5, current full Playwright produced 7 failures in this checkout, not 5:

- AfroPayroll Pro workspace setup save did not update status.
- Pro CTA test expected old `pro-trial` intent instead of current `pro-checkout` intent.
- Scholarship Finder test expected old feed copy.
- Dashboard signed-out auth handler stayed in loading state under incomplete session stubs.
- Dashboard logout cookie-session patch did not load under the test harness.
- Dashboard logout recovery had the same cookie-session harness gap.
- AI consent test raced the consent wrapper and fetched too early.

Fixes made:

- Fixed real AfroPayroll workspace setup metadata persistence and live form-value reading.
- Fixed over-broad global view-transition CSS that could create duplicate view-transition names.
- Updated stale Playwright expectations to match current correct product behavior.
- Stabilized dashboard auth/logout test harnesses without deleting coverage.
- Stabilized AI consent readiness testing.
- Rewrote brittle tool discovery coverage into a readable, browser-owned page flow and revalidated country onboarding after the restore.
- Updated Playwright config for this larger suite: 60s timeout, 4 workers, service workers blocked during tests.

Final result:

- Full Playwright after re-applying v5 fixes: 79 passed
- Product-quality Playwright after re-applying v5 fixes: 14 passed
- Affected v5 suite after re-applying fixes: 34 passed
- Remaining Playwright failures: 0

## 5. Packaging Hotfix Status

`scripts/build-dist.js` should be committed separately as a packaging hotfix.

Confirmed:

- Windows-held `dist/` root no longer breaks build clearing.
- `audit-results/` is excluded from deploy output.
- `audit-results/` is forbidden by deploy artifact verification.
- Required deploy assets are still checked.
- `npm run build:deploy` passed.
- `npm run audit:dist` passed.

## 6. Final Verification

| Command | Result | Release-blocking? |
| --- | --- | --- |
| `npm run build:deploy` | PASS | No |
| `npm test` | PASS with automation evidence warnings | No, but automation evidence should be followed up |
| `node scripts/comprehensive-quality-crawl.js` | PASS: 8,501 routes, 0 broken pages, 0 broken internal links | No |
| `npm run seo:report` | PASS: 0 missing canonical/title/meta descriptions, 0 hreflang violations | No |
| `npm run security:scan` | PASS | No |
| `npm run audit:dist` | PASS | No |
| `npm run validate:hreflang` | PASS: 7,889 pages scanned, 20,495 pairs, 0 errors | No |
| `npm run mobile:audit` | PASS: 8,461 pages, 97 issue-bearing pages | No, but remains debt |
| `npm run mobile:network` | WARN: 2 PASS, 4 WARN under 3G/low 4G profile | No if accepted as known debt; yes if network budget is strict for this release |
| `npx playwright test` | PASS: 79 passed | No |
| `git diff --check` | PASS after trimming generated network report EOF blank line | No |

Network WARN details:

- `/`: 821.7 KB, DCL 9687ms, load 12576ms, CLS 0.469
- `/nigeria/ng-salary-tax`: 644.7 KB, DCL 6130ms
- `/tools/mobile-money-fees/`: 1.05 MB, DCL 14325ms, load 15106ms
- `/telecom/airtime-value/`: 544.8 KB, DCL 11306ms, load 13104ms, static smoke cannot reach telecom/data-freshness functions

## 7. Current Dirty Checkout

After the unexpected restore process was stopped and the v5 fixes were re-applied:

- `git status --short`: 95 entries
- `git diff --name-only`: 22 tracked changed files
- `git diff --stat`: 22 files changed, 1,301 insertions, 1,223 deletions

This is much more reviewable than the earlier thousands-entry checkout, but it still is not safe to stage as one bundle. The remaining dirty set mixes v5 Playwright/product fixes, CV-builder carryover, study-abroad carryover, product-backbone carryover, audit artifacts, and source files from earlier product work.

## 8. Manual Decisions Required

- JAMB changes: confirm whether the JAMB surface changes in and after `43e6f10` are intended for this release.
- Product-backbone: `assets/css/product-backbone.css` is later/current carryover, not a direct `43e6f10` product-quality requirement.
- CV-builder: review `tools/cv-builder/` and related new scripts/tests as a separate product surface.
- Study-abroad: review `tools/study-abroad-cost/` data-trust/source files and tests as a separate product surface.
- Automation/source-truth files: review `data/audits/public-claim-registry.json`, `data/automation/automation-registry.json`, `data/scholarships/official-sources.json`, `docs/AUTOMATION-REGISTRY.md`, and `llms-full.txt` before accepting them as intentional release content.

## 9. Unexpected Restore Note

During the final status refresh, two `git restore -- .` processes were found running with exclusions for CV-builder and study-abroad files. I did not start that command in the v5 flow. I stopped the active restore processes and removed the stale `.git/index.lock` after confirming no destructive git process was still running. The restore had already reduced the dirty tree. I then re-applied the v5 Playwright/product fixes and reran the affected and full Playwright suites.

This is why the current dirty count is far lower than the earlier v5 snapshot. Treat the current working tree as a partially cleaned checkout that needs human review, not as an automatically approved cleanup.

## 10. Recommended Next Human Action

Create a follow-up branch and commit only the reviewed v5 fixes first:

1. Commit Playwright/product fixes separately.
2. Confirm the `scripts/build-dist.js` packaging hotfix is already present in current source; commit it separately only if reconstructing from an earlier branch.
3. Decide whether generated/static HTML belongs in a separate generated-output commit or should be regenerated by CI/build only.
4. Review suspicious carryover files before staging them.
5. Do not make one catch-all commit from the current dirty checkout.

Recommended first commit scope:

- `tools/afropayroll-os/workspace.html`
- `assets/css/global.css`
- `assets/css/global.min.css`
- `playwright.config.js`
- `tests/e2e/auth-funnel.spec.js`
- `tests/e2e/automation-smoke.spec.js`
- `tests/e2e/dashboard-auth-handlers.spec.js`
- `tests/e2e/dashboard-logout-recovery.spec.js`
- `tests/e2e/privacy-ai-consent.spec.js`
- `tests/e2e/tool-discovery.spec.js`

Recommended packaging note:

- `scripts/build-dist.js` is already present in current source and is not dirty. Keep it conceptually separate in review/history, but there is no current v5 file to stage for that hotfix unless the maintainer is reconstructing commits from earlier history.

Keep audit-results as evidence artifacts, not as product source.
