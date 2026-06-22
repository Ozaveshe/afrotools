#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'automation', 'automation-registry.json');
const NETLIFY_TOML_PATH = path.join(ROOT, 'netlify.toml');
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');
const REPORTS_DIR = path.join(ROOT, 'reports');
const DEFAULT_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

const FAIL_ON_STALE = process.argv.includes('--fail-on-stale');
const ALLOW_MISSING_ENV = process.argv.includes('--allow-missing-env');

const EXPLICIT_HEALTH = {
  'afrostream-livecheck': {
    type: 'scraper_run',
    scraperId: 'afrostream-livecheck',
    requireScheduledSource: true,
  },
  'afrostream-news-monitor': {
    type: 'scraper_run',
    scraperId: 'afrostream-news-monitor',
    requireScheduledSource: true,
  },
  'afrostream-sync': {
    type: 'scraper_run',
    scraperId: 'afrostream-sync',
    requireScheduledSource: true,
  },
  'scheduled-fetch-forex-rates': {
    type: 'live_data_key',
    key: 'forex-latest',
    note: 'Older forex scheduler writes live_data_store directly instead of scraper_runs.',
  },
  'scheduled-fetch-central-bank-rates': {
    type: 'meta',
    metaKey: 'rates',
    fallbackKey: 'rates-latest',
    note: 'Central-bank scheduler updates the shared rates meta category.',
  },
  'scheduled-refresh-market-data': {
    type: 'market_data_runs',
    trigger: 'netlify-schedule',
  },
  'scheduled-scan-gazette': {
    type: 'meta',
    metaKey: 'gazette',
  },
  'scheduled-source-health-watchdog': {
    type: 'live_data_key',
    key: 'automation-health-latest',
  },
};

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

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

function sanitizeError(error) {
  return String(error && error.message ? error.message : error || 'Unknown error')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/apikey["']?\s*[:=]\s*["']?[A-Za-z0-9._-]+/gi, 'apikey=[redacted]')
    .slice(0, 240);
}

async function supabaseGet(restPath) {
  const key = getSupabaseKey();
  if (!key) {
    return { skipped: true, reason: 'supabase_service_key_missing' };
  }

  const response = await fetch(getSupabaseUrl() + '/rest/v1/' + restPath, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error('Supabase ' + response.status + ' reading ' + restPath.split('?')[0] + (body ? ': ' + body.slice(0, 160) : ''));
  }

  return { rows: await response.json() };
}

function parseNetlifySchedules() {
  const text = readText(NETLIFY_TOML_PATH);
  const schedules = new Map();
  let currentFunction = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const section = rawLine.match(/^\s*\[functions\."([^"]+)"\]\s*$/);
    if (section) {
      currentFunction = section[1];
      continue;
    }
    if (/^\s*\[/.test(rawLine)) {
      currentFunction = null;
      continue;
    }
    const schedule = rawLine.match(/^\s*schedule\s*=\s*"([^"]+)"\s*$/);
    if (currentFunction && schedule) schedules.set(currentFunction, schedule[1]);
  }

  return schedules;
}

function parseRegistryRecords() {
  const registry = readJson(REGISTRY_PATH);
  const records = Array.isArray(registry.records) ? registry.records : [];
  const byFunction = new Map();

  for (const record of records) {
    if (!record || !record.netlify_function) continue;
    const existing = byFunction.get(record.netlify_function);
    if (!existing || String(record.id || '').startsWith('netlify:')) {
      byFunction.set(record.netlify_function, record);
    }
  }

  return { registry, records, byFunction };
}

function functionPath(functionName) {
  return path.join(FUNCTIONS_DIR, functionName + '.js');
}

function deriveRunScraperHealth(text) {
  const runMatch = text.match(/runScraper\s*\(\s*\{([\s\S]*?)\n\s*\}\s*\)/);
  if (!runMatch) return null;
  const idMatch = runMatch[1].match(/\bid\s*:\s*['"]([^'"]+)['"]/);
  return idMatch ? { type: 'scraper_run', scraperId: idMatch[1] } : null;
}

function deriveMetaHealth(text) {
  const metaMatch = text.match(/updateMeta\s*\(\s*['"]([^'"]+)['"]/);
  return metaMatch ? { type: 'meta', metaKey: metaMatch[1] } : null;
}

function inferHealth(functionName) {
  if (EXPLICIT_HEALTH[functionName]) {
    return Object.assign({ source: 'explicit' }, EXPLICIT_HEALTH[functionName]);
  }

  const filePath = functionPath(functionName);
  if (!fs.existsSync(filePath)) {
    return { type: 'missing_function_file', source: 'missing_file' };
  }

  const text = readText(filePath);
  return deriveRunScraperHealth(text) ||
    deriveMetaHealth(text) ||
    null;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function firstTimestamp(record) {
  if (!record || typeof record !== 'object') return null;
  return toIso(
    record.checked_at ||
    record.last_fetch ||
    record.updated_at ||
    record.timestamp ||
    record.fetched_at ||
    record.last_updated ||
    record.lastCheckedAt ||
    record.cachedAt ||
    record.last_success_at ||
    record.finished_at ||
    record.started_at
  );
}

function ageHours(timestamp, nowMs) {
  const iso = toIso(timestamp);
  if (!iso) return null;
  return Math.max(0, (nowMs - new Date(iso).getTime()) / (60 * 60 * 1000));
}

function roundHours(value) {
  if (value === null || value === undefined) return null;
  return Math.round(value * 10) / 10;
}

function isFailureStatus(status) {
  return /^(error|failed|failure|anomaly|stale|write-failed)$/i.test(String(status || '').trim());
}

function statusFor(timestamp, status, slaHours, nowMs) {
  const age = ageHours(timestamp, nowMs);
  if (!timestamp) return { status: 'missing', age_hours: null };
  if (isFailureStatus(status)) return { status: 'degraded', age_hours: age };
  if (age !== null && Number(slaHours) > 0 && age > Number(slaHours)) {
    return { status: 'stale', age_hours: age };
  }
  return { status: 'ok', age_hours: age };
}

function buildParams(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) search.append(key, value);
  });
  return search.toString();
}

async function getLatestScraperRun(scraperId, scheduledOnly) {
  const params = buildParams({
    select: 'scraper_id,status,source,records_count,error_message,duration_ms,fetched_at',
    scraper_id: 'eq.' + scraperId,
    order: 'fetched_at.desc',
    limit: '1',
  });
  const anyResult = await supabaseGet('scraper_runs?' + params);
  if (anyResult.skipped) return anyResult;
  const latestAny = Array.isArray(anyResult.rows) ? latestRow(anyResult.rows) : null;

  if (!scheduledOnly) {
    return { latest: latestAny, latest_any: latestAny, latest_scheduled: null };
  }

  const scheduledParams = buildParams({
    select: 'scraper_id,status,source,records_count,error_message,duration_ms,fetched_at',
    scraper_id: 'eq.' + scraperId,
    source: 'ilike.*Netlify*Scheduled*',
    order: 'fetched_at.desc',
    limit: '1',
  });
  const scheduledResult = await supabaseGet('scraper_runs?' + scheduledParams);
  if (scheduledResult.skipped) return scheduledResult;
  const latestScheduled = Array.isArray(scheduledResult.rows) ? latestRow(scheduledResult.rows) : null;
  return {
    latest: latestScheduled,
    latest_any: latestAny,
    latest_scheduled: latestScheduled,
  };
}

function latestRow(rows) {
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function getLiveDataRow(key) {
  const params = buildParams({
    select: 'key,updated_at,data',
    key: 'eq.' + key,
    limit: '1',
  });
  const result = await supabaseGet('live_data_store?' + params);
  if (result.skipped) return result;
  return { row: latestRow(result.rows) };
}

async function checkScraperRun(record, functionName, health, nowMs) {
  const result = await getLatestScraperRun(health.scraperId, !!health.requireScheduledSource);
  if (result.skipped) return unavailable(record, functionName, health, result.reason);

  const latest = result.latest;
  const latestAny = result.latest_any;
  const statusValue = latest && latest.status;
  const timestamp = latest && toIso(latest.fetched_at);
  const computed = statusFor(timestamp, statusValue, record.sla_hours, nowMs);
  let note = health.requireScheduledSource ? 'Requires a Netlify Scheduled Function scraper_runs row.' : '';

  if (health.requireScheduledSource && !latest && latestAny) {
    note = 'No scheduled row found; latest any-source row is ' + (latestAny.source || 'unknown source') + '.';
  }

  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    schedule: record.expected_schedule || null,
    netlify_schedule: null,
    status: computed.status,
    evidence_type: health.requireScheduledSource ? 'scraper_runs_scheduled' : 'scraper_runs',
    evidence_id: health.scraperId,
    latest_at: timestamp,
    age_hours: roundHours(computed.age_hours),
    sla_hours: Number(record.sla_hours || 0),
    latest_status: statusValue || null,
    latest_source: latest && latest.source || null,
    records_count: latest && latest.records_count !== undefined ? latest.records_count : null,
    error_excerpt: latest && latest.error_message ? String(latest.error_message).slice(0, 220) : null,
    latest_any_at: latestAny && toIso(latestAny.fetched_at),
    latest_any_source: latestAny && latestAny.source || null,
    severity: record.severity_if_stale || 'p2',
    note,
  };
}

async function checkLiveDataKey(record, functionName, health, nowMs) {
  const result = await getLiveDataRow(health.key);
  if (result.skipped) return unavailable(record, functionName, health, result.reason);

  const row = result.row;
  const data = row && row.data && typeof row.data === 'object' ? row.data : {};
  const rowTimestamp = row && toIso(row.updated_at);
  const dataTimestamp = firstTimestamp(data);
  const timestamp = rowTimestamp || dataTimestamp;
  const dataStatus = data.status || (data.ok === false ? 'degraded' : 'ok');
  const computed = statusFor(timestamp, dataStatus, record.sla_hours, nowMs);

  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    schedule: record.expected_schedule || null,
    netlify_schedule: null,
    status: computed.status,
    evidence_type: 'live_data_store',
    evidence_id: health.key,
    latest_at: timestamp,
    data_timestamp: dataTimestamp,
    age_hours: roundHours(computed.age_hours),
    sla_hours: Number(record.sla_hours || 0),
    latest_status: dataStatus || null,
    latest_source: data.source || data.trigger || null,
    records_count: data.record_count || data.records_count || null,
    error_excerpt: data.error ? String(data.error).slice(0, 220) : null,
    severity: record.severity_if_stale || 'p2',
    note: health.note || 'Uses live_data_store.updated_at as scheduled write proof.',
  };
}

async function checkMeta(record, functionName, health, nowMs) {
  const result = await getLiveDataRow('meta');
  if (result.skipped) return unavailable(record, functionName, health, result.reason);

  const meta = result.row && result.row.data && typeof result.row.data === 'object' ? result.row.data : {};
  const category = meta[health.metaKey] || {};
  let timestamp = firstTimestamp(category);
  let fallbackNote = '';

  if (!timestamp && health.fallbackKey) {
    const fallback = await getLiveDataRow(health.fallbackKey);
    if (!fallback.skipped && fallback.row) {
      timestamp = toIso(fallback.row.updated_at) || firstTimestamp(fallback.row.data);
      fallbackNote = 'Fallback used live_data_store:' + health.fallbackKey + '.';
    }
  }

  const latestStatus = category.status || (timestamp ? 'ok' : null);
  const computed = statusFor(timestamp, latestStatus, record.sla_hours, nowMs);

  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    schedule: record.expected_schedule || null,
    netlify_schedule: null,
    status: computed.status,
    evidence_type: 'live_data_meta',
    evidence_id: health.metaKey,
    latest_at: timestamp,
    age_hours: roundHours(computed.age_hours),
    sla_hours: Number(record.sla_hours || 0),
    latest_status: latestStatus || null,
    latest_source: category.source || null,
    records_count: category.records_count || category.countries_count || null,
    error_excerpt: category.error ? String(category.error).slice(0, 220) : null,
    severity: record.severity_if_stale || 'p2',
    note: [health.note || 'Uses live_data_store.meta category timestamp.', fallbackNote].filter(Boolean).join(' '),
  };
}

async function checkMarketDataRuns(record, functionName, health, nowMs) {
  const params = buildParams({
    select: 'id,source_id,dataset,status,started_at,finished_at,records_inserted,records_published,error_summary,payload',
    order: 'started_at.desc',
    limit: '100',
  });
  const result = await supabaseGet('market_data_source_runs?' + params);
  if (result.skipped) return unavailable(record, functionName, health, result.reason);

  const rows = Array.isArray(result.rows) ? result.rows : [];
  const trigger = health.trigger || 'netlify-schedule';
  const scheduledRows = rows.filter((row) => row && row.payload && row.payload.trigger === trigger);
  const latest = scheduledRows[0] || rows[0] || null;
  const timestamp = latest && toIso(latest.finished_at || latest.started_at);
  const latestStatus = latest && latest.status;
  const computed = statusFor(timestamp, latestStatus, record.sla_hours, nowMs);
  const failedRecent = scheduledRows.filter((row) => isFailureStatus(row.status)).length;

  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    schedule: record.expected_schedule || null,
    netlify_schedule: null,
    status: computed.status,
    evidence_type: 'market_data_source_runs',
    evidence_id: trigger,
    latest_at: timestamp,
    age_hours: roundHours(computed.age_hours),
    sla_hours: Number(record.sla_hours || 0),
    latest_status: latestStatus || null,
    latest_source: latest && latest.dataset || null,
    records_count: latest && (latest.records_published || latest.records_inserted || null),
    error_excerpt: latest && latest.error_summary ? String(latest.error_summary).slice(0, 220) : null,
    severity: record.severity_if_stale || 'p2',
    note: 'Checked latest market_data_source_runs payload.trigger=' + trigger + '; recent scheduled rows=' + scheduledRows.length + ', failed=' + failedRecent + '.',
  };
}

function unavailable(record, functionName, health, reason) {
  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    schedule: record.expected_schedule || null,
    netlify_schedule: null,
    status: 'unavailable',
    evidence_type: health.type,
    evidence_id: health.scraperId || health.key || health.metaKey || health.trigger || null,
    latest_at: null,
    age_hours: null,
    sla_hours: Number(record.sla_hours || 0),
    latest_status: null,
    latest_source: null,
    records_count: null,
    error_excerpt: reason,
    severity: record.severity_if_stale || 'p2',
    note: 'Live proof skipped: ' + reason,
  };
}

async function runCheck(record, functionName, health, nowMs) {
  if (health.type === 'scraper_run') return checkScraperRun(record, functionName, health, nowMs);
  if (health.type === 'live_data_key') return checkLiveDataKey(record, functionName, health, nowMs);
  if (health.type === 'meta') return checkMeta(record, functionName, health, nowMs);
  if (health.type === 'market_data_runs') return checkMarketDataRuns(record, functionName, health, nowMs);
  return {
    id: record.id,
    display_name: record.display_name,
    function_name: functionName,
    status: 'skipped',
    evidence_type: health.type || 'none',
    evidence_id: null,
    note: health.type === 'missing_function_file' ? 'Function file missing.' : 'No live health mapper is configured.',
    severity: record.severity_if_stale || 'p2',
  };
}

function countsByStatus(items) {
  const counts = { ok: 0, stale: 0, degraded: 0, missing: 0, unavailable: 0, skipped: 0 };
  for (const item of items) {
    const key = counts[item.status] === undefined ? 'skipped' : item.status;
    counts[key] += 1;
  }
  return counts;
}

function severityRank(item) {
  const order = { p0: 0, p1: 1, p2: 2, p3: 3 };
  return order[item.severity] === undefined ? 4 : order[item.severity];
}

function problemItems(items) {
  return items
    .filter((item) => ['stale', 'degraded', 'missing', 'unavailable'].includes(item.status))
    .sort((a, b) => severityRank(a) - severityRank(b) || String(a.function_name).localeCompare(String(b.function_name)));
}

function formatAge(hours) {
  return hours === null || hours === undefined ? 'n/a' : String(hours) + 'h';
}

function markdownTable(items) {
  const lines = [
    '| Status | Function | Evidence | Latest | Age | SLA | Note |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
  ];
  for (const item of items) {
    lines.push([
      item.status,
      '`' + item.function_name + '`',
      '`' + item.evidence_type + ':' + (item.evidence_id || 'n/a') + '`',
      item.latest_at || 'n/a',
      formatAge(item.age_hours),
      formatAge(item.sla_hours),
      String(item.note || '').replace(/\|/g, '/'),
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }
  return lines;
}

function writeReports(report) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const date = report.generated_at.slice(0, 10);
  const jsonPath = path.join(REPORTS_DIR, 'live-automation-health-' + date + '.json');
  const mdPath = path.join(REPORTS_DIR, 'live-automation-health-' + date + '.md');
  const latestJsonPath = path.join(REPORTS_DIR, 'live-automation-health-latest.json');
  const latestMdPath = path.join(REPORTS_DIR, 'live-automation-health-latest.md');

  report.report_paths = {
    json: path.relative(ROOT, jsonPath),
    markdown: path.relative(ROOT, mdPath),
    latest_json: path.relative(ROOT, latestJsonPath),
    latest_markdown: path.relative(ROOT, latestMdPath),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(latestJsonPath, JSON.stringify(report, null, 2) + '\n');

  const problems = problemItems(report.checks);
  const lines = [];
  lines.push('# Live Automation Health - ' + date);
  lines.push('');
  lines.push('Generated: ' + report.generated_at);
  lines.push('Supabase target: AfroTools (`zpclagtgczsygrgztlts`). Secrets are not printed.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('- Netlify scheduled functions parsed: ' + report.netlify_scheduled_functions + '.');
  lines.push('- Monitored live evidence checks: ' + report.checks.length + '.');
  lines.push('- Skipped scheduled functions without durable live proof mapping: ' + report.skipped.length + '.');
  lines.push('- Status counts: ok=' + report.counts.ok + ', stale=' + report.counts.stale + ', degraded=' + report.counts.degraded + ', missing=' + report.counts.missing + ', unavailable=' + report.counts.unavailable + '.');
  lines.push('');
  lines.push('## Problems');
  lines.push('');
  if (!problems.length) {
    lines.push('- None.');
  } else {
    for (const item of problems) {
      lines.push('- [' + String(item.severity || 'p2').toUpperCase() + '] `' + item.function_name + '` is `' + item.status + '` via `' + item.evidence_type + ':' + (item.evidence_id || 'n/a') + '`; latest=' + (item.latest_at || 'n/a') + ', age=' + formatAge(item.age_hours) + ', SLA=' + formatAge(item.sla_hours) + '. ' + (item.note || ''));
    }
  }
  lines.push('');
  lines.push('## Monitored Functions');
  lines.push('');
  lines.push(...markdownTable(report.checks));
  lines.push('');
  lines.push('## Skipped Functions');
  lines.push('');
  if (!report.skipped.length) {
    lines.push('- None.');
  } else {
    for (const item of report.skipped) {
      lines.push('- `' + item.function_name + '`: ' + item.reason + '.');
    }
  }
  lines.push('');
  lines.push('## Warnings');
  lines.push('');
  if (!report.warnings.length) {
    lines.push('- None.');
  } else {
    for (const warning of report.warnings) lines.push('- ' + warning);
  }
  lines.push('');

  fs.writeFileSync(mdPath, lines.join('\n'));
  fs.writeFileSync(latestMdPath, lines.join('\n'));
}

async function main() {
  const now = new Date();
  const nowMs = now.getTime();
  const schedules = parseNetlifySchedules();
  const { byFunction } = parseRegistryRecords();
  const warnings = [];
  const checks = [];
  const skipped = [];

  for (const [functionName, netlifySchedule] of Array.from(schedules.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const record = byFunction.get(functionName);
    if (!record) {
      skipped.push({
        function_name: functionName,
        reason: 'scheduled function is not registered in automation-registry.json',
      });
      continue;
    }

    if (record.expected_schedule && record.expected_schedule !== netlifySchedule) {
      warnings.push(functionName + ': registry schedule `' + record.expected_schedule + '` differs from netlify.toml `' + netlifySchedule + '`.');
    }

    const health = inferHealth(functionName);
    if (!health) {
      skipped.push({
        id: record.id,
        function_name: functionName,
        reason: 'no durable live health mapper found in function source',
      });
      continue;
    }

    const result = await runCheck(record, functionName, health, nowMs);
    result.netlify_schedule = netlifySchedule;
    checks.push(result);
  }

  const report = {
    schema_version: 1,
    generated_at: now.toISOString(),
    supabase_project_ref: 'zpclagtgczsygrgztlts',
    netlify_scheduled_functions: schedules.size,
    counts: countsByStatus(checks),
    warnings,
    checks: checks.sort((a, b) => severityRank(a) - severityRank(b) || String(a.function_name).localeCompare(String(b.function_name))),
    skipped: skipped.sort((a, b) => String(a.function_name).localeCompare(String(b.function_name))),
    report_paths: null,
  };

  writeReports(report);

  const problems = problemItems(report.checks);
  console.log('AfroTools live automation health');
  console.log('- Netlify scheduled functions parsed: ' + report.netlify_scheduled_functions);
  console.log('- Monitored checks: ' + report.checks.length);
  console.log('- Status: ok=' + report.counts.ok + ', stale=' + report.counts.stale + ', degraded=' + report.counts.degraded + ', missing=' + report.counts.missing + ', unavailable=' + report.counts.unavailable + ', skipped=' + report.skipped.length);
  console.log('- Report: ' + report.report_paths.markdown);
  if (problems.length) {
    console.log('- Top issues:');
    problems.slice(0, 8).forEach((item) => {
      console.log('  - [' + String(item.severity || 'p2').toUpperCase() + '] ' + item.function_name + ': ' + item.status + ' (' + item.evidence_type + ':' + (item.evidence_id || 'n/a') + ', latest=' + (item.latest_at || 'n/a') + ', age=' + formatAge(item.age_hours) + ', SLA=' + formatAge(item.sla_hours) + ')');
    });
  }

  if (report.counts.unavailable > 0 && !ALLOW_MISSING_ENV) {
    process.exitCode = 2;
  } else if (FAIL_ON_STALE && problems.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('automation live health audit failed: ' + sanitizeError(error));
  process.exitCode = 1;
});
