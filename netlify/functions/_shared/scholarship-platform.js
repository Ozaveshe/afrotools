const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getData, setData } = require('./data-store');

let fallbackFeedModule = null;
try {
  fallbackFeedModule = require('../../../assets/js/education-scholarship-feed.js');
} catch (error) {
  fallbackFeedModule = null;
}

const AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const AUTH_SERVICE_KEY =
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const DATA_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const DATA_READ_KEY =
  process.env.SUPABASE_DATA_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY_DATA ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const CACHE_KEY = 'scholarships-latest';
const DEFAULT_REMINDER_OFFSETS = [30, 14, 7, 1, 0];
const MIRROR_STALE_HOURS = 36;
const SOURCE_KEYS = {
  primary: 'afrotools-data-catalog',
  backup: 'afrotools-curated-backup'
};

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

function buildLegacyScholarship(row) {
  const snapshot = row && row.raw_snapshot && typeof row.raw_snapshot === 'object' ? row.raw_snapshot : {};
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
    levels: ensureArray(snapshot.levels || row.study_levels),
    study_levels: ensureArray(row.study_levels),
    destinations: ensureArray(snapshot.destinations || row.destination_countries),
    destination_countries: ensureArray(row.destination_countries),
    fields: ensureArray(snapshot.fields || row.fields),
    funding: row.funding_type || snapshot.funding || '',
    funding_type: row.funding_type || '',
    description: row.summary || snapshot.description || snapshot.summary || '',
    summary: row.summary || snapshot.description || '',
    min_gpa_4: snapshot.min_gpa_4 != null ? snapshot.min_gpa_4 : row.min_gpa,
    min_gpa_5: snapshot.min_gpa_5 != null ? snapshot.min_gpa_5 : null,
    min_ielts: row.min_ielts != null ? row.min_ielts : toNumber(snapshot.min_ielts),
    deadline_date: row.deadline_date || snapshot.deadline_date || null,
    deadline_text: row.deadline_text || snapshot.deadline_text || '',
    deadline_month: snapshot.deadline_month || null,
    status: row.status,
    confidence_mode: row.confidence_mode,
    proof_level: row.proof_level,
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
  const count = Array.isArray(rows) ? rows.length : 0;
  const lastCheckedLabel = formatTimestamp(lastCheckedAt);
  const hasSourceError = !!(options && options.error);
  const isDegraded = mode === 'cached' || mode === 'fallback' || hasSourceError;

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
  const rows = [
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
  return Array.isArray(data) ? data : [];
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

  const deadlineDate = parseDeadlineDate(raw.deadline_date || raw.deadlineDate);
  const status = (function () {
    const explicit = String(raw.status || '').toLowerCase();
    if (['open', 'upcoming', 'unclear', 'closed'].indexOf(explicit) !== -1) return explicit;
    if (deadlineDate && new Date(deadlineDate).getTime() < Date.now()) return 'closed';
    return deadlineDate ? 'open' : 'unclear';
  })();

  const minGpa4 = toNumber(raw.min_gpa_4);
  const minGpa5 = toNumber(raw.min_gpa_5);
  const confidenceMode = ['live', 'cached', 'curated', 'fallback'].indexOf(String(raw.confidence_mode || '')) !== -1
    ? String(raw.confidence_mode)
    : (source.source_type === 'curated_import' ? 'curated' : 'live');

  const summary = String(raw.summary || raw.description || '').trim();
  const officialUrl = String(raw.official_url || raw.info_url || raw.application_url || raw.source_url || '').trim();
  const sourceUrl = String(raw.source_url || raw.application_url || raw.info_url || officialUrl).trim();
  const slug = slugify(raw.slug || title + '-' + (raw.provider || raw.destination || raw.country || 'scholarship'));

  return {
    slug: slug,
    title: title,
    provider: String(raw.provider || '').trim(),
    source_url: sourceUrl || null,
    official_url: officialUrl || null,
    destination_countries: uniqueStrings(raw.destination_countries || raw.destinations),
    eligible_origins: uniqueStrings(raw.eligible_origins || ['Africa']),
    study_levels: uniqueStrings(raw.study_levels || raw.levels),
    fields: uniqueStrings(raw.fields || ['any']),
    funding_type: String(raw.funding_type || raw.funding || '').trim() || null,
    min_gpa: minGpa4 != null ? minGpa4 : (minGpa5 != null ? Number((minGpa5 * 0.8).toFixed(2)) : null),
    min_ielts: toNumber(raw.min_ielts),
    deadline_date: deadlineDate,
    deadline_text: String(raw.deadline_text || '').trim() || null,
    status: status,
    confidence_mode: confidenceMode,
    proof_level: String(raw.proof_level || (officialUrl ? 'official_link' : 'platform_feed')).trim(),
    summary: summary || null,
    last_seen_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
    is_featured: !!raw.is_featured,
    is_active: raw.is_active === false ? false : true,
    raw_snapshot: raw,
    last_source_id: source.id
  };
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
      raw_payload: rawItem,
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

async function fetchSourceItems(source) {
  if (!source || !source.parser_key) return [];
  if (source.parser_key === 'data_instance_scholarship_catalog') {
    return fetchDataInstanceScholarships();
  }
  if (source.parser_key === 'curated_backup_catalog') {
    return getFallbackScholarships();
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

  for (const source of (sources || [])) {
    const runId = await beginIngestRun(client, source.id);
    try {
      const rawItems = await fetchSourceItems(source);
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
    reminderReconciliation: reminderReconciliation,
    meta: scholarships.length ? meta : buildFeedMeta([], {
      mode: 'fallback',
      error: primaryError ? primaryError.message : 'Scholarship mirror is empty'
    })
  };
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
    const meta = Object.assign({}, cached.meta || buildFeedMeta([], { mode: 'cached' }), {
      mode: 'cached',
      label: 'Cached feed',
      isDegraded: true,
      stale: true,
      tone: 'warn',
      error: settings.error || (cached.meta && cached.meta.error) || ''
    });
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

    return Object.assign({}, legacy, {
      saveId: save.id,
      scholarshipId: scholarship.id,
      savedAt: save.saved_at,
      note: save.note || '',
      priority: save.priority || 'normal',
      archived: !!save.archived,
      reminder: {
        enabled: !!(reminder && reminder.enabled),
        offsets: normalizeOffsets(reminder && reminder.offsets),
        lastSentAt: reminder && reminder.last_sent_at ? reminder.last_sent_at : null,
        reminderType: reminder && reminder.reminder_type ? reminder.reminder_type : 'deadline'
      }
    });
  }).filter(Boolean);

  const nextDeadline = items
    .filter(function (item) {
      return item.deadline_date && new Date(item.deadline_date).getTime() >= Date.now();
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

  if (!reminderRow.enabled || !scholarship || !scholarship.deadline_date || scholarship.status === 'closed') {
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
    .select('id, title, provider, official_url, source_url, deadline_date, deadline_text, confidence_mode, status, is_active')
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

    if (!hasActiveSave || !scholarship || !scholarship.is_active || scholarship.status === 'closed' || !scholarship.deadline_date) {
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

async function saveScholarshipForUser(client, userId, input) {
  const scholarshipId = input.scholarship_id || input.scholarshipId;
  if (!scholarshipId) throw new Error('Missing scholarship_id');

  const scholarship = await getScholarshipById(client, scholarshipId);
  if (!scholarship || !scholarship.is_active) throw new Error('Scholarship not found');

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

  const reminderEnabled = input.reminder_enabled === undefined ? !!scholarship.deadline_date : !!input.reminder_enabled;
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
  SOURCE_KEYS,
  buildFeedMeta,
  buildLegacyScholarship,
  buildReminderSchedule,
  filterScholarships,
  getAuthClient,
  getFallbackScholarships,
  getScholarshipById,
  listSavedScholarships,
  loadScholarshipFeed,
  normalizeOffsets,
  reconcileReminderJobsForScholarshipIds,
  saveScholarshipForUser,
  syncScholarshipMirror,
  syncReminderJobs,
  unsaveScholarshipForUser,
  updateReminderForUser,
  writeFeedCache
};
