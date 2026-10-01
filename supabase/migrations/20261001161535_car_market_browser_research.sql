-- Browser-visible asking-price research, separate from approved observations.
-- Seeing a listing does not confirm availability or grant publication rights.
create table public.car_market_research (
  research_key text primary key check (research_key ~ '^[0-9a-f]{64}$'),
  source_id text not null references public.car_market_sources(source_id),
  listing_url text not null check (listing_url like 'https://%' and length(listing_url) <= 2048),
  source_listing_id text check (length(source_listing_id) <= 120),
  observed_at timestamptz not null,
  listing_added_on date,
  vehicle_id text references public.car_market_vehicles(vehicle_id),
  make text not null check (length(make) between 1 and 120),
  model text not null check (length(model) between 1 and 120),
  model_year integer not null check (model_year between 1990 and 2100),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  market text not null check (length(market) between 1 and 120),
  condition_label text not null check (condition_label in ('foreign-used','local-used','new')),
  trim_label text check (length(trim_label) <= 120),
  asking_price bigint not null check (asking_price between 1000 and 1000000000000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  mileage_value bigint check (mileage_value >= 0),
  mileage_unit text check (mileage_unit in ('km','mi')),
  verification_level text not null check (verification_level in ('detail-page-checked','result-card-only')),
  quality_flags jsonb not null check (jsonb_typeof(quality_flags) = 'array' and quality_flags @> '["availability-unconfirmed"]'::jsonb and quality_flags <@ '["availability-unconfirmed","listing-age-over-90-days","specification-conflict","possible-duplicate"]'::jsonb),
  captured_at timestamptz not null default now(),
  unique (source_id, listing_url, observed_at),
  check ((mileage_value is null) = (mileage_unit is null)),
  check (listing_added_on is null or listing_added_on <= observed_at::date)
);
alter table public.car_market_research enable row level security;
revoke all on public.car_market_research from anon, authenticated;

create function public.car_market_guard_research() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare source_domain text; source_access text; vehicle public.car_market_vehicles;
begin
  if tg_op <> 'INSERT' then raise exception 'Research facts are append-only'; end if;
  select domain, access_status into source_domain, source_access from public.car_market_sources where source_id = new.source_id;
  if source_access is null or source_access in ('blocked','retired') then raise exception 'Source unavailable for research'; end if;
  if new.listing_url !~ ('^https://' || replace(source_domain, '.', '\.') || '/[^?#[:space:]]*$') then raise exception 'URL outside source domain or contains query/fragment'; end if;
  if new.observed_at > now() + interval '5 minutes' or new.observed_at < now() - interval '30 days' then raise exception 'Observation outside 30-day window'; end if;
  if new.listing_added_on is not null and new.observed_at::date - new.listing_added_on > 90 and not new.quality_flags @> '["listing-age-over-90-days"]'::jsonb then raise exception 'Old listing requires age flag'; end if;
  if new.vehicle_id is not null then
    select * into vehicle from public.car_market_vehicles where vehicle_id = new.vehicle_id;
    if vehicle.vehicle_id is null or regexp_replace(lower(vehicle.make), '[^a-z0-9]', '', 'g') <> regexp_replace(lower(new.make), '[^a-z0-9]', '', 'g') or vehicle.model_year <> new.model_year
      or not exists (select 1 from unnest(string_to_array(vehicle.model, '/')) m where regexp_replace(lower(trim(m)), '[^a-z0-9]', '', 'g') = regexp_replace(lower(new.model), '[^a-z0-9]', '', 'g')) then
      raise exception 'Catalog identity mismatch';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.car_market_guard_research() from public, anon, authenticated;
create trigger car_market_guard_research before insert or update or delete on public.car_market_research
for each row execute function public.car_market_guard_research();
comment on table public.car_market_research is 'Private unapproved research only. Never feeds price snapshots or public SEO; source rights, availability and identity need separate review.';
