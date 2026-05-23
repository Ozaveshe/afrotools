const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');
const {
  filterScholarships,
  getAuthClient,
  listSavedScholarships,
  loadScholarshipFeed
} = require('./_shared/scholarship-platform');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(statusCode, body, responseMeta) {
  const meta = responseMeta || {};
  const response = {
    statusCode: statusCode,
    headers: Object.assign({}, CORS_HEADERS, meta.headers || {}),
    body: JSON.stringify(body)
  };

  if (meta.multiValueHeaders && Object.keys(meta.multiValueHeaders).length) {
    response.multiValueHeaders = meta.multiValueHeaders;
  }

  return response;
}

function paginate(list, params) {
  let items = Array.isArray(list) ? list.slice() : [];
  const offset = parseInt(params.offset, 10) || 0;
  const limit = parseInt(params.limit, 10) || 0;
  const total = items.length;

  if (offset > 0) items = items.slice(offset);
  if (limit > 0) items = items.slice(0, limit);

  return {
    items: items,
    total: total
  };
}

function formatClaimSafeLabel(count) {
  const value = Math.max(0, Math.floor(Number(count) || 0));
  return value + ' Scholarship' + (value === 1 ? '' : 's');
}

function getScholarshipMode(item) {
  const mode = item && (item.confidence_mode || item.mode || item.source_mode);
  if (mode === 'live' || mode === 'cached' || mode === 'curated' || mode === 'fallback') {
    return mode;
  }
  return 'curated';
}

function getScholarshipStatus(item) {
  if (item && item.deadline_confidence === 'no_single_public_deadline') {
    return 'variable';
  }

  const status = String(item && item.status ? item.status : '').toLowerCase();
  if (status === 'open' || status === 'upcoming' || status === 'unclear' || status === 'closed' || status === 'variable') {
    return status;
  }

  if (item && item.deadline_date) {
    const deadline = new Date(item.deadline_date);
    if (!Number.isNaN(deadline.getTime())) {
      return deadline.getTime() < Date.now() ? 'closed' : 'open';
    }
  }

  return 'unclear';
}

function hasOfficialLink(item) {
  return !!(item && (item.official_url || item.application_url || item.info_url || item.source_url));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function utcDateKey(value) {
  const date = parseDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

function daysUntil(value, now) {
  const date = parseDate(value);
  if (!date) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadline = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.ceil((deadline - today) / 86400000);
}

function firstTimestamp(item, fields) {
  for (let index = 0; index < fields.length; index += 1) {
    const value = item && item[fields[index]];
    if (parseDate(value)) return value;
  }
  return '';
}

function buildScholarshipMetadata(items, meta, now) {
  const list = Array.isArray(items) ? items : [];
  const current = now instanceof Date ? now : new Date();
  const todayKey = current.toISOString().slice(0, 10);
  const sourceHealth = {
    mode: meta && meta.mode ? meta.mode : 'fallback',
    label: meta && meta.label ? meta.label : '',
    stale: !!(meta && meta.stale),
    degraded: !!(meta && meta.isDegraded),
    limited: !!(meta && meta.isLimited),
    public_min_count: meta && meta.publicMinCount ? meta.publicMinCount : 0,
    official_link_count: 0,
    with_deadline_count: 0,
    source_backed_count: 0
  };

  const counts = list.reduce(function (state, item) {
    const status = getScholarshipStatus(item);
    const days = daysUntil(item && item.deadline_date, current);
    const verifiedAt = firstTimestamp(item, [
      'verified_at',
      'last_checked_at',
      'last_verified_at',
      'deadline_last_checked',
      'award_value_last_checked_at'
    ]);
    const addedAt = firstTimestamp(item, ['published_at', 'created_at']);
    const staleAnchor = firstTimestamp(item, ['last_checked_at', 'verified_at', 'last_verified_at', 'last_seen_at']);
    const staleDate = parseDate(staleAnchor);

    if (status === 'open' || status === 'upcoming' || status === 'variable') state.open += 1;
    if ((typeof days === 'number' && days >= 0 && days <= 30) || status === 'closing_soon') state.closingSoon += 1;
    if (verifiedAt && utcDateKey(verifiedAt) === todayKey) state.verifiedToday += 1;
    if (addedAt && utcDateKey(addedAt) === todayKey) state.addedToday += 1;
    if (!staleDate || current.getTime() - staleDate.getTime() > 30 * 86400000) state.stale += 1;
    if (hasOfficialLink(item)) sourceHealth.official_link_count += 1;
    if (item && item.deadline_date) sourceHealth.with_deadline_count += 1;
    if (item && (item.source_url || item.official_url)) sourceHealth.source_backed_count += 1;
    return state;
  }, {
    open: 0,
    closingSoon: 0,
    verifiedToday: 0,
    addedToday: 0,
    stale: 0
  });

  return {
    total_loaded: list.length,
    scholarships_added_count: list.length,
    added_today_count: counts.addedToday,
    open_count: counts.open,
    closing_soon_count: counts.closingSoon,
    verified_today_count: counts.verifiedToday,
    last_refresh_at: meta && (meta.lastCheckedAt || meta.cachedAt) ? meta.lastCheckedAt || meta.cachedAt : null,
    stale_count: counts.stale,
    source_health: sourceHealth
  };
}

function buildScholarshipSummary(items, meta) {
  const list = Array.isArray(items) ? items : [];
  const summary = {
    total: list.length,
    live: 0,
    curated: 0,
    cached: 0,
    fallback: 0,
    open: 0,
    upcoming: 0,
    unclear: 0,
    variable: 0,
    closed: 0,
    officialLink: 0,
    withDeadlineDate: 0,
    deadlineResolved: 0,
    noSinglePublicDeadline: 0,
    verifiedExactDeadline: 0,
    claimSafeLabel: formatClaimSafeLabel(list.length),
    isLimited: !!(meta && meta.isLimited)
  };

  list.forEach(function (item) {
    const mode = getScholarshipMode(item);
    const status = getScholarshipStatus(item);
    summary[mode] += 1;
    summary[status] += 1;
    if (hasOfficialLink(item)) summary.officialLink += 1;
    if (item && item.deadline_date) summary.withDeadlineDate += 1;
    if (item && item.deadline_confidence === 'verified') {
      summary.verifiedExactDeadline += 1;
      summary.deadlineResolved += 1;
    } else if (item && item.deadline_confidence === 'no_single_public_deadline') {
      summary.noSinglePublicDeadline += 1;
      summary.deadlineResolved += 1;
    }
  });

  return summary;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};

  try {
    const feed = await loadScholarshipFeed();
    const filtered = filterScholarships(feed.scholarships, params);
    const paged = paginate(filtered, params);
    const payload = {
      scholarships: paged.items,
      total: paged.total,
      count: paged.items.length,
      mode: feed.meta.mode,
      label: feed.meta.label,
      message: feed.meta.message,
      tone: feed.meta.tone,
      stale: !!feed.meta.stale,
      cachedAt: feed.meta.cachedAt || feed.meta.lastCheckedAt || null,
      lastCheckedAt: feed.meta.lastCheckedAt || feed.meta.cachedAt || null,
      lastCheckedLabel: feed.meta.lastCheckedLabel || '',
      isDegraded: !!feed.meta.isDegraded,
      isLimited: !!feed.meta.isLimited,
      error: feed.meta.error || ''
    };
    payload.summary = buildScholarshipSummary(filtered, feed.meta);
    Object.assign(payload, buildScholarshipMetadata(filtered, feed.meta));

    const authResult = await getUserFromEvent(event);
    const sessionResponse = authResult && authResult.sessionResponse ? authResult.sessionResponse : null;
    if (authResult && authResult.user) {
      const client = getAuthClient();
      if (client) {
        const saved = await listSavedScholarships(client, authResult.user.id);
        payload.savedSummary = {
          count: saved.count,
          reminderEnabledCount: saved.reminderEnabledCount,
          scholarshipIds: saved.items.map(function (item) {
            return item.scholarshipId || item.id;
          }),
          nextDeadline: saved.nextDeadline ? {
            scholarshipId: saved.nextDeadline.scholarshipId || saved.nextDeadline.id,
            title: saved.nextDeadline.title,
            date: saved.nextDeadline.deadline_date || null
          } : null
        };
      }
    }

    return jsonResponse(200, payload, sessionResponse);
  } catch (error) {
    return jsonResponse(500, {
      error: 'Failed to load scholarship feed',
      detail: error.message,
      mode: 'fallback'
    });
  }
};

exports._private = {
  buildScholarshipMetadata,
  buildScholarshipSummary,
  daysUntil,
  getScholarshipStatus
};
