// Exercise the generated PostgreSQL against synthetic evidence, then roll back.
const { validate, intakeSql, vehicleIds } = require('../../scripts/car-market-evidence');
const { snapshotSql } = require('../../scripts/car-market-snapshot-sql');
const now = new Date(), source = 'cohort-regression', alias = source + '-alias';
const sources = Object.fromEntries([source, alias].map(id => [id, { domain: 'example.org', access_status: 'manual-only' }]));
const groups = [
  ['Lagos', 'LE', 2500, 3, 0], ['Abuja', 'LE', 2500, 3, 10000000],
  ['Lagos', 'SE', 2500, 3, 20000000], ['Lagos', 'LE', 3500, 3, 30000000],
  ['Lagos', null, 2500, 3, 0], [null, 'LE', 2500, 3, 0],
  ['Lagos', 'LE', null, 3, 0], ['Lagos', 'Unknown', 2500, 3, 0],
  ['Lagos', 'LX', 2500, 2, 0], ['Lagos', 'XLE', 2000, 3, 0]
];
const fixtures = groups.flatMap(([market, trim_label, engine_cc, count, offset], group) => Array.from({ length: count }, (_, index) => ({
  vehicle_id: 'toyota-camry-2005', source_id: group === 9 && index === 1 ? alias : source,
  listing_url: 'https://example.org/car-cohort-regression/' + group + '-' + (group === 9 && index === 1 ? 0 : index),
  source_listing_id: 'synthetic-' + group + '-' + index,
  observed_at: new Date(now.getTime() - 3600000).toISOString(), country_code: 'NG',
  market: group === 0 && index === 1 ? ' lagos ' : market,
  trim_label: group === 0 && index === 1 ? ' le ' : trim_label,
  engine_cc, condition_label: 'foreign-used', currency: 'NGN', asking_price: offset + (index + 1) * 1000000
})));
const rows = validate(fixtures, sources, vehicleIds(), now);
const snapshot = snapshotSql({ vehicleId: 'toyota-camry-2005', countryCode: 'NG', condition: 'foreign-used', currency: 'NGN' });
const sql = `begin;
insert into public.car_market_sources (source_id, display_name, domain, access_status)
values ('${source}', 'Synthetic rollback cohort test', 'example.org', 'manual-only'),
  ('${alias}', 'Synthetic rollback URL test', 'example.org', 'manual-only');
${intakeSql(rows)}
update public.car_market_listing_observations set review_status = 'accepted', reviewed_at = now()
where source_id in ('${source}', '${alias}');
${snapshot}
do $$ begin
  if (select count(*) from public.car_market_price_snapshots where '${source}' = any(source_ids)) <> 4 then
    raise exception 'Expected four separate complete cohorts; unknown, small or duplicate-URL cohorts leaked';
  end if;
  if (select array_agg(median_ask order by median_ask) from public.car_market_price_snapshots where '${source}' = any(source_ids)) <> array[2000000,12000000,22000000,32000000]::numeric[] then
    raise exception 'Quartiles mixed market, trim or engine groups';
  end if;
  if exists (
    select 1 from public.car_market_price_snapshots s cross join lateral (
      select count(distinct lower(btrim(h.facts->>'market'))) as markets,
        count(distinct lower(btrim(h.facts->>'trim_label'))) as trims,
        count(distinct h.facts->>'engine_cc') as engines
      from public.car_market_observation_history h where h.observation_id = any(s.observation_ids)
    ) g where '${source}' = any(s.source_ids)
      and (g.markets <> 1 or g.trims <> 1 or g.engines <> 1 or s.sample_size <> 3 or s.status <> 'draft')
  ) then raise exception 'A snapshot is mixed or no longer draft'; end if;
end $$;
${snapshot}
do $$ begin
  if (select count(*) from public.car_market_price_snapshots where '${source}' = any(source_ids)) <> 4 then
    raise exception 'Repeated generation duplicated cohorts';
  end if;
end $$;
-- An older unscoped draft must not suppress the correctly scoped replacement.
update public.car_market_price_snapshots set market = null
where '${source}' = any(source_ids) and median_ask = 2000000;
${snapshot}
do $$ begin
  if (select count(*) from public.car_market_price_snapshots where '${source}' = any(source_ids)) <> 5
    or not exists (select 1 from public.car_market_price_snapshots where '${source}' = any(source_ids) and median_ask = 2000000 and market is not null) then
    raise exception 'Legacy unscoped snapshot suppressed a scoped replacement';
  end if;
end $$;
rollback;
select 'passed: four complete cohorts, correct medians, exclusions, idempotence and legacy replacement; rolled back' as regression_result,
  (select count(*) from public.car_market_sources where source_id in ('${source}', '${alias}')) as synthetic_sources_remaining,
  (select count(*) from public.car_market_listing_observations where source_id in ('${source}', '${alias}')) as synthetic_listings_remaining,
  (select count(*) from public.car_market_price_snapshots where '${source}' = any(source_ids) or '${alias}' = any(source_ids)) as synthetic_snapshots_remaining;`;
process.stdout.write(sql);
