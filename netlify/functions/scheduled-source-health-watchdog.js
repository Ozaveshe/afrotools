const { getData, setData } = require('./_shared/data-store');
const { loadScholarshipFeed, SCHOLARSHIP_PUBLIC_MIN_COUNT } = require('./_shared/scholarship-platform');
const { getCollector } = require('./_shared/market-data-refresh');
const { isEmailConfigured, sendEmail } = require('./_shared/email-adapter');
const { isScheduledEvent } = require('./_shared/scheduled-event');

const WATCHDOG_KEY = 'automation-health-latest';
const DEFAULT_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

const LIVE_DATA_WATCHES = [
  { id: 'forex', blobKey: 'forex-latest', metaKey: 'forex', staleAfterMinutes: 2880, severity: 'p1' },
  { id: 'fuel', blobKey: 'fuel-latest', metaKey: 'fuel', staleAfterMinutes: 4320, severity: 'p1' },
  { id: 'rates', blobKey: 'rates-latest', metaKey: 'rates', staleAfterMinutes: 4320, severity: 'p2' },
  { id: 'commodities', blobKey: 'commodity-prices-latest', metaKey: 'commodities', staleAfterMinutes: 4320, severity: 'p2' },
  { id: 'electricity', blobKey: 'electricity-latest', metaKey: 'electricity', staleAfterMinutes: 10080, severity: 'p2' },
  { id: 'telecom', blobKey: 'telecom-latest', metaKey: 'telecom', staleAfterMinutes: 4320, severity: 'p2' },
  { id: 'insurance', blobKey: 'insurance-rates-latest', metaKey: 'insurance', staleAfterMinutes: 10080, severity: 'p3' },
  { id: 'property', blobKey: 'property-prices-latest', metaKey: 'property', staleAfterMinutes: 10080, severity: 'p3' },
  { id: 'salaries', blobKey: 'salary-benchmarks-latest', metaKey: 'salaries', staleAfterMinutes: 10080, severity: 'p3' },
  { id: 'stocks', blobKey: 'stock-indices-latest', metaKey: 'stocks', staleAfterMinutes: 1440, severity: 'p2' },
  { id: 'shipping', blobKey: 'shipping-rates-latest', metaKey: 'shipping', staleAfterMinutes: 10080, severity: 'p3' },
  { id: 'agri_inputs', blobKey: 'agri-inputs-latest', metaKey: 'agri_inputs', staleAfterMinutes: 10080, severity: 'p3' },
  { id: 'crypto', blobKey: 'crypto-latest', metaKey: 'crypto', staleAfterMinutes: 360, severity: 'p1' }
];

function cleanEnv(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
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

function getHeader(event, headerName) {
  const headers = event && event.headers ? event.headers : {};
  const expected = String(headerName || '').toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) return headers[key];
  }
  return '';
}

function isScheduledInvocation(event) {
  return isScheduledEvent(event);
}

function isAdminRequest(event) {
  const adminSecret = cleanEnv(process.env.ADMIN_KEY || process.env.ADMIN_SECRET);
  const adminKey = getHeader(event, 'x-admin-key');
  return !!adminSecret && !!adminKey && adminKey === adminSecret;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function ageMinutes(value, nowMs) {
  const iso = toIso(value);
  if (!iso) return null;
  return Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 60000));
}

function firstTimestamp(record) {
  if (!record || typeof record !== 'object') return null;
  return toIso(
    record.last_fetch ||
    record.updated_at ||
    record.timestamp ||
    record.fetched_at ||
    record.last_updated ||
    record.lastCheckedAt ||
    record.cachedAt
  );
}

function sanitizeError(error) {
  return String(error && error.message ? error.message : error || 'Unknown error')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/apikey["']?\s*[:=]\s*["']?[A-Za-z0-9._-]+/gi, 'apikey=[redacted]')
    .slice(0, 220);
}

function pushIssue(summary, bucket, issue) {
  const item = {
    id: issue.id,
    surface: issue.surface || issue.id,
    severity: issue.severity || 'p2',
    message: issue.message,
    age_minutes: issue.age_minutes == null ? null : issue.age_minutes,
    updated_at: issue.updated_at || null,
  };
  summary[bucket].push(item);
  if (bucket === 'failures') {
    summary.ok = false;
  } else if (bucket === 'stale' || bucket === 'degraded') {
    summary.ok = false;
  }
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

async function checkLiveDataMeta(summary, nowMs) {
  const meta = (await getData('meta')) || {};
  const categories = [];

  for (const watch of LIVE_DATA_WATCHES) {
    const catMeta = meta[watch.metaKey] || meta[watch.id] || {};
    let updatedAt = firstTimestamp(catMeta);
    let blobSeen = false;

    if (!updatedAt) {
      const blob = await getData(watch.blobKey);
      blobSeen = !!blob;
      updatedAt = firstTimestamp(blob);
    }

    const age = ageMinutes(updatedAt, nowMs);
    const status = String(catMeta.status || (updatedAt ? 'unknown' : 'missing'));
    const item = {
      id: watch.id,
      blob_key: watch.blobKey,
      status,
      updated_at: updatedAt,
      age_minutes: age,
      stale_after_minutes: watch.staleAfterMinutes,
      severity: watch.severity,
      blob_seen: blobSeen,
      records_count: catMeta.records_count || null,
      source: catMeta.source || null,
    };
    categories.push(item);

    if (age === null) {
      pushIssue(summary, 'stale', {
        id: watch.id,
        surface: 'live_data_meta',
        severity: watch.severity,
        message: 'No live-data timestamp found for ' + watch.id,
      });
    } else if (age > watch.staleAfterMinutes) {
      pushIssue(summary, 'stale', {
        id: watch.id,
        surface: 'live_data_meta',
        severity: watch.severity,
        message: watch.id + ' is older than its watchdog threshold',
        age_minutes: age,
        updated_at: updatedAt,
      });
    } else if (!['ok', 'live', 'unknown'].includes(status)) {
      pushIssue(summary, 'degraded', {
        id: watch.id,
        surface: 'live_data_meta',
        severity: watch.severity,
        message: watch.id + ' meta status is ' + status,
        age_minutes: age,
        updated_at: updatedAt,
      });
    }
  }

  summary.sources.live_data_meta = {
    checked: true,
    total: categories.length,
    categories,
  };
}

async function checkScraperHealth(summary, nowMs) {
  try {
    const result = await supabaseGet('scraper_health?select=*&order=last_run_at.desc&limit=100');
    if (result.skipped) {
      summary.warnings.push({ id: 'scraper_health', severity: 'p3', message: result.reason });
      return;
    }

    const rows = Array.isArray(result.rows) ? result.rows : [];
    const unhealthy = [];
    const stale = [];

    rows.forEach(function (row) {
      const id = row.scraper_id || row.id || row.name || 'unknown-scraper';
      const status = String(row.status || '').toLowerCase();
      const isHealthy = row.is_healthy !== false && !['error', 'failed', 'anomaly'].includes(status);
      if (!isHealthy) unhealthy.push({ id, status: status || 'unhealthy' });

      const lastRun = toIso(row.last_run_at || row.fetched_at || row.last_success_at);
      const age = ageMinutes(lastRun, nowMs);
      if (age !== null && age > 1440) stale.push({ id, age_minutes: age, updated_at: lastRun });
    });

    summary.sources.scraper_health = {
      checked: true,
      total: rows.length,
      unhealthy_count: unhealthy.length,
      stale_count: stale.length,
      unhealthy: unhealthy.slice(0, 20),
      stale: stale.slice(0, 20),
    };

    unhealthy.slice(0, 10).forEach(function (item) {
      pushIssue(summary, 'degraded', {
        id: item.id,
        surface: 'scraper_health',
        severity: 'p2',
        message: 'Scraper health row is not healthy: ' + item.status,
      });
    });
  } catch (error) {
    summary.warnings.push({ id: 'scraper_health', severity: 'p2', message: sanitizeError(error) });
  }
}

async function checkMarketDataRuns(summary, nowMs) {
  try {
    const [sourcesResult, runsResult] = await Promise.all([
      supabaseGet('market_data_sources?select=id,dataset,source_key,active,last_success_at,last_error_at,cadence_hours,ttl_hours&active=eq.true&order=dataset.asc,source_key.asc'),
      supabaseGet('market_data_source_runs?select=id,source_id,dataset,status,started_at,finished_at,records_inserted,records_published,error_summary&order=started_at.desc&limit=50'),
    ]);

    if (sourcesResult.skipped || runsResult.skipped) {
      summary.warnings.push({ id: 'market_data', severity: 'p3', message: 'supabase_service_key_missing' });
      return;
    }

    const sources = Array.isArray(sourcesResult.rows) ? sourcesResult.rows : [];
    const refreshManagedSources = sources.filter(function (source) {
      return !!getCollector(source);
    });
    const runs = Array.isArray(runsResult.rows) ? runsResult.rows : [];
    const staleSources = [];
    const recentCutoff = nowMs - (7 * 24 * 60 * 60 * 1000);
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

    refreshManagedSources.forEach(function (source) {
      const cadenceHours = Number(source.cadence_hours || source.ttl_hours || 24);
      const thresholdMinutes = Math.max(cadenceHours * 2 * 60, 1440);
      const lastSuccess = toIso(source.last_success_at);
      const age = ageMinutes(lastSuccess, nowMs);
      if (age === null || age > thresholdMinutes) {
        staleSources.push({
          dataset: source.dataset || null,
          source_key: source.source_key || null,
          age_minutes: age,
          updated_at: lastSuccess,
          severity: source.dataset === 'remittance_quote' ? 'p1' : 'p2',
        });
      }
    });

    summary.sources.market_data = {
      checked: true,
      active_sources: sources.length,
      refresh_managed_sources: refreshManagedSources.length,
      recent_runs: recentRuns.length,
      failed_recent_runs: failedRuns.length,
      stale_sources: staleSources.slice(0, 25),
    };

    failedRuns.slice(0, 10).forEach(function (run) {
      pushIssue(summary, 'degraded', {
        id: 'market_data_run:' + (run.dataset || run.id),
        surface: 'market_data_source_runs',
        severity: run.dataset === 'remittance_quote' ? 'p1' : 'p2',
        message: 'Recent market data run failed for ' + (run.dataset || 'unknown dataset'),
        updated_at: toIso(run.finished_at || run.started_at),
      });
    });

    staleSources.slice(0, 10).forEach(function (source) {
      pushIssue(summary, 'stale', {
        id: 'market_data_source:' + (source.source_key || source.dataset || 'unknown'),
        surface: 'market_data_sources',
        severity: source.severity,
        message: 'Active market data source has no recent success',
        age_minutes: source.age_minutes,
        updated_at: source.updated_at,
      });
    });
  } catch (error) {
    summary.warnings.push({ id: 'market_data', severity: 'p2', message: sanitizeError(error) });
  }
}

async function checkScholarshipRuns(summary, nowMs) {
  try {
    const result = await supabaseGet('scholarship_ingest_runs?select=*&order=started_at.desc&limit=10');
    if (result.skipped) {
      summary.warnings.push({ id: 'scholarship_ingest_runs', severity: 'p3', message: result.reason });
      return;
    }

    const runs = Array.isArray(result.rows) ? result.rows : [];
    const latest = runs[0] || null;
    const latestTime = latest ? toIso(latest.finished_at || latest.started_at || latest.created_at) : null;
    const age = ageMinutes(latestTime, nowMs);
    const latestStatus = String(latest && latest.status ? latest.status : '').toLowerCase();

    summary.sources.scholarship_ingest_runs = {
      checked: true,
      recent_runs: runs.length,
      latest_status: latestStatus || null,
      latest_at: latestTime,
      latest_age_minutes: age,
    };

    if (!latest) {
      pushIssue(summary, 'stale', {
        id: 'scholarship_ingest_runs',
        surface: 'scholarships',
        severity: 'p1',
        message: 'No scholarship ingest run was found',
      });
    } else if (['failed', 'error'].includes(latestStatus)) {
      pushIssue(summary, 'failures', {
        id: 'scholarship_ingest_runs',
        surface: 'scholarships',
        severity: 'p1',
        message: 'Latest scholarship ingest run failed',
        updated_at: latestTime,
      });
    } else if (age !== null && age > 2160) {
      pushIssue(summary, 'stale', {
        id: 'scholarship_ingest_runs',
        surface: 'scholarships',
        severity: 'p1',
        message: 'Scholarship ingest run is older than 36 hours',
        age_minutes: age,
        updated_at: latestTime,
      });
    }
  } catch (error) {
    summary.warnings.push({ id: 'scholarship_ingest_runs', severity: 'p2', message: sanitizeError(error) });
  }
}

async function checkScholarshipFeed(summary) {
  try {
    const feed = await loadScholarshipFeed();
    const meta = feed.meta || {};
    const count = Array.isArray(feed.scholarships) ? feed.scholarships.length : 0;
    summary.sources.scholarship_feed = {
      checked: true,
      count,
      mode: meta.mode || null,
      label: meta.label || null,
      stale: !!meta.stale,
      is_degraded: !!meta.isDegraded,
      is_limited: !!meta.isLimited,
      last_checked_at: meta.lastCheckedAt || meta.cachedAt || null,
      public_min_count: SCHOLARSHIP_PUBLIC_MIN_COUNT,
    };

    if (count === 0 || meta.isDegraded || meta.stale) {
      pushIssue(summary, 'degraded', {
        id: 'scholarship_feed',
        surface: 'scholarships',
        severity: 'p1',
        message: 'Scholarship feed is degraded, stale, or empty',
        updated_at: meta.lastCheckedAt || meta.cachedAt || null,
      });
    } else if (meta.isLimited || count < SCHOLARSHIP_PUBLIC_MIN_COUNT) {
      pushIssue(summary, 'degraded', {
        id: 'scholarship_feed_limited',
        surface: 'scholarships',
        severity: 'p2',
        message: 'Scholarship feed is below public minimum count and must stay limited-label',
        updated_at: meta.lastCheckedAt || meta.cachedAt || null,
      });
    }
  } catch (error) {
    pushIssue(summary, 'failures', {
      id: 'scholarship_feed',
      surface: 'scholarships',
      severity: 'p1',
      message: sanitizeError(error),
    });
  }
}

function highSeverityIssues(summary) {
  return []
    .concat(summary.failures || [], summary.stale || [], summary.degraded || [])
    .filter(function (issue) {
      return issue && (issue.severity === 'p0' || issue.severity === 'p1');
    });
}

function getDigestRecipients() {
  return cleanEnv(
    process.env.AUTOMATION_HEALTH_EMAIL_TO ||
    process.env.AFROTOOLS_AUTOMATION_HEALTH_TO ||
    process.env.AFROALERTS_EMAIL_TO ||
    process.env.ALERT_EMAIL_TO
  )
    .split(',')
    .map(function (item) { return item.trim(); })
    .filter(Boolean);
}

async function maybeSendDigest(summary) {
  const high = highSeverityIssues(summary);
  const recipients = getDigestRecipients();

  summary.notifications = {
    email_configured: isEmailConfigured(),
    recipient_configured: recipients.length > 0,
    sent: false,
    reason: null,
  };

  if (!high.length) {
    summary.notifications.reason = 'no_p0_p1_issues';
    return;
  }
  if (!isEmailConfigured()) {
    summary.notifications.reason = 'email_provider_missing';
    return;
  }
  if (!recipients.length) {
    summary.notifications.reason = 'recipient_missing';
    return;
  }

  const lines = high.slice(0, 20).map(function (issue) {
    return '[' + issue.severity.toUpperCase() + '] ' + issue.id + ': ' + issue.message;
  });
  const text = [
    'AfroTools source-health watchdog found high-severity stale/degraded lanes.',
    '',
    lines.join('\n'),
    '',
    'Checked at: ' + summary.checked_at,
  ].join('\n');

  const result = await sendEmail({
    to: recipients,
    subject: 'AfroTools source-health watchdog: ' + high.length + ' high-severity issue(s)',
    text,
    html: '<pre style="font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap">' +
      text.replace(/[&<>]/g, function (char) {
        return char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;';
      }) +
      '</pre>',
  });

  summary.notifications.sent = !!result.ok;
  summary.notifications.reason = result.ok ? 'sent' : (result.providerStatus || 'send_failed');
}

function safeSummary(summary, includeDetails) {
  if (includeDetails) return summary;
  const marketData = summary.sources && summary.sources.market_data ? summary.sources.market_data : null;
  const staleSources = marketData && Array.isArray(marketData.stale_sources)
    ? marketData.stale_sources
    : [];
  return {
    ok: summary.ok,
    checked_at: summary.checked_at,
    stale: summary.stale,
    degraded: summary.degraded,
    failures: summary.failures,
    warnings: summary.warnings,
    sources: {
      live_data_meta: summary.sources.live_data_meta ? {
        checked: true,
        total: summary.sources.live_data_meta.total,
      } : null,
      scraper_health: summary.sources.scraper_health ? {
        checked: true,
        total: summary.sources.scraper_health.total,
        unhealthy_count: summary.sources.scraper_health.unhealthy_count,
        stale_count: summary.sources.scraper_health.stale_count,
      } : null,
      market_data: summary.sources.market_data ? {
        checked: true,
        active_sources: marketData.active_sources,
        refresh_managed_sources: marketData.refresh_managed_sources,
        recent_runs: marketData.recent_runs,
        failed_recent_runs: marketData.failed_recent_runs,
        stale_source_count: staleSources.length,
      } : null,
      scholarship_feed: summary.sources.scholarship_feed || null,
      scholarship_ingest_runs: summary.sources.scholarship_ingest_runs || null,
    },
    notifications: summary.notifications || null,
  };
}

async function runWatchdog() {
  const now = new Date();
  const summary = {
    ok: true,
    checked_at: now.toISOString(),
    stale: [],
    degraded: [],
    failures: [],
    warnings: [],
    sources: {},
  };

  await checkLiveDataMeta(summary, now.getTime());
  await checkScraperHealth(summary, now.getTime());
  await checkMarketDataRuns(summary, now.getTime());
  await checkScholarshipRuns(summary, now.getTime());
  await checkScholarshipFeed(summary);
  await maybeSendDigest(summary);

  const written = await setData(WATCHDOG_KEY, safeSummary(summary, true));
  if (!written) {
    summary.warnings.push({
      id: WATCHDOG_KEY,
      severity: 'p2',
      message: 'Watchdog result could not be written to durable store',
    });
  }

  return summary;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  const scheduled = isScheduledInvocation(event);
  const admin = isAdminRequest(event);

  if (!scheduled && !admin) {
    const latest = await getData(WATCHDOG_KEY);
    return json(200, latest ? safeSummary(latest, false) : {
      ok: false,
      checked_at: null,
      stale: [],
      degraded: [],
      failures: [],
      warnings: [{ id: WATCHDOG_KEY, severity: 'p2', message: 'No watchdog result has been recorded yet' }],
    });
  }

  try {
    const summary = await runWatchdog();
    return json(summary.ok ? 200 : 207, safeSummary(summary, admin));
  } catch (error) {
    const failed = {
      ok: false,
      checked_at: new Date().toISOString(),
      stale: [],
      degraded: [],
      failures: [{
        id: 'scheduled-source-health-watchdog',
        surface: 'watchdog',
        severity: 'p1',
        message: sanitizeError(error),
      }],
      warnings: [],
    };
    await setData(WATCHDOG_KEY, failed);
    return json(500, failed);
  }
};
