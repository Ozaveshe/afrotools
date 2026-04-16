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

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers: h, body: '{"error":"SUPABASE service key not configured"}' };

  var qs = event.queryStringParameters || {};
  var parts = ['is_published=eq.true'];

  if (qs.live === 'true') {
    parts.push('is_live=eq.true');
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

  var limit = Math.min(parseInt(qs.limit, 10) || 50, 100);
  parts.push('limit=' + limit);

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_streams?' + parts.join('&'), {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
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
    return { statusCode: 200, headers: h, body: JSON.stringify({ success: true, data: rows, count: rows.length }) };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
