-- Private evidence ledger for the AfroTools car catalog. A catalog identity can be
-- active without a publishable price; only reviewed snapshots may feed public pages.
create table if not exists public.car_market_vehicles (
  vehicle_id text primary key,
  make text not null,
  make_slug text not null,
  model text not null,
  model_slug text not null,
  model_year integer not null check (model_year between 1990 and 2100),
  body_type text not null,
  catalog_status text not null default 'active' check (catalog_status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_slug, model_slug, model_year)
);

create table if not exists public.car_market_sources (
  source_id text primary key,
  display_name text not null,
  domain text not null,
  country_code text,
  terms_url text,
  robots_url text,
  access_status text not null default 'review-needed'
    check (access_status in ('review-needed', 'manual-only', 'automated-approved', 'blocked', 'retired')),
  last_policy_checked_at timestamptz,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_market_ingest_runs (
  run_id uuid primary key default gen_random_uuid(),
  source_id text not null references public.car_market_sources(source_id),
  mode text not null check (mode in ('manual', 'scheduled')),
  status text not null default 'started' check (status in ('started', 'completed', 'partial', 'blocked', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  pages_checked integer not null default 0 check (pages_checked >= 0),
  listings_seen integer not null default 0 check (listings_seen >= 0),
  listings_accepted integer not null default 0 check (listings_accepted >= 0),
  error_code text,
  notes text
);

create table if not exists public.car_market_listing_observations (
  listing_key text primary key,
  vehicle_id text not null references public.car_market_vehicles(vehicle_id),
  source_id text not null references public.car_market_sources(source_id),
  run_id uuid references public.car_market_ingest_runs(run_id),
  listing_url text not null check (listing_url ~ '^https://'),
  source_listing_id text,
  observed_at timestamptz not null,
  listing_updated_at timestamptz,
  country_code text not null,
  market text,
  condition_label text,
  trim_label text,
  engine_cc integer check (engine_cc between 100 and 12000),
  mileage_km integer check (mileage_km >= 0),
  asking_price numeric(16,2) not null check (asking_price > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'accepted', 'rejected', 'expired')),
  review_reason text,
  reviewed_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_id, listing_url)
);

create table if not exists public.car_market_price_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references public.car_market_vehicles(vehicle_id),
  country_code text not null,
  market text,
  condition_label text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  lower_quartile numeric(16,2) not null check (lower_quartile > 0),
  median_ask numeric(16,2) not null check (median_ask > 0),
  upper_quartile numeric(16,2) not null check (upper_quartile > 0),
  sample_size integer not null check (sample_size >= 3),
  observed_from timestamptz not null,
  observed_to timestamptz not null,
  source_ids text[] not null,
  listing_keys text[] not null,
  method text not null,
  limitations text not null,
  status text not null default 'draft'
    check (status in ('draft', 'reviewed', 'published', 'expired', 'rejected')),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (lower_quartile <= median_ask and median_ask <= upper_quartile),
  check (observed_from <= observed_to),
  check (cardinality(listing_keys) >= 3)
);

create index if not exists car_market_listings_vehicle_status_idx
  on public.car_market_listing_observations(vehicle_id, country_code, review_status, observed_at desc);
create index if not exists car_market_listings_source_seen_idx
  on public.car_market_listing_observations(source_id, last_seen_at desc);
create index if not exists car_market_snapshots_publication_idx
  on public.car_market_price_snapshots(vehicle_id, country_code, status, observed_to desc);

alter table public.car_market_vehicles enable row level security;
alter table public.car_market_sources enable row level security;
alter table public.car_market_ingest_runs enable row level security;
alter table public.car_market_listing_observations enable row level security;
alter table public.car_market_price_snapshots enable row level security;

revoke all on public.car_market_vehicles from anon, authenticated;
revoke all on public.car_market_sources from anon, authenticated;
revoke all on public.car_market_ingest_runs from anon, authenticated;
revoke all on public.car_market_listing_observations from anon, authenticated;
revoke all on public.car_market_price_snapshots from anon, authenticated;
