-- Phase 2: African car directory + price intelligence layer.
-- This migration is intentionally additive and uses car_* table names to avoid
-- colliding with broader AfroTools product and marketplace tables.

create table if not exists public.car_countries (
  id text primary key,
  code text not null unique,
  name text not null,
  currency_code text not null,
  currency_symbol text not null,
  import_enabled boolean not null default true,
  directory_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_ports (
  id text primary key,
  country_code text not null references public.car_countries(code) on delete cascade,
  name text not null,
  default_terminal_cost numeric not null default 0,
  default_clearing_cost numeric not null default 0,
  default_storage_per_day numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_destination_cities (
  id text primary key,
  country_code text not null references public.car_countries(code) on delete cascade,
  name text not null,
  inland_delivery_preset numeric not null default 0,
  registration_preset numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.car_vehicle_makes(id) on delete cascade,
  slug text not null,
  name text not null,
  body_type text,
  active_year_start integer,
  active_year_end integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_id, slug)
);

create table if not exists public.car_vehicle_year_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.car_vehicle_models(id) on delete cascade,
  year integer not null,
  trim_label text,
  engine_cc_min integer,
  engine_cc_max integer,
  fuel_types_json jsonb not null default '[]'::jsonb,
  transmissions_json jsonb not null default '[]'::jsonb,
  source_markets_json jsonb not null default '[]'::jsonb,
  confidence text not null default 'low',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_country_rule_packs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  version text not null,
  effective_from date not null,
  effective_to date,
  status text not null default 'draft',
  confidence text not null default 'medium',
  source_notes_json jsonb not null default '[]'::jsonb,
  rules_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.car_valuation_packs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  version text not null,
  valuation_method text not null,
  source_name text,
  source_url text,
  effective_from date,
  effective_to date,
  file_url text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.car_vehicle_reference_values (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  valuation_pack_id uuid references public.car_valuation_packs(id) on delete set null,
  make text not null,
  model text not null,
  year integer not null,
  trim text,
  engine_cc integer,
  customs_reference_value numeric not null,
  currency text not null default 'USD',
  confidence text not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_source_market_prices (
  id uuid primary key default gen_random_uuid(),
  source_market text not null,
  make text not null,
  model text not null,
  year integer not null,
  trim text,
  condition_band text,
  mileage_band text,
  min_price numeric not null,
  median_price numeric not null,
  max_price numeric not null,
  currency text not null default 'USD',
  collected_at timestamptz not null,
  confidence text not null default 'low',
  source_type text not null default 'estimated',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_local_market_prices (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  trim text,
  mileage_band text,
  condition_band text,
  min_ask numeric not null,
  median_ask numeric not null,
  max_ask numeric not null,
  currency text not null,
  sample_size integer not null default 0,
  collected_at timestamptz not null,
  confidence text not null default 'low',
  source_type text not null default 'estimated',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_shipping_presets (
  id text primary key,
  source_market text not null,
  destination_country text not null references public.car_countries(code) on delete cascade,
  destination_port text not null,
  method text not null,
  min_cost numeric not null default 0,
  typical_cost numeric not null default 0,
  max_cost numeric not null default 0,
  currency text not null default 'USD',
  transit_days integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_registration_fee_packs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  version text not null,
  rules_json jsonb not null default '{}'::jsonb,
  effective_from date not null,
  effective_to date,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.car_practical_cost_presets (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  port_id text references public.car_ports(id) on delete set null,
  category text not null,
  min_cost numeric not null default 0,
  typical_cost numeric not null default 0,
  max_cost numeric not null default 0,
  currency text not null default 'USD',
  notes text,
  confidence text not null default 'medium',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_saved_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  country_code text references public.car_countries(code) on delete set null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  fx_rate_used jsonb not null default '{}'::jsonb,
  rule_pack_version text,
  created_at timestamptz not null default now()
);

create table if not exists public.car_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  country_code text references public.car_countries(code) on delete set null,
  make text not null,
  model text not null,
  year integer not null,
  trim text,
  target_max_landed_cost numeric,
  target_max_local_ask numeric,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists car_source_market_prices_lookup_idx on public.car_source_market_prices (source_market, make, model, year);
create index if not exists car_local_market_prices_lookup_idx on public.car_local_market_prices (country_code, make, model, year);
create index if not exists car_vehicle_reference_values_lookup_idx on public.car_vehicle_reference_values (country_code, make, model, year);
create index if not exists car_watchlists_user_idx on public.car_watchlists (user_id, active);
create index if not exists car_saved_quotes_user_idx on public.car_saved_quotes (user_id, created_at desc);

alter table public.car_saved_quotes enable row level security;
alter table public.car_watchlists enable row level security;

drop policy if exists "Users can manage own car saved quotes" on public.car_saved_quotes;
create policy "Users can manage own car saved quotes" on public.car_saved_quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own car watchlists" on public.car_watchlists;
create policy "Users can manage own car watchlists" on public.car_watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
