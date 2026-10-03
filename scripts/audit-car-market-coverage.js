#!/usr/bin/env node
// Operator-only coverage audit. Verify the configured AfroTools MCP project before SQL.
// No network access, price values, listing URLs or public exports are produced here.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseCsv } = require('./car-catalog-manager');
const { mergeCatalog } = require('./car-market-catalog');
const PROJECT = 'zpclagtgczsygrgztlts';
const DAY = 86400000;

function loadScope(directory = path.join(__dirname, '../data/cars')) {
  const read = name => {
    const rows = parseCsv(fs.readFileSync(path.join(directory, name), 'utf8').replace(/^\uFEFF/, ''));
    const headers = rows.shift();
    return rows.filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((key, i) => [key, row[i] || ''])));
  };
  const originals = mergeCatalog([...read('master-vehicle-catalog.csv'), ...read('import-duty-vehicle-estimates.csv')]);
  const pack = JSON.parse(fs.readFileSync(path.join(directory, 'price-intelligence.json'), 'utf8'));
  return validateScope({
    original_ids: originals.filter(row => row.catalog_status === 'active').map(row => row.vehicle_id).sort(),
    markets: Object.values(pack.countries).filter(row => row.directory_enabled === true).map(row => ({ country_code: row.code, currency: row.currency_code })).sort((a, b) => a.country_code.localeCompare(b.country_code))
  });
}

function validateScope(scope) {
  if (!scope || !Array.isArray(scope.original_ids) || !scope.original_ids.length || !Array.isArray(scope.markets) || !scope.markets.length) throw Error('Missing coverage scope');
  if (scope.original_ids.some(id => typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) || new Set(scope.original_ids).size !== scope.original_ids.length) throw Error('Invalid original identities');
  if (scope.markets.some(row => !row || !/^[A-Z]{2}$/.test(row.country_code) || !/^[A-Z]{3}$/.test(row.currency)) || new Set(scope.markets.map(row => row.country_code)).size !== scope.markets.length) throw Error('Invalid supported markets');
  return scope;
}

const scopeHash = scope => crypto.createHash('sha256').update(JSON.stringify(validateScope(scope))).digest('hex');
const literal = value => "'" + String(value).replace(/'/g, "''") + "'";

function captureSql(scope = loadScope()) {
  validateScope(scope);
  const markets = scope.markets.map(row => '(' + literal(row.country_code) + ',' + literal(row.currency) + ')').join(',');
  return `with markets(country_code,currency) as (values ${markets}),
active as (select vehicle_id from public.car_market_vehicles where catalog_status='active'),
latest as (select distinct on(source_id,listing_url) * from public.car_market_research order by source_id,listing_url,observed_at desc,research_key desc)
select jsonb_build_object('schema_version',1,'project_ref','${PROJECT}','captured_at',now(),'scope_sha256','${scopeHash(scope)}',
'catalog_ids',(select coalesce(jsonb_agg(vehicle_id order by vehicle_id),'[]'::jsonb) from active),
'markets',(select jsonb_agg(jsonb_build_object('country_code',m.country_code,'currency',m.currency,
'private_rows',(select count(*) from latest r where r.country_code=m.country_code),
'private_ids',(select coalesce(jsonb_agg(vehicle_id order by vehicle_id),'[]'::jsonb) from (select distinct r.vehicle_id from latest r join active a using(vehicle_id) where r.country_code=m.country_code and r.currency=m.currency) x),
'private_currency_mismatches',(select count(*) from latest r where r.country_code=m.country_code and r.currency<>m.currency),
'old_postings',(select count(*) from latest r where r.country_code=m.country_code and r.listing_added_on<current_date-90),
'unknown_posting_dates',(select count(*) from latest r where r.country_code=m.country_code and r.listing_added_on is null),
'specification_conflicts',(select count(*) from latest r where r.country_code=m.country_code and r.quality_flags ? 'specification-conflict'),
'pending_observations',(select count(*) from public.car_market_listing_observations o where o.country_code=m.country_code and o.review_status='pending'),
'accepted_observations',(select count(*) from public.car_market_listing_observations o where o.country_code=m.country_code and o.review_status='accepted'),
'accepted_ids',(select coalesce(jsonb_agg(vehicle_id order by vehicle_id),'[]'::jsonb) from (select distinct o.vehicle_id from public.car_market_listing_observations o join active a using(vehicle_id) where o.country_code=m.country_code and o.currency=m.currency and o.review_status='accepted') x),
'published_snapshots',(select count(*) from public.car_market_price_snapshots s where s.country_code=m.country_code and s.status='published'),
'published_ids',(select coalesce(jsonb_agg(vehicle_id order by vehicle_id),'[]'::jsonb) from (select distinct s.vehicle_id from public.car_market_price_snapshots s join active a using(vehicle_id) where s.country_code=m.country_code and s.currency=m.currency and s.status='published') x),
'current_published_snapshots',(select count(*) from public.car_market_price_snapshots s where s.country_code=m.country_code and s.status='published' and s.observed_from>=now()-interval '14 days' and s.observed_from<=s.observed_to and s.observed_to<=now()),
'current_published_ids',(select coalesce(jsonb_agg(vehicle_id order by vehicle_id),'[]'::jsonb) from (select distinct s.vehicle_id from public.car_market_price_snapshots s join active a using(vehicle_id) where s.country_code=m.country_code and s.currency=m.currency and s.status='published' and s.observed_from>=now()-interval '14 days' and s.observed_from<=s.observed_to and s.observed_to<=now()) x),
'stale_published_snapshots',(select count(*) from public.car_market_price_snapshots s where s.country_code=m.country_code and s.status='published' and s.observed_from<now()-interval '14 days'),
'automated_approved_sources',(select count(*) from public.car_market_sources src where src.country_code=m.country_code and src.access_status='automated-approved')) order by m.country_code) from markets m)) as coverage_capture;`;
}

function auditCapture(capture, scope = loadScope(), { now = new Date() } = {}) {
  validateScope(scope);
  const count = (value, label) => { if (!Number.isSafeInteger(value) || value < 0) throw Error('Invalid count: ' + label); return value; };
  const exactKeys = (value, allowed) => { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key)) || allowed.some(key => !(key in value))) throw Error('Unexpected capture fields'); };
  exactKeys(capture, ['schema_version', 'project_ref', 'captured_at', 'scope_sha256', 'catalog_ids', 'markets']);
  if (capture.schema_version !== 1 || capture.project_ref !== PROJECT || capture.scope_sha256 !== scopeHash(scope)) throw Error('Wrong project or coverage scope');
  const at = now.getTime(), captured = Date.parse(capture.captured_at);
  const midnight = Date.parse(String(capture.captured_at).slice(0, 10) + 'T00:00:00Z');
  if (typeof capture.captured_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(capture.captured_at) || !Number.isFinite(at) || !Number.isFinite(captured) || !Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== capture.captured_at.slice(0, 10) || Number(capture.captured_at.slice(11, 13)) > 23 || Number(capture.captured_at.slice(14, 16)) > 59 || Number(capture.captured_at.slice(17, 19)) > 59 || captured > at + 300000 || captured < at - DAY) throw Error('Capture must be fresh within one day');
  const ids = (value, label, catalog) => {
    if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || (catalog && !catalog.has(id))) || new Set(value).size !== value.length) throw Error('Invalid identities: ' + label);
    return value;
  };
  const catalog = new Set(ids(capture.catalog_ids, 'catalog'));
  if (!catalog.size || !Array.isArray(capture.markets) || capture.markets.length !== scope.markets.length) throw Error('Missing catalog or market coverage');
  const originals = new Set(scope.original_ids), seen = new Set();
  const fields = ['country_code', 'currency', 'private_rows', 'private_ids', 'private_currency_mismatches', 'old_postings', 'unknown_posting_dates', 'specification_conflicts', 'pending_observations', 'accepted_observations', 'accepted_ids', 'published_snapshots', 'published_ids', 'current_published_snapshots', 'current_published_ids', 'stale_published_snapshots', 'automated_approved_sources'];
  const rows = capture.markets.map(row => {
    exactKeys(row, fields);
    const expected = scope.markets.find(m => m.country_code === row.country_code);
    if (!expected || expected.currency !== row.currency || seen.has(row.country_code)) throw Error('Wrong or repeated market');
    seen.add(row.country_code);
    for (const field of fields.filter(key => !['country_code', 'currency'].includes(key) && !key.endsWith('_ids'))) count(row[field], field);
    for (const field of ['private_ids', 'accepted_ids', 'published_ids', 'current_published_ids']) ids(row[field], field, catalog);
    if (row.private_ids.length > row.private_rows - row.private_currency_mismatches || row.accepted_ids.length > row.accepted_observations || row.published_ids.length > row.published_snapshots || row.current_published_ids.length > row.current_published_snapshots || row.current_published_snapshots + row.stale_published_snapshots > row.published_snapshots || row.current_published_ids.some(id => !row.published_ids.includes(id)) || ['old_postings', 'unknown_posting_dates', 'specification_conflicts'].some(key => row[key] > row.private_rows) || row.old_postings + row.unknown_posting_dates > row.private_rows) throw Error('Inconsistent coverage counts');
    const privateSet = new Set(row.private_ids), current = new Set(row.current_published_ids);
    return { ...row, private_matches: privateSet.size, private_original_matches: row.private_ids.filter(id => originals.has(id)).length, private_missing_ids: [...catalog].filter(id => !privateSet.has(id)).sort(), current_published_matches: current.size, current_published_missing_ids: [...catalog].filter(id => !current.has(id)).sort() };
  }).sort((a, b) => a.country_code.localeCompare(b.country_code));
  const union = new Set(rows.flatMap(row => row.private_ids)), sum = key => rows.reduce((n, row) => n + row[key], 0);
  return { schemaVersion: 1, capturedAt: capture.captured_at, projectRef: PROJECT, scopeSha256: capture.scope_sha256, counts: { activeCatalog: catalog.size, supportedMarkets: rows.length, expectedIdentityMarketPairs: catalog.size * rows.length, originalIdentities: originals.size, expectedOriginalMarketPairs: originals.size * rows.length, privateDistinctIdentities: union.size, privateIdentityMarketPairs: sum('private_matches'), privateOriginalMarketPairs: sum('private_original_matches'), privateOriginalMissingMarketPairs: originals.size * rows.length - sum('private_original_matches'), privateMissingMarketPairs: catalog.size * rows.length - sum('private_matches'), currentPublishedIdentityMarketPairs: sum('current_published_matches'), currentPublishedMissingMarketPairs: catalog.size * rows.length - sum('current_published_matches') }, originalIdsMissingFromActiveCatalog: [...originals].filter(id => !catalog.has(id)).sort(), markets: rows, limitations: ['Private research is not accepted evidence or a public price.', 'Published counts are native status/freshness counters, not permission, comparability or public-export validation.', 'Coverage targets do not establish local availability or import eligibility for every vehicle in every country.', 'An observed listing or relative recency label does not establish original posting date, active stock or unique physical inventory.', 'This operator report contains no prices, listing URLs, contacts, VINs, images or public exports.'] };
}

if (require.main === module) {
  const [command, file, output] = process.argv.slice(2);
  if (command === 'sql' && process.argv.length === 3) process.stdout.write(captureSql());
  else if (command === 'report' && file && [4, 5].includes(process.argv.length)) {
    const report = auditCapture(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')));
    if (output) {
      fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify({ output, counts: report.counts }));
    } else console.log(JSON.stringify(report, null, 2));
  } else throw Error('Usage: audit-car-market-coverage.js sql | report COVERAGE_CAPTURE.json [OUTPUT.json]');
}
module.exports = { PROJECT, loadScope, validateScope, scopeHash, captureSql, auditCapture };
