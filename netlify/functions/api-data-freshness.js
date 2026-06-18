/**
 * AfroTools - Data Freshness API
 *
 * Public response: safe status/count summaries for live-data categories,
 * market-data sources, scholarship feed freshness, and the source-health
 * watchdog. Admin requests with x-admin-key include deeper source rows.
 */

const { getData } = require('./_shared/data-store');
const { loadScholarshipFeed, SCHOLARSHIP_PUBLIC_MIN_COUNT } = require('./_shared/scholarship-platform');
const { getCollector } = require('./_shared/market-data-refresh');
const { getAllowedOrigin } = require('./utils/cors');

const DEFAULT_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

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
    metaKey: 'agri_inputs',
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
  const secret = cleanEnv(process.env.ADMIN_KEY || process.env.ADMIN_SECRET);
  const header = getHeader(event, 'x-admin-key');
  return !!secret && !!header && header === secret;
}

function getSupabaseUrl() {
  const candidate = cleanEnv(
    process.env.SUPABASE_AUTH_URL ||
    process.env.SUPABASE_DATA_URL ||
    process.env.SUPABASE_URL
  );
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(candidate) ? candidate : DEFAULT_SUPABASE_URL;
}

function getSupabaseKey() {
  return cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_AUTH_SERVICE_KEY
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

async function supabaseGet(path) {
  const key = getSupabaseKey();
  if (!key) return { skipped: true, reason: 'supabase_service_key_missing' };

  const response = await fetch(getSupabaseUrl() + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
    },
  });

  if (!response.ok) {
    throw new Error('Supabase ' + response.status + ' reading ' + path.split('?')[0]);
  }

  return { rows: await response.json() };
}

async function buildCategoryStatus(cat, config, meta, now) {
  const catMeta = meta[config.metaKey] || meta[cat] || {};
  let updatedAt = findTimestamp(catMeta);
  let blobPresent = false;

  if (!updatedAt) {
    const blob = await getData(config.blobKey);
    blobPresent = !!blob;
    updatedAt = findTimestamp(blob);
  }

  const age = ageMinutes(updatedAt, now);
  const derivedStatus = catMeta.status === 'ok'
    ? getStatus(age, config.thresholds)
    : (catMeta.status || getStatus(age, config.thresholds));

  return {
    updatedAt,
    status: derivedStatus,
    source: catMeta.source || null,
    source_type: catMeta.source_type || null,
    age_minutes: age,
    records_count: catMeta.records_count || null,
    confidence: catMeta.confidence || null,
    blob_key: config.blobKey,
    blob_present: blobPresent,
  };
}

async function buildMarketDataSummary(includeAdmin) {
  try {
    const [sourcesResult, runsResult] = await Promise.all([
      supabaseGet('market_data_sources?select=id,dataset,source_key,active,last_success_at,last_error_at,cadence_hours,ttl_hours&active=eq.true&order=dataset.asc,source_key.asc'),
      supabaseGet('market_data_source_runs?select=id,source_id,dataset,status,started_at,finished_at,records_inserted,records_published,error_summary&order=started_at.desc&limit=50'),
    ]);

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

async function buildScholarshipSummary() {
  try {
    const feed = await loadScholarshipFeed();
    const meta = feed.meta || {};
    const count = Array.isArray(feed.scholarships) ? feed.scholarships.length : 0;
    return {
      available: true,
      count,
      mode: meta.mode || null,
      label: meta.label || null,
      stale: !!meta.stale,
      isDegraded: !!meta.isDegraded,
      isLimited: !!meta.isLimited,
      lastCheckedAt: meta.lastCheckedAt || meta.cachedAt || null,
      claimSafeLabel: count + ' Scholarship' + (count === 1 ? '' : 's'),
      publicMinCount: SCHOLARSHIP_PUBLIC_MIN_COUNT,
      status: count > 0 && !meta.stale && !meta.isDegraded ? (meta.isLimited ? 'limited' : 'ok') : 'degraded',
    };
  } catch (error) {
    return {
      available: false,
      status: 'error',
      error: sanitizeError(error),
    };
  }
}

async function buildWatchdogSummary(includeAdmin) {
  const latest = await getData('automation-health-latest');
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
  if (stale > 0 || degraded > 0 || marketData.status === 'degraded' || scholarship.status === 'degraded' || watchdog.status !== 'ok') {
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
  const meta = (await getData('meta')) || {};
  const now = Date.now();
  const categories = {};

  const cats = requestedCat ? [requestedCat] : Object.keys(CATEGORY_CONFIGS);
  for (const cat of cats) {
    const config = CATEGORY_CONFIGS[cat];
    if (!config) continue;
    categories[cat] = await buildCategoryStatus(cat, config, meta, now);
  }

  const marketData = await buildMarketDataSummary(includeAdmin);
  const scholarship = await buildScholarshipSummary();
  const automationWatchdog = await buildWatchdogSummary(includeAdmin);
  const overallHealth = computeOverallHealth(categories, marketData, scholarship, automationWatchdog);

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      categories,
      market_data: marketData,
      scholarship,
      automation_watchdog: automationWatchdog,
      overall_health: overallHealth,
      checked_at: new Date().toISOString(),
    }),
  };
};
