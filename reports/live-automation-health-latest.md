# Live Automation Health - 2026-06-30

Generated: 2026-06-30T05:22:58.393Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 35.
- Monitored live evidence checks: 35.
- Skipped scheduled functions without durable live proof mapping: 0.
- Status counts: ok=24, stale=1, degraded=0, missing=10, unavailable=0.

## Problems

- [P1] `afrostream-livecheck` is `stale` via `scraper_runs_scheduled:afrostream-livecheck`; latest=2026-06-30T03:04:44.654Z, next=2026-06-30T05:34:00.000Z, age=2.3h, SLA=1h. Requires a Netlify Scheduled Function scraper_runs row. Latest any-source row is Manual livecheck endpoint at 2026-06-30T05:05:09.232Z; not accepted as scheduled proof.
- [P1] `scheduled-reconcile-scholarship-deadlines` is `missing` via `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines`; latest=n/a, next=2026-06-30T06:18:00.000Z, age=n/a, SLA=4h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P1] `scheduled-send-scholarship-reminders` is `missing` via `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders`; latest=n/a, next=2026-06-30T05:43:00.000Z, age=n/a, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P1] `send-signin-reminders` is `missing` via `live_data_store:scheduled-proof-send-signin-reminders`; latest=n/a, next=2026-07-01T09:29:00.000Z, age=n/a, SLA=192h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `scheduled-cleanup-scraper-runs` is `missing` via `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs`; latest=n/a, next=2026-07-01T06:53:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `scheduled-send-jamb-daily` is `missing` via `live_data_store:scheduled-proof-scheduled-send-jamb-daily`; latest=n/a, next=2026-06-30T06:08:00.000Z, age=n/a, SLA=2h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-activity-milestones` is `missing` via `live_data_store:scheduled-proof-send-activity-milestones`; latest=n/a, next=2026-06-30T11:23:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-lead-followups` is `missing` via `live_data_store:scheduled-proof-send-lead-followups`; latest=n/a, next=2026-06-30T12:37:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-monthly-digest` is `missing` via `live_data_store:scheduled-proof-send-monthly-digest`; latest=n/a, next=2026-07-01T08:09:00.000Z, age=n/a, SLA=744h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-onboarding-nudges` is `missing` via `live_data_store:scheduled-proof-send-onboarding-nudges`; latest=n/a, next=2026-06-30T10:11:00.000Z, age=n/a, SLA=36h. Uses scheduled-proof heartbeat written after the scheduled handler returns.
- [P2] `send-weekly-newsletter` is `missing` via `live_data_store:scheduled-proof-send-weekly-newsletter`; latest=n/a, next=2026-07-06T08:19:00.000Z, age=n/a, SLA=192h. Uses scheduled-proof heartbeat written after the scheduled handler returns.

## Monitored Functions

| Status | Function | Evidence | Latest | Next scheduled | Age | SLA | Note |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| stale | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-06-30T03:04:44.654Z | 2026-06-30T05:34:00.000Z | 2.3h | 1h | Requires a Netlify Scheduled Function scraper_runs row. Latest any-source row is Manual livecheck endpoint at 2026-06-30T05:05:09.232Z; not accepted as scheduled proof. |
| ok | `scheduled-discover-scholarships` | `live_data_store:scholarship-source-registry-latest` | 2026-06-30T00:49:07.898Z | 2026-06-30T06:49:00.000Z | 4.6h | 12h | Scholarship source discovery writes the latest source registry summary to live_data_store. |
| missing | `scheduled-reconcile-scholarship-deadlines` | `live_data_store:scheduled-proof-scheduled-reconcile-scholarship-deadlines` | n/a | 2026-06-30T06:18:00.000Z | n/a | 4h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `scheduled-send-scholarship-reminders` | `live_data_store:scheduled-proof-scheduled-send-scholarship-reminders` | n/a | 2026-06-30T05:43:00.000Z | n/a | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-06-30T02:57:20.873Z | 2026-06-30T06:57:00.000Z | 2.4h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `scheduled-verify-scholarships` | `live_data_store:scholarships-latest` | 2026-06-30T05:21:20.753Z | 2026-06-30T06:34:00.000Z | 0h | 12h | Scholarship verification writes the public scholarship feed cache to live_data_store. |
| missing | `send-signin-reminders` | `live_data_store:scheduled-proof-send-signin-reminders` | n/a | 2026-07-01T09:29:00.000Z | n/a | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-06-30T00:46:52.089Z | 2026-06-30T06:46:00.000Z | 4.6h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-06-30T02:16:10.665Z | 2026-06-30T06:16:00.000Z | 3.1h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `conflict-sync` | `table_latest:ac_conflicts.last_api_sync` | 2026-06-30T03:13:15.877Z | 2026-07-01T03:12:00.000Z | 2.2h | 36h | Conflict sync patches ac_conflicts.last_api_sync on published conflicts. |
| missing | `scheduled-cleanup-scraper-runs` | `live_data_store:scheduled-proof-scheduled-cleanup-scraper-runs` | n/a | 2026-07-01T06:53:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scheduled-detect-changes` | `live_data_store:prev-fuel` | 2026-06-30T00:26:57.324Z | 2026-06-30T06:26:00.000Z | 4.9h | 12h | Change detector updates previous-snapshot keys in live_data_store after each scan. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-06-25T03:19:19.547Z | 2026-07-02T03:19:00.000Z | 122.1h | 192h |  |
| ok | `scheduled-fetch-bank-rates` | `scraper_runs:bank-rates` | 2026-06-30T03:17:32.935Z | 2026-07-07T03:17:00.000Z | 2.1h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-06-30T03:17:32.426Z | 2026-06-30T12:28:00.000Z | 2.1h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-06-30T02:21:10.317Z | 2026-07-01T02:21:00.000Z | 3h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-06-30T04:27:18.158Z | 2026-06-30T05:27:00.000Z | 0.9h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-06-30T03:33:15.233Z | 2026-07-01T03:33:00.000Z | 1.8h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-06-30T05:22:22.372Z | 2026-06-30T05:37:00.000Z | 0h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-06-30T00:13:19.699Z | 2026-06-30T06:13:00.000Z | 5.2h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-06-29T03:41:19.924Z | 2026-07-06T03:41:00.000Z | 25.7h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-06-24T03:44:29.127Z | 2026-07-01T03:44:00.000Z | 145.6h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-06-26T03:47:30.160Z | 2026-07-03T03:47:00.000Z | 97.6h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-06-30T04:52:40.838Z | 2026-07-01T04:52:00.000Z | 0.5h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-06-30T05:11:23.362Z | 2026-06-30T06:11:00.000Z | 0.2h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-06-30T00:47:12.903Z | 2026-06-30T12:47:00.000Z | 4.6h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-06-30T00:40:25.883Z | 2026-06-30T06:39:00.000Z | 4.7h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=100, failed=7. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-06-29T05:59:22.732Z | 2026-06-30T05:58:00.000Z | 23.4h | 36h | Uses live_data_store.meta category timestamp. |
| missing | `scheduled-send-jamb-daily` | `live_data_store:scheduled-proof-scheduled-send-jamb-daily` | n/a | 2026-06-30T06:08:00.000Z | n/a | 2h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| ok | `scrape-fx-rates` | `table_latest:fx_snapshots.captured_at` | 2026-06-30T03:24:22.931Z | 2026-06-30T06:43:00.000Z | 2h | 36h | Legacy FX scraper writes fx_snapshots rows. |
| missing | `send-activity-milestones` | `live_data_store:scheduled-proof-send-activity-milestones` | n/a | 2026-06-30T11:23:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-lead-followups` | `live_data_store:scheduled-proof-send-lead-followups` | n/a | 2026-06-30T12:37:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-monthly-digest` | `live_data_store:scheduled-proof-send-monthly-digest` | n/a | 2026-07-01T08:09:00.000Z | n/a | 744h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-onboarding-nudges` | `live_data_store:scheduled-proof-send-onboarding-nudges` | n/a | 2026-06-30T10:11:00.000Z | n/a | 36h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |
| missing | `send-weekly-newsletter` | `live_data_store:scheduled-proof-send-weekly-newsletter` | n/a | 2026-07-06T08:19:00.000Z | n/a | 192h | Uses scheduled-proof heartbeat written after the scheduled handler returns. |

## Skipped Functions

- None.

## Warnings

- None.
