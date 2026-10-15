'use strict';

const policy = require('./scraper-health-policy.json');
const { previousScheduledAt } = require('./cron-schedule');
const SCOPE = 'collector_run_history';

function timestamp(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// This measures successful collector runs. It does not certify source values,
// provider availability, or that Netlify (rather than a manual call) ran the job.
function classifyScraper(row, now = Date.now(), collectors = policy.collectors) {
  const original = row && typeof row === 'object' ? row : {};
  const owner = Object.prototype.hasOwnProperty.call(collectors, original.scraper_id) ? collectors[original.scraper_id] : null;
  const result = Object.assign({}, original, {
    view_is_healthy: original.is_healthy == null ? null : original.is_healthy,
    is_healthy: false,
    health_scope: SCOPE,
    scheduled_proof_status: 'not_checked',
    health_status: 'unknown_owner',
    function_name: owner ? owner.function_name : null,
    schedule: owner ? owner.schedule : null,
    sla_hours: owner ? owner.sla_hours : null,
  });
  const retired = policy.retired_history && Object.prototype.hasOwnProperty.call(policy.retired_history, original.scraper_id)
    ? policy.retired_history[original.scraper_id] : null;
  if (!owner && retired) {
    result.health_status = 'retired_history';
    result.replacement_evidence = retired;
    return result;
  }
  if (!owner) return result;
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const success = timestamp(original.last_success_at);
  const lastRun = timestamp(original.last_run_at);
  const lastDue = previousScheduledAt(owner.schedule, new Date(nowMs));
  result.last_scheduled_at = lastDue;
  result.age_hours = success === null || !Number.isFinite(nowMs) ? null : (nowMs - success) / 3600000;
  if (success === null || lastRun === null) {
    result.health_status = 'missing_evidence';
    return result;
  }
  if (!Number.isFinite(nowMs) || success > nowMs || lastRun > nowMs || success > lastRun ||
      !lastDue || !(owner.sla_hours > 0)) {
    result.health_status = 'invalid_evidence';
    return result;
  }
  const counts = [original.errors_24h, original.anomalies_24h];
  if (counts.some(value => value === null || value === undefined || !/^\d+$/.test(String(value)))) {
    result.health_status = 'invalid_evidence';
    return result;
  }
  if (counts.some(value => Number(value) > 0) || lastRun > success ||
      /^(error|failed|failure|anomaly|degraded|stale|write-failed)$/i.test(String(original.status || ''))) {
    result.health_status = 'degraded';
    return result;
  }
  // SLAs allow normal collection latency. Weekend jobs can retain their last
  // completed weekday run when no later scheduled invocation has become due.
  const coversLastDue = success >= new Date(lastDue).getTime();
  if (result.age_hours > owner.sla_hours && !coversLastDue) {
    result.health_status = 'stale';
    return result;
  }
  result.is_healthy = true;
  result.health_status = coversLastDue ? 'covers_last_scheduled_run' : 'within_sla';
  return result;
}

function summarizeScrapers(rows, { now = Date.now(), id = null, collectors = policy.collectors } = {}) {
  if (!Array.isArray(rows)) throw new Error('Invalid scraper health payload');
  const list = rows.slice();
  const requestedRetired = id && !Object.prototype.hasOwnProperty.call(collectors, id) &&
    policy.retired_history && Object.prototype.hasOwnProperty.call(policy.retired_history, id);
  const expected = id ? (requestedRetired ? [] : [id]) : Object.keys(collectors);
  for (const scraperId of expected) {
    if (!list.some(row => row && row.scraper_id === scraperId)) list.push({ scraper_id: scraperId });
  }
  const scrapers = list.map(row => classifyScraper(row, now, collectors));
  const active = scrapers.filter(row => row.health_status !== 'retired_history');
  const healthy = active.filter(row => row.is_healthy).length;
  return {
    health_scope: SCOPE,
    scheduled_proof_status: 'not_checked',
    overall_health: !active.length ? (scrapers.length || requestedRetired ? 'not_applicable' : 'critical') : healthy < active.length * 0.5 ? 'critical' : healthy < active.length ? 'degraded' : 'healthy',
    healthy_count: healthy,
    total_count: scrapers.length,
    active_total_count: active.length,
    retired_history_count: scrapers.length - active.length,
    unknown_owner_count: scrapers.filter(row => row.health_status === 'unknown_owner').length,
    scrapers,
    checked_at: new Date(now).toISOString(),
  };
}

module.exports = { classifyScraper, summarizeScrapers };
