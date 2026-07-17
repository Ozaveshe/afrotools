-- Market-data freshness metadata and source-backed ingest support

create table if not exists public.market_data_sources (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  source_key text not null,
  source_name text not null,
  source_type text not null default 'official_notice',
  base_url text,
  country_scope text[] not null default '{}'::text[],
  provider_scope text[] not null default '{}'::text[],
  cadence_hours integer not null default 24,
  ttl_hours integer not null default 24,
  active boolean not null default true,
  notes text,
  last_success_at timestamptz,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_data_sources_dataset_check
    check (dataset = any (array['fintech_fee'::text, 'remittance_quote'::text]))
);

create unique index if not exists idx_market_data_sources_source_key
  on public.market_data_sources(source_key);

create index if not exists idx_market_data_sources_dataset
  on public.market_data_sources(dataset, active);

alter table public.market_data_sources enable row level security;

drop policy if exists "No direct client access to market_data_sources" on public.market_data_sources;
create policy "No direct client access to market_data_sources"
  on public.market_data_sources
  for all
  using (false)
  with check (false);

create table if not exists public.market_data_source_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.market_data_sources(id) on delete cascade,
  dataset text not null,
  status text not null default 'running',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_published integer not null default 0,
  error_summary text,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint market_data_source_runs_dataset_check
    check (dataset = any (array['fintech_fee'::text, 'remittance_quote'::text])),
  constraint market_data_source_runs_status_check
    check (status = any (array['running'::text, 'success'::text, 'partial'::text, 'failed'::text]))
);

create index if not exists idx_market_data_source_runs_source_id
  on public.market_data_source_runs(source_id, started_at desc);

alter table public.market_data_source_runs enable row level security;

drop policy if exists "No direct client access to market_data_source_runs" on public.market_data_source_runs;
create policy "No direct client access to market_data_source_runs"
  on public.market_data_source_runs
  for all
  using (false)
  with check (false);

alter table public.fintech_fee_reports
  add column if not exists source_id uuid references public.market_data_sources(id) on delete set null,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists ingestion_method text not null default 'community',
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists last_checked_at timestamptz,
  add column if not exists customer_segment text;

alter table public.remittance_quotes
  add column if not exists source_id uuid references public.market_data_sources(id) on delete set null,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists ingestion_method text not null default 'community',
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists last_checked_at timestamptz,
  add column if not exists funding_method text;

create index if not exists idx_fintech_fee_reports_public_fresh
  on public.fintech_fee_reports(is_public, expires_at desc, observed_at desc);

create index if not exists idx_remittance_quotes_public_fresh
  on public.remittance_quotes(is_public, expires_at desc, observed_at desc);

create index if not exists idx_fintech_fee_reports_source_id
  on public.fintech_fee_reports(source_id, observed_at desc);

create index if not exists idx_remittance_quotes_source_id
  on public.remittance_quotes(source_id, observed_at desc);

update public.fintech_fee_reports
set source_name = coalesce(source_name, provider_name),
    source_url = coalesce(source_url, proof_url),
    ingestion_method = coalesce(nullif(ingestion_method, ''), case when contribution_id is null then 'legacy' else 'community' end),
    published_at = coalesce(published_at, verified_at, case when is_public then created_at else null end),
    last_checked_at = coalesce(last_checked_at, verified_at, updated_at, created_at),
    customer_segment = coalesce(customer_segment, payload ->> 'customer_segment'),
    expires_at = coalesce(
      expires_at,
      case
        when coalesce(source_type, '') = 'official_notice' then observed_at + interval '30 days'
        when coalesce(source_type, '') = 'receipt' then observed_at + interval '14 days'
        when coalesce(source_type, '') = 'self_observed' then observed_at + interval '7 days'
        else observed_at + interval '7 days'
      end
    );

update public.remittance_quotes
set source_name = coalesce(source_name, provider_name),
    source_url = coalesce(source_url, proof_url),
    ingestion_method = coalesce(nullif(ingestion_method, ''), case when contribution_id is null then 'legacy' else 'community' end),
    published_at = coalesce(published_at, verified_at, case when is_public then created_at else null end),
    last_checked_at = coalesce(last_checked_at, verified_at, updated_at, created_at),
    funding_method = coalesce(funding_method, payload ->> 'funding_method'),
    expires_at = coalesce(
      expires_at,
      case
        when coalesce(source_type, '') = 'merchant_quote' then observed_at + interval '12 hours'
        when coalesce(source_type, '') = 'official_notice' then observed_at + interval '24 hours'
        when coalesce(source_type, '') = 'receipt' then observed_at + interval '24 hours'
        when coalesce(source_type, '') = 'self_observed' then observed_at + interval '24 hours'
        else observed_at + interval '12 hours'
      end
    );
