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
