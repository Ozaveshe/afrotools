// netlify/functions/afrostream-snapshots.js
// Public API: GET /api/afrostream/snapshots?period=week|month|all&limit=
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

function isoDate(daysBack) {
  var d = new Date(Date.now() - daysBack * 86400000);
  return d.toISOString().slice(0, 10);
}

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers: h, body: '{"error":"SUPABASE service key not configured"}' };

  var qs = event.queryStringParameters || {};
  var period = qs.period || 'month';
  var limit = Math.min(parseInt(qs.limit, 10) || 500, 1000);
  var parts = ['select=*', 'order=snapshot_date.desc,creator_id.asc', 'limit=' + limit];

  if (period === 'week') parts.push('snapshot_date=gte.' + isoDate(7));
  else if (period === 'month') parts.push('snapshot_date=gte.' + isoDate(30));
  else if (period !== 'all') return { statusCode: 400, headers: h, body: '{"error":"Unsupported period"}' };

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_creator_snapshots?' + parts.join('&'), {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    var rows = await readJson(res);
    if (!res.ok) {
      return {
        statusCode: res.status >= 500 ? 502 : res.status,
        headers: h,
        body: JSON.stringify({ error: 'Supabase request failed', detail: rows && rows.message ? rows.message : 'Unexpected upstream error' })
      };
    }

    rows = Array.isArray(rows) ? rows : [];
    var dates = {};
    rows.forEach(function(row) { if (row.snapshot_date) dates[row.snapshot_date] = true; });
    var dateList = Object.keys(dates).sort();
    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({
        success: true,
        data: rows,
        count: rows.length,
        period: period,
        dates: dateList,
        has_history: dateList.length >= 2,
        latest_snapshot: dateList[dateList.length - 1] || null,
        oldest_snapshot: dateList[0] || null
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
