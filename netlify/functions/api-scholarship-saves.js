const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');
const {
  getAuthClient,
  listSavedScholarships,
  saveScholarshipForUser,
  unsaveScholarshipForUser
} = require('./_shared/scholarship-platform');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const authResult = await getUserFromEvent(event);
  const sessionResponse = authResult && authResult.sessionResponse ? authResult.sessionResponse : null;
  const user = authResult && authResult.user ? authResult.user : null;
  if (!user) {
    return jsonResponse(401, { error: 'Unauthorized' }, sessionResponse);
  }

  const client = getAuthClient();
  if (!client) {
    return jsonResponse(500, { error: 'Server config error' }, sessionResponse);
  }

  try {
    if (event.httpMethod === 'GET') {
      const saved = await listSavedScholarships(client, user.id);
      return jsonResponse(200, saved, sessionResponse);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const saved = await saveScholarshipForUser(client, user.id, body);
      return jsonResponse(200, saved, sessionResponse);
    }

    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const scholarshipId = params.scholarship_id || params.id;
      const saved = await unsaveScholarshipForUser(client, user.id, scholarshipId);
      return jsonResponse(200, saved, sessionResponse);
    }

    return jsonResponse(405, { error: 'Method not allowed' }, sessionResponse);
  } catch (error) {
    return jsonResponse(400, { error: error.message || 'Scholarship save request failed' }, sessionResponse);
  }
};
