# Market Data Ingestion

## Purpose

This workflow exists for market-data surfaces that should become truly fresh instead of depending only on community submissions or static copy.

The first supported datasets are:

- `fintech_fee`
- `remittance_quote`
- `fuel_price`

## Principles

- Keep live Supabase source truth separate from repo code.
- Treat official source ingest and community reports as different lanes.
- Publish only rows that have a freshness window.
- Expired rows should stop appearing on public endpoints automatically.

## Supabase Tables

- `public.market_data_sources`
  - one row per tracked source
  - stores source key, base URL, cadence, and TTL
- `public.market_data_source_runs`
  - one row per ingest attempt
  - stores status plus row counts
- `public.fintech_fee_reports`
  - now supports `source_id`, `source_name`, `source_url`, `ingestion_method`, `published_at`, `expires_at`, and `last_checked_at`
- `public.remittance_quotes`
  - now supports the same freshness metadata plus `funding_method`
- `public.fuel_prices`
  - receives source-backed country fuel rows from the scheduled fuel scraper after `fuel-latest` is written

## Admin Endpoint

- `GET /api/market-data-ingest`
  - returns source and recent run summary
- `POST /api/market-data-ingest`
  - protected by `x-admin-key`
  - upserts a source row
  - creates an ingest run
  - inserts source-backed dataset rows
  - supersedes older public rows from the same source and metric
- `GET /api/market-data-refresh`
  - protected by `x-admin-key`
  - runs the registered source collectors immediately
  - accepts optional `dataset` or `source_key` filters

## Daily Automation

- `scheduled-refresh-market-data`
  - runs once per day via Netlify Scheduled Functions
  - pulls every active supported row from `public.market_data_sources`
  - fetches the live source page or PDF
  - parses verified fee or quote rows
  - writes fresh rows into the public domain tables
  - logs each attempt in `public.market_data_source_runs`

The first automated collectors cover the currently registered live sources:

- `gh-mtn-momo-tariffs`
- `ke-safaricom-mpesa-terms`
- `ke-safaricom-buy-goods-guide`
- `ug-mtn-momopay-faq`
- `ug-mtn-momo-campaign-payments-2026`
- `ug-mtn-international-remittances`
- `wise-*` corridor sources for remittance quotes

Unsupported source keys stay in inventory but will log a failed run until a collector is added for that key.
Sites that block server-side fetches can also produce failed runs even when a collector exists; those sources need either a different official endpoint or a browser-assisted refresh lane.

## Fuel Price Sync

- `scheduled-fetch-fuel-prices`
  - runs every 6 hours via Netlify Scheduled Functions
  - scrapes public GlobalPetrolPrices country gasoline and diesel pages
  - writes the full source payload to `public.live_data_store` at `fuel-latest`
  - upserts normalized USD petrol, diesel, and LPG fields into `public.fuel_prices`
  - registers the source as `globalpetrolprices-country-fuel-pages` under dataset `fuel_price`

## AfroAlerts Change Detection

- `scheduled-detect-changes`
  - runs every 6 hours via Netlify Scheduled Functions
  - compares `fuel-latest`, `electricity-latest`, and `commodity-prices-latest` against their `prev-*` snapshots
  - writes public rows to `public.alerts`
  - sends an email only for newly inserted high-severity alerts

Alert guardrails:

- The first real commodity snapshot after `reference-fallback` should seed `prev-commodities` without sending a dramatic baseline email.
- Generated alerts expire after `AFROALERTS_EXPIRY_DAYS` days, defaulting to 30.
- Duplicate active alerts with the same title and effective date are skipped before insert and email delivery.
- Set `AFROALERTS_EMAIL_TO` to a comma-separated recipient list. The fallback recipient is the owner inbox.

## POST Shape

```json
{
  "dataset": "fintech_fee",
  "publish": true,
  "source": {
    "source_key": "ng-opay-fees",
    "source_name": "OPay Nigeria tariffs",
    "source_type": "official_notice",
    "base_url": "https://example.com/fees",
    "country_scope": ["NG"],
    "provider_scope": ["OPay"],
    "cadence_hours": 24,
    "ttl_hours": 720
  },
  "records": [
    {
      "country_code": "NG",
      "city": "National",
      "provider_name": "OPay",
      "fee_type": "Transfer",
      "amount_band": "1-5000",
      "fee_amount": 10,
      "transaction_channel": "App",
      "source_url": "https://example.com/fees",
      "observed_at": "2026-05-01T00:00:00Z"
    }
  ]
}
```

## Freshness Rules

- `fintech_fee`
  - `official_notice`: 30 days
  - `receipt`: 14 days
  - `self_observed` or community-like rows: 7 days
- `remittance_quote`
  - `official_notice`: 24 hours
  - `merchant_quote`: 12 hours
  - most other quote captures: 24 hours

The public APIs filter on `expires_at`, so expired rows stop surfacing even if they remain in the history tables.

## Next Step

After this foundation is live, keep expanding the source inventory and collector coverage so more provider-country lanes refresh automatically instead of depending on manual inserts.
