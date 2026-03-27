/**
 * AfroTools — Calculation History API
 *
 * POST /api/history       — save a calculation (requires auth token)
 * GET  /api/history       — get recent calculations (requires auth token)
 * GET  /api/history?tool=  — get calculations for a specific tool
 * DELETE /api/history?id=  — delete a calculation (requires auth token)
 *
 * Uses service role key to bypass RLS (auth verified via token).
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
if (!SUPABASE_ANON_KEY) console.warn('[api-history] Missing SUPABASE_ANON_KEY_AUTH env var');

const FREE_LIMIT = 5;
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);
  if (!user) return jsonResponse(401, { error: 'Unauthorized' });

  const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return jsonResponse(500, { error: 'Server config error' });

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  const params = event.queryStringParameters || {};

  // GET: fetch recent calculations
  if (event.httpMethod === 'GET') {
    const limit = Math.min(Math.max(parseInt(params.limit, 10) || 10, 1), 50);
    let url = `${SUPABASE_URL}/rest/v1/calculation_history?user_id=eq.${user.id}&select=*&order=created_at.desc&limit=${limit}`;
    if (params.tool) {
      url += `&tool_slug=eq.${encodeURIComponent(params.tool)}`;
    }
    const res = await fetch(url, { headers });
    const data = await res.json();
    return jsonResponse(200, { data: Array.isArray(data) ? data : [] });
  }

  // DELETE: remove a calculation
  if (event.httpMethod === 'DELETE') {
    if (!params.id) return jsonResponse(400, { error: 'Missing id parameter' });
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/calculation_history?id=eq.${params.id}&user_id=eq.${user.id}`,
      { method: 'DELETE', headers }
    );
    return jsonResponse(res.ok ? 200 : 400, { deleted: res.ok });
  }

  // POST: save a calculation
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    // Check free tier limit (count this month's saves)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/calculation_history?user_id=eq.${user.id}&created_at=gte.${monthStart}&select=id`,
      { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } }
    );
    const countHeader = countRes.headers.get('content-range');
    const count = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : 0;

    // Check if user is pro
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=tier`,
      { headers }
    );
    const profileData = await profileRes.json();
    const isPro = Array.isArray(profileData) && profileData[0] && profileData[0].tier === 'pro';

    if (!isPro && count >= FREE_LIMIT) {
      return jsonResponse(200, { saved: false, reason: 'limit_reached', limit: FREE_LIMIT });
    }

    // Sanitize input
    const row = {
      user_id: user.id,
      tool_slug: String(body.tool_slug || body.toolSlug || '').substring(0, 100),
      tool_name: String(body.tool_name || body.toolName || '').substring(0, 200),
      country_code: body.country_code || body.countryCode || null,
      currency: body.currency || null,
      inputs: body.inputs || {},
      outputs: body.outputs || {},
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/calculation_history`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });

    if (res.ok) {
      const inserted = await res.json();
      return jsonResponse(200, { saved: true, id: inserted[0] ? inserted[0].id : null });
    }

    const errText = await res.text();
    return jsonResponse(200, { saved: false, reason: 'db_error', error: errText });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
