// netlify/functions/creator-hooks.js
// Supabase CRUD for HookFactory — hook history, favorites
// Uses the Auth/Profiles Supabase instance

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || 'list';

  try {
    // List hook history for a user
    if (action === 'list' && params.user_id) {
      let url = `/rest/v1/creator_hooks_history?user_id=eq.${params.user_id}&select=id,topic,platform,content_type,hooks,favorited,created_at&order=created_at.desc`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 20}`;

      const res = await supaFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // Get single hook generation
    if (action === 'get' && params.id) {
      const res = await supaFetch(`/rest/v1/creator_hooks_history?id=eq.${params.id}&select=*&limit=1`);
      const rows = await res.json();
      if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
    }

    // Save hook generation (upsert)
    if (action === 'save' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id required' }) };

      const record = {
        user_id: body.user_id,
        topic: body.topic || '',
        platform: body.platform || 'tiktok',
        content_type: body.content_type || 'educational',
        hooks: body.hooks || [],
        favorited: body.favorited || []
      };

      let method, url;
      if (body.id) {
        method = 'PATCH';
        url = `/rest/v1/creator_hooks_history?id=eq.${body.id}&user_id=eq.${body.user_id}`;
      } else {
        method = 'POST';
        url = '/rest/v1/creator_hooks_history';
      }

      const res = await supaFetch(url, {
        method,
        body: JSON.stringify(record),
        returnRep: method === 'POST'
      });

      if (method === 'POST') {
        const data = await res.json();
        return { statusCode: 201, headers, body: JSON.stringify(Array.isArray(data) ? data[0] : data) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Delete hook generation
    if (action === 'delete' && params.id && params.user_id) {
      await supaFetch(`/rest/v1/creator_hooks_history?id=eq.${params.id}&user_id=eq.${params.user_id}`, { method: 'DELETE' });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Stats
    if (action === 'stats' && params.user_id) {
      const res = await supaFetch(`/rest/v1/creator_hooks_history?user_id=eq.${params.user_id}&select=id,platform,content_type,created_at`);
      const rows = await res.json();

      const platformCounts = {};
      const typeCounts = {};
      rows.forEach(function(r) {
        platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
        typeCounts[r.content_type] = (typeCounts[r.content_type] || 0) + 1;
      });

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ totalGenerations: rows.length, platformCounts, typeCounts })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use: list, get, save, delete, stats' }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function supaFetch(path, options = {}) {
  const url = SUPABASE_URL + path;
  const fetchHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (options.method === 'PATCH') fetchHeaders.Prefer = 'return=minimal';
  if (options.returnRep) fetchHeaders.Prefer = 'return=representation';

  return fetch(url, {
    method: options.method || 'GET',
    headers: fetchHeaders,
    body: options.body || undefined
  });
}
