'use strict';

const fs = require('fs');
const path = require('path');

const { validateDataForKey } = require('../netlify/functions/_shared/live-data-contracts');
const freshness = require('../netlify/functions/api-data-freshness')._test;

const ROOT = path.resolve(__dirname, '..');
const PROJECT_REF = 'zpclagtgczsygrgztlts';
const DEFAULT_SUPABASE_URL = 'https://' + PROJECT_REF + '.supabase.co';
const META_PATH = path.join(ROOT, 'data', '_meta.json');
const FUEL_SOURCE_WORKFLOW_PATH = path.join(ROOT, 'data', 'fuel', 'official-source-workflow.json');

const DATASETS = Object.freeze([
  { category: 'forex', storageKey: 'forex-latest', filePath: path.join(ROOT, 'data', 'forex', 'latest.json') },
  { category: 'fuel', storageKey: 'fuel-latest', filePath: path.join(ROOT, 'data', 'fuel', 'latest.json') },
  { category: 'rates', storageKey: 'rates-latest', filePath: path.join(ROOT, 'data', 'rates', 'latest.json') },
  { category: 'commodities', storageKey: 'commodity-prices-latest', filePath: path.join(ROOT, 'data', 'commodities', 'latest.json') },
]);

function getSupabaseConfig() {
  const url = String(
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_AUTH_URL ||
    DEFAULT_SUPABASE_URL
  ).replace(/\/$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
    '';

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (_error) {
    throw new Error('Invalid Supabase URL: ' + url);
  }
  if (hostname !== PROJECT_REF + '.supabase.co') {
    throw new Error('Refusing to read a non-AfroTools Supabase project: ' + hostname);
  }
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_DATA_SERVICE_ROLE_KEY).');
  }

  return { url, key };
}

async function fetchLiveRow(config, key) {
  const endpoint = config.url + '/rest/v1/live_data_store?key=eq.' + encodeURIComponent(key) + '&select=key,data,updated_at';
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + config.key,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Supabase read failed for ' + key + ': HTTP ' + response.status + ' ' + (await response.text()));
  }
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || !rows[0].data) {
    throw new Error('Expected one live_data_store row for ' + key + '.');
  }
  return rows[0];
}

function canonicalTimestamp(payload) {
  const value = freshness.findTimestamp(payload);
  const milliseconds = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : null;
}

function enrichFuelSourceMetadata(payload) {
  if (!payload || !Array.isArray(payload.countries)) return payload;
  const workflow = JSON.parse(fs.readFileSync(FUEL_SOURCE_WORKFLOW_PATH, 'utf8'));
  const sourcesByCode = new Map((workflow.priority_countries || []).map(function (item) {
    return [item.code, item];
  }));

  payload.countries.forEach(function (country) {
    const source = sourcesByCode.get(country.code);
    if (!source) return;
    country.official_verified = country.official_verified === true;
    country.official_source_name = source.authority;
    country.official_source_url = source.source_url;
    country.official_source_state = source.source_state;
  });
  payload.official_verified_count = payload.countries.filter(function (country) {
    return country.official_verified === true;
  }).length;
  payload.source_reviewed_at = workflow.reviewed_at || payload.source_reviewed_at;
  return payload;
}

function validateSnapshot(dataset, payload, nowMs) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(dataset.category + ' snapshot must be an object.');
  }

  const asOf = canonicalTimestamp(payload);
  if (!asOf) throw new Error(dataset.category + ' snapshot has no valid freshness timestamp.');

  const threshold = freshness.CATEGORY_CONFIGS[dataset.category].thresholds.stale;
  const rawAge = (nowMs - new Date(asOf).getTime()) / 60000;
  const age = freshness.ageMinutes(asOf, nowMs);
  if (!Number.isFinite(rawAge) || rawAge < -5 || age > threshold) {
    throw new Error(dataset.category + ' live snapshot is outside its stale threshold (' + Math.round(rawAge) + 'm; limit ' + threshold + 'm).');
  }

  const contractResult = validateDataForKey(dataset.storageKey, payload, new Date(nowMs).toISOString());
  if (!contractResult.valid) {
    throw new Error(dataset.category + ' live snapshot violates its data contract: ' + contractResult.errors.join('; '));
  }

  return asOf;
}

function countRecords(category, payload) {
  if (Number.isFinite(Number(payload.record_count))) return Number(payload.record_count);
  if (category === 'forex' && payload.rates) return Object.keys(payload.rates).length;
  if ((category === 'fuel' || category === 'rates') && Array.isArray(payload.countries)) return payload.countries.length;
  if (category === 'commodities' && Array.isArray(payload.commodities)) return payload.commodities.length;
  return undefined;
}

function atomicWriteJson(targetPath, value) {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = path.join(
    directory,
    '.' + path.basename(targetPath) + '.' + process.pid + '.' + Date.now() + '.tmp'
  );

  try {
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_cleanupError) {
      // Preserve the original write/rename failure.
    }
    throw error;
  }
}

function buildMetaEntry(existing, remote, payload, asOf, category) {
  const entry = Object.assign({}, existing || {}, remote || {});
  const recordCount = countRecords(category, payload);

  entry.last_fetch = asOf;
  entry.source = payload.source || entry.source || 'live_data_store';
  entry.status = 'ok';
  entry.error = null;
  entry.as_of = asOf;
  if (payload.source_state) entry.source_state = payload.source_state;
  if (payload.source_reviewed_at) entry.source_reviewed_at = payload.source_reviewed_at;
  if (Number.isFinite(Number(payload.official_verified_count))) {
    entry.official_verified_count = Number(payload.official_verified_count);
  }
  if (recordCount !== undefined) entry.record_count = recordCount;

  return entry;
}

async function refreshStaticFallbacks() {
  const config = getSupabaseConfig();
  const nowMs = Date.now();
  const rows = await Promise.all(DATASETS.map(function (dataset) {
    return fetchLiveRow(config, dataset.storageKey);
  }));
  const metaRow = await fetchLiveRow(config, 'meta');

  const snapshots = DATASETS.map(function (dataset, index) {
    const payload = dataset.category === 'fuel'
      ? enrichFuelSourceMetadata(rows[index].data)
      : rows[index].data;
    return {
      dataset,
      payload,
      asOf: validateSnapshot(dataset, payload, nowMs),
    };
  });

  const localMeta = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf8')) : {};
  const remoteMeta = metaRow.data && typeof metaRow.data === 'object' ? metaRow.data : {};
  const nextMeta = Object.assign({}, localMeta);

  snapshots.forEach(function (snapshot) {
    nextMeta[snapshot.dataset.category] = buildMetaEntry(
      localMeta[snapshot.dataset.category],
      remoteMeta[snapshot.dataset.category],
      snapshot.payload,
      snapshot.asOf,
      snapshot.dataset.category
    );
  });

  snapshots.forEach(function (snapshot) {
    atomicWriteJson(snapshot.dataset.filePath, snapshot.payload);
    console.log('Refreshed ' + path.relative(ROOT, snapshot.dataset.filePath) + ' (as of ' + snapshot.asOf + ')');
  });
  atomicWriteJson(META_PATH, nextMeta);
  console.log('Reconciled data/_meta.json for ' + snapshots.length + ' static fallbacks.');
}

if (require.main === module) {
  refreshStaticFallbacks().catch(function (error) {
    console.error('Static fallback refresh failed: ' + (error.stack || error.message));
    process.exit(1);
  });
}

module.exports = {
  DATASETS,
  META_PATH,
  PROJECT_REF,
  atomicWriteJson,
  canonicalTimestamp,
  enrichFuelSourceMetadata,
  refreshStaticFallbacks,
  validateSnapshot,
};
