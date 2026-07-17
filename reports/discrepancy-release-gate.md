# Discrepancy Release Gate - 2026-05-19

## Verdict

No P0/P1 public discrepancy remains in this checkout.

The release gate is practical green for public scholarship truth, exact API count display, registered measurable claims, required production schedules, and Playwright browser availability. Yellow items below are documented because they are operational scope limits or review queues, not active public copy/API mismatches.

## Status Table

| Gate | Status | Evidence |
| --- | --- | --- |
| Scholarship public claim | Green | `npm run audit:scholarship-truth` passed. No static `120+` scholarship claim remains in checked public surfaces. |
| API count summary | Green | Direct `/api/scholarships` handler check returned `total=11`, `count=11`, `claimSafeLabel="11 Scholarships"`, `isLimited=true`, `label="Limited live feed"`. |
| Netlify schedule registry | Green | `npm run audit:automation-registry` found 35 Netlify schedules and no missing production runner schedules. |
| Codex automation registry | Yellow | Registry loads 67 Codex definitions and 110 registry records, but several Codex-only lanes have no recent run evidence in the May 15-19 report. |
| Public claim audit | Green | `npm run audit:public-claims` passed with 0 failures. Remaining 83 warnings are article/educational context owned by `content-review`. |
| Playwright preflight | Green | `npm run automation:preflight` passed with Chromium found and headless launch succeeding. |
| Live-data freshness | Yellow | Browser live-data smoke passed. Local preflight lacks `RESEND_API_KEY` and Netlify blob/site env, so local notification/blob-backed freshness coverage remains scope-limited. |

## Issues Not Fixed In This PR

### Codex-only run evidence gaps

| Field | Detail |
| --- | --- |
| Issue | Several Codex-only or mixed automations have no recent run evidence, and two report non-completed statuses. |
| Severity | P2 |
| Public surface | Internal automation registry and operations coverage, not a direct public copy/API claim. |
| Source of truth | `reports/automation-run-report-2026-05-15-to-2026-05-19.md` plus `data/automation/automation-registry.json`. |
| Owner automation | `audit:automation-registry`. |
| Why not fixed now | A repo patch cannot manufacture true Codex run evidence. Production-required Netlify and GitHub Action schedules are present. |
| Exact next action | Run or resume the warned Codex lanes, then refresh the automation run report and rerun `npm run audit:automation-registry`. |

### Local notification and blob freshness scope

| Field | Detail |
| --- | --- |
| Issue | Local preflight cannot prove notification-send or Netlify blob-backed freshness because `RESEND_API_KEY` and Netlify blob/site env are not present locally. |
| Severity | P2 |
| Public surface | Notification delivery and blob-backed freshness monitoring. |
| Source of truth | `npm run automation:preflight` environment checks and Netlify production env. |
| Owner automation | `automation:preflight` and `scheduled-source-health-watchdog`. |
| Why not fixed now | Secrets should not be added to the repo. The public pages were downgraded where delivery was not proven. |
| Exact next action | Verify the same preflight in the Netlify environment or provide local secret scope, then rerun notification/blob freshness checks. |

### Source ledger review queues

| Field | Detail |
| --- | --- |
| Issue | Government and transport source checks report changed and blocked/manual sources, with 0 broken sources. |
| Severity | P3 |
| Public surface | Government and transport source-ledger backed claims. |
| Source of truth | `data/government/official-sources.json`, `data/transport/official-sources.json`, generated source-ledger reports. |
| Owner automation | `government:sources:check`, `transport:sources:check`, GitHub source-ledger workflows. |
| Why not fixed now | Changed and manual statuses need source review, not invented data or silent acceptance. |
| Exact next action | Let the daily GitHub check surface drift and use the weekly refresh PR lane to review changed/manual sources. |

### Public claim audit warnings

| Field | Detail |
| --- | --- |
| Issue | The public claim audit warns on 83 general educational/article-context phrases such as `thousands` and `54 countries`. |
| Severity | P3 |
| Public surface | Blog/article and educational data context. |
| Source of truth | `data/audits/public-claim-registry.json` and `scripts/audit-public-claims.js`. |
| Owner automation | `content-review`. |
| Why not fixed now | These are warnings, not unregistered platform capability claims. |
| Exact next action | Review if any article phrase is promoted into product/platform copy, then register or downgrade it. |

## Validation Log

| Command | Result |
| --- | --- |
| `npm run audit:scholarship-truth` | Pass |
| `npm run audit:public-claims` | Pass, 0 failures, 83 article-context warnings |
| `npm run audit:automation-registry` | Pass, no missing production schedules, Codex evidence warnings |
| `npm run automation:preflight` | Pass, Chromium available, 2 local secret-scope warnings |
| `npm run government:sources:check` | Pass, 58 sources, 17 changed, 23 blocked/manual, 0 broken |
| `npm run transport:sources:check` | Pass, 41 sources, 4 changed, 12 blocked/manual, 0 broken |
| `npm run build:deploy` | Pass |
| `npm test` | Pass |
| `npm run test:live-data-status` | Pass, 3 Playwright tests |
| `npm run test:tool-verification` | Pass, 395 PAYE/VAT pages verified |
| `git diff --check` | Pass, line-ending warnings only |
| Scholarship inflation grep equivalent | Pass, no matches with `rg` equivalent |
| Risky phrase grep equivalent | Informational matches remain in registered data/article contexts; no unregistered public-claim audit failures |

## Copy Fixes Applied During Gate

- Compliance Calendar email-alert promises were changed to exportable calendar reminders and a reminder preview.
- Regulatory Alerts client-only subscription success was changed to a delivery preview with no stored/sent contact claim.
- Regulatory Alerts static named reporter leaderboard was removed and replaced with a pending ledger notice.
- Pro tax-law email-alert wording was changed to tax-law review notes.
- Cote d'Ivoire PAYE `real-time ITS estimation` was changed to `instant ITS estimation`.

## Count Policy

Scholarship pages and metadata remain exact/live-feed based. The public API currently reports 11 scholarships, with a limited live feed label. No static `120+` scholarship claim is allowed until the live API genuinely has at least 120 active verified or explicitly curated records.
