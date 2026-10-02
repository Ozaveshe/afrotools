#!/usr/bin/env node
// Emit a private, review-required price snapshot from accepted, recent listings.
const { vehicleIds } = require('./car-market-evidence');
const { labelSql, unknownLabels } = require('./car-market-cohort');

function snapshotSql({ vehicleId, countryCode, condition, currency }) {
  if (!/^[a-z0-9-]+$/.test(vehicleId || '') || !vehicleIds().has(vehicleId)) throw new Error('Unknown vehicle');
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error('Invalid country code');
  if (!['foreign-used', 'local-used', 'new'].includes(condition)) throw new Error('Invalid condition');
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency');
  const market = labelSql('o.market'), trim = labelSql('o.trim_label');
  const unknown = unknownLabels.map(value => "'" + value + "'").join(', ');
  // All inputs above are constrained to safe characters before interpolation.
  return `with comparable as (
  select o.listing_key, o.listing_url, o.source_id, o.asking_price, o.observed_at, h.observation_id,
    o.market, o.trim_label, o.engine_cc, ${market} as market_key, ${trim} as trim_key
  from public.car_market_listing_observations o
  join public.car_market_observation_history h
    on h.listing_key = o.listing_key and h.observed_at = o.observed_at
  join public.car_market_sources s on s.source_id = o.source_id
  where o.vehicle_id = '${vehicleId}' and o.country_code = '${countryCode}'
    and o.condition_label = '${condition}' and o.currency = '${currency}'
    and o.review_status = 'accepted' and o.observed_at >= now() - interval '14 days'
    and o.observed_at <= now() and o.reviewed_at >= o.observed_at
    and s.access_status in ('manual-only', 'automated-approved')
    and length(btrim(o.market)) between 1 and 120
    and length(btrim(o.trim_label)) between 1 and 120
    and o.market !~ '[<>[:cntrl:]]' and o.trim_label !~ '[<>[:cntrl:]]'
    and ${market} not in (${unknown}) and ${trim} not in (${unknown})
    and o.engine_cc between 100 and 12000
), aggregate as (
  select min(market) as market, market_key, trim_key, engine_cc,
    count(*)::integer as sample_size, count(distinct listing_url)::integer as distinct_urls,
    percentile_cont(0.25) within group (order by asking_price)::numeric(16,2) as lower_quartile,
    percentile_cont(0.5) within group (order by asking_price)::numeric(16,2) as median_ask,
    percentile_cont(0.75) within group (order by asking_price)::numeric(16,2) as upper_quartile,
    min(observed_at) as observed_from, max(observed_at) as observed_to,
    array_agg(distinct source_id order by source_id) as source_ids,
    array_agg(listing_key order by listing_key) as listing_keys,
    array_agg(observation_id order by listing_key) as observation_ids
  from comparable
  group by market_key, trim_key, engine_cc
)
insert into public.car_market_price_snapshots
  (vehicle_id, country_code, market, condition_label, currency, lower_quartile, median_ask,
   upper_quartile, sample_size, observed_from, observed_to, source_ids, listing_keys,
   method, limitations, status, observation_ids)
select '${vehicleId}', '${countryCode}', market, '${condition}', '${currency}',
  lower_quartile, median_ask, upper_quartile, sample_size, observed_from, observed_to,
  source_ids, listing_keys, 'quartiles of reviewed asking prices within market, trim and engine group',
  'Asking prices, not sale prices; mileage varies. Verify drivetrain, transmission, available stock, each seller and import cost.', 'draft', observation_ids
from aggregate a
where sample_size >= 3 and distinct_urls = sample_size and not exists (
  select 1 from public.car_market_price_snapshots s
  where s.vehicle_id = '${vehicleId}' and s.country_code = '${countryCode}'
    and s.condition_label = '${condition}' and s.currency = '${currency}'
    and ${labelSql('s.market')} = a.market_key
    and s.observation_ids = a.observation_ids and s.status in ('draft', 'reviewed', 'published')
)
returning snapshot_id, sample_size, median_ask, status;`;
}

if (require.main === module) {
  const [vehicleId, countryCode, condition, currency] = process.argv.slice(2);
  process.stdout.write(snapshotSql({ vehicleId, countryCode, condition, currency }));
}

module.exports = { snapshotSql };
