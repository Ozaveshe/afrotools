#!/usr/bin/env node
// Export reviewed public ranges from an operator-supplied, project-verified capture.
// No network credentials, research rows, contacts or private observation IDs are exported.
const fs = require('node:fs');
const { vehicleIds } = require('./car-market-evidence');
const { cohort } = require('./car-market-cohort');
const PROJECT = 'zpclagtgczsygrgztlts';
const DAY = 86400000;
const approved = value => ['manual-only', 'automated-approved'].includes(value);
const fields = ['snapshot_id', 'vehicle_id', 'country_code', 'market', 'condition_label', 'currency', 'lower_quartile', 'median_ask', 'upper_quartile', 'sample_size', 'observed_from', 'observed_to', 'method', 'limitations', 'status', 'reviewed_at', 'published_at'];

function captureSql() {
  return `select jsonb_build_object(
  'project_ref', '${PROJECT}', 'queried_at', now(),
  'snapshots', coalesce(jsonb_agg(payload order by observed_to desc), '[]'::jsonb)) as capture
from (
  select s.observed_to, jsonb_build_object(
    ${fields.map(key => `'${key}', s.${key}`).join(',\n    ')},
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
      'observation_id', h.observation_id, 'listing_key', h.listing_key,
      'current_revision', o.observed_at = h.observed_at,
      'review_status', o.review_status, 'reviewed_at', o.reviewed_at,
      'vehicle_id', o.vehicle_id, 'country_code', o.country_code,
      'market', o.market, 'trim_label', o.trim_label, 'engine_cc', o.engine_cc,
      'history_cohort', jsonb_build_object('market', h.facts->'market',
        'trim_label', h.facts->'trim_label', 'engine_cc', h.facts->'engine_cc'),
      'condition_label', o.condition_label, 'currency', o.currency,
      'asking_price', o.asking_price, 'observed_at', o.observed_at,
      'listing_url', o.listing_url, 'source_id', o.source_id,
      'source_name', src.display_name, 'source_domain', src.domain,
      'source_access_status', src.access_status)), '[]'::jsonb)
      from unnest(s.observation_ids) ids(observation_id)
      left join public.car_market_observation_history h using (observation_id)
      left join public.car_market_listing_observations o on o.listing_key = h.listing_key
      left join public.car_market_sources src on src.source_id = o.source_id)
  ) payload
  from public.car_market_price_snapshots s
  where s.status = 'published'
) selected;`;
}

function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) throw Error('Invalid timestamp');
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw Error('Invalid timestamp');
  return time;
}
function text(value, name, max = 1000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[<>\r\n]/.test(value)) throw Error('Invalid ' + name);
  return value;
}
function number(value) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 1e12) throw Error('Invalid price');
  return parsed;
}
function quantile(sorted, fraction) {
  const position = (sorted.length - 1) * fraction, index = Math.floor(position);
  return sorted[index] + (sorted[Math.ceil(position)] - sorted[index]) * (position - index);
}
function exportCapture(capture, registry, { now = new Date(), vehicles = vehicleIds() } = {}) {
  const at = now.getTime();
  if (capture.project_ref !== PROJECT || !Number.isFinite(at)) throw Error('Wrong project or clock');
  const captured = timestamp(capture.queried_at);
  if (captured > at + 300000 || captured < at - DAY) throw Error('Capture must be fresh within one day');
  if (!Array.isArray(capture.snapshots) || capture.snapshots.length > 10000) throw Error('Invalid snapshots');
  const observations = [], excluded = [], seen = new Set();
  const sorted = [...capture.snapshots].sort((a, b) => (Date.parse(b.observed_to) - Date.parse(a.observed_to)) || (Date.parse(b.published_at) - Date.parse(a.published_at)));
  for (const s of sorted) {
    try {
      if (s.status !== 'published') throw Error('Not published');
      if (!vehicles.has(s.vehicle_id) || !/^[A-Z]{2}$/.test(s.country_code) || !/^[A-Z]{3}$/.test(s.currency) || !['foreign-used', 'local-used', 'new'].includes(s.condition_label)) throw Error('Invalid comparable identity');
      text(s.snapshot_id, 'snapshot ID', 80);
      const from = timestamp(s.observed_from), to = timestamp(s.observed_to), reviewed = timestamp(s.reviewed_at), published = timestamp(s.published_at);
      if (from > to || from < at - 14 * DAY || to > captured + 300000 || reviewed < to || published < reviewed || published > captured + 300000) throw Error('Stale or unordered review dates');
      if (!Number.isInteger(s.sample_size) || s.sample_size < 3 || !Array.isArray(s.members) || s.members.length !== s.sample_size) throw Error('Insufficient or inconsistent sample');
      const urls = new Set(), ids = new Set(), keys = new Set(), sources = new Map(), prices = [], observed = [];
      let group;
      for (const m of s.members) {
        const source = registry.sources[m.source_id];
        if (!source || !approved(source.access_status) || !approved(m.source_access_status) || source.domain !== m.source_domain) throw Error('Source permission withdrawn or unapproved');
        if (m.current_revision !== true || m.review_status !== 'accepted' || m.vehicle_id !== s.vehicle_id || m.country_code !== s.country_code || m.currency !== s.currency || m.condition_label !== s.condition_label) throw Error('Observation changed or not accepted');
        const current = cohort(m), historical = cohort(m.history_cohort || {});
        if (current.key !== historical.key) throw Error('Observation cohort differs from history');
        if (cohort({ ...m, market: s.market }).key !== current.key) throw Error('Snapshot market differs from members');
        if (group && current.key !== group.key) throw Error('Mixed market, trim or engine group');
        group = group || current;
        const time = timestamp(m.observed_at), checked = timestamp(m.reviewed_at);
        if (time < from || time > to || checked < time || checked > reviewed) throw Error('Invalid member review dates');
        const url = new URL(m.listing_url);
        if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !(url.hostname === source.domain || url.hostname.endsWith('.' + source.domain))) throw Error('Unsafe source URL');
        if (!m.observation_id || !m.listing_key || urls.has(url.href) || ids.has(m.observation_id) || keys.has(m.listing_key)) throw Error('Duplicate or missing member');
        urls.add(url.href); ids.add(m.observation_id); keys.add(m.listing_key);
        prices.push(number(m.asking_price)); observed.push(time);
        sources.set(url.href, { sourceId: m.source_id, sourceName: text(m.source_name, 'source name', 120), sourceUrl: url.href });
      }
      if (Math.min(...observed) !== from || Math.max(...observed) !== to) throw Error('Snapshot window mismatch');
      prices.sort((a, b) => a - b);
      const band = [s.lower_quartile, s.median_ask, s.upper_quartile].map(number);
      if (band.some((value, index) => Math.abs(value - quantile(prices, [0.25, 0.5, 0.75][index])) > 0.011)) throw Error('Snapshot prices differ from members');
      const key = JSON.stringify([s.vehicle_id, s.country_code, s.condition_label, s.currency, group.key]);
      if (seen.has(key)) throw Error('Older comparable snapshot');
      const result = { snapshotId: s.snapshot_id, vehicleId: s.vehicle_id, countryCode: s.country_code, condition: s.condition_label, currency: s.currency, market: text(s.market, 'market', 120).trim(), trimLabel: group.trimLabel, engineCc: group.engineCc, lowerQuartile: band[0], median: band[1], upperQuartile: band[2], sampleSize: s.sample_size, observedFrom: new Date(from).toISOString(), observedTo: new Date(to).toISOString(), reviewedAt: new Date(reviewed).toISOString(), expiresAt: new Date(from + 14 * DAY).toISOString(), method: text(s.method, 'method'), limitations: text(s.limitations, 'limitations'), sources: [...sources.values()] };
      seen.add(key); observations.push(result);
    } catch (error) { excluded.push({ snapshotId: s.snapshot_id || null, reason: error.message }); }
  }
  return { publicPack: { schemaVersion: 1, generatedAt: now.toISOString(), observations }, excluded };
}

if (require.main === module) {
  const [command, input, registry, output] = process.argv.slice(2);
  if (command === 'sql') process.stdout.write(captureSql());
  else if (command === 'export' && input && registry && output) {
    const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    const result = exportCapture(read(input), read(registry));
    fs.writeFileSync(output, JSON.stringify(result.publicPack, null, 2) + '\n');
    console.log(JSON.stringify({ exported: result.publicPack.observations.length, excluded: result.excluded }));
  } else throw Error('Usage: car-market-public-export.js sql | export CAPTURE.json REGISTRY.json OUTPUT.json');
}
module.exports = { captureSql, exportCapture };
