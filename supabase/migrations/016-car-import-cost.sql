-- AfroTools African Car Landed Cost Calculator data model.
-- Not applied automatically here: the live data Supabase project was not writable
-- through MCP in this session, so keep this migration for the next manual deploy.

create table if not exists public.car_import_rule_packs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  version text not null,
  effective_from date not null,
  effective_to date,
  status text not null default 'draft',
  confidence text not null default 'estimate',
  pack jsonb not null,
  source_notes jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.car_import_valuation_tables (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  version text not null,
  source_name text not null,
  source_url text,
  effective_from date,
  rows jsonb not null,
  row_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.car_import_practical_cost_presets (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  port_code text not null,
  city_id text,
  preset jsonb not null,
  confidence text not null default 'estimate',
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (country_code, port_code, city_id)
);

create table if not exists public.car_import_rule_audit_log (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  action text not null,
  before_pack jsonb,
  after_pack jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.car_import_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  country_code text not null,
  source_market text,
  vehicle jsonb not null,
  result jsonb not null,
  fx jsonb not null,
  rule_pack_version text,
  created_at timestamptz not null default now()
);

alter table public.car_import_rule_packs enable row level security;
alter table public.car_import_valuation_tables enable row level security;
alter table public.car_import_practical_cost_presets enable row level security;
alter table public.car_import_rule_audit_log enable row level security;
alter table public.car_import_quotes enable row level security;

drop policy if exists "public can read published car import rule packs" on public.car_import_rule_packs;
create policy "public can read published car import rule packs"
  on public.car_import_rule_packs for select
  using (status = 'published');

drop policy if exists "public can read car import practical presets" on public.car_import_practical_cost_presets;
create policy "public can read car import practical presets"
  on public.car_import_practical_cost_presets for select
  using (true);

drop policy if exists "users can read own car import quotes" on public.car_import_quotes;
create policy "users can read own car import quotes"
  on public.car_import_quotes for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own car import quotes" on public.car_import_quotes;
create policy "users can insert own car import quotes"
  on public.car_import_quotes for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own car import quotes" on public.car_import_quotes;
create policy "users can delete own car import quotes"
  on public.car_import_quotes for delete
  using (auth.uid() = user_id);

create index if not exists idx_car_import_rule_packs_country_status
  on public.car_import_rule_packs(country_code, status, effective_from desc);

create index if not exists idx_car_import_quotes_user_created
  on public.car_import_quotes(user_id, created_at desc);
