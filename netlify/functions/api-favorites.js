/**
 * AfroTools — Favorites/Saved Tools API
 *
 * GET    /api/favorites          — list user's saved tools
 * POST   /api/favorites          — save a tool (body: { tool_id })
 * DELETE /api/favorites?tool_id= — remove a saved tool
 *
 * Uses service role key to bypass RLS (auth verified via bearer token or secure session cookie).
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body, responseMeta) {
  const meta = responseMeta || {};
  const response = {
    statusCode,
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
  const user = authResult && authResult.user ? authResult.user : null;
  const sessionResponse = authResult && authResult.sessionResponse ? authResult.sessionResponse : null;
  if (!user) return jsonResponse(401, { error: 'Unauthorized' }, sessionResponse);

  const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return jsonResponse(500, { error: 'Server config error' }, sessionResponse);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  const params = event.queryStringParameters || {};

  // GET: list favorites
  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${user.id}&select=tool_id,created_at&order=created_at.desc`,
      { headers }
    );
    const data = await res.json();
    return jsonResponse(200, { data: Array.isArray(data) ? data : [] }, sessionResponse);
  }

  // POST: add favorite
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }, sessionResponse); }

    const toolId = String(body.tool_id || '').substring(0, 100);
    if (!toolId) return jsonResponse(400, { error: 'Missing tool_id' }, sessionResponse);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: user.id, tool_id: toolId }),
    });

    return jsonResponse(res.ok ? 200 : 400, { saved: res.ok }, sessionResponse);
  }

  // DELETE: remove favorite
  if (event.httpMethod === 'DELETE') {
    const toolId = params.tool_id;
    if (!toolId) return jsonResponse(400, { error: 'Missing tool_id parameter' }, sessionResponse);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${user.id}&tool_id=eq.${encodeURIComponent(toolId)}`,
      { method: 'DELETE', headers }
    );
    return jsonResponse(res.ok ? 200 : 400, { deleted: res.ok }, sessionResponse);
  }

  return jsonResponse(405, { error: 'Method not allowed' }, sessionResponse);
};
