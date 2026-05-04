-- Register the fuel price source-backed lane in market-data source inventory.

alter table public.market_data_sources
  drop constraint if exists market_data_sources_dataset_check;

alter table public.market_data_sources
  add constraint market_data_sources_dataset_check
  check (dataset = any (array[
    'fintech_fee'::text,
    'remittance_quote'::text,
    'fuel_price'::text
  ]));

alter table public.market_data_source_runs
  drop constraint if exists market_data_source_runs_dataset_check;

alter table public.market_data_source_runs
  add constraint market_data_source_runs_dataset_check
  check (dataset = any (array[
    'fintech_fee'::text,
    'remittance_quote'::text,
    'fuel_price'::text
  ]));

insert into public.market_data_sources (
  dataset,
  source_key,
  source_name,
  source_type,
  base_url,
  country_scope,
  provider_scope,
  cadence_hours,
  ttl_hours,
  active,
  notes
) values (
  'fuel_price',
  'globalpetrolprices-country-fuel-pages',
  'GlobalPetrolPrices country fuel pages',
  'public_page',
  'https://www.globalpetrolprices.com/',
  '{}'::text[],
  '{}'::text[],
  6,
  48,
  true,
  'scheduled-fetch-fuel-prices scrapes public gasoline and diesel country pages, stores fuel-latest, and syncs public.fuel_prices.'
)
on conflict (source_key) do update
set dataset = excluded.dataset,
    source_name = excluded.source_name,
    source_type = excluded.source_type,
    base_url = excluded.base_url,
    country_scope = excluded.country_scope,
    provider_scope = excluded.provider_scope,
    cadence_hours = excluded.cadence_hours,
    ttl_hours = excluded.ttl_hours,
    active = excluded.active,
    notes = excluded.notes,
    updated_at = now();
