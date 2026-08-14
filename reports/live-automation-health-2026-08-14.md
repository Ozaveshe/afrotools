# Live Automation Health - 2026-08-14

Generated: 2026-08-14T04:13:18.048Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 34.
- Monitored live evidence checks: 34.
- Skipped scheduled functions without durable live proof mapping: 0.
- Status counts: ok=20, stale=11, degraded=1, missing=2, unavailable=0.

## Problems

- [P1] `afrostream-livecheck` is `stale` via `scraper_runs_scheduled:afrostream-livecheck`; latest=2026-08-13T13:04:27.845Z, next=2026-08-14T04:34:00.000Z, age=15.1h, SLA=1h. Requires a Netlify Scheduled Function scraper_runs row.
- [P1] `scheduled-discover-scholarships` is `stale` via `live_data_store:scholarship-source-registry-latest`; latest=2026-08-13T12:49:07.760Z, next=2026-08-14T06:49:00.000Z, age=15.4h, SLA=12h. Scholarship source discovery writes the latest source registry summary to live_data_store.
- [P1] `scheduled-reconcile-scholarship-deadlines` is `stale` via `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines`; latest=2026-08-13T12:18:07.630Z, next=2026-08-14T04:18:00.000Z, age=15.9h, SLA=4h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P1] `scheduled-send-scholarship-reminders` is `stale` via `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders`; latest=2026-08-13T12:43:07.596Z, next=2026-08-14T04:43:00.000Z, age=15.5h, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P1] `scheduled-source-health-watchdog` is `stale` via `live_data_store:automation-health-latest`; latest=2026-08-13T12:57:14.674Z, next=2026-08-14T04:57:00.000Z, age=15.3h, SLA=4h. Uses live_data_store.updated_at as scheduled write proof.
- [P1] `scheduled-verify-scholarships` is `stale` via `live_data_store:scholarships-latest`; latest=2026-08-13T13:04:24.863Z, next=2026-08-14T06:34:00.000Z, age=15.1h, SLA=12h. Scholarship verification writes the public scholarship feed cache to live_data_store.
- [P2] `afrostream-sync` is `stale` via `scraper_runs_scheduled:afrostream-sync`; latest=2026-08-13T12:16:03.394Z, next=2026-08-14T04:16:00.000Z, age=16h, SLA=4h. Requires a Netlify Scheduled Function scraper_runs row.
- [P2] `scheduled-detect-changes` is `stale` via `live_data_store:prev-fuel`; latest=2026-08-13T12:26:04.196Z, next=2026-08-14T06:26:00.000Z, age=15.8h, SLA=12h. Change detector updates previous-snapshot keys in live_data_store after each scan.
- [P2] `scheduled-fetch-crypto` is `stale` via `scraper_runs:crypto-prices`; latest=2026-08-13T12:27:03.139Z, next=2026-08-14T04:27:00.000Z, age=15.8h, SLA=2h.
- [P2] `scheduled-fetch-forex-rates` is `stale` via `live_data_store:forex-latest`; latest=2026-08-13T12:52:03.534Z, next=2026-08-14T04:22:00.000Z, age=15.4h, SLA=0.5h. Older forex scheduler writes live_data_store directly instead of scraper_runs.
- [P2] `scheduled-fetch-fuel-prices` is `stale` via `scraper_runs:fuel-prices`; latest=2026-08-13T12:13:12.089Z, next=2026-08-14T06:13:00.000Z, age=16h, SLA=12h.
- [P2] `scheduled-fetch-stocks` is `degraded` via `scraper_runs:stock-indices`; latest=2026-08-14T04:12:18.846Z, next=2026-08-14T05:11:00.000Z, age=0h, SLA=2h.
- [P2] `scheduled-send-jamb-daily` is `missing` via `live_data_store:scheduled-proof-scheduled-send-jamb-daily`; latest=n/a, next=2026-08-14T05:08:00.000Z, age=n/a, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-activity-milestones` is `missing` via `live_data_store:scheduled-proof-send-activity-milestones`; latest=n/a, next=2026-08-14T11:23:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.

## Monitored Functions

| Status | Function | Evidence | Latest | Next scheduled | Age | SLA | Note |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| stale | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-08-13T13:04:27.845Z | 2026-08-14T04:34:00.000Z | 15.1h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| stale | `scheduled-discover-scholarships` | `live_data_store:scholarship-source-registry-latest` | 2026-08-13T12:49:07.760Z | 2026-08-14T06:49:00.000Z | 15.4h | 12h | Scholarship source discovery writes the latest source registry summary to live_data_store. |
| stale | `scheduled-reconcile-scholarship-deadlines` | `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines` | 2026-08-13T12:18:07.630Z | 2026-08-14T04:18:00.000Z | 15.9h | 4h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| stale | `scheduled-send-scholarship-reminders` | `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders` | 2026-08-13T12:43:07.596Z | 2026-08-14T04:43:00.000Z | 15.5h | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| stale | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-08-13T12:57:14.674Z | 2026-08-14T04:57:00.000Z | 15.3h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| stale | `scheduled-verify-scholarships` | `live_data_store:scholarships-latest` | 2026-08-13T13:04:24.863Z | 2026-08-14T06:34:00.000Z | 15.1h | 12h | Scholarship verification writes the public scholarship feed cache to live_data_store. |
| ok | `send-signin-reminders` | `live_data_store:scheduled-proof-send-signin-reminders` | 2026-08-12T09:29:03.202Z | 2026-08-19T09:29:00.000Z | 42.7h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-08-13T12:46:56.063Z | 2026-08-14T06:46:00.000Z | 15.4h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| stale | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-08-13T12:16:03.394Z | 2026-08-14T04:16:00.000Z | 16h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `conflict-sync` | `table_latest:ac_conflicts.last_api_sync` | 2026-08-13T03:12:14.990Z | 2026-08-15T03:12:00.000Z | 25h | 36h | Conflict sync patches ac_conflicts.last_api_sync on published conflicts. |
| ok | `scheduled-cleanup-scraper-runs` | `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs` | 2026-08-01T06:53:13.451Z | 2026-09-01T06:53:00.000Z | 309.3h | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| stale | `scheduled-detect-changes` | `live_data_store:prev-fuel` | 2026-08-13T12:26:04.196Z | 2026-08-14T06:26:00.000Z | 15.8h | 12h | Change detector updates previous-snapshot keys in live_data_store after each scan. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-08-13T03:19:06.637Z | 2026-08-20T03:19:00.000Z | 24.9h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-08-13T12:28:38.931Z | 2026-08-14T12:28:00.000Z | 15.7h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-08-13T02:21:04.742Z | 2026-08-15T02:21:00.000Z | 25.9h | 36h |  |
| stale | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-08-13T12:27:03.139Z | 2026-08-14T04:27:00.000Z | 15.8h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-08-13T03:33:04.154Z | 2026-08-15T03:33:00.000Z | 24.7h | 36h |  |
| stale | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-08-13T12:52:03.534Z | 2026-08-14T04:22:00.000Z | 15.4h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| stale | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-08-13T12:13:12.089Z | 2026-08-14T06:13:00.000Z | 16h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-08-10T03:41:06.309Z | 2026-08-17T03:41:00.000Z | 96.5h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-08-12T03:44:04.648Z | 2026-08-19T03:44:00.000Z | 48.5h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-08-07T03:47:05.568Z | 2026-08-21T03:47:00.000Z | 168.4h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-08-13T04:52:09.359Z | 2026-08-14T04:52:00.000Z | 23.4h | 36h |  |
| degraded | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-08-14T04:12:18.846Z | 2026-08-14T05:11:00.000Z | 0h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-08-13T12:47:08.097Z | 2026-08-14T12:47:00.000Z | 15.4h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-08-13T12:39:57.297Z | 2026-08-14T06:39:00.000Z | 15.6h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=99, failed=8. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-08-13T05:59:19.772Z | 2026-08-14T05:58:00.000Z | 22.2h | 36h | Uses live_data_store.meta category timestamp. |
| missing | `scheduled-send-jamb-daily` | `live_data_store:scheduled-proof-scheduled-send-jamb-daily` | n/a | 2026-08-14T05:08:00.000Z | n/a | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scrape-fx-rates` | `table_latest:fx_snapshots.captured_at` | 2026-08-13T06:43:07.910Z | 2026-08-14T06:43:00.000Z | 21.5h | 36h | Legacy FX scraper writes fx_snapshots rows. |
| missing | `send-activity-milestones` | `live_data_store:scheduled-proof-send-activity-milestones` | n/a | 2026-08-14T11:23:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-lead-followups` | `live_data_store:scheduled-proof-send-lead-followups` | 2026-08-13T12:37:40.362Z | 2026-08-14T12:37:00.000Z | 15.6h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-monthly-digest` | `live_data_store:scheduled-proof-send-monthly-digest` | 2026-08-01T08:09:09.186Z | 2026-09-01T08:09:00.000Z | 308.1h | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-onboarding-nudges` | `live_data_store:scheduled-proof-send-onboarding-nudges` | 2026-08-13T10:12:18.405Z | 2026-08-14T10:11:00.000Z | 18h | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `send-weekly-newsletter` | `live_data_store:scheduled-proof-send-weekly-newsletter` | 2026-08-10T08:19:05.397Z | 2026-08-17T08:19:00.000Z | 91.9h | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |

## Skipped Functions

- None.

## Warnings

- None.
