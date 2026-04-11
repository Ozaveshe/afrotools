-- Phase 3 foundations for car media, financing offers, and data-driven scoring.
-- These tables are additive and can be used by Mission Control or future publish jobs.

create table if not exists public.car_media_assets (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  storage_path text,
  public_url text not null,
  thumbnail_url text,
  alt_text text not null,
  caption text,
  media_type text not null default 'hero',
  source_type text not null default 'admin-upload',
  license_type text not null default 'internal',
  source_url text,
  credit text,
  confidence text not null default 'medium',
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_media_bindings (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.car_media_assets(id) on delete cascade,
  vehicle_variant_id uuid references public.car_vehicle_year_variants(id) on delete cascade,
  country_code text references public.car_countries(code) on delete cascade,
  source_market text,
  make_slug text,
  model_slug text,
  year integer,
  body_type text,
  is_primary boolean not null default false,
  display_order integer not null default 1,
  status text not null default 'approved',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_financing_offers (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.car_countries(code) on delete cascade,
  provider_name text not null,
  offer_label text not null,
  offer_type text not null default 'partner-estimate',
  apr_pct numeric not null,
  apr_max_pct numeric,
  min_down_payment_pct numeric not null default 0.25,
  default_down_payment_pct numeric not null default 0.30,
  processing_fee_pct numeric not null default 0,
  tenure_months_json jsonb not null default '[]'::jsonb,
  default_tenure_months integer,
  max_vehicle_age_years integer,
  min_amount_usd numeric,
  max_amount_usd numeric,
  vehicle_classes_json jsonb not null default '[]'::jsonb,
  source_type text not null default 'partner-estimate',
  confidence text not null default 'medium',
  cta_label text,
  cta_url text,
  notes text,
  effective_from date,
  effective_to date,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.car_scoring_models (
  id uuid primary key default gen_random_uuid(),
  score_type text not null check (score_type in ('import-risk', 'liquidity')),
  country_code text references public.car_countries(code) on delete cascade,
  version text not null,
  config_json jsonb not null default '{}'::jsonb,
  source_type text not null default 'internal',
  confidence text not null default 'medium',
  effective_from date,
  effective_to date,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (score_type, country_code, version)
);

create index if not exists car_media_bindings_lookup_idx on public.car_media_bindings (country_code, make_slug, model_slug, year, body_type, source_market);
create index if not exists car_financing_offers_country_idx on public.car_financing_offers (country_code, active);
create index if not exists car_scoring_models_lookup_idx on public.car_scoring_models (score_type, country_code, status);
