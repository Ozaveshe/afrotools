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
      error: feed.meta.error || ''
    };

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
