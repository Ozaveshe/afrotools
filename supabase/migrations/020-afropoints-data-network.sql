-- AfroPoints data network foundation

alter table public.contributions
  add column if not exists vertical text,
  add column if not exists subtype text,
  add column if not exists observed_at timestamptz,
  add column if not exists source_type text,
  add column if not exists proof_url text,
  add column if not exists unit text,
  add column if not exists quantity numeric,
  add column if not exists provider_name text,
  add column if not exists merchant_name text,
  add column if not exists route_name text,
  add column if not exists business_context text,
  add column if not exists review_required boolean not null default false,
  add column if not exists review_reason text;

update public.contributions
set observed_at = coalesce(observed_at, submitted_at),
    proof_url = coalesce(proof_url, photo_url),
    subtype = coalesce(subtype, data_category),
    vertical = coalesce(
      vertical,
      case data_category
        when 'informal_fx_rate' then 'fx_remittance'
        when 'remittance_quote' then 'fx_remittance'
        when 'forex_rate' then 'fx_remittance'
        when 'fuel_price' then 'fuel_transport'
        when 'transport_fare' then 'fuel_transport'
        when 'transport' then 'fuel_transport'
        when 'staple_price' then 'staple_basket'
        when 'product_price' then 'staple_basket'
        when 'meal_price' then 'staple_basket'
        when 'rent_listing' then 'rent_intelligence'
        when 'lease_risk_report' then 'rent_intelligence'
        when 'rent' then 'rent_intelligence'
        when 'salary_report' then 'salary_intelligence'
        when 'salary' then 'salary_intelligence'
        when 'fintech_fee' then 'fintech_fees'
        when 'backup_power_cost' then 'backup_power'
        when 'business_cost' then 'backup_power'
        when 'school_fee' then 'school_fees'
        when 'education_cost' then 'school_fees'
        when 'clinic_cost' then 'health_costs'
        when 'pharmacy_price' then 'health_costs'
        when 'wholesale_retail_spread' then 'wholesale_retail'
        else 'market_data'
      end
    );

create index if not exists idx_contributions_vertical on public.contributions(vertical);
create index if not exists idx_contributions_subtype on public.contributions(subtype);
create index if not exists idx_contributions_observed_at on public.contributions(observed_at desc);
create index if not exists idx_contributions_review_required on public.contributions(review_required) where review_required = true;

alter table public.points_profiles
  add column if not exists contributor_persona text,
  add column if not exists regular_countries jsonb not null default '[]'::jsonb,
  add column if not exists regular_cities jsonb not null default '[]'::jsonb,
  add column if not exists regular_neighborhoods jsonb not null default '[]'::jsonb,
  add column if not exists regular_routes jsonb not null default '[]'::jsonb,
  add column if not exists coverage_categories jsonb not null default '[]'::jsonb,
  add column if not exists submission_frequency text,
  add column if not exists payout_preference text,
  add column if not exists proof_comfort text,
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.data_buyer_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid,
  company text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  use_case text not null,
  verticals jsonb not null default '[]'::jsonb,
  countries jsonb not null default '[]'::jsonb,
  cities jsonb not null default '[]'::jsonb,
  cadence text,
  delivery_format text,
  budget_band text,
  consent boolean not null default false,
  review_status text not null default 'new',
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remittance_quotes (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text,
  neighborhood text,
  observed_at timestamptz not null default now(),
  send_country text,
  receive_country text,
  send_currency text,
  receive_currency text,
  send_amount numeric,
  fee_amount numeric,
  fx_rate numeric,
  received_amount numeric,
  delivery_minutes integer,
  provider_name text,
  payout_method text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.transport_fares (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  route_name text,
  route_from text,
  route_to text,
  fare_amount numeric,
  currency_code text,
  transport_mode text,
  provider_name text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.market_basket_templates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  city text,
  neighborhood text,
  basket_name text not null,
  currency_code text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_basket_snapshots (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  template_id uuid references public.market_basket_templates(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text,
  neighborhood text,
  observed_at timestamptz not null default now(),
  basket_name text,
  basket_total numeric,
  currency_code text,
  items jsonb not null default '[]'::jsonb,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.rent_listings (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  property_type text,
  bedrooms numeric,
  bathrooms numeric,
  monthly_rent numeric,
  lease_term_months integer,
  deposit_amount numeric,
  furnishing text,
  vacancy_status text,
  landlord_type text,
  listing_url text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.lease_risk_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  listing_url text,
  landlord_name text,
  property_type text,
  asking_rent numeric,
  deposit_amount numeric,
  lease_term_months integer,
  risk_score numeric,
  scam_signals jsonb not null default '[]'::jsonb,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.salary_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  role_title text,
  role_category text,
  industry text,
  experience_level text,
  company_size text,
  sector text,
  monthly_gross numeric,
  monthly_net numeric,
  total_cash_comp numeric,
  compensation_period text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.fintech_fee_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  provider_name text,
  fee_type text,
  amount_band text,
  fee_amount numeric,
  fee_percentage numeric,
  transaction_channel text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.backup_power_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  energy_type text,
  product_name text,
  provider_name text,
  cost_amount numeric,
  currency_code text,
  unit text,
  quantity numeric,
  runtime_hours numeric,
  power_size_va numeric,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.school_fee_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  institution_name text,
  education_level text,
  institution_type text,
  fee_period text,
  annual_tuition numeric,
  extras_total numeric,
  currency_code text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.clinic_cost_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  facility_name text,
  facility_type text,
  service_name text,
  cost_amount numeric,
  currency_code text,
  wait_time_minutes integer,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.pharmacy_price_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  pharmacy_name text,
  medicine_name text,
  brand_name text,
  dosage text,
  pack_size text,
  price_amount numeric,
  currency_code text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.wholesale_retail_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.contributions(id) on delete set null,
  user_id uuid,
  verification_state text not null default 'pending',
  review_status text not null default 'pending',
  is_public boolean not null default false,
  confidence_score numeric not null default 0,
  country_code text not null,
  city text not null,
  neighborhood text,
  observed_at timestamptz not null default now(),
  market_name text,
  product_name text,
  brand_name text,
  wholesale_price numeric,
  retail_price numeric,
  spread_pct numeric,
  currency_code text,
  source_type text,
  proof_url text,
  photo_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists idx_buyer_leads_status on public.data_buyer_leads(review_status, created_at desc);
create index if not exists idx_buyer_leads_verticals on public.data_buyer_leads using gin(verticals);
create index if not exists idx_remittance_quotes_public on public.remittance_quotes(is_public, country_code, observed_at desc);
create index if not exists idx_transport_fares_public on public.transport_fares(is_public, country_code, city, observed_at desc);
create index if not exists idx_basket_snapshots_public on public.market_basket_snapshots(is_public, country_code, city, observed_at desc);
create index if not exists idx_rent_listings_public on public.rent_listings(is_public, country_code, city, observed_at desc);
create index if not exists idx_lease_risk_public on public.lease_risk_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_salary_reports_public on public.salary_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_fintech_fee_public on public.fintech_fee_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_backup_power_public on public.backup_power_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_school_fee_public on public.school_fee_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_clinic_cost_public on public.clinic_cost_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_pharmacy_price_public on public.pharmacy_price_reports(is_public, country_code, city, observed_at desc);
create index if not exists idx_wholesale_retail_public on public.wholesale_retail_reports(is_public, country_code, city, observed_at desc);

alter table public.data_buyer_leads enable row level security;
alter table public.remittance_quotes enable row level security;
alter table public.transport_fares enable row level security;
alter table public.market_basket_templates enable row level security;
alter table public.market_basket_snapshots enable row level security;
alter table public.rent_listings enable row level security;
alter table public.lease_risk_reports enable row level security;
alter table public.salary_reports enable row level security;
alter table public.fintech_fee_reports enable row level security;
alter table public.backup_power_reports enable row level security;
alter table public.school_fee_reports enable row level security;
alter table public.clinic_cost_reports enable row level security;
alter table public.pharmacy_price_reports enable row level security;
alter table public.wholesale_retail_reports enable row level security;

drop policy if exists "Users can create buyer leads" on public.data_buyer_leads;
create policy "Users can create buyer leads"
on public.data_buyer_leads
for insert
with check (consent = true and (submitted_by is null or auth.uid() = submitted_by));

drop policy if exists "Users can read own buyer leads" on public.data_buyer_leads;
create policy "Users can read own buyer leads"
on public.data_buyer_leads
for select
using (submitted_by is not distinct from auth.uid());

drop policy if exists "Anyone can read public remittance quotes" on public.remittance_quotes;
create policy "Anyone can read public remittance quotes"
on public.remittance_quotes
for select
using (is_public = true);

drop policy if exists "Anyone can read public transport fares" on public.transport_fares;
create policy "Anyone can read public transport fares"
on public.transport_fares
for select
using (is_public = true);

drop policy if exists "Anyone can read market basket templates" on public.market_basket_templates;
create policy "Anyone can read market basket templates"
on public.market_basket_templates
for select
using (true);

drop policy if exists "Anyone can read public basket snapshots" on public.market_basket_snapshots;
create policy "Anyone can read public basket snapshots"
on public.market_basket_snapshots
for select
using (is_public = true);

drop policy if exists "Anyone can read public rent listings" on public.rent_listings;
create policy "Anyone can read public rent listings"
on public.rent_listings
for select
using (is_public = true);

drop policy if exists "Anyone can read public lease risk reports" on public.lease_risk_reports;
create policy "Anyone can read public lease risk reports"
on public.lease_risk_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public salary reports" on public.salary_reports;
create policy "Anyone can read public salary reports"
on public.salary_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public fintech fee reports" on public.fintech_fee_reports;
create policy "Anyone can read public fintech fee reports"
on public.fintech_fee_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public backup power reports" on public.backup_power_reports;
create policy "Anyone can read public backup power reports"
on public.backup_power_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public school fee reports" on public.school_fee_reports;
create policy "Anyone can read public school fee reports"
on public.school_fee_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public clinic cost reports" on public.clinic_cost_reports;
create policy "Anyone can read public clinic cost reports"
on public.clinic_cost_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public pharmacy price reports" on public.pharmacy_price_reports;
create policy "Anyone can read public pharmacy price reports"
on public.pharmacy_price_reports
for select
using (is_public = true);

drop policy if exists "Anyone can read public wholesale retail reports" on public.wholesale_retail_reports;
create policy "Anyone can read public wholesale retail reports"
on public.wholesale_retail_reports
for select
using (is_public = true);
