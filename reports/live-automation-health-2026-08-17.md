# Live Automation Health - 2026-08-17

Generated: 2026-08-17T02:37:02.882Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 34.
- Monitored live evidence checks: 34.
- Skipped scheduled functions without durable live proof mapping: 0.
- Status counts: ok=33, stale=0, degraded=0, missing=1, unavailable=0.

## Problems

- [P2] `send-activity-milestones` is `missing` via `live_data_store:scheduled-proof-send-activity-milestones`; latest=n/a, next=2026-08-17T11:23:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.

## Monitored Functions

| Status | Function | Evidence | Latest | Next scheduled | Age | SLA | Note |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| ok | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-08-17T02:34:25.592Z | 2026-08-17T03:04:00.000Z | 0h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-discover-scholarships` | `live_data_store:scholarship-source-registry-latest` | 2026-08-17T00:49:03.115Z | 2026-08-17T06:49:00.000Z | 1.8h | 12h | Scholarship source discovery writes the latest source registry summary to live_data_store. |
| ok | `scheduled-reconcile-scholarship-deadlines` | `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines` | 2026-08-17T02:18:06.049Z | 2026-08-17T04:18:00.000Z | 0.3h | 4h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-send-scholarship-reminders` | `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders` | 2026-08-17T01:43:02.911Z | 2026-08-17T02:43:00.000Z | 0.9h | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-08-17T00:57:11.620Z | 2026-08-17T02:57:00.000Z | 1.7h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `scheduled-verify-scholarships` | `live_data_store:scholarships-latest` | 2026-08-17T02:35:05.603Z | 2026-08-17T06:34:00.000Z | 0h | 12h | Scholarship verification writes the public scholarship feed cache to live_data_store. |
| ok | `send-signin-reminders` | `live_data_store:scheduled-proof-send-signin-reminders` | 2026-08-12T09:29:03.202Z | 2026-08-19T09:29:00.000Z | 113.1h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-08-17T00:46:15.658Z | 2026-08-17T06:46:00.000Z | 1.8h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-08-17T02:16:07.768Z | 2026-08-17T04:16:00.000Z | 0.3h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `conflict-sync` | `table_latest:ac_conflicts.last_api_sync` | 2026-08-16T03:13:15.407Z | 2026-08-17T03:12:00.000Z | 23.4h | 36h | Conflict sync patches ac_conflicts.last_api_sync on published conflicts. |
| ok | `scheduled-cleanup-scraper-runs` | `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs` | 2026-08-01T06:53:13.451Z | 2026-09-01T06:53:00.000Z | 379.7h | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-detect-changes` | `live_data_store:prev-fuel` | 2026-08-17T00:26:06.882Z | 2026-08-17T06:26:00.000Z | 2.2h | 12h | Change detector updates previous-snapshot keys in live_data_store after each scan. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-08-13T03:19:06.637Z | 2026-08-20T03:19:00.000Z | 95.3h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-08-17T00:28:22.204Z | 2026-08-17T12:28:00.000Z | 2.1h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-08-17T02:21:04.020Z | 2026-08-18T02:21:00.000Z | 0.3h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-08-17T02:27:04.389Z | 2026-08-17T03:27:00.000Z | 0.2h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-08-16T03:33:03.663Z | 2026-08-17T03:33:00.000Z | 23.1h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-08-17T02:37:03.093Z | 2026-08-17T02:52:00.000Z | 0h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-08-17T00:13:13.418Z | 2026-08-17T06:13:00.000Z | 2.4h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-08-10T03:41:06.309Z | 2026-08-17T03:41:00.000Z | 166.9h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-08-12T03:44:04.648Z | 2026-08-19T03:44:00.000Z | 118.9h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-08-16T08:45:33.280Z | 2026-08-21T03:47:00.000Z | 17.9h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-08-16T04:52:21.026Z | 2026-08-17T04:52:00.000Z | 21.7h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-08-17T02:11:09.698Z | 2026-08-17T03:11:00.000Z | 0.4h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-08-17T00:47:04.775Z | 2026-08-17T12:47:00.000Z | 1.8h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-08-17T00:39:54.882Z | 2026-08-17T06:39:00.000Z | 2h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=100, failed=7. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-08-16T05:58:32.489Z | 2026-08-17T05:58:00.000Z | 20.6h | 36h | Uses live_data_store.meta category timestamp. |
| ok | `scheduled-send-jamb-daily` | `live_data_store:scheduled-proof-scheduled-send-jamb-daily` | 2026-08-17T02:08:05.368Z | 2026-08-17T03:08:00.000Z | 0.5h | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scrape-fx-rates` | `table_latest:fx_snapshots.captured_at` | 2026-08-16T06:43:04.264Z | 2026-08-17T06:43:00.000Z | 19.9h | 36h | Legacy FX scraper writes fx_snapshots rows. |
| missing | `send-activity-milestones` | `live_data_store:scheduled-proof-send-activity-milestones` | n/a | 2026-08-17T11:23:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-lead-followups` | `live_data_store:scheduled-proof-send-lead-followups` | 2026-08-16T12:37:06.494Z | 2026-08-17T12:37:00.000Z | 14h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-monthly-digest` | `live_data_store:scheduled-proof-send-monthly-digest` | 2026-08-01T08:09:09.186Z | 2026-09-01T08:09:00.000Z | 378.5h | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-onboarding-nudges` | `live_data_store:scheduled-proof-send-onboarding-nudges` | 2026-08-16T10:12:14.626Z | 2026-08-17T10:11:00.000Z | 16.4h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-weekly-newsletter` | `live_data_store:scheduled-proof-send-weekly-newsletter` | 2026-08-10T08:19:05.397Z | 2026-08-17T08:19:00.000Z | 162.3h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |

## Skipped Functions

- None.

## Warnings

- None.
