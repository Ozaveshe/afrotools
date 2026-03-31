/**
 * CarouselStudio — Netlify Function
 * Handles project save/load for authenticated users
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY_AUTH || '';

function getCorsHeaders(event) {
  const origin = (event.headers && event.headers.origin) || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function sbFetch(path, opts) {
  opts = opts || {};
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...opts.headers
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };

  const params = event.queryStringParameters || {};
  const action = params.action || (event.httpMethod === 'POST' ? 'save' : 'list');

  try {
    // ── GET: List user projects ──
    if (action === 'list' && params.user_id) {
      const res = await sbFetch(
        `creator_carousel_projects?user_id=eq.${params.user_id}&select=id,title,format,template_id,created_at,updated_at&order=updated_at.desc&limit=50`
      );
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ── GET: Load single project ──
    if (action === 'get' && params.id) {
      const res = await sbFetch(
        `creator_carousel_projects?id=eq.${params.id}&select=*&limit=1`
      );
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data[0] || null) };
    }

    // ── POST: Save / update project ──
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (body.action === 'save' && body.project) {
        const project = body.project;
        project.updated_at = new Date().toISOString();

        let res;
        if (project.id) {
          res = await sbFetch(
            `creator_carousel_projects?id=eq.${project.id}`,
            { method: 'PATCH', body: project }
          );
        } else {
          project.created_at = new Date().toISOString();
          res = await sbFetch('creator_carousel_projects', { method: 'POST', body: project });
        }
        const data = await res.json();
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(data) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown POST action' }) };
    }

    // ── DELETE: Remove project ──
    if (event.httpMethod === 'DELETE' && params.id && params.user_id) {
      const res = await sbFetch(
        `creator_carousel_projects?id=eq.${params.id}&user_id=eq.${params.user_id}`,
        { method: 'DELETE' }
      );
      return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify({ success: res.ok }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
