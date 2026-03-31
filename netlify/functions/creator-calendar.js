/**
 * CreatorCalendar — Netlify Function
 * CRUD for creator_posts, creator_content_pillars, creator_platforms
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY_AUTH || '';

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

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || (event.httpMethod === 'POST' ? 'post-action' : 'list-posts');

  try {
    // ─── GET: List posts with date range ───
    if (action === 'list-posts') {
      let url = 'creator_posts?select=*,creator_content_pillars(name,color)&order=scheduled_date.asc,scheduled_time.asc';
      if (params.user_id) url += `&user_id=eq.${params.user_id}`;
      if (params.start) url += `&scheduled_date=gte.${params.start}`;
      if (params.end) url += `&scheduled_date=lte.${params.end}`;
      if (params.platform) url += `&platforms=cs.["${params.platform}"]`;
      if (params.status) url += `&status=eq.${params.status}`;
      if (params.pillar_id) url += `&pillar_id=eq.${params.pillar_id}`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 50}`;

      const res = await sbFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ─── GET: List pillars ───
    if (action === 'list-pillars') {
      let url = 'creator_content_pillars?select=*&order=sort_order.asc';
      if (params.user_id) url += `&user_id=eq.${params.user_id}`;

      const res = await sbFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ─── GET: List platforms ───
    if (action === 'list-platforms') {
      let url = 'creator_platforms?select=*&order=created_at.asc';
      if (params.user_id) url += `&user_id=eq.${params.user_id}`;

      const res = await sbFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ─── POST actions ───
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const postAction = body.action || action;

      // Save (upsert) post
      if (postAction === 'save-post' && body.post) {
        const post = body.post;
        post.updated_at = new Date().toISOString();

        let res;
        if (post.id) {
          // Update
          res = await sbFetch(`creator_posts?id=eq.${post.id}`, {
            method: 'PATCH',
            body: post
          });
        } else {
          // Insert
          res = await sbFetch('creator_posts', {
            method: 'POST',
            body: post
          });
        }

        const data = await res.json();
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(data) };
      }

      // Delete post
      if (postAction === 'delete-post' && body.id) {
        const res = await sbFetch(`creator_posts?id=eq.${body.id}`, { method: 'DELETE' });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // Save pillar
      if (postAction === 'save-pillar' && body.pillar) {
        const pillar = body.pillar;
        let res;
        if (pillar.id) {
          res = await sbFetch(`creator_content_pillars?id=eq.${pillar.id}`, {
            method: 'PATCH',
            body: pillar
          });
        } else {
          res = await sbFetch('creator_content_pillars', {
            method: 'POST',
            body: pillar
          });
        }
        const data = await res.json();
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(data) };
      }

      // Save platform
      if (postAction === 'save-platform' && body.platform) {
        const platform = body.platform;
        let res;
        if (platform.id) {
          res = await sbFetch(`creator_platforms?id=eq.${platform.id}`, {
            method: 'PATCH',
            body: platform
          });
        } else {
          res = await sbFetch('creator_platforms', {
            method: 'POST',
            body: platform
          });
        }
        const data = await res.json();
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(data) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown POST action' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action: ' + action }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
