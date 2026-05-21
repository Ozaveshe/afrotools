// netlify/functions/afrostream-streams.js
// Public API: GET /api/afrostream/streams?live=&platform=&limit=
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers?.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'Vary': 'Origin' };
}

function readJson(res) {
  return res.text().then(function(text) {
    return text ? JSON.parse(text) : null;
  });
}

function readCount(res, fallback) {
  var range = res.headers.get('content-range') || '';
  var match = /\/(\d+)$/.exec(range);
  return match ? parseInt(match[1], 10) : fallback;
}

function creatorKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function enrichStreamsWithCreators(rows) {
  if (!rows.length) return rows;
  var res = await fetch(SUPABASE_URL + '/rest/v1/as_creators?select=id,slug,name,country,avatar,cover,total_followers,subscribers,primary_platform,is_published&limit=1000', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  var creators = await readJson(res);
  if (!res.ok || !Array.isArray(creators)) return rows;

  var byId = new Map();
  var byName = new Map();
  creators.forEach(function(c) {
    if (c.id) byId.set(String(c.id), c);
    var key = creatorKey(c.name);
    if (key && !byName.has(key)) byName.set(key, c);
  });

  return rows.map(function(row) {
    var creator = row.creator_id ? byId.get(String(row.creator_id)) : null;
    if (!creator) creator = byName.get(creatorKey(row.creator_name || row.creator));
    if (!creator) return row;
    var out = Object.assign({}, row);
    out.creator_slug = out.creator_slug || creator.slug || '';
    out.creator_avatar = out.creator_avatar || creator.avatar || '';
    out.creator_cover = out.creator_cover || creator.cover || '';
    out.avatar_url = out.avatar_url || creator.avatar || '';
    out.cover_url = out.cover_url || creator.cover || '';
    out.creator_country = out.creator_country || creator.country || '';
    out.creator_followers = out.creator_followers || creator.total_followers || creator.subscribers || null;
    out.creator_primary_platform = out.creator_primary_platform || creator.primary_platform || '';
    if (!out.country) out.country = creator.country || '';
    return out;
  });
}

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers: h, body: '{"error":"SUPABASE service key not configured"}' };

  var qs = event.queryStringParameters || {};
  var parts = ['is_published=eq.true'];

  if (qs.live === 'true') {
    var liveCutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString();
    parts.push('is_live=eq.true');
    parts.push('stream_date=gte.' + liveCutoff);
    parts.push('order=stream_date.desc');
  } else if (qs.live === 'false') {
    parts.push('is_live=eq.false');
    parts.push('stream_date=gte.' + new Date().toISOString());
    parts.push('order=stream_date.asc');
  } else {
    parts.push('order=stream_date.desc');
  }

  if (qs.platform) parts.push('platform=eq.' + encodeURIComponent(qs.platform));
  if (qs.country) parts.push('country=eq.' + encodeURIComponent(qs.country));

  var limit = Math.min(parseInt(qs.limit, 10) || 50, 500);
  parts.push('limit=' + limit);

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_streams?' + parts.join('&'), {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'count=exact' }
    });
    var data = await readJson(res);
    if (!res.ok) {
      return {
        statusCode: res.status >= 500 ? 502 : res.status,
        headers: h,
        body: JSON.stringify({ error: 'Supabase request failed', detail: data && data.message ? data.message : 'Unexpected upstream error' })
      };
    }

    var rows = Array.isArray(data) ? data : [];
    var totalCount = readCount(res, rows.length);
    rows = await enrichStreamsWithCreators(rows);
    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({ success: true, data: rows, count: totalCount, returned_count: rows.length })
    };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
