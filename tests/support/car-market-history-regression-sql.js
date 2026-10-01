// Emits a rollback-only live database regression using synthetic, non-public facts.
const { validate, intakeSql, vehicleIds } = require('../../scripts/car-market-evidence');
const { snapshotSql } = require('../../scripts/car-market-snapshot-sql');
const now = new Date();
const sources = { 'history-regression': { domain: 'example.org', access_status: 'manual-only' } };
const timestamp = hours => new Date(now.getTime() - hours * 3600000).toISOString();
const fixtures = [1, 2, 3].map(number => ({
  vehicle_id: 'toyota-camry-2005', source_id: 'history-regression',
  listing_url: `https://example.org/car-history-regression/${number}`,
  source_listing_id: `synthetic-${number}`, observed_at: timestamp(2),
  country_code: 'NG', condition_label: 'foreign-used', currency: 'NGN',
  asking_price: 4000000 + number * 100000, mileage_km: 120000, engine_cc: 2400,
  trim_label: 'Synthetic initial', market: 'Synthetic market'
}));
const initial = validate(fixtures, sources, vehicleIds(), now);
const refresh = validate([{ ...fixtures[0], observed_at: timestamp(1), asking_price: 4800000, mileage_km: 125000, trim_label: 'Synthetic refreshed', engine_cc: 2500, market: 'Synthetic new market' }], sources, vehicleIds(), now);
const older = validate([{ ...fixtures[0], observed_at: timestamp(3), asking_price: 1000000 }], sources, vehicleIds(), now);
const snapshot = snapshotSql({ vehicleId: 'toyota-camry-2005', countryCode: 'NG', condition: 'foreign-used', currency: 'NGN' });
const sql = `begin;
insert into public.car_market_sources (source_id, display_name, domain, access_status)
values ('history-regression', 'Synthetic rollback test', 'example.org', 'manual-only');
${intakeSql(initial)}
update public.car_market_listing_observations set review_status = 'accepted', reviewed_at = now()
where source_id = 'history-regression';
${snapshot}
${intakeSql(older)}
do $$ begin
  if (select asking_price from public.car_market_listing_observations where listing_key = '${initial[0].listing_key}') <> 4100000 then
    raise exception 'Older observations overwrote current price';
  end if;
end $$;
${intakeSql(refresh)}
do $$ begin
  if (select count(*) from public.car_market_observation_history where listing_key = any(array[${initial.map(row => `'${row.listing_key}'`).join(',')}])) <> 4 then
    raise exception 'History did not retain initial and refreshed observations';
  end if;
  if not exists (select 1 from public.car_market_listing_observations where listing_key = '${initial[0].listing_key}' and asking_price = 4800000 and engine_cc = 2500 and trim_label = 'Synthetic refreshed' and review_status = 'pending') then
    raise exception 'Refreshed comparable facts or review reset failed';
  end if;
  if (select count(*) from public.car_market_price_snapshots where 'history-regression' = any(source_ids) and status = 'expired') <> 1 then
    raise exception 'Changed evidence did not expire prior snapshot';
  end if;
end $$;
update public.car_market_listing_observations set review_status = 'accepted', reviewed_at = now()
where listing_key = '${initial[0].listing_key}';
${snapshot}
do $$ declare blocked boolean := false; begin
  if (select count(*) from public.car_market_price_snapshots where 'history-regression' = any(source_ids)) <> 2 then
    raise exception 'Same URLs with new observations did not create a new snapshot';
  end if;
  begin
    update public.car_market_observation_history set facts = '{}' where listing_key = '${initial[0].listing_key}';
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'History was mutable'; end if;
end $$;
update public.car_market_listing_observations set review_status = 'rejected'
where listing_key = '${initial[1].listing_key}';
do $$ begin
  if exists (select 1 from public.car_market_price_snapshots where 'history-regression' = any(source_ids) and status <> 'expired') then
    raise exception 'Withdrawn approval did not expire snapshot';
  end if;
end $$;
update public.car_market_listing_observations set review_status = 'accepted', reviewed_at = now()
where source_id = 'history-regression';
${snapshot}
update public.car_market_sources set access_status = 'blocked' where source_id = 'history-regression';
do $$ begin
  if exists (select 1 from public.car_market_listing_observations where source_id = 'history-regression' and review_status = 'accepted')
    or exists (select 1 from public.car_market_price_snapshots where 'history-regression' = any(source_ids) and status <> 'expired') then
    raise exception 'Source access withdrawal left usable evidence';
  end if;
end $$;
select 'passed: history retained, stale refresh ignored, facts refreshed, snapshots expired and regenerated, history immutable, source revocation enforced' as regression_result;
rollback;`;
process.stdout.write(sql);
