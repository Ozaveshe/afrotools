#!/usr/bin/env node
// Private browser research only. This does not approve sources or publish prices.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { loadCatalog } = require('./car-market-catalog');
const fields = ['source_id', 'listing_url', 'source_listing_id', 'observed_at', 'listing_added_on', 'vehicle_id', 'make', 'model', 'model_year', 'country_code', 'market', 'condition_label', 'trim_label', 'asking_price', 'currency', 'mileage_value', 'mileage_unit', 'verification_level', 'quality_flags'];
const flags = new Set(['availability-unconfirmed', 'listing-age-over-90-days', 'specification-conflict', 'possible-duplicate']);
const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

function catalog() {
  return new Map(loadCatalog().filter(row => row.catalog_status === 'active').map(row => [row.vehicle_id, row]));
}

function validate(rows, sources, vehicles = catalog(), now = new Date()) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100) throw new Error('Expected 1..100 research records');
  const seen = new Set();
  return rows.map((input, index) => {
    const fail = message => { throw new Error(`research ${index + 1}: ${message}`); };
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('expected object');
    for (const key of Object.keys(input)) if (!fields.includes(key)) fail(`unsupported field ${key}`);
    const row = { ...input };
    const source = sources[row.source_id];
    if (!source || !['review-needed', 'manual-only', 'automated-approved'].includes(source.access_status)) fail('source unavailable for research');
    let url;
    try { url = new URL(row.listing_url); } catch { fail('invalid URL'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== source.domain) fail('invalid source URL');
    if (url.search || source.listing_url_policy === 'cars-zm-public-reference-v1') {
      // This public advert reference is not a general query-string exception.
      const entries = [...url.searchParams];
      const id = url.searchParams.get('id');
      if (source.listing_url_policy !== 'cars-zm-public-reference-v1' || url.hostname !== 'cars-zambia.com' || url.pathname !== '/listing.php' || url.hash || entries.length !== 2 || new Set(entries.map(([key]) => key)).size !== 2 || url.searchParams.get('type') !== 'car' || !/^[1-9]\d{0,9}$/.test(id || '')) fail('invalid source URL');
      url.search = `?type=car&id=${id}`;
    }
    url.hash = '';
    row.listing_url = url.toString();
    const observed = Date.parse(row.observed_at);
    if (typeof row.observed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(row.observed_at) || !Number.isFinite(observed) || observed > now.getTime() + 300000 || observed < now.getTime() - 30 * 86400000) fail('observation outside 30-day window');
    row.observed_at = new Date(observed).toISOString();
    for (const key of ['make', 'model', 'market']) if (typeof row[key] !== 'string' || !row[key].trim() || row[key].length > 120 || /[<>\r\n]/.test(row[key])) fail(`invalid ${key}`);
    for (const key of ['trim_label', 'source_listing_id']) if (row[key] != null && (typeof row[key] !== 'string' || row[key].length > 120 || /[<>\r\n]/.test(row[key]))) fail(`invalid ${key}`);
    if (!Number.isInteger(row.model_year) || row.model_year < 1990 || row.model_year > 2100) fail('invalid model year');
    if (!/^[A-Z]{2}$/.test(row.country_code || '') || !/^[A-Z]{3}$/.test(row.currency || '')) fail('invalid country or currency');
    if (row.condition_label != null && !['foreign-used', 'local-used', 'new'].includes(row.condition_label)) fail('invalid condition');
    row.condition_label ??= null;
    if (!Number.isSafeInteger(row.asking_price) || row.asking_price < 1000 || row.asking_price > 1000000000000) fail('invalid asking price');
    if (row.mileage_value != null && (!Number.isSafeInteger(row.mileage_value) || row.mileage_value < 0 || !['km', 'mi'].includes(row.mileage_unit))) fail('invalid mileage');
    if (row.mileage_value == null && row.mileage_unit != null) fail('mileage unit without value');
    if (!['detail-page-checked', 'result-card-only'].includes(row.verification_level)) fail('invalid verification level');
    if (row.vehicle_id != null) {
      const vehicle = vehicles.get(row.vehicle_id);
      if (!vehicle || normalize(vehicle.make) !== normalize(row.make) || Number(vehicle.year) !== row.model_year || !vehicle.model.split('/').some(model => normalize(model.trim()) === normalize(row.model))) fail('catalog identity mismatch');
    }
    if (row.quality_flags != null && (!Array.isArray(row.quality_flags) || row.quality_flags.some(flag => !flags.has(flag)))) fail('invalid quality flag');
    const quality = new Set(row.quality_flags || []);
    quality.add('availability-unconfirmed');
    if (row.listing_added_on != null) {
      const added = Date.parse(row.listing_added_on + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.listing_added_on) || !Number.isFinite(added) || new Date(added).toISOString().slice(0, 10) !== row.listing_added_on || added > observed) fail('invalid listing date');
      if (observed - added > 90 * 86400000) quality.add('listing-age-over-90-days');
    }
    row.quality_flags = [...quality].sort();
    row.research_key = crypto.createHash('sha256').update(`${row.source_id}\n${row.listing_url}\n${row.observed_at}`).digest('hex');
    if (seen.has(row.research_key)) fail('duplicate observation');
    seen.add(row.research_key);
    return row;
  });
}

function sqlValue(value) {
  if (value == null) return 'null';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
function researchSql(rows) {
  const columns = ['research_key', ...fields];
  return `insert into public.car_market_research (${columns.join(', ')}) values\n${rows.map(row => '(' + columns.map(key => sqlValue(row[key])).join(', ') + ')').join(',\n')}\non conflict (research_key) do nothing;`;
}

if (require.main === module) {
  const [command, input, registry] = process.argv.slice(2);
  if (!['validate', 'sql'].includes(command) || !input || !registry) throw new Error('Usage: car-market-research.js validate|sql INPUT.json SOURCE-REGISTRY.json');
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const rows = validate(read(input).listings, read(registry).sources);
  if (command === 'sql') process.stdout.write(researchSql(rows));
  else console.log(JSON.stringify({ researchRecords: rows.length, catalogMatched: rows.filter(row => row.vehicle_id).length, availabilityUnconfirmed: rows.length, publishable: 0 }));
}
module.exports = { validate, researchSql, catalog };
