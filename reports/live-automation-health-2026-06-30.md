# Live Automation Health - 2026-06-30

Generated: 2026-06-30T01:57:03.153Z
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
| ok | `afrostream-livecheck` | `scraper_runs_scheduled:afrostream-livecheck` | 2026-06-30T01:34:31.157Z | 0.4h | 1h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-source-health-watchdog` | `live_data_store:automation-health-latest` | 2026-06-30T00:57:09.006Z | 1h | 4h | Uses live_data_store.updated_at as scheduled write proof. |
| ok | `afrostream-news-monitor` | `scraper_runs_scheduled:afrostream-news-monitor` | 2026-06-30T00:46:52.089Z | 1.2h | 36h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `afrostream-sync` | `scraper_runs_scheduled:afrostream-sync` | 2026-06-30T00:16:42.039Z | 1.7h | 4h | Requires a Netlify Scheduled Function scraper_runs row. |
| ok | `scheduled-fetch-agri-inputs` | `scraper_runs:agri-inputs` | 2026-06-25T03:19:19.547Z | 118.6h | 192h |  |
| ok | `scheduled-fetch-bank-rates` | `scraper_runs:bank-rates` | 2026-06-23T03:17:30.188Z | 166.7h | 192h |  |
| ok | `scheduled-fetch-central-bank-rates` | `live_data_meta:rates` | 2026-06-30T00:28:44.145Z | 1.5h | 24h | Central-bank scheduler updates the shared rates meta category. |
| ok | `scheduled-fetch-commodity-prices` | `scraper_runs:commodity-prices` | 2026-06-29T02:21:28.275Z | 23.6h | 36h |  |
| ok | `scheduled-fetch-crypto` | `scraper_runs:crypto-prices` | 2026-06-30T01:27:09.467Z | 0.5h | 2h |  |
| ok | `scheduled-fetch-electricity-tariffs` | `scraper_runs:electricity-tariffs` | 2026-06-29T03:33:11.722Z | 22.4h | 36h |  |
| ok | `scheduled-fetch-forex-rates` | `live_data_store:forex-latest` | 2026-06-30T01:52:21.690Z | 0.1h | 0.5h | Older forex scheduler writes live_data_store directly instead of scraper_runs. |
| ok | `scheduled-fetch-fuel-prices` | `scraper_runs:fuel-prices` | 2026-06-30T00:13:19.699Z | 1.7h | 12h |  |
| ok | `scheduled-fetch-insurance` | `scraper_runs:insurance-premiums` | 2026-06-29T03:41:19.924Z | 22.3h | 192h |  |
| ok | `scheduled-fetch-property` | `scraper_runs:property-prices` | 2026-06-24T03:44:29.127Z | 142.2h | 192h |  |
| ok | `scheduled-fetch-salaries` | `scraper_runs:salary-benchmarks` | 2026-06-26T03:47:30.160Z | 94.2h | 192h |  |
| ok | `scheduled-fetch-shipping` | `scraper_runs:shipping-rates` | 2026-06-29T04:52:20.062Z | 21.1h | 36h |  |
| ok | `scheduled-fetch-stocks` | `scraper_runs:stock-indices` | 2026-06-30T01:11:25.875Z | 0.8h | 2h |  |
| ok | `scheduled-fetch-telecom-plans` | `scraper_runs:telecom-plans` | 2026-06-30T00:47:12.903Z | 1.2h | 24h |  |
| ok | `scheduled-refresh-market-data` | `market_data_source_runs:netlify-schedule` | 2026-06-30T00:40:25.883Z | 1.3h | 36h | Checked latest market_data_source_runs payload.trigger=netlify-schedule; recent scheduled rows=100, failed=7. |
| ok | `scheduled-scan-gazette` | `live_data_meta:gazette` | 2026-06-29T05:59:22.732Z | 20h | 36h | Uses live_data_store.meta category timestamp. |

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
