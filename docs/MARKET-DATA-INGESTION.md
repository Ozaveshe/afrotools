# Market Data Ingestion

## Purpose

This workflow exists for market-data surfaces that should become truly fresh instead of depending only on community submissions or static copy.

The first supported datasets are:

- `fintech_fee`
- `remittance_quote`

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

## Admin Endpoint

- `GET /api/market-data-ingest`
  - returns source and recent run summary
- `POST /api/market-data-ingest`
  - protected by `x-admin-key`
  - upserts a source row
  - creates an ingest run
  - inserts source-backed dataset rows
  - supersedes older public rows from the same source and metric

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

After this foundation is live, add real source collectors or admin workflows that feed this endpoint with official fintech tariff rows and corridor-specific remittance quotes.
