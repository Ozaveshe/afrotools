'use strict';

const fx = require('./reference-fx');
const SOURCE = 'AfroTools reference inputs; World Bank indicators when available';
const FOOD_INDICATOR = 'AG.PRD.FOOD.XD';
const FOOD_SOURCE = 'https://api.worldbank.org/v2';
const contracts = require('../../../data/calculation-quality/external-data-contracts.json');
const FX_MAX_AGE_MS = contracts.datasets.find(item => item.storageKey === 'forex-latest').maxAgeHours * 60 * 60 * 1000;

function iso(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return null;
  const calendar = new Date(value.slice(0, 10) + 'T00:00:00Z');
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function number(value) {
  if (value === null || (typeof value === 'string' && !value.trim()) || typeof value === 'boolean') return null;
  const result = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(result) && result >= 0 ? result : null;
}

// A statistical observation year is not a local market-price review date.
function latestFoodObservations(rows, codes, now) {
  const result = {}, year = new Date(now).getUTCFullYear();
  for (const row of rows || []) {
    const code = row?.country?.id;
    const value = number(row?.value);
    if (!codes.includes(code) || row.indicator?.id !== FOOD_INDICATOR || value === null || !/^\d{4}$/.test(String(row.date))) continue;
    const observedYear = Number(row.date);
    if (observedYear > year || observedYear < 1960) continue;
    if (!result[code] || observedYear > result[code].year) {
      result[code] = { value, year: observedYear, indicator: FOOD_INDICATOR, source: FOOD_SOURCE };
    }
  }
  return result;
}

function fertilizerBenchmarks(payload, now) {
  const result = {}, currentYear = new Date(now).getUTCFullYear();
  const collectedAt = iso(payload?.timestamp);
  const age = collectedAt ? new Date(now).getTime() - new Date(collectedAt).getTime() : Infinity;
  if (age < 0 || age > 7 * 24 * 60 * 60 * 1000 || !Array.isArray(payload?.commodities)) return result;
  for (const row of payload.commodities) {
    if (!row || typeof row !== 'object') continue;
    const series = {urea:'UREA_EE_BULK',phosphate:'DAP'}[row.id];
    const period = String(row.period || ''), value = number(row.price);
    let url;
    try { url = new URL(row.source_url); } catch (_) { continue; }
    if (!series || row.source !== 'worldbank-cmo-xlsx' || row.currency !== 'USD' || row.unit !== 'mt' ||
      url.protocol !== 'https:' || url.hostname !== 'thedocs.worldbank.org' || !url.pathname.endsWith('/CMO-Historical-Data-Monthly.xlsx') ||
      value === null || !/^\d{4}M(?:0[1-9]|1[0-2])$/.test(period)) continue;
    const year = Number(period.slice(0, 4)), month = period.includes('M') ? Number(period.slice(5)) : 0;
    if (year < 1960 || year > currentYear || (year === currentYear && month > new Date(now).getUTCMonth() + 1)) continue;
    const order = year * 100 + month;
    if (!result[series] || order > result[series].order) result[series] = {value, period, order,
      source:'World Bank Pink Sheet', source_url:row.source_url, collected_at:collectedAt, unit:'USD/mt'};
  }
  return result;
}

function conversion(forex,currency,now) {
  return fx.conversionReceipt(forex,currency,{now,maxAgeMs:FX_MAX_AGE_MS});
}
function dollars(value,currency,forex,now) {
  return fx.convertReferenceAmount(value,currency,forex,{now,maxAgeMs:FX_MAX_AGE_MS,direction:'local-to-usd',decimals:2}).converted_amount;
}

function buildSnapshot(configs, food, fertilizer, forex, now) {
  const collectedAt = iso(now);
  if (!collectedAt) throw new Error('Invalid agriculture collection timestamp');
  const countries = Object.keys(configs).map(code => {
    const config = configs[code], fx = conversion(forex, config.currency, now);
    const foodMetric = food[code] || null, urea = fertilizer.UREA_EE_BULK || null, dap = fertilizer.DAP || null;
    return {
      code, name: config.name, currency: config.currency,
      inputs: Object.keys(config.inputs).map(item => ({item, price_local: config.inputs[item],
        price_usd: dollars(config.inputs[item],config.currency,forex,now),
        currency: config.currency, price_status: 'unverified_reference', price_reviewed_at: null})),
      food_production_index: foodMetric?.value ?? null,
      global_urea_usd_mt: urea?.value ?? null, global_dap_usd_mt: dap?.value ?? null,
      metrics: {food_production_index: foodMetric, global_urea_usd_mt: urea, global_dap_usd_mt: dap},
      last_updated: null, collected_at: collectedAt, price_reviewed_at: null,
      price_status: 'unverified_reference', source: foodMetric || urea || dap ? 'reference-with-wb' : 'reference',
      conversion: fx
    };
  });
  return {schemaVersion: 2, snapshot_type: 'reference', timestamp: collectedAt, collected_at: collectedAt,
    source: SOURCE, source_type: 'reference', price_status: 'unverified_reference', price_reviewed_at: null,
    current_prices: false, countries, record_count: countries.length};
}

// Normalize retained legacy payloads without rewriting storage or pretending a
// successful collection reviewed the hard-coded local prices.
function normalizeSnapshot(payload, now = new Date().toISOString()) {
  if (typeof now === 'number' && Number.isFinite(now)) now = new Date(now).toISOString();
  if (!payload || !Array.isArray(payload.countries) || !payload.countries.length || !iso(payload.timestamp)) return null;
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs) || new Date(iso(payload.timestamp)).getTime() > nowMs) return null;
  if (payload.schemaVersion !== undefined && payload.schemaVersion !== 2) return null;
  const modern = payload.schemaVersion === 2 && payload.snapshot_type === 'reference' && payload.source === SOURCE;
  if (payload.schemaVersion === 2 && !modern) return null;
  if (!payload.countries.every(row => row && ['reference', 'reference-with-wb'].includes(row.source) && /^[A-Z]{2}$/.test(row.code || '') &&
    Array.isArray(row.inputs) && row.inputs.length && row.inputs.every(input => input && number(input.price_local) !== null))) return null;
  const collectedAt = iso(payload.timestamp);
  return {...payload, source: SOURCE, source_type: 'reference', snapshot_type: 'reference', current_prices: false,
    collected_at: collectedAt, price_status: 'unverified_reference', price_reviewed_at: null,
    countries: payload.countries.map(row => {
      const snapshot = modern ? fx.receiptSnapshot(row.conversion,row.currency) : null;
      const qualified = fx.revalidateReceipt(modern ? row.conversion : null,row.currency,{now,maxAgeMs:FX_MAX_AGE_MS});
      return {...row, source:modern ? row.source : 'reference', last_updated: null, collected_at: collectedAt,
      price_status: 'unverified_reference', price_reviewed_at: null,
      inputs: row.inputs.map(input => ({...input, price_status: 'unverified_reference', price_reviewed_at: null,
        price_usd: dollars(number(input.price_local),row.currency,snapshot,now)})),
      food_production_index: modern ? row.food_production_index : null,
      global_urea_usd_mt: modern ? row.global_urea_usd_mt : null,
      global_dap_usd_mt: modern ? row.global_dap_usd_mt : null,
      conversion: qualified,
      metrics: modern ? row.metrics : {food_production_index:null, global_urea_usd_mt:null, global_dap_usd_mt:null}
    };})};
}

function referenceStatus(payload, meta, now, staleAfterMinutes) {
  const normalized = normalizeSnapshot(payload, now);
  const timestamp = normalized?.collected_at || null;
  const age = timestamp ? Math.round((new Date(now).getTime() - new Date(timestamp).getTime()) / 60000) : null;
  const collectionStatus = !normalized || age === null || age < 0 ? 'offline' :
    age > staleAfterMinutes ? 'stale' : meta?.status && !['ok','live'].includes(meta.status) ? 'degraded' : 'ok';
  return {updatedAt:timestamp, collected_at:timestamp, age_minutes:age, source:normalized?.source || null,
    source_type:normalized ? 'reference' : null, status:collectionStatus === 'offline' ? 'offline' : 'stale',
    collection_status:collectionStatus, price_status:'unverified_reference', price_reviewed_at:null,
    current_prices:false, availability:normalized ? 'reference' : 'unavailable',
    records_count:normalized?.countries.length ?? null, confidence:null, blob_present:!!payload};
}

module.exports = {SOURCE, FOOD_INDICATOR, iso, number, latestFoodObservations, fertilizerBenchmarks,
  conversion, buildSnapshot, normalizeSnapshot, referenceStatus};
