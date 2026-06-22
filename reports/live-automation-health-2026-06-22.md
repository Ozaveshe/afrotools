# Live Automation Health - 2026-06-22

Generated: 2026-06-22T18:19:47.171Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 35.
- Monitored live evidence checks: 20.
- Skipped scheduled functions without durable live proof mapping: 15.
- Status counts: ok=15, stale=3, degraded=0, missing=2, unavailable=0.

## Problems

- [P1] `afrostream-livecheck` is `missing` via `scraper_runs_scheduled:afrostream-livecheck`; latest=n/a, age=n/a, SLA=1h. No scheduled row found; latest any-source row is Manual livecheck endpoint.
- [P1] `scheduled-source-health-watchdog` is `stale` via `live_data_store:automation-health-latest`; latest=2026-06-18T03:04:34.194Z, age=111.3h, SLA=4h. Uses live_data_store.updated_at as scheduled write proof.
- [P2] `afrostream-news-monitor` is `stale` via `scraper_runs_scheduled:afrostream-news-monitor`; latest=2026-06-12T02:12:55.402Z, age=256.1h, SLA=36h. Requires a Netlify Scheduled Function scraper_runs row.
- [P2] `afrostream-sync` is `missing` via `scraper_runs_scheduled:afrostream-sync`; latest=n/a, age=n/a, SLA=4h. No scheduled row found; latest any-source row is Codex manual MCP snapshot repair 2026-06-18.
- [P2] `scheduled-refresh-market-data` is `stale` via `market_data_source_runs:netlify-schedule`; latest=2026-05-24T12:24:57.384Z, age=701.9h, SLA=36h. Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=18, failed=3.

## Monitored Functions

| Status | Function | Evidence | Latest | Age | SLA | Note |
| --- | --- | --- | --- | ---: | ---: | --- |
| missing | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | n/a | n/a | 1h | No scheduled row found; latest any-source row is Manual livecheck endpoint. |
| stale | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-06-18T03:04:34.194Z | 111.3h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| stale | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-06-12T02:12:55.402Z | 256.1h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| missing | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | n/a | n/a | 4h | No scheduled row found; latest any-source row is Codex manual MCP snapshot repair 2026-06-18. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-06-18T03:19:21.758Z | 111h | 192h |  |
| ok | `scheduled-fetch-bank-rates` | `scraper_runs:bank-rates` | 2026-06-16T03:17:46.926Z | 159h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-06-22T12:29:05.102Z | 5.8h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-06-22T02:21:30.086Z | 16h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-06-22T17:27:29.582Z | 0.9h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-06-22T03:33:10.636Z | 14.8h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-06-22T18:07:23.340Z | 0.2h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-06-22T18:13:32.840Z | 0.1h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-06-22T03:41:19.936Z | 14.6h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-06-17T03:44:23.330Z | 134.6h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-06-19T03:47:18.242Z | 86.5h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-06-22T04:52:28.166Z | 13.5h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-06-22T18:11:30.095Z | 0.1h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-06-22T12:47:13.973Z | 5.5h | 24h |  |
| stale | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-05-24T12:24:57.384Z | 701.9h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=18, failed=3. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-06-22T05:58:43.274Z | 12.4h | 36h | Uses live_data_store.meta category timestamp. |

## Skipped Functions

- `conflict-sync`: no durable live health mapper found in function source.
- `scheduled-cleanup-scraper-runs`: no durable live health mapper found in function source.
- `scheduled-detect-changes`: no durable live health mapper found in function source.
- `scheduled-discover-scholarships`: no durable live health mapper found in function source.
- `scheduled-reconcile-scholarship-deadlines`: no durable live health mapper found in function source.
- `scheduled-send-jamb-daily`: no durable live health mapper found in function source.
- `scheduled-send-scholarship-reminders`: no durable live health mapper found in function source.
- `scheduled-verify-scholarships`: no durable live health mapper found in function source.
- `scrape-fx-rates`: no durable live health mapper found in function source.
- `send-activity-milestones`: no durable live health mapper found in function source.
- `send-lead-followups`: no durable live health mapper found in function source.
- `send-monthly-digest`: no durable live health mapper found in function source.
- `send-onboarding-nudges`: no durable live health mapper found in function source.
- `send-signin-reminders`: no durable live health mapper found in function source.
- `send-weekly-newsletter`: no durable live health mapper found in function source.

## Warnings

- None.
