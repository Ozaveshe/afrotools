#!/usr/bin/env node
// Emit a private, review-required price snapshot from accepted, recent listings.
const { vehicleIds } = require('./car-market-evidence');

function snapshotSql({ vehicleId, countryCode, condition, currency }) {
  if (!/^[a-z0-9-]+$/.test(vehicleId || '') || !vehicleIds().has(vehicleId)) throw new Error('Unknown vehicle');
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error('Invalid country code');
  if (!['foreign-used', 'local-used', 'new'].includes(condition)) throw new Error('Invalid condition');
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency');
  // All inputs above are constrained to safe characters before interpolation.
  return `with comparable as (
  select listing_key, source_id, asking_price, observed_at
  from public.car_market_listing_observations
  where vehicle_id = '${vehicleId}' and country_code = '${countryCode}'
    and condition_label = '${condition}' and currency = '${currency}'
    and review_status = 'accepted' and observed_at >= now() - interval '14 days'
), aggregate as (
  select count(*)::integer as sample_size,
    percentile_cont(0.25) within group (order by asking_price)::numeric(16,2) as lower_quartile,
    percentile_cont(0.5) within group (order by asking_price)::numeric(16,2) as median_ask,
    percentile_cont(0.75) within group (order by asking_price)::numeric(16,2) as upper_quartile,
    min(observed_at) as observed_from, max(observed_at) as observed_to,
    array_agg(distinct source_id order by source_id) as source_ids,
    array_agg(listing_key order by listing_key) as listing_keys
  from comparable
)
insert into public.car_market_price_snapshots
  (vehicle_id, country_code, condition_label, currency, lower_quartile, median_ask,
   upper_quartile, sample_size, observed_from, observed_to, source_ids, listing_keys,
   method, limitations, status)
select '${vehicleId}', '${countryCode}', '${condition}', '${currency}',
  lower_quartile, median_ask, upper_quartile, sample_size, observed_from, observed_to,
  source_ids, listing_keys, 'quartiles of reviewed asking prices',
  'Asking prices, not sale prices; trim, mileage, and condition vary. Verify each seller and import cost.', 'draft'
from aggregate a
where sample_size >= 3 and not exists (
  select 1 from public.car_market_price_snapshots s
  where s.vehicle_id = '${vehicleId}' and s.country_code = '${countryCode}'
    and s.condition_label = '${condition}' and s.currency = '${currency}'
    and s.listing_keys = a.listing_keys and s.status in ('draft', 'reviewed', 'published')
)
returning snapshot_id, sample_size, median_ask, status;`;
}

if (require.main === module) {
  const [vehicleId, countryCode, condition, currency] = process.argv.slice(2);
  process.stdout.write(snapshotSql({ vehicleId, countryCode, condition, currency }));
}

module.exports = { snapshotSql };
