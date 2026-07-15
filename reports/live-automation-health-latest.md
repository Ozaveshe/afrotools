# Live Automation Health - 2026-07-15

Generated: 2026-07-15T10:06:40.363Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 34.
- Monitored live evidence checks: 34.
- Skipped scheduled functions without durable live proof mapping: 0.
- Status counts: ok=30, stale=0, degraded=0, missing=4, unavailable=0.

## Problems

- [P2] `scheduled-cleanup-scraper-runs` is `missing` via `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs`; latest=n/a, next=2026-08-01T06:53:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `scheduled-send-jamb-daily` is `missing` via `live_data_store:scheduled-proof-scheduled-send-jamb-daily`; latest=n/a, next=2026-07-15T10:08:00.000Z, age=n/a, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-activity-milestones` is `missing` via `live_data_store:scheduled-proof-send-activity-milestones`; latest=n/a, next=2026-07-15T11:23:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-monthly-digest` is `missing` via `live_data_store:scheduled-proof-send-monthly-digest`; latest=n/a, next=2026-08-01T08:09:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.

## Monitored Functions

| Status | Function | Evidence | Latest | Next scheduled | Age | SLA | Note |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| ok | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-07-15T10:05:02.760Z | 2026-07-15T10:34:00.000Z | 0h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-discover-scholarships` | `live_data_store:scholarship-source-registry-latest` | 2026-07-15T06:49:12.927Z | 2026-07-15T12:49:00.000Z | 3.3h | 12h | Scholarship source discovery writes the latest source registry summary to live_data_store. |
| ok | `scheduled-reconcile-scholarship-deadlines` | `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines` | 2026-07-15T08:18:50.606Z | 2026-07-15T10:18:00.000Z | 1.8h | 4h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-send-scholarship-reminders` | `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders` | 2026-07-15T09:43:11.394Z | 2026-07-15T10:43:00.000Z | 0.4h | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-07-15T08:57:41.309Z | 2026-07-15T10:57:00.000Z | 1.1h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `scheduled-verify-scholarships` | `live_data_store:scholarships-latest` | 2026-07-15T09:50:27.025Z | 2026-07-15T12:34:00.000Z | 0.3h | 12h | Scholarship verification writes the public scholarship feed cache to live_data_store. |
| ok | `send-signin-reminders` | `live_data_store:scheduled-proof-send-signin-reminders` | 2026-07-15T09:29:48.783Z | 2026-07-22T09:29:00.000Z | 0.6h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-07-15T06:47:13.542Z | 2026-07-15T12:46:00.000Z | 3.3h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-07-15T08:16:16.979Z | 2026-07-15T10:16:00.000Z | 1.8h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `conflict-sync` | `table_latest:ac_conflicts.last_api_sync` | 2026-07-15T03:13:48.710Z | 2026-07-16T03:12:00.000Z | 6.9h | 36h | Conflict sync patches ac_conflicts.last_api_sync on published conflicts. |
| missing | `scheduled-cleanup-scraper-runs` | `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs` | n/a | 2026-08-01T06:53:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-detect-changes` | `live_data_store:prev-fuel` | 2026-07-15T06:26:24.821Z | 2026-07-15T12:26:00.000Z | 3.7h | 12h | Change detector updates previous-snapshot keys in live_data_store after each scan. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-07-09T03:19:10.073Z | 2026-07-16T03:19:00.000Z | 150.8h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-07-15T00:28:51.252Z | 2026-07-15T12:28:00.000Z | 9.6h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-07-15T02:21:31.542Z | 2026-07-16T02:21:00.000Z | 7.8h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-07-15T09:27:22.498Z | 2026-07-15T10:27:00.000Z | 0.7h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-07-15T03:33:25.956Z | 2026-07-16T03:33:00.000Z | 6.6h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-07-15T09:52:22.131Z | 2026-07-15T10:07:00.000Z | 0.2h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-07-15T06:13:15.870Z | 2026-07-15T12:13:00.000Z | 3.9h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-07-13T03:41:15.555Z | 2026-07-20T03:41:00.000Z | 54.4h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-07-15T03:44:23.599Z | 2026-07-22T03:44:00.000Z | 6.4h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-07-10T03:47:23.595Z | 2026-07-17T03:47:00.000Z | 126.3h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-07-15T04:52:41.716Z | 2026-07-16T04:52:00.000Z | 5.2h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-07-15T09:11:11.073Z | 2026-07-15T10:11:00.000Z | 0.9h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-07-15T00:47:25.953Z | 2026-07-15T12:47:00.000Z | 9.3h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-07-15T06:40:34.825Z | 2026-07-15T12:39:00.000Z | 3.4h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=100, failed=9. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-07-15T05:58:39.132Z | 2026-07-16T05:58:00.000Z | 4.1h | 36h | Uses live_data_store.meta category timestamp. |
| missing | `scheduled-send-jamb-daily` | `live_data_store:scheduled-proof-scheduled-send-jamb-daily` | n/a | 2026-07-15T10:08:00.000Z | n/a | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scrape-fx-rates` | `table_latest:fx_snapshots.captured_at` | 2026-07-15T06:43:11.625Z | 2026-07-16T06:43:00.000Z | 3.4h | 36h | Legacy FX scraper writes fx_snapshots rows. |
| missing | `send-activity-milestones` | `live_data_store:scheduled-proof-send-activity-milestones` | n/a | 2026-07-15T11:23:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-lead-followups` | `live_data_store:scheduled-proof-send-lead-followups` | 2026-07-14T12:37:31.125Z | 2026-07-15T12:37:00.000Z | 21.5h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-monthly-digest` | `live_data_store:scheduled-proof-send-monthly-digest` | n/a | 2026-08-01T08:09:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-onboarding-nudges` | `live_data_store:scheduled-proof-send-onboarding-nudges` | 2026-07-14T10:11:44.852Z | 2026-07-15T10:11:00.000Z | 23.9h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-weekly-newsletter` | `live_data_store:scheduled-proof-send-weekly-newsletter` | 2026-07-13T08:19:54.309Z | 2026-07-20T08:19:00.000Z | 49.8h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |

## Skipped Functions

- None.

## Warnings

- None.
