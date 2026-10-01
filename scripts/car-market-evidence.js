#!/usr/bin/env node
// Validate manually reviewed or licensed-feed listing facts before private DB intake.
// This never fetches third-party pages or publishes prices by itself.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const allowedFields = new Set([
  'vehicle_id', 'source_id', 'listing_url', 'source_listing_id', 'observed_at',
  'listing_updated_at', 'country_code', 'market', 'condition_label', 'trim_label',
  'engine_cc', 'mileage_km', 'asking_price', 'currency'
]);
const fields = [...allowedFields];
const root = path.join(__dirname, '..');

function vehicleIds() {
  const ids = new Set();
  for (const file of ['master-vehicle-catalog.csv', 'import-duty-vehicle-estimates.csv']) {
    const input = fs.readFileSync(path.join(root, 'data/cars', file), 'utf8');
    for (const line of input.split(/\r?\n/).slice(1)) {
      const id = line.split(',')[0];
      if (id) ids.add(id);
    }
  }
  return ids;
}

function validate(rows, sources, vehicles, now = new Date()) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100) throw new Error('Input must contain 1..100 listings');
  const seen = new Set();
  return rows.map((row, index) => {
    const label = `listing ${index + 1}`;
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`${label}: expected object`);
    for (const key of Object.keys(row)) if (!allowedFields.has(key)) throw new Error(`${label}: unsupported field ${key}`);
    if (!vehicles.has(row.vehicle_id)) throw new Error(`${label}: unknown vehicle_id`);
    const source = sources[row.source_id];
    if (!source || !['manual-only', 'automated-approved'].includes(source.access_status)) throw new Error(`${label}: source not approved for intake`);
    let url;
    try { url = new URL(row.listing_url); } catch { throw new Error(`${label}: invalid listing_url`); }
    if (url.protocol !== 'https:' || url.hostname !== source.domain && !url.hostname.endsWith(`.${source.domain}`)) throw new Error(`${label}: URL outside source domain`);
    url.hash = '';
    const timestamp = Date.parse(row.observed_at);
    if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 300000 || timestamp < now.getTime() - 30 * 86400000) throw new Error(`${label}: observed_at must be within 30 days`);
    if (row.listing_updated_at && !Number.isFinite(Date.parse(row.listing_updated_at))) throw new Error(`${label}: invalid listing_updated_at`);
    if (!/^[A-Z]{2}$/.test(row.country_code || '') || !/^[A-Z]{3}$/.test(row.currency || '')) throw new Error(`${label}: invalid country or currency`);
    if (!Number.isSafeInteger(row.asking_price) || row.asking_price < 1000 || row.asking_price > 1000000000000) throw new Error(`${label}: invalid asking_price`);
    if (!['foreign-used', 'local-used', 'new'].includes(row.condition_label)) throw new Error(`${label}: condition_label required`);
    if (row.engine_cc != null && (!Number.isSafeInteger(row.engine_cc) || row.engine_cc < 100 || row.engine_cc > 12000)) throw new Error(`${label}: invalid engine_cc`);
    if (row.mileage_km != null && (!Number.isSafeInteger(row.mileage_km) || row.mileage_km < 0)) throw new Error(`${label}: invalid mileage_km`);
    for (const key of ['source_listing_id', 'market', 'trim_label']) if (row[key] != null && (typeof row[key] !== 'string' || row[key].length > 120)) throw new Error(`${label}: invalid ${key}`);
    const listing_url = url.toString();
    const listing_key = crypto.createHash('sha256').update(`${row.source_id}\n${listing_url}`).digest('hex');
    if (seen.has(listing_key)) throw new Error(`${label}: duplicate listing`);
    seen.add(listing_key);
    return { ...row, listing_url, listing_key, review_status: 'pending' };
  });
}

function sqlValue(value) {
  if (value == null) return 'null';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function intakeSql(rows) {
  const columns = ['listing_key', ...fields, 'review_status'];
  const values = rows.map(row => `(${columns.map(field => sqlValue(row[field])).join(', ')})`).join(',\n  ');
  return `insert into public.car_market_listing_observations (${columns.join(', ')}) values
  ${values}
on conflict (listing_key) do update set
  vehicle_id = excluded.vehicle_id, source_listing_id = excluded.source_listing_id,
  country_code = excluded.country_code, market = excluded.market,
  condition_label = excluded.condition_label, trim_label = excluded.trim_label,
  engine_cc = excluded.engine_cc, asking_price = excluded.asking_price,
  currency = excluded.currency, mileage_km = excluded.mileage_km,
  listing_updated_at = excluded.listing_updated_at, observed_at = excluded.observed_at,
  last_seen_at = now(), review_status = 'pending', review_reason = null, reviewed_at = null
where excluded.observed_at > car_market_listing_observations.observed_at;`;
}

if (require.main === module) {
  const [command, inputFile, sourceFile] = process.argv.slice(2);
  if (!['validate', 'sql'].includes(command) || !inputFile || !sourceFile) throw new Error('Usage: car-market-evidence.js validate|sql input.json source-registry.json');
  const input = JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'));
  const registry = JSON.parse(fs.readFileSync(path.resolve(sourceFile), 'utf8'));
  const rows = validate(input.listings, registry.sources, vehicleIds());
  if (command === 'sql') process.stdout.write(intakeSql(rows));
  else console.log(JSON.stringify({ valid: rows.length, pendingReview: rows.length, uniqueVehicles: new Set(rows.map(row => row.vehicle_id)).size }));
}

module.exports = { validate, intakeSql, vehicleIds };
