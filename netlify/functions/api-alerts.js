/**
 * AfroTools — Alerts API
 *
 * GET  /api/alerts              — all active alerts
 * GET  /api/alerts?country=NG   — alerts for a specific country
 * POST /api/alerts              — create alert (admin only)
 * PUT  /api/alerts?id=UUID      — update alert (admin only)
 * DELETE /api/alerts?id=UUID    — deactivate alert (admin only)
 */

const SUPABASE_DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function getServiceKey() {
  return process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}

function isAdmin(event) {
  const key = event.headers['x-admin-key'];
  const secret = process.env.ADMIN_SECRET;
  return secret && key === secret;
}

async function supaFetch(path, options = {}) {
  const key = getServiceKey();
  if (!key) throw new Error('Missing service key');
  const res = await fetch(`${SUPABASE_DATA_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation' : 'return=representation',
      ...options.headers,
    },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; } catch { return { status: res.status, data: text }; }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const params = event.queryStringParameters || {};

  // --- GET: public, cached ---
  if (event.httpMethod === 'GET') {
    let query = 'alerts?active=eq.true&order=effective_date.desc';
    // Filter by country
    if (params.country) {
      const code = params.country.toUpperCase();
      query += `&or=(country_codes.cs.{${code}},country_codes.cs.{ALL})`;
    }
    // Filter out expired
    const today = new Date().toISOString().split('T')[0];
    query += `&or=(expires_at.is.null,expires_at.gte.${today})`;

    const result = await supaFetch(query);
    if (result.status >= 400) {
      return jsonResponse(503, { error: 'Alerts unavailable' });
    }
    return jsonResponse(200, {
      alerts: Array.isArray(result.data) ? result.data : [],
      timestamp: new Date().toISOString(),
    }, { 'Cache-Control': 'public, max-age=300' });
  }

  // --- Admin-only mutations ---
  if (!isAdmin(event)) {
    return jsonResponse(401, { error: 'Unauthorized. Provide x-admin-key header.' });
  }

  // --- POST: create alert ---
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    const { country_codes, title, description, severity, effective_date, expires_at } = body;
    if (!title || !description || !severity || !effective_date) {
      return jsonResponse(400, { error: 'Missing required fields: title, description, severity, effective_date' });
    }

    const result = await supaFetch('alerts', {
      method: 'POST',
      body: JSON.stringify({
        country_codes: country_codes || ['ALL'],
        title, description, severity, effective_date,
        expires_at: expires_at || null,
        active: true,
      }),
    });
    return jsonResponse(result.status < 300 ? 201 : result.status, result.data);
  }

  // --- PUT: update alert ---
  if (event.httpMethod === 'PUT') {
    if (!params.id) return jsonResponse(400, { error: 'Missing ?id= parameter' });
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }
    body.updated_at = new Date().toISOString();
    const result = await supaFetch(`alerts?id=eq.${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return jsonResponse(result.status < 300 ? 200 : result.status, result.data);
  }

  // --- DELETE: soft-delete ---
  if (event.httpMethod === 'DELETE') {
    if (!params.id) return jsonResponse(400, { error: 'Missing ?id= parameter' });
    const result = await supaFetch(`alerts?id=eq.${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }),
    });
    return jsonResponse(result.status < 300 ? 200 : result.status, { ok: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
