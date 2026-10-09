'use strict';

const fx = require('./reference-fx');
const contracts = require('../../../data/calculation-quality/external-data-contracts.json');
const FX_MAX_AGE_MS = contracts.datasets.find(row => row.storageKey === 'forex-latest').maxAgeHours * 3600000;
const KEYS = Object.freeze({insurance:'insurance-rates-latest', property:'property-prices-latest', salaries:'salary-benchmarks-latest'});
const SOURCES = Object.freeze({insurance:'AfroTools unreviewed insurance references',
  property:'AfroTools unreviewed property references', salaries:'AfroTools unreviewed salary references'});
const CURRENCIES = Object.freeze({NG:'NGN', KE:'KES', ZA:'ZAR', GH:'GHS', EG:'EGP', ET:'ETB',
  TZ:'TZS', RW:'RWF', UG:'UGX', CI:'XOF', SN:'XOF', CM:'XAF', MA:'MAD', TN:'TND', MU:'MUR', ZM:'ZMW'});
const SECTORS = Object.freeze(['technology','finance','healthcare','education','oil_gas','agriculture','retail','manufacturing','government','ngo']);
const PROPERTY_FIELDS = Object.freeze(['rent_1br_center','rent_1br_outside','rent_3br_center','rent_3br_outside','buy_sqm_center','buy_sqm_outside']);
const INSURANCE_TYPES = Object.freeze(['car_comprehensive','car_third_party','health_individual','health_family','life_term','funeral','home']);
const EXPERIENCES = new Set(['entry','entry-level','junior','mid','mid-level','senior','lead','manager','executive']);
const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const optionalAmount = value => value === null || amount(value);
const options = now => ({now, maxAgeMs:FX_MAX_AGE_MS});
const referenceFields = () => ({source_type:'reference', reference_status:'unverified_reference',
  reference_reviewed_at:null, current_prices:false});
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 120;

function localAmount(value, currency, snapshot, now) {
  return fx.convertReferenceAmount(value, currency, snapshot,
    {...options(now), direction:'usd-to-local', decimals:0}).converted_amount;
}

// A reference collection is deliberately not a market-price review. Local
// amounts derive only from a separately qualified, dated FX observation.
function buildSnapshot(category, countries, now) {
  if (!Object.hasOwn(KEYS, category) || !fx.timestamp(now)) throw new Error('Invalid reference collection');
  return {schemaVersion:1, snapshot_type:'reference', category, source:SOURCES[category],
    ...referenceFields(), timestamp:fx.timestamp(now), collected_at:fx.timestamp(now),
    countries, record_count:countries.length};
}

// Community values stay separate from the undated reference median. Each
// observation is one cohort's supplied statistic; no pooling or invented IQR.
function communityObservations(rows, country, sector, forex, now) {
  if (!Array.isArray(rows) || !Object.hasOwn(CURRENCIES, country) || !SECTORS.includes(sector)) return [];
  const result = [], seen = new Set();
  for (const row of rows) {
    if (!row || row.country_code !== country || row.role_category !== sector ||
        row.currency !== CURRENCIES[country] || !['monthly','annual'].includes(row.period) ||
        !EXPERIENCES.has(row.experience_level) || !Number.isSafeInteger(row.sample_size) || row.sample_size <= 0 ||
        !amount(row.median_gross) || row.median_gross <= 0 ||
        !optionalAmount(row.p25_gross) || !optionalAmount(row.p75_gross)) continue;
    const observedAt = fx.timestamp(row.updated_at);
    if (!observedAt || !fx.timestamp(now) || observedAt > fx.timestamp(now)) continue;
    if ((row.p25_gross !== null && row.p25_gross > row.median_gross) ||
        (row.p75_gross !== null && row.p75_gross < row.median_gross)) continue;
    const key = JSON.stringify([row.experience_level,row.period,observedAt]);
    // Conflicting duplicate cohort summaries are ambiguous, never averaged.
    if (seen.has(key)) {
      const prior = result.find(item => item._key === key);
      if (prior) prior._ambiguous = true;
      continue;
    }
    seen.add(key);
    const usd = value => value === null ? null : fx.convertReferenceAmount(value, row.currency, forex,
      {...options(now), direction:'local-to-usd', decimals:2}).converted_amount;
    result.push({_key:key, source_type:'community', source:'salary_benchmarks', country_code:country,
      role_category:sector, experience_level:row.experience_level, currency:row.currency, period:row.period,
      sample_size:row.sample_size, observed_at:observedAt, median_local:row.median_gross,
      p25_local:row.p25_gross, p75_local:row.p75_gross, median_usd:usd(row.median_gross),
      p25_usd:usd(row.p25_gross), p75_usd:usd(row.p75_gross),
      observation_status:'unreviewed_community', current_prices:false,
      conversion:fx.conversionReceipt(forex,row.currency,options(now))});
  }
  return result.filter(row => !row._ambiguous).map(({_key, ...row}) => row);
}

function normalizeCommunity(rows, country, sector, conversion, now) {
  if (!Array.isArray(rows)) return [];
  // Reuse the ingestion validator at API read time; never trust stored derived
  // amounts or let the reference collection timestamp refresh the observation.
  return communityObservations(rows.filter(row => row && row.source === 'salary_benchmarks').map(row => ({
    country_code:row.country_code, role_category:row.role_category, experience_level:row.experience_level,
    currency:row.currency, period:row.period, sample_size:row.sample_size, updated_at:row.observed_at,
    median_gross:row.median_local, p25_gross:row.p25_local, p75_gross:row.p75_local
  })), country, sector, conversion, now);
}

function normalizeSnapshot(category, payload, now = new Date().toISOString()) {
  if (!Object.hasOwn(KEYS, category) || !payload || !Array.isArray(payload.countries) || !payload.countries.length) return null;
  const collected = fx.timestamp(payload.timestamp), evaluated = fx.timestamp(now);
  if (!collected || !evaluated || collected > evaluated) return null;
  const modern = payload.schemaVersion === 1 && payload.snapshot_type === 'reference' &&
    payload.category === category && payload.source === SOURCES[category];
  if (payload.schemaVersion !== undefined && !modern) return null;
  const seen = new Set(), countries = [];
  for (const row of payload.countries) {
    if (!row || !Object.hasOwn(CURRENCIES,row.code) || row.currency !== CURRENCIES[row.code] ||
        !text(row.name) || seen.has(row.code)) return null;
    seen.add(row.code);
    if (modern ? row.source !== 'reference' : !['reference-with-forex','numbeo-with-reference','community-enriched'].includes(row.source)) return null;
    if (category !== 'salaries' && row.source === 'community-enriched') return null;
    if (category !== 'property' && row.source === 'numbeo-with-reference') return null;
    const snapshot = modern ? fx.receiptSnapshot(row.conversion,row.currency) : null;
    const conversion = fx.revalidateReceipt(modern ? row.conversion : null,row.currency,options(now));
    const common = {code:row.code,name:row.name,currency:row.currency,source:'reference', ...referenceFields(),
      last_updated:null,collected_at:collected,conversion};
    if (category === 'insurance') {
      if (!Array.isArray(row.products) || !row.products.length || !row.products.every(p => p &&
          INSURANCE_TYPES.includes(p.type) && optionalAmount(p.avg_premium_usd))) return null;
      countries.push({...common, providers:Array.isArray(row.providers) ? row.providers.filter(text) : [],
        provider_status:'unreviewed_reference', insurance_penetration:null,
        products:row.products.map(p => ({type:p.type,currency:row.currency,period:'annual',...referenceFields(),
          avg_premium_usd:p.avg_premium_usd,avg_premium_local:localAmount(p.avg_premium_usd,row.currency,snapshot,now)}))});
    } else if (category === 'property') {
      if (!Array.isArray(row.cities) || !row.cities.length || !row.cities.every(c => c && text(c.city) &&
          PROPERTY_FIELDS.every(field => optionalAmount(c[field + '_usd'])))) return null;
      countries.push({...common,cities:row.cities.map(c => {
        const values = Object.fromEntries(PROPERTY_FIELDS.map(field => [field + '_usd',c[field + '_usd']]));
        return {city:c.city,...referenceFields(),...values,rent_period:'monthly',purchase_unit:'square_metre',
          rent_1br_center_local:localAmount(c.rent_1br_center_usd,row.currency,snapshot,now),
          rent_3br_center_local:localAmount(c.rent_3br_center_usd,row.currency,snapshot,now)};
      })});
    } else {
      if (!Array.isArray(row.sectors) || !row.sectors.length || !row.sectors.every(s => s &&
          SECTORS.includes(s.sector) && optionalAmount(s.median_usd))) return null;
      const ambiguousLegacy = !modern && row.source === 'community-enriched';
      countries.push({...common,sectors:row.sectors.map(s => {
        const median = ambiguousLegacy ? null : s.median_usd;
        return {sector:s.sector,currency:row.currency,period:'monthly',...referenceFields(),
          reference_status:ambiguousLegacy ? 'needs_review' : 'unverified_reference',
          median_usd:median, median_local:localAmount(median,row.currency,snapshot,now),
          p25_usd:null,p75_usd:null,sample_size:0,
          community_observations:modern ? normalizeCommunity(s.community_observations,row.code,s.sector,snapshot,now) : []};
      })});
    }
  }
  return buildSnapshot(category,countries,collected);
}

function referenceStatus(category,payload,meta,now,staleAfterMinutes) {
  const clock = typeof now === 'number' && Number.isFinite(now) ? new Date(now).toISOString() : now;
  const normalized = normalizeSnapshot(category,payload,clock);
  const collected = normalized?.collected_at || null;
  const age = collected ? Math.round((Date.parse(clock)-Date.parse(collected))/60000) : null;
  const collection = !normalized ? 'offline' : age > staleAfterMinutes ? 'stale' :
    meta?.status && !['ok','live'].includes(meta.status) ? 'degraded' : 'ok';
  const available = normalized?.countries.filter(row => row.conversion.status === 'available').length || 0;
  return {updatedAt:collected,collected_at:collected,age_minutes:age,source:normalized?.source || null,
    source_type:normalized ? 'reference' : null,status:normalized ? 'stale' : 'offline',collection_status:collection,
    reference_status:'unverified_reference',reference_reviewed_at:null,current_prices:false,
    availability:normalized ? 'reference' : 'unavailable',records_count:normalized?.countries.length ?? null,
    conversion_status:!available ? 'unavailable' : available === normalized.countries.length ? 'available' : 'partial',
    confidence:null,blob_present:!!payload};
}

module.exports = {KEYS,SOURCES,CURRENCIES,SECTORS,PROPERTY_FIELDS,INSURANCE_TYPES,FX_MAX_AGE_MS,
  amount,options,referenceFields,localAmount,buildSnapshot,communityObservations,normalizeSnapshot,referenceStatus};
