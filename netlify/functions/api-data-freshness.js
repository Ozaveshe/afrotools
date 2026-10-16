/**
 * AfroTools - Data Freshness API
 *
 * Public response: safe status/count summaries for live-data categories,
 * market-data sources, scholarship feed freshness, and the source-health
 * watchdog. Admin requests with x-admin-key include deeper source rows.
 */

const { getData } = require('./_shared/data-store');
const { getCollector } = require('./_shared/market-data-refresh');
const { getAllowedOrigin } = require('./utils/cors');
const { getEnv } = require('./_shared/env');

const DEFAULT_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const READ_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 10000;

// One request budget covers headers AND response bodies. The explicit race also
// bounds read adapters that do not honor AbortSignal; only read operations belong here.
async function readWithDeadline(operation, deadline) {
  const timeout = Math.min(READ_TIMEOUT_MS, (deadline || Date.now() + READ_TIMEOUT_MS) - Date.now());
  const controller = new AbortController();
  let timer;
  const error = new Error('Freshness read deadline exceeded');
  error.name = 'TimeoutError';
  if (timeout <= 0) throw error;
  const expired = new Promise(function (_resolve, reject) {
    timer = setTimeout(function () {
      reject(error);
      controller.abort(error);
    }, timeout);
  });
  try {
    return await Promise.race([Promise.resolve().then(function () {
      return operation(controller.signal);
    }), expired]);
  } finally {
    clearTimeout(timer);
    // Release a rejected/non-OK fetch body too; successful JSON is already detached.
    if (!controller.signal.aborted) controller.abort();
  }
}

const CATEGORY_CONFIGS = {
  forex: {
    blobKey: 'forex-latest',
    metaKey: 'forex',
    thresholds: { live: 1440, ok: 2880, stale: 10080 },
  },
  fuel: {
    blobKey: 'fuel-latest',
    metaKey: 'fuel',
    thresholds: { live: 720, ok: 4320, stale: 10080 },
  },
  commodities: {
    blobKey: 'commodity-prices-latest',
    metaKey: 'commodities',
    thresholds: { live: 1440, ok: 4320, stale: 10080 },
  },
  electricity: {
    blobKey: 'electricity-latest',
    metaKey: 'electricity',
    thresholds: { live: 1440, ok: 10080, stale: 43200 },
  },
  telecom: {
    blobKey: 'telecom-latest',
    metaKey: 'telecom',
    thresholds: { live: 720, ok: 4320, stale: 10080 },
  },
  rates: {
    blobKey: 'rates-latest',
    metaKey: 'rates',
    thresholds: { live: 1440, ok: 4320, stale: 10080 },
  },
  insurance: {
    blobKey: 'insurance-rates-latest',
    metaKey: 'insurance',
    thresholds: { live: 10080, ok: 20160, stale: 43200 },
  },
  property: {
    blobKey: 'property-prices-latest',
    metaKey: 'property',
    thresholds: { live: 10080, ok: 20160, stale: 43200 },
  },
  salaries: {
    blobKey: 'salary-benchmarks-latest',
    metaKey: 'salaries',
    thresholds: { live: 10080, ok: 20160, stale: 43200 },
  },
  stocks: {
    blobKey: 'stock-indices-latest',
    metaKey: 'stocks',
    thresholds: { live: 1440, ok: 2880, stale: 10080 },
  },
  shipping: {
    blobKey: 'shipping-rates-latest',
    metaKey: 'shipping',
    thresholds: { live: 10080, ok: 20160, stale: 43200 },
  },
  agri_inputs: {
    blobKey: 'agri-inputs-latest',
    metaKey: 'agriculture',
    thresholds: { live: 10080, ok: 20160, stale: 43200 },
  },
  crypto: {
    blobKey: 'crypto-latest',
    metaKey: 'crypto',
    thresholds: { live: 120, ok: 360, stale: 1440 },
  },
};

function cleanEnv(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function getHeader(event, headerName) {
  const headers = event.headers || {};
  const expected = String(headerName || '').toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) return headers[key];
  }
  return '';
}

function isAdmin(event) {
  const secret = cleanEnv(getEnv('ADMIN_KEY') || getEnv('ADMIN_SECRET'));
  const header = getHeader(event, 'x-admin-key');
  return !!secret && !!header && header === secret;
}

function getSupabaseUrl() {
  const candidate = cleanEnv(
    getEnv('SUPABASE_AUTH_URL') ||
    getEnv('SUPABASE_DATA_URL') ||
    getEnv('SUPABASE_URL')
  );
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(candidate) ? candidate : DEFAULT_SUPABASE_URL;
}

function getSupabaseKey() {
  return cleanEnv(
    getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    getEnv('SUPABASE_DATA_SERVICE_ROLE_KEY') ||
    getEnv('SUPABASE_SERVICE_KEY') ||
    getEnv('SUPABASE_AUTH_SERVICE_KEY')
  );
}

function sanitizeError(error) {
  return String(error && error.message ? error.message : error || 'Unknown error')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/apikey["']?\s*[:=]\s*["']?[A-Za-z0-9._-]+/gi, 'apikey=[redacted]')
    .slice(0, 220);
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function findTimestamp(data) {
  if (!data || typeof data !== 'object') return null;
  return toIso(
    data.last_fetch ||
    data.updated_at ||
    data.timestamp ||
    data.fetched_at ||
    data.last_updated ||
    data.lastCheckedAt ||
    data.cachedAt
  );
}

function ageMinutes(timestamp, now) {
  const iso = toIso(timestamp);
  if (!iso) return null;
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
}

function getStatus(age, thresholds) {
  if (age === null) return 'offline';
  if (age <= thresholds.live) return 'live';
  if (age <= thresholds.ok) return 'ok';
  if (age <= thresholds.stale) return 'stale';
  return 'offline';
}

function claimSafeStatus(timestamp, source, reportedStatus, thresholds, now) {
  const age = ageMinutes(timestamp, now);
  if (!timestamp || !source || age === null) return 'offline';
  const observedStatus = getStatus(age, thresholds);
  const normalizedReported = ['live', 'ok', 'stale', 'offline'].includes(reportedStatus)
    ? reportedStatus
    : observedStatus;
  const rank = { live: 0, ok: 1, stale: 2, offline: 3 };
  return rank[normalizedReported] > rank[observedStatus] ? normalizedReported : observedStatus;
}

async function supabaseGet(path, deadline) {
  const key = getSupabaseKey();
  if (!key) return { skipped: true, reason: 'supabase_service_key_missing' };

  return readWithDeadline(async function (signal) {
    const response = await fetch(getSupabaseUrl() + '/rest/v1/' + path, {
      signal,
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
      },
    });
    if (!response.ok) {
      throw new Error('Supabase ' + response.status + ' reading ' + path.split('?')[0]);
    }
    return { rows: await response.json() };
  }, deadline);
}

async function buildCategoryStatus(cat, config, meta, now, read = getData) {
  const catMeta = meta[config.metaKey] || meta[cat] || {};
  if (cat === 'shipping') {
    const payload = await read(config.blobKey);
    return {...require('./_shared/shipping-reference').referenceStatus(payload,catMeta,now,config.thresholds.live,
      require('./scheduled-fetch-shipping')._referenceCatalog),blob_key:config.blobKey};
  }
  if (['insurance','property','salaries'].includes(cat)) {
    const payload = await read(config.blobKey);
    return {...require('./_shared/reference-feeds').referenceStatus(cat,payload,catMeta,now,config.thresholds.live),blob_key:config.blobKey};
  }
  if (cat === 'agri_inputs') {
    const payload = await read(config.blobKey);
    return { ...require('./_shared/agri-reference').referenceStatus(payload, catMeta, now, config.thresholds.live), blob_key: config.blobKey };
  }
  let updatedAt = findTimestamp(catMeta);
  let source = catMeta.source || null;
  let blobPresent = false;

  if (!updatedAt || !source) {
    const blob = await read(config.blobKey);
    blobPresent = !!blob;
    updatedAt = updatedAt || findTimestamp(blob);
    source = source || (blob && blob.source) || null;
  }

  const age = ageMinutes(updatedAt, now);
  const derivedStatus = claimSafeStatus(updatedAt, source, catMeta.status, config.thresholds, now);

  return {
    updatedAt,
    status: derivedStatus,
    source,
    source_type: catMeta.source_type || null,
    age_minutes: age,
    records_count: catMeta.records_count || null,
    confidence: catMeta.confidence || null,
    blob_key: config.blobKey,
    blob_present: blobPresent,
  };
}

async function buildMarketDataSummary(includeAdmin, deadline) {
  try {
    const results = await Promise.allSettled([
      supabaseGet('market_data_sources?select=id,dataset,source_key,active,last_success_at,last_error_at,cadence_hours,ttl_hours&active=eq.true&order=dataset.asc,source_key.asc', deadline),
      supabaseGet('market_data_source_runs?select=id,source_id,dataset,status,started_at,finished_at,records_inserted,records_published,error_summary&order=started_at.desc&limit=50', deadline),
    ]);
    // Both reads have the same bounded budget. Settle both before returning so
    // the first error cannot leave a sibling fetch/body running in this handler.
    const rejected = results.find(result => result.status === 'rejected');
    if (rejected) throw rejected.reason;
    const [sourcesResult, runsResult] = results.map(result => result.value);

    if (sourcesResult.skipped || runsResult.skipped) {
      return {
        available: false,
        reason: 'supabase_service_key_missing',
      };
    }

    const now = Date.now();
    const sources = Array.isArray(sourcesResult.rows) ? sourcesResult.rows : [];
    const refreshManagedSources = sources.filter(function (source) {
      return !!getCollector(source);
    });
    const runs = Array.isArray(runsResult.rows) ? runsResult.rows : [];
    const recentCutoff = now - (7 * 24 * 60 * 60 * 1000);
    const recentRuns = runs.filter(function (run) {
      const started = new Date(run.started_at || run.finished_at || 0).getTime();
      return Number.isFinite(started) && started >= recentCutoff;
    });
    const latestRunBySource = {};
    recentRuns.forEach(function (run) {
      const key = (run.source_id || run.dataset || run.id) + ':' + (run.dataset || '');
      if (!latestRunBySource[key]) latestRunBySource[key] = run;
    });
    const latestRecentRuns = Object.keys(latestRunBySource).map(function (key) {
      return latestRunBySource[key];
    });
    const failedRuns = latestRecentRuns.filter(function (run) {
      return ['failed', 'error'].includes(String(run.status || '').toLowerCase());
    });
    const staleSources = refreshManagedSources.filter(function (source) {
      const cadenceHours = Number(source.cadence_hours || source.ttl_hours || 24);
      const threshold = Math.max(cadenceHours * 2 * 60, 1440);
      const age = ageMinutes(source.last_success_at, now);
      return age === null || age > threshold;
    });

    const safe = {
      available: true,
      active_sources: sources.length,
      refresh_managed_sources: refreshManagedSources.length,
      recent_runs: recentRuns.length,
      failed_recent_runs: failedRuns.length,
      stale_sources: staleSources.length,
      status: failedRuns.length || staleSources.length ? 'degraded' : 'ok',
    };

    if (includeAdmin) {
      safe.sources = sources;
      safe.recent_runs = recentRuns;
      safe.failed_runs = failedRuns;
      safe.stale_source_rows = staleSources;
    }

    return safe;
  } catch (error) {
    return {
      available: false,
      status: 'error',
      error: sanitizeError(error),
    };
  }
}

async function buildScholarshipSummary(read) {
  try {
    // A status GET must not import the mirror/sync pipeline or trigger its writes.
    const cached = await read('scholarships-latest');
    if (!cached) return { available: false, status: 'missing', reason: 'scholarship_cache_missing' };
    const meta = cached.meta || {};
    const rows = Array.isArray(cached) ? cached : (Array.isArray(cached.data) ? cached.data : cached.scholarships);
    const count = Array.isArray(rows) ? rows.length : 0;
    const configuredMin = parseInt(getEnv('SCHOLARSHIP_PUBLIC_MIN_COUNT') || getEnv('PUBLIC_MIN_SCHOLARSHIP_COUNT'), 10);
    // Match the producer's default without importing its side-effectful module.
    const publicMinCount = configuredMin > 0 ? configuredMin : 50;
    const isLimited = count > 0 && count < publicMinCount;
    return {
      available: count > 0,
      count,
      mode: 'cached',
      label: isLimited ? 'Limited cached feed' : 'Cached feed',
      stale: true,
      isDegraded: true,
      isLimited,
      lastCheckedAt: toIso(meta.lastCheckedAt || meta.cachedAt || cached.timestamp || cached.cachedAt),
      claimSafeLabel: count + ' Scholarship' + (count === 1 ? '' : 's'),
      publicMinCount,
      status: count > 0 && isLimited ? 'limited' : 'degraded',
    };
  } catch (error) {
    return {
      available: false,
      status: 'error',
      error: sanitizeError(error),
    };
  }
}

async function buildWatchdogSummary(includeAdmin, read) {
  const latest = await read('automation-health-latest');
  if (!latest) {
    return {
      available: false,
      status: 'missing',
    };
  }

  const safe = {
    available: true,
    ok: !!latest.ok,
    checked_at: latest.checked_at || null,
    stale_count: Array.isArray(latest.stale) ? latest.stale.length : 0,
    degraded_count: Array.isArray(latest.degraded) ? latest.degraded.length : 0,
    failure_count: Array.isArray(latest.failures) ? latest.failures.length : 0,
    warning_count: Array.isArray(latest.warnings) ? latest.warnings.length : 0,
    status: latest.ok ? 'ok' : 'degraded',
  };

  if (includeAdmin) {
    safe.details = latest;
  } else {
    safe.stale = Array.isArray(latest.stale) ? latest.stale : [];
    safe.degraded = Array.isArray(latest.degraded) ? latest.degraded : [];
    safe.failures = Array.isArray(latest.failures) ? latest.failures : [];
  }

  return safe;
}

function computeOverallHealth(categories, marketData, scholarship, watchdog) {
  const categoryValues = Object.values(categories);
  const offline = categoryValues.filter(function (cat) { return cat.status === 'offline'; }).length;
  const stale = categoryValues.filter(function (cat) { return cat.status === 'stale'; }).length;
  const degraded = categoryValues.filter(function (cat) {
    return cat.status && !['live', 'ok'].includes(cat.status);
  }).length;

  if (offline > 0 || watchdog.failure_count > 0 || marketData.status === 'error' || scholarship.status === 'error') return 'stale';
  if (stale > 0 || degraded > 0 || marketData.available === false || scholarship.available === false ||
      marketData.status === 'degraded' || ['degraded', 'limited'].includes(scholarship.status) || watchdog.status !== 'ok') {
    return 'degraded';
  }
  return 'healthy';
}

exports.handler = async function(event) {
  const origin = getAllowedOrigin(event);
  const includeAdmin = isAdmin(event);
  const CORS = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': includeAdmin ? 'no-store' : 'public, max-age=60, s-maxage=120',
    Vary: 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const requestedCat = params.cat || null;
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  const read = key => readWithDeadline(() => getData(key), deadline);
  let meta = {};
  let metadata;
  try {
    const snapshot = await read('meta');
    meta = snapshot || {};
    metadata = { available: !!snapshot, status: snapshot ? 'ok' : 'missing' };
  } catch (error) {
    metadata = { available: false, status: 'error', error: sanitizeError(error) };
  }
  const now = Date.now();
  const categories = {};

  const cats = requestedCat ? [requestedCat] : Object.keys(CATEGORY_CONFIGS);
  const [, marketData, scholarship, automationWatchdog] = await Promise.all([
    Promise.all(cats.filter(cat => CATEGORY_CONFIGS[cat]).map(async function (cat) {
      const config = CATEGORY_CONFIGS[cat];
      try {
        categories[cat] = await buildCategoryStatus(cat, config, meta, now, read);
      } catch (error) {
        categories[cat] = { ...await buildCategoryStatus(cat, config, {}, now, async () => null),
          available: false, error: sanitizeError(error) };
      }
    })),
    buildMarketDataSummary(includeAdmin, deadline),
    buildScholarshipSummary(read),
    buildWatchdogSummary(includeAdmin, read).catch(error => ({ available: false, status: 'error', error: sanitizeError(error) })),
  ]);
  const overallHealth = metadata.available ? computeOverallHealth(categories, marketData, scholarship, automationWatchdog) : 'stale';

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      categories,
      metadata,
      market_data: marketData,
      scholarship,
      automation_watchdog: automationWatchdog,
      overall_health: overallHealth,
      checked_at: new Date().toISOString(),
    }),
  };
};

exports._test = {
  buildCategoryStatus,
  CATEGORY_CONFIGS,
  ageMinutes,
  claimSafeStatus,
  findTimestamp,
  getStatus,
  readWithDeadline,
  READ_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
};

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-data-freshness' });
