/**
 * AfroTools — Favorites/Saved Tools API
 *
 * GET    /api/favorites          — list user's saved tools
 * POST   /api/favorites          — save a tool (body: { tool_id })
 * DELETE /api/favorites?tool_id= — remove a saved tool
 *
 * Uses service role key to bypass RLS (auth verified via token).
 */

const SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
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

  // GET: list favorites
  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${user.id}&select=tool_id,created_at&order=created_at.desc`,
      { headers }
    );
    const data = await res.json();
    return jsonResponse(200, { data: Array.isArray(data) ? data : [] });
  }

  // POST: add favorite
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    const toolId = String(body.tool_id || '').substring(0, 100);
    if (!toolId) return jsonResponse(400, { error: 'Missing tool_id' });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: user.id, tool_id: toolId }),
    });

    return jsonResponse(res.ok ? 200 : 400, { saved: res.ok });
  }

  // DELETE: remove favorite
  if (event.httpMethod === 'DELETE') {
    const toolId = params.tool_id;
    if (!toolId) return jsonResponse(400, { error: 'Missing tool_id parameter' });

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${user.id}&tool_id=eq.${encodeURIComponent(toolId)}`,
      { method: 'DELETE', headers }
    );
    return jsonResponse(res.ok ? 200 : 400, { deleted: res.ok });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
