-- Private research preserves unknown condition without assigning a public cohort.
-- This public advert reference is the only query-string exception; RLS is unchanged.
alter table public.car_market_research
  alter column condition_label drop not null;

CREATE OR REPLACE FUNCTION public.car_market_guard_research()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare source_domain text; source_access text; vehicle public.car_market_vehicles;
begin
  if tg_op <> 'INSERT' then raise exception 'Research facts are append-only'; end if;
  select domain, access_status into source_domain, source_access from public.car_market_sources where source_id = new.source_id;
  if source_access is null or source_access in ('blocked','retired') then raise exception 'Source unavailable for research'; end if;
  if new.source_id = 'cars-zambia-zm' then
    if source_domain <> 'cars-zambia.com'
      or new.listing_url !~ '^https://cars-zambia\.com/listing\.php\?type=car&id=[1-9][0-9]{0,9}$'
    then raise exception 'URL outside source domain or contains unapproved query/fragment'; end if;
  elsif new.listing_url !~ ('^https://' || replace(source_domain, '.', '\.') || '/[^?#[:space:]]*$')
  then raise exception 'URL outside source domain or contains unapproved query/fragment'; end if;
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
$function$;

revoke all on function public.car_market_guard_research() from public, anon, authenticated;
