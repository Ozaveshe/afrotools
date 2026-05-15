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

function readCount(res, fallback) {
  var range = res.headers.get('content-range') || '';
  var match = /\/(\d+)$/.exec(range);
  return match ? parseInt(match[1], 10) : fallback;
}

async function fetchSnapshotPage(baseParts, offset, pageSize) {
  var parts = baseParts.slice();
  parts.push('limit=' + pageSize);
  parts.push('offset=' + offset);
  var res = await fetch(SUPABASE_URL + '/rest/v1/as_creator_snapshots?' + parts.join('&'), {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'count=exact' }
  });
  var rows = await readJson(res);
  return { res: res, rows: rows };
}

async function fetchSnapshotDates(baseParts) {
  var dateParts = baseParts.filter(function(part) {
    return part.indexOf('select=') !== 0 && part.indexOf('order=') !== 0 && part.indexOf('limit=') !== 0 && part.indexOf('offset=') !== 0;
  });
  dateParts.unshift('select=snapshot_date');
  dateParts.push('order=snapshot_date.desc');

  var rows = [];
  var offset = 0;
  var pageSize = 1000;

  while (true) {
    var page = await fetchSnapshotPage(dateParts, offset, pageSize);
    if (!page.res.ok) return page;

    var chunk = Array.isArray(page.rows) ? page.rows : [];
    rows = rows.concat(chunk);
    if (chunk.length < pageSize) {
      page.rows = rows;
      return page;
    }
    offset += chunk.length;
  }
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
  var requestedLimit = parseInt(qs.limit, 10) || 500;
  var limit = Math.min(Math.max(requestedLimit, 1), 5000);
  var parts = ['select=*', 'order=snapshot_date.desc,creator_id.asc'];

  if (period === 'week') parts.push('snapshot_date=gte.' + isoDate(7));
  else if (period === 'month') parts.push('snapshot_date=gte.' + isoDate(30));
  else if (period !== 'all') return { statusCode: 400, headers: h, body: '{"error":"Unsupported period"}' };

  try {
    var rows = [];
    var offset = 0;
    var pageSize = Math.min(limit, 1000);
    var totalCount = null;

    while (rows.length < limit) {
      var page = await fetchSnapshotPage(parts, offset, Math.min(pageSize, limit - rows.length));
      if (!page.res.ok) {
        return {
          statusCode: page.res.status >= 500 ? 502 : page.res.status,
          headers: h,
          body: JSON.stringify({ error: 'Supabase request failed', detail: page.rows && page.rows.message ? page.rows.message : 'Unexpected upstream error' })
        };
      }

      var chunk = Array.isArray(page.rows) ? page.rows : [];
      if (totalCount === null) totalCount = readCount(page.res, chunk.length);
      rows = rows.concat(chunk);
      if (chunk.length < Math.min(pageSize, limit - rows.length + chunk.length)) break;
      offset += chunk.length;
    }

    if (!rows) {
      return {
        statusCode: 502,
        headers: h,
        body: JSON.stringify({ error: 'Supabase request failed', detail: 'Unexpected upstream error' })
      };
    }

    var dateMeta = await fetchSnapshotDates(parts);
    if (!dateMeta.res.ok) {
      return {
        statusCode: dateMeta.res.status >= 500 ? 502 : dateMeta.res.status,
        headers: h,
        body: JSON.stringify({ error: 'Supabase request failed', detail: dateMeta.rows && dateMeta.rows.message ? dateMeta.rows.message : 'Unexpected upstream error' })
      };
    }

    var dates = {};
    (Array.isArray(dateMeta.rows) ? dateMeta.rows : []).forEach(function(row) {
      if (row && row.snapshot_date) dates[row.snapshot_date] = true;
    });
    var dateList = Object.keys(dates).sort();
    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({
        success: true,
        data: rows,
        count: totalCount === null ? rows.length : totalCount,
        returned_count: rows.length,
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
