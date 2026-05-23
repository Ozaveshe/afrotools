const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getData, setData } = require('./data-store');

let fallbackFeedModule = null;
let sourceAdapters = null;
try {
  fallbackFeedModule = require('../../../assets/js/education-scholarship-feed.js');
} catch (error) {
  fallbackFeedModule = null;
}
try {
  sourceAdapters = require('./scholarship-source-adapters');
} catch (error) {
  sourceAdapters = null;
}

const AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const AUTH_SERVICE_KEY =
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const DATA_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || AUTH_URL;
const DATA_READ_KEY =
  process.env.SUPABASE_DATA_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY_DATA ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const CACHE_KEY = 'scholarships-latest';
const DEFAULT_REMINDER_OFFSETS = [30, 14, 7, 1, 0];
const MIRROR_STALE_HOURS = 36;
const PUBLIC_MIN_SCHOLARSHIP_COUNT = toPositiveInteger(
  process.env.SCHOLARSHIP_PUBLIC_MIN_COUNT || process.env.PUBLIC_MIN_SCHOLARSHIP_COUNT,
  50
);
const SCHOLARSHIP_PUBLIC_MIN_COUNT = PUBLIC_MIN_SCHOLARSHIP_COUNT;
const SOURCE_KEYS = {
  primary: 'afrotools-data-catalog',
  backup: 'afrotools-curated-backup'
};
const SOURCE_TYPES = new Set(['official_page', 'rss', 'api', 'curated_import', 'permitted_scrape']);
const MANUAL_REVIEW_PARSER_KEYS = new Set([
  'manual_official_page',
  'manual_official_directory',
  'manual_official_portal',
  'manual_official_catalog',
  'manual_review_official_page',
  'manual_review_official_directory',
  'manual_review_official_portal',
  'manual_review_official_catalog'
]);

let sourceRegistryCache = null;
let sourceCandidateCache = null;
let deadlineOverridesCache = null;
let authClient = null;

function getAuthClient() {
  if (!AUTH_SERVICE_KEY) return null;
  if (!authClient) {
    authClient = createClient(AUTH_URL, AUTH_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return authClient;
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(function (item) { return String(item).trim(); }).filter(Boolean);
  return [String(value).trim()].filter(Boolean);
}

function uniqueStrings(values) {
  const seen = new Set();
  return ensureArray(values).filter(function (value) {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueValues(values) {
  const seen = new Set();
  return ensureArray(values).filter(function (value) {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstDefined() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function normalizeCurrencyCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
}

function normalizeJsonObject(value, fallback) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : (fallback || {});
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value.filter(function (item) { return item && typeof item === 'object'; }) : [];
}

function detailList(values) {
  return uniqueStrings(values).join(', ');
}

function buildScholarshipDetailsPayload(record) {
  const awardValue = firstDefined(record.award_value_text, record.award_value_amount, record.award_value_max, record.award_value_min);
  const eligible = detailList(record.eligible_countries && record.eligible_countries.length ? record.eligible_countries : record.eligible_origins);
  const levels = detailList(record.study_levels);
  const fields = detailList(record.fields);
  const destinations = detailList(record.destination_countries);
  const checkedAt = firstDefined(record.last_checked_at, record.verified_at, record.last_verified_at, record.last_seen_at);

  return normalizeJsonObject({
    version: 1,
    generated_at: new Date().toISOString(),
    overview: record.summary || 'Open the official provider page to confirm this scholarship cycle, eligibility, funding coverage, and application steps.',
    key_facts: {
      provider: record.provider || '',
      study_levels: ensureArray(record.study_levels),
      eligible_countries: ensureArray(record.eligible_countries && record.eligible_countries.length ? record.eligible_countries : record.eligible_origins),
      destination_countries: ensureArray(record.destination_countries),
      fields: ensureArray(record.fields),
      funding_type: record.funding_type || '',
      award_value_amount: firstDefined(record.award_value_amount, record.award_value_max, record.award_value_min),
      award_value_currency: record.award_value_currency || '',
      award_value_usd: record.award_value_usd || null,
      local_value_amount: record.local_value_amount || null,
      local_value_currency: record.local_value_currency || '',
      award_value_text: record.award_value_text || '',
      award_components: normalizeJsonArray(record.award_components),
      deadline_date: record.deadline_date || null,
      deadline_text: record.deadline_text || '',
      deadline_status: record.deadline_status || '',
      status: record.status || ''
    },
    sections: [
      {
        heading: 'What this scholarship covers',
        items: [
          record.funding_type ? 'Funding type: ' + record.funding_type + '.' : '',
          awardValue ? 'Source value note: ' + String(awardValue) + (record.award_value_currency ? ' ' + record.award_value_currency : '') + '.' : '',
          normalizeJsonArray(record.award_components).length ? 'The stored source record includes component-level award details.' : ''
        ].filter(Boolean)
      },
      {
        heading: 'Eligibility snapshot',
        items: [
          eligible ? 'Eligible countries/origins: ' + eligible + '.' : '',
          levels ? 'Study level: ' + levels + '.' : '',
          fields ? 'Field area: ' + fields + '.' : '',
          destinations ? 'Destination: ' + destinations + '.' : '',
          record.min_gpa ? 'Minimum GPA signal in AfroTools profile matching: ' + record.min_gpa + ' on a 4.0-style scale.' : '',
          record.min_ielts ? 'English-test signal in AfroTools profile matching: IELTS ' + record.min_ielts + ' or equivalent where the provider requires it.' : ''
        ].filter(Boolean)
      },
      {
        heading: 'Deadline and cycle',
        items: [
          record.deadline_date ? 'Published deadline: ' + record.deadline_date + '.' : '',
          record.deadline_status === 'rolling' || record.deadline_status === 'varies'
            ? 'Deadline status: ' + record.deadline_status + '. Confirm the exact programme, country, or intake window on the official provider page.'
            : '',
          record.deadline_text || ''
        ].filter(Boolean)
      },
      {
        heading: 'Application checklist',
        items: [
          'Open the official provider page and confirm the current cycle before starting.',
          'Check your country, study level, programme, field, GPA, language-test, and funding eligibility.',
          'Prepare transcripts, certificates, passport or national ID details, CV or resume, references, and personal statement or research proposal where requested.',
          'Submit only through the official provider, university, foundation, embassy, government, or approved application portal.'
        ]
      },
      {
        heading: 'Source verification',
        items: [
          record.official_url ? 'Official page: ' + record.official_url : '',
          record.source_url && record.source_url !== record.official_url ? 'Source page: ' + record.source_url : '',
          record.source_type ? 'Source type: ' + record.source_type + '.' : '',
          record.source_confidence != null ? 'Source confidence: ' + record.source_confidence + '/100.' : '',
          checkedAt ? 'Last checked: ' + String(checkedAt).slice(0, 10) + '.' : ''
        ].filter(Boolean)
      }
    ],
    source: {
      official_url: record.official_url || '',
      source_url: record.source_url || '',
      source_type: record.source_type || '',
      source_confidence: record.source_confidence || null,
      freshness_score: record.freshness_score || null,
      last_checked_at: checkedAt || null,
      proof_level: record.proof_level || ''
    },
    audit: {
      detail_quality: 'structured_from_verified_fields',
      review_status: record.review_status || '',
      last_source_id: record.last_source_id || null,
      note: 'Details are generated from the verified scholarship row and source snapshot. Students should always confirm the current cycle on the official provider page.'
    }
  }, {});
}

function parseMoneyString(value) {
  const text = String(value || '').replace(/\u00a0/g, ' ').trim();
  if (!text) return null;

  const codeMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD|NZD|CHF|JPY|CNY|INR|NGN|KES|GHS|ZAR|EGP|TZS|UGX|ETB|RWF|XOF|XAF|MVR)\b/i);
  let currency = codeMatch ? codeMatch[1].toUpperCase() : '';
  if (!currency) {
    if (text.indexOf('$') !== -1) currency = 'USD';
    else if (text.indexOf('£') !== -1) currency = 'GBP';
    else if (text.indexOf('€') !== -1) currency = 'EUR';
  }

  const numbers = text
    .match(/(?:\d{1,3}(?:[,\s]\d{3})+|\d+)(?:\.\d+)?/g);
  if (!numbers || !numbers.length) return currency ? { currency: currency } : null;
  const amounts = numbers
    .map(function (item) { return Number(String(item).replace(/[,\s]/g, '')); })
    .filter(function (number) { return Number.isFinite(number); });
  if (!amounts.length) return currency ? { currency: currency } : null;

  return {
    min: Math.min.apply(Math, amounts),
    max: Math.max.apply(Math, amounts),
    currency: currency
  };
}

function normalizeAwardValue(raw, fallbackSourceUrl) {
  const text = String(firstDefined(
    raw.award_value_text,
    raw.awardValueText,
    raw.award_text,
    raw.award,
    raw.grant,
    raw.value_text
  ) || '').trim();
  const parsed = parseMoneyString(text);

  let min = toNumber(firstDefined(
    raw.award_value_min,
    raw.awardValueMin,
    raw.award_min,
    raw.value_min,
    raw.grant_min,
    raw.award_value_amount,
    raw.awardValueAmount,
    raw.award_amount,
    raw.value_amount,
    raw.grant_amount
  ));
  let max = toNumber(firstDefined(
    raw.award_value_max,
    raw.awardValueMax,
    raw.award_max,
    raw.value_max,
    raw.grant_max
  ));

  if (min == null && parsed && parsed.min != null) min = parsed.min;
  if (max == null && parsed && parsed.max != null) max = parsed.max;
  if (min != null && max == null) max = min;
  if (max != null && min == null) min = max;

  const currency = normalizeCurrencyCode(firstDefined(
    raw.award_value_currency,
    raw.awardValueCurrency,
    raw.award_currency,
    raw.value_currency,
    raw.grant_currency,
    parsed && parsed.currency
  ));
  const period = String(firstDefined(raw.award_value_period, raw.awardValuePeriod, raw.award_period, raw.value_period) || '').trim();
  const confidence = String(firstDefined(raw.award_value_confidence, raw.awardValueConfidence, raw.award_confidence, raw.value_confidence) || '').trim();
  const sourceUrl = String(firstDefined(raw.award_value_source_url, raw.awardValueSourceUrl, raw.award_source_url, raw.value_source_url, fallbackSourceUrl) || '').trim();
  const checkedAt = firstDefined(raw.award_value_last_checked_at, raw.awardValueLastCheckedAt, raw.award_checked_at, raw.value_last_checked_at);

  return {
    min: min,
    max: max,
    currency: currency,
    period: period,
    text: text,
    components: normalizeJsonArray(raw.award_components || raw.awardComponents),
    confidence: confidence || null,
    sourceUrl: sourceUrl || null,
    checkedAt: checkedAt || null
  };
}

function toPositiveInteger(value, fallback) {
  const number = parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function formatScholarshipClaimLabel(count) {
  const value = Math.max(0, Math.floor(Number(count) || 0));
  return value + ' Scholarship' + (value === 1 ? '' : 's');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function buildHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value || {})).digest('hex');
}

function parseDeadlineDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function maxTimestamp(rows) {
  return (rows || []).reduce(function (latest, row) {
    const candidate = row && (row.last_verified_at || row.last_seen_at || row.updated_at || row.cachedAt || row.timestamp);
    if (!candidate) return latest;
    if (!latest) return candidate;
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
  }, null);
}

function isMirrorStale(rows) {
  const latest = maxTimestamp(rows);
  if (!latest) return true;
  return Date.now() - new Date(latest).getTime() > MIRROR_STALE_HOURS * 60 * 60 * 1000;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function normalizeOffsets(offsets) {
  const values = Array.isArray(offsets) ? offsets : DEFAULT_REMINDER_OFFSETS;
  const seen = new Set();
  return values
    .map(function (value) { return Number(value); })
    .filter(function (value) {
      return Number.isInteger(value) && value >= 0 && value <= 365;
    })
    .sort(function (left, right) { return right - left; })
    .filter(function (value) {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function getFallbackScholarships() {
  if (fallbackFeedModule && typeof fallbackFeedModule.getFallbackScholarships === 'function') {
    return fallbackFeedModule.getFallbackScholarships();
  }
  return [];
}

function defaultScholarshipSourceDefinitions() {
  return [
    {
      source_key: SOURCE_KEYS.primary,
      name: 'AfroTools scholarship catalog import',
      source_type: 'api',
      base_url: 'internal:data-instance-scholarships',
      active: true,
      cadence: 'daily',
      parser_key: 'data_instance_scholarship_catalog',
      country_scope: ['ALL'],
      destination_scope: ['global'],
      trust_level: 'platform',
      robots_or_policy_note: 'Internal structured import from the AfroTools scholarship data catalog.'
    },
    {
      source_key: SOURCE_KEYS.backup,
      name: 'AfroTools curated scholarship backup',
      source_type: 'curated_import',
      base_url: 'repo:education-scholarship-feed-fallback',
      active: false,
      cadence: 'manual',
      parser_key: 'curated_backup_catalog',
      country_scope: ['ALL'],
      destination_scope: ['global'],
      trust_level: 'curated',
      robots_or_policy_note: 'Repo-backed fallback catalog used when the live scholarship pipeline is unavailable.'
    }
  ];
}

function cloneSourceRow(row) {
  return Object.assign({}, row, {
    country_scope: ensureArray(row.country_scope),
    destination_scope: ensureArray(row.destination_scope),
    crawl_policy: row.crawl_policy && typeof row.crawl_policy === 'object' ? Object.assign({}, row.crawl_policy) : row.crawl_policy,
    robots_allowed: row.robots_allowed === undefined ? null : row.robots_allowed,
    rate_limit_ms: toPositiveInteger(row.rate_limit_ms, 5000)
  });
}

function normalizeSourceDefinition(input, index) {
  const source = input || {};
  const sourceKey = String(source.source_key || '').trim();
  const name = String(source.name || '').trim();
  const sourceType = String(source.source_type || '').trim();
  const baseUrl = String(source.base_url || '').trim();
  const parserKey = String(source.parser_key || '').trim();
  const location = sourceKey || 'source #' + (index + 1);

  if (!sourceKey) throw new Error('Scholarship source registry entry missing source_key at index ' + index);
  if (!name) throw new Error('Scholarship source registry entry missing name for ' + location);
  if (!SOURCE_TYPES.has(sourceType)) throw new Error('Scholarship source registry entry has unsupported source_type for ' + location);
  if (!baseUrl) throw new Error('Scholarship source registry entry missing base_url for ' + location);
  if (!parserKey) throw new Error('Scholarship source registry entry missing parser_key for ' + location);

  return {
    source_key: sourceKey,
    name: name,
    source_type: sourceType,
    base_url: baseUrl,
    active: source.active === undefined ? true : !!source.active,
    cadence: String(source.cadence || 'manual').trim() || 'manual',
    parser_key: parserKey,
    country_scope: uniqueStrings(source.country_scope || []),
    destination_scope: uniqueStrings(source.destination_scope || []),
    trust_level: String(source.trust_level || 'official').trim() || 'official',
    robots_or_policy_note: String(source.robots_or_policy_note || '').trim() || null,
    adapter_key: String(source.adapter_key || '').trim() || null,
    adapter_version: String(source.adapter_version || '').trim() || null,
    crawl_policy: source.crawl_policy && typeof source.crawl_policy === 'object' ? source.crawl_policy : null,
    robots_url: String(source.robots_url || '').trim() || null,
    robots_allowed: source.robots_allowed === undefined ? null : !!source.robots_allowed,
    rate_limit_ms: toPositiveInteger(source.rate_limit_ms, 5000)
  };
}

function getDefaultScholarshipSourceRows() {
  return defaultScholarshipSourceDefinitions().map(normalizeSourceDefinition);
}

function readScholarshipSourceRegistryPayload() {
  try {
    return require('../../../data/scholarships/official-sources.json');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') return null;
    throw error;
  }
}

function readScholarshipSourceCandidatesPayload() {
  try {
    return require('../../../data/scholarships/source-candidates.json');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') return null;
    throw error;
  }
}

function normalizeSourceCandidateDefinition(input, index) {
  const candidate = input || {};
  const sourceKey = String(candidate.source_key || '').trim();
  const name = String(candidate.name || '').trim();
  const baseUrl = String(candidate.base_url || '').trim();
  const parserKey = String(candidate.parser_key || '').trim();
  const location = sourceKey || 'candidate #' + (index + 1);

  if (!sourceKey) throw new Error('Scholarship source candidate missing source_key at index ' + index);
  if (!name) throw new Error('Scholarship source candidate missing name for ' + location);
  if (!baseUrl) throw new Error('Scholarship source candidate missing base_url for ' + location);
  if (!parserKey) throw new Error('Scholarship source candidate missing parser_key for ' + location);

  return {
    source_key: sourceKey,
    name: name,
    base_url: baseUrl,
    robots_url: String(candidate.robots_url || '').trim() || null,
    parser_key: parserKey,
    status: String(candidate.status || 'reference_only').trim() || 'reference_only',
    allowed_use: String(candidate.allowed_use || '').trim(),
    blocked_use: String(candidate.blocked_use || '').trim(),
    degree_scope: uniqueStrings(candidate.degree_scope || []),
    notes: String(candidate.notes || '').trim()
  };
}

function loadScholarshipSourceCandidates(options) {
  const settings = options || {};
  if (!settings.force && sourceCandidateCache) {
    return sourceCandidateCache.map(function (candidate) {
      return Object.assign({}, candidate, {
        degree_scope: ensureArray(candidate.degree_scope)
      });
    });
  }

  const payload = readScholarshipSourceCandidatesPayload();
  const candidates = payload && Array.isArray(payload.candidates)
    ? payload.candidates.map(normalizeSourceCandidateDefinition)
    : [];
  sourceCandidateCache = candidates;
  return loadScholarshipSourceCandidates({ force: false });
}

function readScholarshipDeadlineOverridesPayload() {
  if (deadlineOverridesCache) return deadlineOverridesCache;
  try {
    deadlineOverridesCache = require('../../../data/scholarships/deadline-overrides.json');
    return deadlineOverridesCache;
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') return null;
    throw error;
  }
}

function getScholarshipDeadlineOverride(slug) {
  const payload = readScholarshipDeadlineOverridesPayload();
  const overrides = payload && payload.overrides && typeof payload.overrides === 'object'
    ? payload.overrides
    : {};
  const entry = overrides[String(slug || '').trim()];
  return entry && typeof entry === 'object' ? entry : null;
}

function normalizeDeadlineStatus(status, deadlineDate) {
  const explicit = String(status || '').toLowerCase();
  if (['open', 'upcoming', 'unclear', 'closed', 'variable'].indexOf(explicit) !== -1) return explicit;
  if (deadlineDate && new Date(deadlineDate).getTime() < Date.now()) return 'closed';
  return deadlineDate ? 'open' : 'unclear';
}

function getDeadlineOverrideConfidence(override) {
  const explicit = String(override && (override.deadline_confidence || override.confidence) || '').toLowerCase();
  if (explicit === 'verified' || explicit === 'no_single_public_deadline') return explicit;
  return override && override.deadline_date ? 'verified' : 'no_single_public_deadline';
}

function getDeadlineOverrideResolution(override) {
  return override && override.deadline_date ? 'exact_date' : 'no_single_public_deadline';
}

function loadScholarshipSourceRegistry(options) {
  const settings = options || {};
  if (!settings.force && sourceRegistryCache) {
    return sourceRegistryCache.map(cloneSourceRow);
  }

  const byKey = new Map();
  getDefaultScholarshipSourceRows().forEach(function (row) {
    byKey.set(row.source_key, row);
  });

  const payload = readScholarshipSourceRegistryPayload();
  if (payload) {
    if (!Array.isArray(payload.sources)) {
      throw new Error('Scholarship source registry must expose a sources array');
    }
    payload.sources.map(normalizeSourceDefinition).forEach(function (row) {
      byKey.set(row.source_key, row);
    });
  }

  sourceRegistryCache = Array.from(byKey.values()).sort(function (left, right) {
    return left.source_key.localeCompare(right.source_key);
  });
  return sourceRegistryCache.map(cloneSourceRow);
}

function isManualReviewParser(source) {
  return !!source && MANUAL_REVIEW_PARSER_KEYS.has(String(source.parser_key || '').trim());
}

function buildLegacyScholarship(row) {
  const snapshot = row && row.raw_snapshot && typeof row.raw_snapshot === 'object' ? row.raw_snapshot : {};
  const source = row && row._source && typeof row._source === 'object' ? row._source : {};
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    title: row.title,
    provider: row.provider || snapshot.provider || '',
    application_url: snapshot.application_url || row.official_url || row.source_url || '',
    info_url: snapshot.info_url || row.official_url || row.source_url || '',
    source_url: row.source_url || snapshot.source_url || snapshot.info_url || snapshot.application_url || '',
    official_url: row.official_url || snapshot.official_url || snapshot.info_url || snapshot.application_url || '',
    source_key: row.source_key || snapshot.source_key || source.source_key || '',
    source_type: row.source_type || snapshot.source_type || source.source_type || '',
    source_name: row.source_name || snapshot.source_name || source.name || '',
    parser_key: row.parser_key || snapshot.parser_key || source.parser_key || '',
    trust_level: row.trust_level || snapshot.trust_level || source.trust_level || '',
    levels: ensureArray(snapshot.levels || row.study_levels),
    study_levels: ensureArray(row.study_levels),
    destinations: ensureArray(snapshot.destinations || row.destination_countries),
    destination_countries: ensureArray(row.destination_countries),
    fields: ensureArray(snapshot.fields || row.fields),
    funding: row.funding_type || snapshot.funding || '',
    funding_type: row.funding_type || '',
    description: row.summary || snapshot.description || snapshot.summary || '',
    summary: row.summary || snapshot.description || '',
    details: normalizeJsonObject(row.details || snapshot.details, {}),
    award_value_min: row.award_value_min != null ? row.award_value_min : null,
    award_value_max: row.award_value_max != null ? row.award_value_max : null,
    award_value_amount: row.award_value_amount != null ? row.award_value_amount : null,
    award_value_currency: row.award_value_currency || '',
    award_value_period: row.award_value_period || '',
    award_value_text: row.award_value_text || '',
    award_components: normalizeJsonArray(row.award_components),
    award_value_confidence: row.award_value_confidence || '',
    award_value_source_url: row.award_value_source_url || '',
    award_value_usd: row.award_value_usd != null ? row.award_value_usd : null,
    local_value_amount: row.local_value_amount != null ? row.local_value_amount : null,
    local_value_currency: row.local_value_currency || '',
    min_gpa_4: snapshot.min_gpa_4 != null ? snapshot.min_gpa_4 : row.min_gpa,
    min_gpa_5: snapshot.min_gpa_5 != null ? snapshot.min_gpa_5 : null,
    min_ielts: row.min_ielts != null ? row.min_ielts : toNumber(snapshot.min_ielts),
    deadline_date: row.deadline_date || snapshot.deadline_date || null,
    deadline_text: row.deadline_text || snapshot.deadline_text || '',
    deadline_month: snapshot.deadline_month || null,
    deadline_status: row.deadline_status || snapshot.deadline_status || null,
    deadline_confidence: row.deadline_confidence || snapshot.deadline_confidence || null,
    deadline_resolution: snapshot.deadline_resolution || null,
    deadline_source_url: row.deadline_source_url || snapshot.deadline_source_url || row.source_url || snapshot.source_url || null,
    deadline_last_checked: row.deadline_last_checked || snapshot.deadline_last_checked || row.last_verified_at || row.last_seen_at || null,
    deadline_notes: row.deadline_notes || snapshot.deadline_notes || '',
    deadline_evidence: snapshot.deadline_evidence || '',
    deadline_checked_urls: Array.isArray(snapshot.deadline_checked_urls) ? snapshot.deadline_checked_urls : [],
    status: row.status,
    confidence_mode: row.confidence_mode,
    source_confidence: row.source_confidence != null ? row.source_confidence : null,
    freshness_score: row.freshness_score != null ? row.freshness_score : null,
    review_status: row.review_status || '',
    proof_level: row.proof_level,
    published_at: row.published_at || null,
    verified_at: row.verified_at || null,
    last_checked_at: row.last_checked_at || null,
    last_seen_at: row.last_seen_at,
    last_verified_at: row.last_verified_at,
    is_featured: !!row.is_featured
  };
}

function filterScholarships(scholarships, params) {
  let results = Array.isArray(scholarships) ? scholarships.slice() : [];

  if (params.level && params.level !== 'all') {
    results = results.filter(function (item) {
      return ensureArray(item.levels).indexOf(params.level) !== -1;
    });
  }

  if (params.destination && params.destination !== 'all') {
    results = results.filter(function (item) {
      const destinations = ensureArray(item.destinations);
      return destinations.indexOf(params.destination) !== -1 || destinations.indexOf('global') !== -1;
    });
  }

  if (params.field && params.field !== 'all') {
    results = results.filter(function (item) {
      const fields = ensureArray(item.fields);
      return fields.indexOf(params.field) !== -1 || fields.indexOf('any') !== -1;
    });
  }

  if (params.funding && params.funding !== 'all') {
    results = results.filter(function (item) {
      return item.funding === params.funding;
    });
  }

  if (params.search) {
    const query = String(params.search).trim().toLowerCase();
    results = results.filter(function (item) {
      return [item.name, item.provider, item.description].some(function (value) {
        return String(value || '').toLowerCase().indexOf(query) !== -1;
      });
    });
  }

  return results;
}

function deriveModeFromRows(rows, options) {
  if (options && options.mode) return options.mode;

  const counts = { live: 0, cached: 0, curated: 0, fallback: 0 };
  (rows || []).forEach(function (row) {
    const mode = row && row.confidence_mode ? String(row.confidence_mode) : 'curated';
    if (counts[mode] !== undefined) counts[mode] += 1;
  });

  if (counts.live > 0 && !isMirrorStale(rows)) return 'live';
  if (counts.curated > 0 && !isMirrorStale(rows)) return 'curated';
  if ((counts.live + counts.curated + counts.cached) > 0) return 'cached';
  return 'fallback';
}

function buildFeedMeta(rows, options) {
  const mode = deriveModeFromRows(rows, options || {});
  const lastCheckedAt = (options && options.lastCheckedAt) || maxTimestamp(rows);
  const countOverride = options && options.count !== undefined ? Number(options.count) : NaN;
  const count = Number.isFinite(countOverride) && countOverride >= 0
    ? Math.floor(countOverride)
    : (Array.isArray(rows) ? rows.length : 0);
  const lastCheckedLabel = formatTimestamp(lastCheckedAt);
  const hasSourceError = !!(options && options.error);
  const isLimited = count > 0 && count < PUBLIC_MIN_SCHOLARSHIP_COUNT;
  const isDegraded = mode === 'cached' || mode === 'fallback' || hasSourceError || isLimited;

  let label = 'Live feed';
  let message = 'Live scholarship feed refreshed.';
  let tone = isDegraded ? 'warn' : 'ok';

  if (mode === 'curated') {
    label = hasSourceError ? 'Curated fallback feed' : 'Curated feed';
    message = 'Showing the curated AfroTools scholarship catalog' + (lastCheckedLabel ? ' last checked on ' + lastCheckedLabel + '.' : '.');
    if (hasSourceError) {
      message = 'Live scholarship refresh is unavailable. Showing the curated AfroTools scholarship catalog instead' +
        (lastCheckedLabel ? ' last checked on ' + lastCheckedLabel + '.' : '.');
    }
  } else if (mode === 'cached') {
    label = 'Cached feed';
    message = 'Live scholarship refresh is unavailable. Showing cached scholarship data' + (lastCheckedLabel ? ' last checked on ' + lastCheckedLabel + '.' : '.');
  } else if (mode === 'fallback') {
    label = 'Fallback feed';
    message = 'Live scholarship pipeline is unavailable. Showing the narrower fallback scholarship dataset instead.';
  } else {
    message = 'Live scholarship feed refreshed' + (lastCheckedLabel ? ' on ' + lastCheckedLabel + '.' : '.');
  }

  if (isLimited) {
    const limitedSourceLabel = mode === 'fallback'
      ? 'fallback scholarship dataset'
      : (mode === 'cached' ? 'cached verified scholarship feed' : 'verified scholarship feed');
    label = 'Limited live feed';
    message = 'Showing ' + formatScholarshipClaimLabel(count) +
      ' from the ' + limitedSourceLabel + '. This is below the public coverage threshold of ' +
      PUBLIC_MIN_SCHOLARSHIP_COUNT +
      ', so AfroTools marks the catalog limited while sources are expanded.';
    tone = 'warn';
  }

  if (options && options.error && mode !== 'fallback') {
    message += ' Feed note: ' + String(options.error);
  }

  return {
    mode: mode,
    label: label,
    message: message,
    tone: tone,
    count: count,
    cachedAt: lastCheckedAt || null,
    lastCheckedAt: lastCheckedAt || null,
    lastCheckedLabel: lastCheckedLabel,
    isDegraded: isDegraded,
    isLimited: isLimited,
    publicMinCount: PUBLIC_MIN_SCHOLARSHIP_COUNT,
    claimSafeLabel: formatScholarshipClaimLabel(count),
    stale: mode === 'cached',
    error: options && options.error ? String(options.error) : ''
  };
}

async function writeFeedCache(scholarships, meta) {
  await setData(CACHE_KEY, {
    data: scholarships,
    timestamp: meta && (meta.lastCheckedAt || meta.cachedAt) ? meta.lastCheckedAt || meta.cachedAt : new Date().toISOString(),
    meta: meta || null,
    count: scholarships.length
  });
}

async function readCachedScholarshipPayload() {
  const cached = await getData(CACHE_KEY);
  if (!cached) return null;

  if (Array.isArray(cached)) {
    return {
      scholarships: cached,
      meta: buildFeedMeta([], { mode: 'cached' })
    };
  }

  const scholarships = Array.isArray(cached.data) ? cached.data : (Array.isArray(cached.scholarships) ? cached.scholarships : []);
  if (!scholarships.length) return null;

  return {
    scholarships: scholarships,
    meta: cached.meta || buildFeedMeta([], {
      mode: 'cached',
      lastCheckedAt: cached.timestamp || cached.cachedAt || null
    })
  };
}

async function ensureScholarshipSources(client) {
  if (!client) return [];
  const rows = loadScholarshipSourceRegistry();

  const { error } = await client.from('scholarship_sources').upsert(rows, {
    onConflict: 'source_key'
  });
  if (error) throw error;
  return rows;
}

async function beginIngestRun(client, sourceId) {
  const { data, error } = await client
    .from('scholarship_ingest_runs')
    .insert({ source_id: sourceId, status: 'running' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function finishIngestRun(client, runId, values) {
  if (!runId) return;
  const payload = Object.assign({
    finished_at: new Date().toISOString()
  }, values || {});
  await client.from('scholarship_ingest_runs').update(payload).eq('id', runId);
}

async function updateSourceHealth(client, sourceId, values) {
  if (!sourceId) return;
  await client.from('scholarship_sources').update(values).eq('id', sourceId);
}

async function fetchMirrorRows(client) {
  const { data, error } = await client
    .from('scholarships')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('deadline_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true })
    .limit(500);
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const sourceIds = uniqueValues(rows.map(function (row) { return row.last_source_id; }));
  if (!sourceIds.length) return rows;

  const { data: sourceRows, error: sourceError } = await client
    .from('scholarship_sources')
    .select('id, source_key, name, source_type, parser_key, trust_level')
    .in('id', sourceIds);
  if (sourceError) throw sourceError;

  const sourceMap = new Map((sourceRows || []).map(function (source) {
    return [source.id, source];
  }));

  return rows.map(function (row) {
    return Object.assign({}, row, {
      _source: row.last_source_id ? sourceMap.get(row.last_source_id) || null : null
    });
  });
}

async function fetchDataInstanceScholarships() {
  if (!DATA_READ_KEY) {
    throw new Error('No Supabase data credentials configured for scholarship import');
  }

  const response = await fetch(DATA_URL + '/rest/v1/scholarships?is_active=eq.true&select=*', {
    headers: {
      apikey: DATA_READ_KEY,
      Authorization: 'Bearer ' + DATA_READ_KEY
    }
  });

  if (!response.ok) {
    throw new Error('Data scholarship source returned HTTP ' + response.status);
  }

  return response.json();
}

function normalizeScholarshipRecord(raw, source) {
  const title = String(raw.title || raw.name || '').trim();
  if (!title) return null;

  const minGpa4 = toNumber(raw.min_gpa_4);
  const minGpa5 = toNumber(raw.min_gpa_5);
  const confidenceMode = ['live', 'cached', 'curated', 'fallback'].indexOf(String(raw.confidence_mode || '')) !== -1
    ? String(raw.confidence_mode)
    : (source.source_type === 'curated_import' ? 'curated' : 'live');

  const summary = String(raw.summary || raw.description || '').trim();
  const officialUrl = String(raw.official_url || raw.info_url || raw.application_url || raw.source_url || '').trim();
  const sourceUrl = String(raw.source_url || raw.application_url || raw.info_url || officialUrl).trim();
  if (!sourceUrl) return null;
  const award = normalizeAwardValue(raw, sourceUrl);
  const slug = slugify(raw.slug || title + '-' + (raw.provider || raw.destination || raw.country || 'scholarship'));
  const deadlineOverride = getScholarshipDeadlineOverride(slug);
  const deadlineDate = parseDeadlineDate((deadlineOverride && deadlineOverride.deadline_date) || raw.deadline_date || raw.deadlineDate);
  const overrideConfidence = deadlineOverride ? getDeadlineOverrideConfidence(deadlineOverride) : '';
  const status = overrideConfidence === 'no_single_public_deadline'
    ? 'variable'
    : normalizeDeadlineStatus((deadlineOverride && deadlineOverride.status) || raw.status, deadlineDate);
  const databaseStatus = status === 'variable' ? 'unclear' : status;
  const studyLevels = uniqueStrings(raw.study_levels || raw.levels);
  const deadlineStatus = deadlineDate ? 'dated' : (status === 'variable' ? 'varies' : (status === 'rolling' ? 'rolling' : null));
  const checkedAt = new Date().toISOString();
  const sourceSnapshot = Object.assign({}, raw, {
    source_key: source.source_key || '',
    source_type: source.source_type || '',
    source_name: source.name || '',
    parser_key: source.parser_key || '',
    trust_level: source.trust_level || '',
    last_source_id: source.id || null
  });
  if (deadlineOverride) {
    const deadlineConfidence = overrideConfidence;
    sourceSnapshot.deadline_override = Object.assign({}, deadlineOverride, {
      applied_from: 'data/scholarships/deadline-overrides.json'
    });
    sourceSnapshot.deadline_confidence = deadlineConfidence;
    sourceSnapshot.deadline_resolution = getDeadlineOverrideResolution(deadlineOverride);
    sourceSnapshot.deadline_source_url = deadlineOverride.deadline_source_url || sourceUrl || '';
    sourceSnapshot.deadline_notes = deadlineOverride.deadline_notes || '';
    sourceSnapshot.deadline_evidence = deadlineOverride.evidence || '';
    sourceSnapshot.deadline_checked_urls = Array.isArray(deadlineOverride.checked_urls) ? deadlineOverride.checked_urls : [];
    sourceSnapshot.deadline_date = deadlineDate;
    sourceSnapshot.deadline_text = deadlineOverride.deadline_text || '';
    sourceSnapshot.deadline_status = status;
  }

  const record = {
    slug: slug,
    title: title,
    provider: String(raw.provider || '').trim(),
    source_url: sourceUrl || null,
    official_url: officialUrl || null,
    destination_countries: uniqueStrings(raw.destination_countries || raw.destinations),
    eligible_origins: uniqueStrings(raw.eligible_origins || ['Africa']),
    eligible_countries: uniqueStrings(raw.eligible_countries || raw.eligible_origins || ['Africa']),
    study_levels: studyLevels,
    level: studyLevels[0] || null,
    fields: uniqueStrings(raw.fields || ['any']),
    funding_type: String(raw.funding_type || raw.funding || '').trim() || null,
    award_value_min: award.min,
    award_value_max: award.max,
    award_value_amount: firstDefined(raw.award_value_amount, raw.awardValueAmount, award.max, award.min),
    award_value_currency: award.currency || null,
    award_value_period: award.period || null,
    award_value_text: award.text || null,
    award_components: award.components,
    award_value_confidence: award.confidence,
    award_value_source_url: award.sourceUrl,
    award_value_last_checked_at: award.checkedAt || null,
    min_gpa: minGpa4 != null ? minGpa4 : (minGpa5 != null ? Number((minGpa5 * 0.8).toFixed(2)) : null),
    min_ielts: toNumber(raw.min_ielts),
    deadline_date: deadlineDate,
    deadline_text: String((deadlineOverride && deadlineOverride.deadline_text) || raw.deadline_text || '').trim() || null,
    deadline_status: deadlineStatus,
    status: databaseStatus,
    confidence_mode: confidenceMode,
    proof_level: String(deadlineOverride
      ? (getDeadlineOverrideConfidence(deadlineOverride) === 'verified' ? 'official_deadline_manual_review' : 'official_deadline_no_single_public_date')
      : (raw.proof_level || (officialUrl ? 'official_link' : 'source_link'))).trim(),
    summary: summary || null,
    source_type: String(raw.source_type || (officialUrl ? 'official' : 'trusted_aggregator')).trim(),
    source_confidence: toNumber(raw.source_confidence) || (officialUrl ? 88 : 60),
    freshness_score: toNumber(raw.freshness_score) || (deadlineDate ? 90 : 78),
    review_status: raw.review_status || (officialUrl ? 'approved' : 'pending'),
    published_at: raw.published_at || raw.created_at || checkedAt,
    verified_at: raw.verified_at || checkedAt,
    last_checked_at: raw.last_checked_at || checkedAt,
    last_seen_at: checkedAt,
    last_verified_at: checkedAt,
    is_featured: !!raw.is_featured,
    is_active: raw.is_active === false ? false : true,
    raw_snapshot: sourceSnapshot,
    last_source_id: source.id
  };

  const details = normalizeJsonObject(raw.details, null);
  if (details && Object.keys(details).length) {
    record.details = details;
  } else {
    record.details = buildScholarshipDetailsPayload(record);
  }

  return record;
}

async function importSourceItems(client, source, rawItems) {
  const parsedItems = [];
  const rawRows = [];

  (rawItems || []).forEach(function (rawItem) {
    const normalized = normalizeScholarshipRecord(rawItem, source);
    if (!normalized) return;
    parsedItems.push(normalized);
    rawRows.push({
      source_id: source.id,
      fetched_at: new Date().toISOString(),
      source_url: normalized.source_url,
      raw_hash: buildHash(rawItem),
      raw_payload: normalized.raw_snapshot,
      parse_status: 'parsed',
      normalized_slug: normalized.slug
    });
  });

  if (!parsedItems.length) {
    return { itemsSeen: Array.isArray(rawItems) ? rawItems.length : 0, itemsCreated: 0, itemsUpdated: 0 };
  }

  const slugs = parsedItems.map(function (item) { return item.slug; });
  const { data: existingRows, error: existingError } = await client
    .from('scholarships')
    .select('slug')
    .in('slug', slugs);
  if (existingError) throw existingError;

  const existingSet = new Set((existingRows || []).map(function (row) { return row.slug; }));

  const { error: rawError } = await client
    .from('scholarship_raw_items')
    .upsert(rawRows, { onConflict: 'source_id,raw_hash' });
  if (rawError) throw rawError;

  const { error: upsertError } = await client
    .from('scholarships')
    .upsert(parsedItems, { onConflict: 'slug' });
  if (upsertError) throw upsertError;

  const { data: persistedRows, error: persistedError } = await client
    .from('scholarships')
    .select('id, slug')
    .in('slug', slugs);
  if (persistedError) throw persistedError;

  return {
    itemsSeen: Array.isArray(rawItems) ? rawItems.length : 0,
    itemsCreated: parsedItems.filter(function (item) { return !existingSet.has(item.slug); }).length,
    itemsUpdated: parsedItems.filter(function (item) { return existingSet.has(item.slug); }).length,
    scholarshipIds: (persistedRows || []).map(function (row) { return row.id; })
  };
}

async function createManualReviewSourceRecord(client, source, reason) {
  if (!client || !source || !source.id) {
    return { itemsSeen: 0, itemsCreated: 0, itemsUpdated: 0, warning: reason || 'manual_review_required' };
  }

  const checkedAt = new Date().toISOString();
  const payload = {
    manual_review_required: true,
    reason: reason || 'manual_review_required',
    source_key: source.source_key || '',
    source_type: source.source_type || '',
    source_name: source.name || '',
    base_url: source.base_url || '',
    cadence: source.cadence || '',
    parser_key: source.parser_key || '',
    country_scope: ensureArray(source.country_scope),
    destination_scope: ensureArray(source.destination_scope),
    trust_level: source.trust_level || '',
    robots_or_policy_note: source.robots_or_policy_note || '',
    checked_at: checkedAt
  };

  const { error } = await client.from('scholarship_raw_items').upsert({
    source_id: source.id,
    fetched_at: checkedAt,
    source_url: source.base_url || null,
    raw_hash: buildHash({ source_key: source.source_key, parser_key: source.parser_key, manual_review_required: true }),
    raw_payload: payload,
    parse_status: 'skipped',
    normalized_slug: null
  }, { onConflict: 'source_id,raw_hash' });
  if (error) throw error;

  return { itemsSeen: 0, itemsCreated: 0, itemsUpdated: 0, warning: payload.reason };
}

async function retireStaleScholarships(client) {
  if (!client) return { inactiveCount: 0, unclearCount: 0, scholarshipIds: [] };

  const { data: backupSource, error: backupError } = await client
    .from('scholarship_sources')
    .select('id')
    .eq('source_key', SOURCE_KEYS.backup)
    .maybeSingle();
  if (backupError) throw backupError;

  const backupSourceId = backupSource && backupSource.id ? backupSource.id : null;
  const inactiveBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const unclearBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let inactiveQuery = client
    .from('scholarships')
    .update({
      is_active: false,
      status: 'unclear',
      proof_level: 'inactive_not_seen_30d'
    })
    .eq('is_active', true)
    .not('last_source_id', 'is', null)
    .lte('last_seen_at', inactiveBefore);
  if (backupSourceId) inactiveQuery = inactiveQuery.neq('last_source_id', backupSourceId);
  const { data: inactiveRows, error: inactiveError } = await inactiveQuery.select('id');
  if (inactiveError) throw inactiveError;

  let unclearQuery = client
    .from('scholarships')
    .update({
      status: 'unclear',
      proof_level: 'manual_review'
    })
    .eq('is_active', true)
    .not('last_source_id', 'is', null)
    .lte('last_seen_at', unclearBefore);
  if (backupSourceId) unclearQuery = unclearQuery.neq('last_source_id', backupSourceId);
  const { data: unclearRows, error: unclearError } = await unclearQuery.select('id');
  if (unclearError) throw unclearError;

  const scholarshipIds = uniqueValues([].concat(
    (inactiveRows || []).map(function (row) { return row.id; }),
    (unclearRows || []).map(function (row) { return row.id; })
  ));

  return {
    inactiveCount: (inactiveRows || []).length,
    unclearCount: (unclearRows || []).length,
    scholarshipIds: scholarshipIds
  };
}

async function fetchSourceItems(source) {
  if (!source || !source.parser_key) {
    return { rawItems: [], manualReview: true, warning: 'manual_review_required: missing parser key' };
  }
  if (sourceAdapters && typeof sourceAdapters.fetchSourceItemsWithAdapter === 'function') {
    const adapterResult = await sourceAdapters.fetchSourceItemsWithAdapter(source);
    if (adapterResult) return adapterResult;
  }
  if (source.parser_key === 'data_instance_scholarship_catalog') {
    return { rawItems: await fetchDataInstanceScholarships(), manualReview: false };
  }
  if (source.parser_key === 'curated_backup_catalog') {
    return { rawItems: getFallbackScholarships(), manualReview: false };
  }
  if (isManualReviewParser(source)) {
    return {
      rawItems: [],
      manualReview: true,
      warning: 'manual_review_required: ' + source.parser_key
    };
  }
  throw new Error('Unsupported scholarship parser: ' + source.parser_key);
}

async function syncScholarshipMirror(options) {
  const client = (options && options.client) || getAuthClient();
  if (!client) throw new Error('Scholarship auth client not configured');

  await ensureScholarshipSources(client);

  const { data: sources, error: sourceError } = await client
    .from('scholarship_sources')
    .select('*')
    .eq('active', true)
    .order('source_key', { ascending: true });
  if (sourceError) throw sourceError;

  let finalMode = null;
  let sawAnyData = false;
  let primaryError = null;
  const touchedScholarshipIds = [];
  let staleRetirement = null;

  for (const source of (sources || [])) {
    const runId = await beginIngestRun(client, source.id);
    try {
      const fetchResult = await fetchSourceItems(source);
      if (fetchResult.manualReview) {
        const manualCounts = await createManualReviewSourceRecord(client, source, fetchResult.warning);
        await finishIngestRun(client, runId, {
          status: 'partial',
          items_seen: 0,
          items_created: 0,
          items_updated: 0,
          error_summary: manualCounts.warning
        });
        await updateSourceHealth(client, source.id, {
          last_success_at: new Date().toISOString(),
          last_error_at: null
        });
        continue;
      }
      const rawItems = fetchResult.rawItems;
      const counts = await importSourceItems(client, source, rawItems);
      if (counts.scholarshipIds && counts.scholarshipIds.length) {
        touchedScholarshipIds.push.apply(touchedScholarshipIds, counts.scholarshipIds);
      }
      await finishIngestRun(client, runId, {
        status: counts.itemsSeen > 0 ? 'success' : 'partial',
        items_seen: counts.itemsSeen,
        items_created: counts.itemsCreated,
        items_updated: counts.itemsUpdated,
        error_summary: counts.itemsSeen > 0 ? null : 'No items returned by source'
      });
      await updateSourceHealth(client, source.id, {
        last_success_at: new Date().toISOString(),
        last_error_at: null
      });
      if (counts.itemsSeen > 0) {
        sawAnyData = true;
        finalMode = source.source_type === 'curated_import' ? 'curated' : 'live';
      }
    } catch (error) {
      if (!primaryError) primaryError = error;
      await finishIngestRun(client, runId, {
        status: 'failed',
        error_summary: error.message
      });
      await updateSourceHealth(client, source.id, {
        last_error_at: new Date().toISOString()
      });
    }
  }

  if (!sawAnyData) {
    const { data: backupSource } = await client
      .from('scholarship_sources')
      .select('*')
      .eq('source_key', SOURCE_KEYS.backup)
      .maybeSingle();

    if (backupSource) {
      const runId = await beginIngestRun(client, backupSource.id);
      const rawItems = getFallbackScholarships();
      const counts = await importSourceItems(client, backupSource, rawItems);
      if (counts.scholarshipIds && counts.scholarshipIds.length) {
        touchedScholarshipIds.push.apply(touchedScholarshipIds, counts.scholarshipIds);
      }
      await finishIngestRun(client, runId, {
        status: counts.itemsSeen > 0 ? 'success' : 'failed',
        items_seen: counts.itemsSeen,
        items_created: counts.itemsCreated,
        items_updated: counts.itemsUpdated,
        error_summary: counts.itemsSeen > 0 ? null : 'No fallback scholarship records available'
      });
      await updateSourceHealth(client, backupSource.id, {
        last_success_at: new Date().toISOString(),
        last_error_at: null
      });
      if (counts.itemsSeen > 0) {
        sawAnyData = true;
        finalMode = 'curated';
      }
    }
  }

  staleRetirement = await retireStaleScholarships(client);
  if (staleRetirement.scholarshipIds && staleRetirement.scholarshipIds.length) {
    touchedScholarshipIds.push.apply(touchedScholarshipIds, staleRetirement.scholarshipIds);
  }

  let reminderReconciliation = null;
  if (touchedScholarshipIds.length) {
    reminderReconciliation = await reconcileReminderJobsForScholarshipIds(client, touchedScholarshipIds);
  }

  const rows = await fetchMirrorRows(client);
  const scholarships = rows.map(buildLegacyScholarship);
  const meta = buildFeedMeta(rows, {
    mode: finalMode || null,
    lastCheckedAt: new Date().toISOString(),
    error: primaryError ? primaryError.message : ''
  });

  if (scholarships.length) {
    await writeFeedCache(scholarships, meta);
  }

  return {
    scholarships: scholarships,
    rows: rows,
    staleRetirement: staleRetirement,
    reminderReconciliation: reminderReconciliation,
    meta: scholarships.length ? meta : buildFeedMeta([], {
      mode: 'fallback',
      error: primaryError ? primaryError.message : 'Scholarship mirror is empty'
    })
  };
}

function decodeXmlEntity(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSitemapLocs(xml) {
  const locs = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match = pattern.exec(String(xml || ''));
  while (match) {
    const loc = decodeXmlEntity(match[1]).trim();
    if (/^https?:\/\//i.test(loc)) locs.push(loc);
    match = pattern.exec(String(xml || ''));
  }
  return uniqueValues(locs);
}

function isLikelyScholarshipLeadUrl(url) {
  const value = String(url || '').toLowerCase();
  return /^https?:\/\//.test(value) &&
    /scholarship|scholarships|funding|studentship|fellowship|bursary|grant/.test(value) &&
    !/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip)(\?|#|$)/.test(value);
}

function titleFromLeadUrl(url) {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname;
    const title = segment.replace(/\.(html?|aspx?)$/i, '').replace(/[-_]+/g, ' ').trim();
    return title ? title.replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) : parsed.hostname;
  } catch (error) {
    return 'Scholarship source lead';
  }
}

async function fetchTextResource(url, options) {
  const settings = options || {};
  const fetchImpl = settings.fetchImpl || fetch;
  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': sourceAdapters && sourceAdapters.DEFAULT_USER_AGENT
        ? sourceAdapters.DEFAULT_USER_AGENT
        : 'AfroToolsScholarshipBot/1.0 (+https://afrotools.com/tools/scholarship-finder/)',
      Accept: 'application/xml,text/xml,text/plain,*/*;q=0.8'
    }
  });
  if (!response.ok) throw new Error('Discovery fetch returned HTTP ' + response.status + ' for ' + url);
  return response.text();
}

function buildSuggestionFromLead(candidate, url) {
  const levels = ensureArray(candidate.degree_scope);
  return {
    source_url: url,
    title: titleFromLeadUrl(url),
    provider: candidate.name,
    country_scope: ['Africa'],
    destination_scope: ['global'],
    study_levels: levels.length ? levels : ['bachelor', 'master', 'phd'],
    submitter_note: [
      'Automated discovery lead from ' + candidate.source_key + '.',
      candidate.allowed_use || '',
      'Do not publish until the canonical official provider page is verified.'
    ].filter(Boolean).join(' '),
    review_status: 'pending'
  };
}

async function discoverSitemapCandidateLeads(candidate, options) {
  const settings = options || {};
  const maxChildSitemaps = toPositiveInteger(settings.maxChildSitemaps, 4);
  const maxLeadsPerCandidate = toPositiveInteger(settings.maxLeadsPerCandidate, 40);
  const result = {
    source_key: candidate.source_key,
    status: candidate.status,
    checked_at: new Date().toISOString(),
    robots_allowed: false,
    leads_seen: 0,
    leads: []
  };

  if (!sourceAdapters || typeof sourceAdapters.checkRobots !== 'function') {
    result.warning = 'robots_check_unavailable';
    return result;
  }

  const robots = await sourceAdapters.checkRobots(candidate.base_url, {
    userAgent: sourceAdapters.DEFAULT_USER_AGENT
  });
  result.robots_allowed = !!robots.robotsAllowed;
  result.robots_url = robots.robotsUrl || candidate.robots_url || '';
  result.robots_status = robots.robotsStatus || 0;
  if (!result.robots_allowed) {
    result.warning = 'robots_disallowed_or_unavailable';
    return result;
  }

  const rootXml = await fetchTextResource(candidate.base_url, settings);
  let locs = parseSitemapLocs(rootXml);
  let leadUrls = locs.filter(isLikelyScholarshipLeadUrl);

  if (leadUrls.length < maxLeadsPerCandidate) {
    const childSitemaps = locs.filter(function (loc) {
      return /\.xml(\?|#|$)/i.test(loc) && /scholarship|program|programme|study|course|degree/i.test(loc);
    }).slice(0, maxChildSitemaps);

    for (let index = 0; index < childSitemaps.length && leadUrls.length < maxLeadsPerCandidate; index += 1) {
      const childXml = await fetchTextResource(childSitemaps[index], settings);
      leadUrls = leadUrls.concat(parseSitemapLocs(childXml).filter(isLikelyScholarshipLeadUrl));
    }
  }

  result.leads = uniqueValues(leadUrls).slice(0, maxLeadsPerCandidate).map(function (url) {
    return buildSuggestionFromLead(candidate, url);
  });
  result.leads_seen = result.leads.length;
  return result;
}

async function storeScholarshipSourceSuggestions(client, leads) {
  const uniqueByUrl = new Map();
  (leads || []).forEach(function (lead) {
    if (lead && /^https?:\/\//i.test(String(lead.source_url || ''))) {
      uniqueByUrl.set(lead.source_url, lead);
    }
  });

  const sourceUrls = Array.from(uniqueByUrl.keys());
  if (!client || !sourceUrls.length) {
    return { seen: sourceUrls.length, existing: 0, created: 0 };
  }

  const existingSet = new Set();
  for (let index = 0; index < sourceUrls.length; index += 100) {
    const chunk = sourceUrls.slice(index, index + 100);
    const { data, error } = await client
      .from('scholarship_source_suggestions')
      .select('source_url')
      .in('source_url', chunk);
    if (error) throw error;
    (data || []).forEach(function (row) {
      existingSet.add(row.source_url);
    });
  }

  const inserts = sourceUrls
    .filter(function (url) { return !existingSet.has(url); })
    .map(function (url) { return uniqueByUrl.get(url); });

  if (!inserts.length) {
    return { seen: sourceUrls.length, existing: existingSet.size, created: 0 };
  }

  const { error: insertError } = await client
    .from('scholarship_source_suggestions')
    .insert(inserts);
  if (insertError) throw insertError;

  return {
    seen: sourceUrls.length,
    existing: existingSet.size,
    created: inserts.length
  };
}

async function discoverScholarshipCandidateLeads(options) {
  const settings = options || {};
  const client = settings.client || getAuthClient();
  const candidates = settings.candidates || loadScholarshipSourceCandidates();
  const results = [];
  let leads = [];

  for (const candidate of candidates) {
    try {
      if (candidate.status !== 'discovery_only') {
        results.push({
          source_key: candidate.source_key,
          status: candidate.status,
          checked_at: new Date().toISOString(),
          leads_seen: 0,
          warning: 'reference_only_or_manual_use'
        });
        continue;
      }
      const result = await discoverSitemapCandidateLeads(candidate, settings);
      results.push(Object.assign({}, result, { leads: undefined }));
      leads = leads.concat(result.leads || []);
    } catch (error) {
      results.push({
        source_key: candidate.source_key,
        status: candidate.status,
        checked_at: new Date().toISOString(),
        leads_seen: 0,
        warning: error.message
      });
    }
  }

  const suggestionCounts = await storeScholarshipSourceSuggestions(client, leads);
  return {
    ok: true,
    checked_at: new Date().toISOString(),
    candidate_count: candidates.length,
    lead_count: leads.length,
    suggestions_seen_count: suggestionCounts.seen,
    suggestions_existing_count: suggestionCounts.existing,
    suggestions_created_count: suggestionCounts.created,
    candidates: results
  };
}

async function discoverScholarshipSources(options) {
  const client = (options && options.client) || getAuthClient();
  if (!client) throw new Error('Scholarship auth client not configured');

  await ensureScholarshipSources(client);
  const { data: sourceRows, error } = await client
    .from('scholarship_sources')
    .select('source_key, name, source_type, base_url, active, cadence, parser_key, country_scope, destination_scope, trust_level, robots_or_policy_note, last_success_at, last_error_at')
    .order('source_key', { ascending: true });
  if (error) throw error;

  const sources = Array.isArray(sourceRows) ? sourceRows : [];
  const summary = {
    ok: true,
    checked_at: new Date().toISOString(),
    source_count: sources.length,
    active_source_count: sources.filter(function (source) { return !!source.active; }).length,
    manual_review_source_count: sources.filter(isManualReviewParser).length,
    parsable_source_count: sources.filter(function (source) { return !isManualReviewParser(source); }).length,
    sources: sources.map(function (source) {
      return {
        source_key: source.source_key,
        name: source.name,
        source_type: source.source_type,
        base_url: source.base_url,
        active: !!source.active,
        cadence: source.cadence,
        parser_key: source.parser_key,
        country_scope: ensureArray(source.country_scope),
        destination_scope: ensureArray(source.destination_scope),
        trust_level: source.trust_level,
        manual_review: isManualReviewParser(source),
        last_success_at: source.last_success_at || null,
        last_error_at: source.last_error_at || null
      };
    })
  };

  try {
    summary.candidate_discovery = await discoverScholarshipCandidateLeads({
      client: client
    });
  } catch (error) {
    summary.candidate_discovery = {
      ok: false,
      checked_at: new Date().toISOString(),
      error: error.message
    };
  }

  await setData('scholarship-source-registry-latest', summary);
  return summary;
}

async function loadScholarshipFeed(options) {
  const client = getAuthClient();
  const settings = options || {};

  if (client) {
    try {
      await ensureScholarshipSources(client);
      let rows = await fetchMirrorRows(client);

      if (settings.forceSync || !rows.length || isMirrorStale(rows)) {
        try {
          return await syncScholarshipMirror({ client: client });
        } catch (error) {
          if (rows.length) {
            const scholarships = rows.map(buildLegacyScholarship);
            const meta = buildFeedMeta(rows, {
              mode: 'cached',
              error: error.message
            });
            await writeFeedCache(scholarships, meta);
            return { scholarships: scholarships, rows: rows, meta: meta };
          }
        }
      }

      if (rows.length) {
        const scholarships = rows.map(buildLegacyScholarship);
        const meta = buildFeedMeta(rows, {});
        await writeFeedCache(scholarships, meta);
        return { scholarships: scholarships, rows: rows, meta: meta };
      }
    } catch (error) {
      settings.error = error.message;
    }
  }

  const cached = await readCachedScholarshipPayload();
  if (cached) {
    const cachedCount = Array.isArray(cached.scholarships) ? cached.scholarships.length : 0;
    const isLimited = cachedCount > 0 && cachedCount < PUBLIC_MIN_SCHOLARSHIP_COUNT;
    const meta = Object.assign({}, cached.meta || buildFeedMeta([], { mode: 'cached' }), {
      mode: 'cached',
      label: isLimited ? 'Limited live feed' : 'Cached feed',
      isDegraded: true,
      stale: true,
      tone: 'warn',
      isLimited: isLimited,
      publicMinCount: PUBLIC_MIN_SCHOLARSHIP_COUNT,
      claimSafeLabel: formatScholarshipClaimLabel(cachedCount),
      error: settings.error || (cached.meta && cached.meta.error) || ''
    });
    if (isLimited) {
      meta.message = 'Showing ' + formatScholarshipClaimLabel(cachedCount) +
        ' from the cached verified scholarship feed. This is below the public coverage threshold of ' +
        PUBLIC_MIN_SCHOLARSHIP_COUNT +
        ', so AfroTools marks the catalog limited while sources are expanded.';
    }
    return {
      scholarships: cached.scholarships,
      rows: [],
      meta: meta
    };
  }

  const fallback = getFallbackScholarships();
  return {
    scholarships: fallback,
    rows: [],
    meta: buildFeedMeta([], {
      mode: 'fallback',
      count: fallback.length,
      error: settings.error || 'Scholarship pipeline unavailable'
    })
  };
}

async function getScholarshipById(client, scholarshipId) {
  const { data, error } = await client
    .from('scholarships')
    .select('*')
    .eq('id', scholarshipId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function listSavedScholarships(client, userId) {
  const { data: saves, error: saveError } = await client
    .from('user_saved_scholarships')
    .select('id, scholarship_id, saved_at, note, priority, archived, archived_at, updated_at')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('saved_at', { ascending: false });
  if (saveError) throw saveError;

  if (!saves || !saves.length) {
    return {
      items: [],
      count: 0,
      nextDeadline: null,
      reminderEnabledCount: 0
    };
  }

  const scholarshipIds = saves.map(function (row) { return row.scholarship_id; });
  const { data: scholarshipRows, error: scholarshipError } = await client
    .from('scholarships')
    .select('*')
    .in('id', scholarshipIds);
  if (scholarshipError) throw scholarshipError;

  const { data: reminderRows, error: reminderError } = await client
    .from('user_scholarship_reminders')
    .select('id, scholarship_id, reminder_type, offsets, enabled, last_sent_at')
    .eq('user_id', userId)
    .eq('reminder_type', 'deadline');
  if (reminderError) throw reminderError;

  const scholarshipMap = new Map((scholarshipRows || []).map(function (row) {
    return [row.id, row];
  }));
  const reminderMap = new Map((reminderRows || []).map(function (row) {
    return [row.scholarship_id, row];
  }));

  const items = saves.map(function (save) {
    const scholarship = scholarshipMap.get(save.scholarship_id);
    if (!scholarship) return null;

    const reminder = reminderMap.get(save.scholarship_id) || null;
    const legacy = buildLegacyScholarship(scholarship);
    const reminderUnavailableReason = getReminderUnavailableReason(scholarship);
    const canUseDeadlineReminder = !reminderUnavailableReason;

    return Object.assign({}, legacy, {
      saveId: save.id,
      scholarshipId: scholarship.id,
      savedAt: save.saved_at,
      note: save.note || '',
      priority: save.priority || 'normal',
      archived: !!save.archived,
      reminder: {
        enabled: !!(reminder && reminder.enabled && canUseDeadlineReminder),
        offsets: normalizeOffsets(reminder && reminder.offsets),
        lastSentAt: reminder && reminder.last_sent_at ? reminder.last_sent_at : null,
        reminderType: reminder && reminder.reminder_type ? reminder.reminder_type : 'deadline',
        canEnable: canUseDeadlineReminder,
        unavailableReason: reminderUnavailableReason
      }
    });
  }).filter(Boolean);

  const nextDeadline = items
    .filter(function (item) {
      return hasDatedFutureDeadline(item);
    })
    .sort(function (left, right) {
      return new Date(left.deadline_date).getTime() - new Date(right.deadline_date).getTime();
    })[0] || null;

  return {
    items: items,
    count: items.length,
    nextDeadline: nextDeadline,
    reminderEnabledCount: items.filter(function (item) {
      return item.reminder && item.reminder.enabled;
    }).length
  };
}

function buildReminderSchedule(deadlineDate, offsets, options) {
  if (!deadlineDate) return [];
  const base = new Date(deadlineDate + 'T09:00:00Z');
  if (Number.isNaN(base.getTime())) return [];
  const settings = options || {};
  const now = Date.now();

  const schedule = normalizeOffsets(offsets).map(function (offsetDays) {
    const target = new Date(base.getTime());
    target.setUTCDate(target.getUTCDate() - offsetDays);
    return {
      offsetDays: offsetDays,
      scheduledFor: target.toISOString()
    };
  });

  if (settings.includePast) {
    return schedule;
  }

  return schedule.filter(function (entry) {
    return new Date(entry.scheduledFor).getTime() >= now - (60 * 60 * 1000);
  });
}

function hasDatedFutureDeadline(scholarship, options) {
  if (!scholarship || !scholarship.deadline_date || scholarship.status === 'closed') return false;
  if (scholarship.deadline_confidence === 'no_single_public_deadline') return false;

  const parsed = parseDeadlineDate(scholarship.deadline_date);
  if (!parsed) return false;

  const settings = options || {};
  const current = settings.now instanceof Date ? settings.now : new Date();
  const today = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
  const deadline = new Date(parsed + 'T00:00:00Z');
  return deadline.getTime() >= today;
}

function getReminderUnavailableReason(scholarship) {
  if (!scholarship || !scholarship.is_active) return 'scholarship_unavailable';
  if (scholarship.deadline_confidence === 'no_single_public_deadline') return 'no_single_public_deadline';
  if (!scholarship.deadline_date) return 'missing_dated_deadline';
  if (scholarship.status === 'closed') return 'deadline_closed';
  if (!hasDatedFutureDeadline(scholarship)) return 'deadline_not_future_dated';
  return '';
}

async function cancelReminderJobs(client, reminderId) {
  if (!reminderId) return;
  await client
    .from('scholarship_notification_jobs')
    .update({
      status: 'cancelled',
      processed_at: new Date().toISOString()
    })
    .eq('reminder_id', reminderId)
    .eq('status', 'queued');
}

async function syncReminderJobs(client, userId, scholarship, reminderRow) {
  if (!reminderRow) return [];
  await cancelReminderJobs(client, reminderRow.id);

  if (!reminderRow.enabled || !hasDatedFutureDeadline(scholarship)) {
    return [];
  }

  const schedule = buildReminderSchedule(scholarship.deadline_date, reminderRow.offsets);
  if (!schedule.length) return [];

  const rows = schedule.map(function (entry) {
    return {
      job_type: 'deadline_reminder',
      user_id: userId,
      scholarship_id: scholarship.id,
      reminder_id: reminderRow.id,
      scheduled_for: entry.scheduledFor,
      status: 'queued',
      payload: {
        scholarshipTitle: scholarship.title,
        provider: scholarship.provider || '',
        officialUrl: scholarship.official_url || scholarship.source_url || '',
        deadlineDate: scholarship.deadline_date,
        deadlineText: scholarship.deadline_text || '',
        confidenceMode: scholarship.confidence_mode,
        offsetDays: entry.offsetDays
      }
    };
  });

  const { error } = await client
    .from('scholarship_notification_jobs')
    .upsert(rows, { onConflict: 'reminder_id,scheduled_for,job_type' });
  if (error) throw error;
  return rows;
}

function buildReminderScopeKey(userId, scholarshipId) {
  return String(userId) + ':' + String(scholarshipId);
}

async function reconcileReminderJobsForScholarshipIds(client, scholarshipIds) {
  const ids = uniqueValues(scholarshipIds);
  if (!ids.length) {
    return {
      scholarshipCount: 0,
      reminderCount: 0,
      queuedJobs: 0,
      cancelledReminders: 0
    };
  }

  const { data: scholarshipRows, error: scholarshipError } = await client
    .from('scholarships')
    .select('id, title, provider, official_url, source_url, deadline_date, deadline_text, deadline_confidence, confidence_mode, status, is_active')
    .in('id', ids);
  if (scholarshipError) throw scholarshipError;

  const { data: reminderRows, error: reminderError } = await client
    .from('user_scholarship_reminders')
    .select('id, user_id, scholarship_id, reminder_type, offsets, enabled, last_sent_at')
    .in('scholarship_id', ids)
    .eq('reminder_type', 'deadline');
  if (reminderError) throw reminderError;

  if (!reminderRows || !reminderRows.length) {
    return {
      scholarshipCount: ids.length,
      reminderCount: 0,
      queuedJobs: 0,
      cancelledReminders: 0
    };
  }

  const { data: saveRows, error: saveError } = await client
    .from('user_saved_scholarships')
    .select('user_id, scholarship_id')
    .in('scholarship_id', ids)
    .eq('archived', false);
  if (saveError) throw saveError;

  const scholarshipMap = new Map((scholarshipRows || []).map(function (row) {
    return [row.id, row];
  }));
  const activeSaveKeys = new Set((saveRows || []).map(function (row) {
    return buildReminderScopeKey(row.user_id, row.scholarship_id);
  }));

  let queuedJobs = 0;
  let cancelledReminders = 0;

  for (const reminderRow of reminderRows) {
    const scholarship = scholarshipMap.get(reminderRow.scholarship_id) || null;
    const hasActiveSave = activeSaveKeys.has(buildReminderScopeKey(reminderRow.user_id, reminderRow.scholarship_id));

    if (!hasActiveSave || !scholarship || !scholarship.is_active || !hasDatedFutureDeadline(scholarship)) {
      await cancelReminderJobs(client, reminderRow.id);
      cancelledReminders += 1;
      continue;
    }

    const jobs = await syncReminderJobs(client, reminderRow.user_id, scholarship, reminderRow);
    queuedJobs += jobs.length;
  }

  return {
    scholarshipCount: ids.length,
    reminderCount: reminderRows.length,
    queuedJobs: queuedJobs,
    cancelledReminders: cancelledReminders
  };
}

async function reconcileAllScholarshipDeadlines(options) {
  const client = (options && options.client) || getAuthClient();
  if (!client) throw new Error('Scholarship auth client not configured');

  const { data: scholarshipRows, error } = await client
    .from('scholarships')
    .select('id')
    .limit(1000);
  if (error) throw error;

  const ids = (scholarshipRows || []).map(function (row) { return row.id; });
  const result = await reconcileReminderJobsForScholarshipIds(client, ids);
  return Object.assign({
    checked_at: new Date().toISOString()
  }, result);
}

async function saveScholarshipForUser(client, userId, input) {
  const scholarshipId = input.scholarship_id || input.scholarshipId;
  if (!scholarshipId) throw new Error('Missing scholarship_id');

  const scholarship = await getScholarshipById(client, scholarshipId);
  if (!scholarship || !scholarship.is_active) throw new Error('Scholarship not found');

  const reminderEnabled = input.reminder_enabled === undefined ? false : !!input.reminder_enabled;
  if (reminderEnabled && !hasDatedFutureDeadline(scholarship)) {
    throw new Error('Deadline reminders require a dated future scholarship deadline');
  }

  const saveRow = {
    user_id: userId,
    scholarship_id: scholarshipId,
    note: input.note ? String(input.note).slice(0, 400) : null,
    priority: ['low', 'normal', 'high'].indexOf(String(input.priority || 'normal')) !== -1 ? String(input.priority) : 'normal',
    archived: false,
    archived_at: null
  };

  const { error: saveError } = await client
    .from('user_saved_scholarships')
    .upsert(saveRow, { onConflict: 'user_id,scholarship_id' });
  if (saveError) throw saveError;

  const reminderPayload = {
    user_id: userId,
    scholarship_id: scholarshipId,
    reminder_type: 'deadline',
    enabled: reminderEnabled,
    offsets: normalizeOffsets(input.offsets)
  };

  const { data: reminderRows, error: reminderError } = await client
    .from('user_scholarship_reminders')
    .upsert(reminderPayload, { onConflict: 'user_id,scholarship_id,reminder_type' })
    .select('id, scholarship_id, reminder_type, offsets, enabled, last_sent_at');
  if (reminderError) throw reminderError;

  const reminderRow = Array.isArray(reminderRows) ? reminderRows[0] : reminderRows;
  await syncReminderJobs(client, userId, scholarship, reminderRow);

  return listSavedScholarships(client, userId);
}

async function unsaveScholarshipForUser(client, userId, scholarshipId) {
  if (!scholarshipId) throw new Error('Missing scholarship_id');

  const { error: saveError } = await client
    .from('user_saved_scholarships')
    .update({
      archived: true,
      archived_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId);
  if (saveError) throw saveError;

  const { data: reminderRows, error: reminderError } = await client
    .from('user_scholarship_reminders')
    .update({ enabled: false })
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId)
    .select('id');
  if (reminderError) throw reminderError;

  for (const row of (reminderRows || [])) {
    await cancelReminderJobs(client, row.id);
  }

  return listSavedScholarships(client, userId);
}

async function updateReminderForUser(client, userId, input) {
  const scholarshipId = input.scholarship_id || input.scholarshipId;
  if (!scholarshipId) throw new Error('Missing scholarship_id');

  const scholarship = await getScholarshipById(client, scholarshipId);
  if (!scholarship || !scholarship.is_active) throw new Error('Scholarship not found');

  const { data: saveRow, error: saveError } = await client
    .from('user_saved_scholarships')
    .select('id')
    .eq('user_id', userId)
    .eq('scholarship_id', scholarshipId)
    .eq('archived', false)
    .maybeSingle();
  if (saveError) throw saveError;
  if (!saveRow) throw new Error('Save the scholarship before enabling reminders');
  if (input.enabled && !hasDatedFutureDeadline(scholarship)) {
    throw new Error('Deadline reminders require a dated future scholarship deadline');
  }

  const { data: reminderRows, error: reminderError } = await client
    .from('user_scholarship_reminders')
    .upsert({
      user_id: userId,
      scholarship_id: scholarshipId,
      reminder_type: 'deadline',
      enabled: !!input.enabled,
      offsets: normalizeOffsets(input.offsets)
    }, { onConflict: 'user_id,scholarship_id,reminder_type' })
    .select('id, scholarship_id, reminder_type, offsets, enabled, last_sent_at');
  if (reminderError) throw reminderError;

  const reminderRow = Array.isArray(reminderRows) ? reminderRows[0] : reminderRows;
  await syncReminderJobs(client, userId, scholarship, reminderRow);

  return listSavedScholarships(client, userId);
}

module.exports = {
  AUTH_URL,
  CACHE_KEY,
  DEFAULT_REMINDER_OFFSETS,
  SCHOLARSHIP_PUBLIC_MIN_COUNT,
  PUBLIC_MIN_SCHOLARSHIP_COUNT,
  SOURCE_KEYS,
  buildFeedMeta,
  buildLegacyScholarship,
  buildReminderSchedule,
  filterScholarships,
  discoverScholarshipCandidateLeads,
  discoverScholarshipSources,
  ensureScholarshipSources,
  getAuthClient,
  getFallbackScholarships,
  getScholarshipById,
  hasDatedFutureDeadline,
  listSavedScholarships,
  loadScholarshipSourceCandidates,
  loadScholarshipFeed,
  loadScholarshipSourceRegistry,
  parseSitemapLocs,
  normalizeOffsets,
  reconcileAllScholarshipDeadlines,
  reconcileReminderJobsForScholarshipIds,
  saveScholarshipForUser,
  syncScholarshipMirror,
  syncReminderJobs,
  unsaveScholarshipForUser,
  updateReminderForUser,
  writeFeedCache
};
