# Live Automation Health - 2026-06-22

Generated: 2026-06-22T20:22:44.886Z
Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.

## Summary

- Netlify scheduled functions parsed: 35.
- Monitored live evidence checks: 20.
- Skipped scheduled functions without durable live proof mapping: 15.
- Status counts: ok=20, stale=0, degraded=0, missing=0, unavailable=0.

## Problems

- None.

## Monitored Functions

| Status | Function | Evidence | Latest | Age | SLA | Note |
| --- | --- | --- | --- | ---: | ---: | --- |
| ok | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-06-22T20:04:30.116Z | 0.3h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-06-22T18:57:09.004Z | 1.4h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-06-22T18:46:52.187Z | 1.6h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-06-22T20:16:12.853Z | 0.1h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-06-18T03:19:21.758Z | 113.1h | 192h |  |
| ok | `scheduled-fetch-bank-rates` | `scraper_runs:bank-rates` | 2026-06-16T03:17:46.926Z | 161.1h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-06-22T12:29:05.102Z | 7.9h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-06-22T02:21:30.086Z | 18h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-06-22T19:27:07.042Z | 0.9h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-06-22T03:33:10.636Z | 16.8h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-06-22T20:22:24.372Z | 0h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-06-22T18:13:32.840Z | 2.2h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-06-22T03:41:19.936Z | 16.7h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-06-17T03:44:23.330Z | 136.6h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-06-19T03:47:18.242Z | 88.6h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-06-22T04:52:28.166Z | 15.5h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-06-22T20:11:10.932Z | 0.2h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-06-22T12:47:13.973Z | 7.6h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-06-22T18:40:04.524Z | 1.7h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=62, failed=6. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-06-22T05:58:43.274Z | 14.4h | 36h | Uses live_data_store.meta category timestamp. |

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
