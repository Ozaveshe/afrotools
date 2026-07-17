# Live Automation Health - 2026-07-13

Generated: 2026-07-13T09:11:22.541Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 35.
- Monitored live evidence checks: 35.
- Skipped scheduled functions without durable live proof mapping: 0.
- Status counts: ok=28, stale=0, degraded=0, missing=7, unavailable=0.

## Problems

- [P1] `send-signin-reminders` is `missing` via `live_data_store:scheduled-proof-send-signin-reminders`; latest=n/a, next=2026-07-15T09:29:00.000Z, age=n/a, SLA=192h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `scheduled-cleanup-scraper-runs` is `missing` via `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs`; latest=n/a, next=2026-08-01T06:53:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `scheduled-send-jamb-daily` is `missing` via `live_data_store:scheduled-proof-scheduled-send-jamb-daily`; latest=n/a, next=2026-07-13T10:08:00.000Z, age=n/a, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-activity-milestones` is `missing` via `live_data_store:scheduled-proof-send-activity-milestones`; latest=n/a, next=2026-07-13T11:23:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-lead-followups` is `missing` via `live_data_store:scheduled-proof-send-lead-followups`; latest=n/a, next=2026-07-13T12:37:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-monthly-digest` is `missing` via `live_data_store:scheduled-proof-send-monthly-digest`; latest=n/a, next=2026-08-01T08:09:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-onboarding-nudges` is `missing` via `live_data_store:scheduled-proof-send-onboarding-nudges`; latest=n/a, next=2026-07-13T10:11:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.

## Monitored Functions

| Status | Function | Evidence | Latest | Next scheduled | Age | SLA | Note |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| ok | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-07-13T09:04:58.530Z | 2026-07-13T09:34:00.000Z | 0.1h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-discover-scholarships` | `live_data_store:scholarship-source-registry-latest` | 2026-07-13T06:49:27.133Z | 2026-07-13T12:49:00.000Z | 2.4h | 12h | Scholarship source discovery writes the latest source registry summary to live_data_store. |
| ok | `scheduled-reconcile-scholarship-deadlines` | `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines` | 2026-07-13T08:18:42.241Z | 2026-07-13T10:18:00.000Z | 0.9h | 4h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-send-scholarship-reminders` | `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders` | 2026-07-13T08:43:06.502Z | 2026-07-13T09:43:00.000Z | 0.5h | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-07-13T08:57:38.715Z | 2026-07-13T10:57:00.000Z | 0.2h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `scheduled-verify-scholarships` | `live_data_store:scholarships-latest` | 2026-07-13T08:57:36.743Z | 2026-07-13T12:34:00.000Z | 0.2h | 12h | Scholarship verification writes the public scholarship feed cache to live_data_store. |
| missing | `send-signin-reminders` | `live_data_store:scheduled-proof-send-signin-reminders` | n/a | 2026-07-15T09:29:00.000Z | n/a | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-07-13T06:46:52.578Z | 2026-07-13T12:46:00.000Z | 2.4h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-07-13T08:16:12.495Z | 2026-07-13T10:16:00.000Z | 0.9h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `conflict-sync` | `table_latest:ac_conflicts.last_api_sync` | 2026-07-13T03:13:40.670Z | 2026-07-14T03:12:00.000Z | 6h | 36h | Conflict sync patches ac_conflicts.last_api_sync on published conflicts. |
| missing | `scheduled-cleanup-scraper-runs` | `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs` | n/a | 2026-08-01T06:53:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-detect-changes` | `live_data_store:prev-fuel` | 2026-07-13T06:26:43.050Z | 2026-07-13T12:26:00.000Z | 2.7h | 12h | Change detector updates previous-snapshot keys in live_data_store after each scan. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-07-09T03:19:10.073Z | 2026-07-16T03:19:00.000Z | 101.9h | 192h |  |
| ok | `scheduled-fetch-bank-rates` | `scraper_runs:bank-rates` | 2026-07-07T03:17:17.144Z | 2026-07-14T03:17:00.000Z | 149.9h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-07-13T00:28:47.943Z | 2026-07-13T12:28:00.000Z | 8.7h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-07-13T02:21:16.113Z | 2026-07-14T02:21:00.000Z | 6.8h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-07-13T08:27:28.788Z | 2026-07-13T09:27:00.000Z | 0.7h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-07-13T03:33:14.123Z | 2026-07-14T03:33:00.000Z | 5.6h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-07-13T09:07:34.301Z | 2026-07-13T09:22:00.000Z | 0.1h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-07-13T06:13:26.668Z | 2026-07-13T12:13:00.000Z | 3h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-07-13T03:41:15.555Z | 2026-07-20T03:41:00.000Z | 5.5h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-07-08T03:44:20.566Z | 2026-07-15T03:44:00.000Z | 125.5h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-07-10T03:47:23.595Z | 2026-07-17T03:47:00.000Z | 77.4h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-07-13T04:52:08.211Z | 2026-07-14T04:52:00.000Z | 4.3h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-07-13T09:11:27.834Z | 2026-07-13T10:11:00.000Z | 0h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-07-13T00:47:19.865Z | 2026-07-13T12:47:00.000Z | 8.4h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-07-13T06:40:00.518Z | 2026-07-13T12:39:00.000Z | 2.5h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=98, failed=7. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-07-13T05:58:45.834Z | 2026-07-14T05:58:00.000Z | 3.2h | 36h | Uses live_data_store.meta category timestamp. |
| missing | `scheduled-send-jamb-daily` | `live_data_store:scheduled-proof-scheduled-send-jamb-daily` | n/a | 2026-07-13T10:08:00.000Z | n/a | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scrape-fx-rates` | `table_latest:fx_snapshots.captured_at` | 2026-07-13T06:43:05.023Z | 2026-07-14T06:43:00.000Z | 2.5h | 36h | Legacy FX scraper writes fx_snapshots rows. |
| missing | `send-activity-milestones` | `live_data_store:scheduled-proof-send-activity-milestones` | n/a | 2026-07-13T11:23:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-lead-followups` | `live_data_store:scheduled-proof-send-lead-followups` | n/a | 2026-07-13T12:37:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-monthly-digest` | `live_data_store:scheduled-proof-send-monthly-digest` | n/a | 2026-08-01T08:09:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-onboarding-nudges` | `live_data_store:scheduled-proof-send-onboarding-nudges` | n/a | 2026-07-13T10:11:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-weekly-newsletter` | `live_data_store:scheduled-proof-send-weekly-newsletter` | 2026-07-13T08:19:54.309Z | 2026-07-20T08:19:00.000Z | 0.9h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |

## Skipped Functions

- None.

## Warnings

- None.
