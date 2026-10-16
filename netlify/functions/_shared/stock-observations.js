'use strict';

// These collectors use EOD quotes. A collection clock is not a trade clock.
const PROVIDERS = new Set(['alphavantage', 'marketstack']);
const DEFAULT_THRESHOLDS = Object.freeze({ ok: 2880, stale: 10080 });
const DAY_MS = 86400000;

function providerDay(value, nowMs) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = Date.parse(value + 'T00:00:00.000Z');
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== value ||
      value > new Date(nowMs).toISOString().slice(0, 10)) return null;
  return value;
}
function collectionTime(payload) {
  const value = payload && (payload.collected_at || payload.timestamp);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
function optionalNumber(value, nonnegative = false) {
  return typeof value === 'number' && Number.isFinite(value) && (!nonnegative || value >= 0) ? value : null;
}

function normalizeSnapshot(payload, now = Date.now(), thresholds = DEFAULT_THRESHOLDS) {
  const nowMs = now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('Invalid stock qualification clock');
  const raw = payload && Array.isArray(payload.indices) ? payload.indices : [];
  const indices = [], seen = new Set();
  let referenceCount = 0, undatedCount = 0, invalidCount = 0;
  for (const row of raw) {
    if (row && row.source === 'reference-only') { referenceCount++; continue; }
    if (!row || !PROVIDERS.has(row.source) || typeof row.price !== 'number' ||
        !Number.isFinite(row.price) || row.price <= 0 ||
        typeof row.exchange !== 'string' || !/^[A-Z0-9]{2,10}$/.test(row.exchange) ||
        typeof row.country !== 'string' || !/^[A-Z]{2}$/.test(row.country) || seen.has(row.exchange)) {
      invalidCount++; continue;
    }
    const day = providerDay(row.last_trading_day, nowMs);
    if (!day) { undatedCount++; continue; }
    seen.add(row.exchange);
    indices.push({ exchange: row.exchange, country: row.country,
      name: typeof row.name === 'string' ? row.name : null,
      index_name: typeof row.index_name === 'string' ? row.index_name : null,
      price: row.price, change: optionalNumber(row.change), change_pct: optionalNumber(row.change_pct),
      volume: optionalNumber(row.volume, true), last_trading_day: day, source: row.source });
  }
  const days = indices.map(row => row.last_trading_day).sort();
  const oldest = days[0] || null, newest = days[days.length - 1] || null;
  // Internal day boundaries bound uncertainty; neither is a provider quote instant.
  const dayStart = oldest ? Date.parse(oldest + 'T00:00:00.000Z') : null;
  const upper = dayStart === null ? null : Math.ceil((nowMs - dayStart) / 60000);
  const lower = dayStart === null ? null : Math.max(0, Math.floor((nowMs - dayStart - DAY_MS) / 60000));
  const requested = payload && payload.collection_coverage && payload.collection_coverage.requested_exchanges;
  const requestedValid = Array.isArray(requested) && requested.length > 0 && requested.length <= 100 &&
    requested.every(code => typeof code === 'string' && /^[A-Z0-9]{2,10}$/.test(code)) &&
    new Set(requested).size === requested.length && indices.every(row => requested.includes(row.exchange));
  const coverage = requestedValid ? { requested_exchanges: [...requested],
    qualified_exchanges: indices.map(row => row.exchange),
    unavailable_exchanges: requested.filter(code => !seen.has(code)),
    requested_count: requested.length, qualified_count: indices.length,
    unavailable_count: requested.length - indices.length } : null;
  const incompleteCollection = coverage && coverage.unavailable_count > 0;
  const excluded = raw.length - indices.length;
  const status = !indices.length || upper > thresholds.stale ? 'offline'
    : upper > thresholds.ok || excluded > 0 || incompleteCollection ? 'stale' : 'ok';
  const availability = !indices.length ? referenceCount === raw.length && raw.length ? 'reference-only'
    : undatedCount ? 'unverified' : 'unavailable' : excluded || incompleteCollection ? 'partial' : 'dated';
  return { qualification_version: 1, timestamp: oldest, collected_at: collectionTime(payload),
    observation_precision: oldest ? 'date' : null, observation_basis: 'provider_last_trading_day',
    oldest_observation_date: oldest, newest_observation_date: newest,
    age_lower_bound_minutes: lower, age_upper_bound_minutes: upper,
    status, availability, current_prices: false, confidence: null,
    source_type: indices.length ? 'api' : referenceCount ? 'reference' : null,
    source: [...new Set(indices.map(row => row.source))].join(',') || (referenceCount ? 'reference-only' : null),
    collection_coverage: coverage, indices, count: indices.length, input_count: raw.length, excluded_count: excluded,
    reference_count: referenceCount, undated_count: undatedCount, invalid_count: invalidCount };
}

function buildSnapshot(input, collectedAt) {
  const payload = Array.isArray(input) ? { indices: input } : input;
  const snapshot = normalizeSnapshot({ ...payload, collected_at: collectedAt }, collectedAt);
  if (snapshot.indices.length < 2) throw new Error('Insufficient dated stock index observations');
  return { ...snapshot, record_count: snapshot.indices.length };
}

function validateSnapshot(next, previous, now = Date.now()) {
  const current = normalizeSnapshot(next, now), old = normalizeSnapshot(previous, now);
  if (current.count < 2) return { valid: false, warnings: ['Insufficient dated stock observations'] };
  const priorDays = new Map(old.indices.map(row => [row.exchange, row.last_trading_day]));
  const regressed = current.indices.some(row => priorDays.has(row.exchange) && row.last_trading_day < priorDays.get(row.exchange));
  return { valid: !regressed, warnings: regressed ? ['Provider observation dates regressed; previous data retained'] : [] };
}

function categoryStatus(payload, now, thresholds = DEFAULT_THRESHOLDS, meta = {}) {
  const value = normalizeSnapshot(payload, now, thresholds);
  const { indices, count, ...summary } = value;
  const collectionStatus = ['ok', 'error', 'anomaly', 'write-failed', 'stale'].includes(meta.status) ? meta.status : null;
  const degradedCollection = collectionStatus && collectionStatus !== 'ok';
  return { ...summary, status: summary.status === 'ok' && degradedCollection ? 'stale' : summary.status,
    collection_status: collectionStatus, updatedAt: value.oldest_observation_date,
    age_minutes: value.age_upper_bound_minutes, records_count: count, blob_present: !!payload };
}

module.exports = { normalizeSnapshot, buildSnapshot, validateSnapshot, categoryStatus };
