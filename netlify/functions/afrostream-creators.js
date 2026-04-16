// netlify/functions/afrostream-creators.js
// Public API: GET /api/afrostream/creators?country=&category=&platform=&sort=&limit=
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers?.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Vary': 'Origin' };
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

  if (qs.country) parts.push('country=eq.' + encodeURIComponent(qs.country));
  if (qs.category) parts.push('categories=cs.{' + encodeURIComponent(qs.category) + '}');
  if (qs.platform) {
    var col = qs.platform.toLowerCase() + '_url';
    parts.push(col + '=not.is.null');
    parts.push(col + '=neq.');
  }

  var sort = 'afro_score.desc.nullslast,subscribers.desc';
  if (qs.sort === 'subscribers') sort = 'subscribers.desc';
  if (qs.sort === 'afro_score' || qs.sort === 'score') sort = 'afro_score.desc.nullslast,subscribers.desc';
  if (qs.sort === 'gift_revenue') sort = 'gift_revenue.desc';
  if (qs.sort === 'growth_rate' || qs.sort === 'growth_pct') sort = 'growth_pct.desc.nullslast,growth_rate.desc.nullslast';
  if (qs.sort === 'name') sort = 'name.asc';
  if (qs.sort === 'newest') sort = 'created_at.desc';
  parts.push('order=' + sort);

  var limit = Math.min(parseInt(qs.limit, 10) || 50, 100);
  parts.push('limit=' + limit);
  if (qs.offset) parts.push('offset=' + (parseInt(qs.offset, 10) || 0));

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_creators?' + parts.join('&'), {
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
