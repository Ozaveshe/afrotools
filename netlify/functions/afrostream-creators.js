// netlify/functions/afrostream-creators.js
// Public API: GET /api/afrostream/creators?country=&category=&platform=&sort=&limit=
var FALLBACK = require('../../data/afrostream/creators-fallback.json');
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers?.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Vary': 'Origin' };
}

function readJson(res) {
  return res.text().then(function(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      var parseError = new Error('Upstream returned a non-JSON response');
      parseError.code = 'UPSTREAM_NON_JSON';
      parseError.status = res.status;
      throw parseError;
    }
  });
}

function readCount(res, fallback) {
  var range = res.headers.get('content-range') || '';
  var match = /\/(\d+)$/.exec(range);
  return match ? parseInt(match[1], 10) : fallback;
}

function creatorKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mergeStreamStats(creators, streams) {
  var byId = {};
  var byName = {};

  (streams || []).forEach(function(row) {
    if (!row) return;
    var viewers = Math.max(0, parseInt(row.viewer_count, 10) || 0);
    var date = row.stream_date || row.updated_at || row.created_at || '';
    var keys = [];
    if (row.creator_id) keys.push({ map: byId, key: String(row.creator_id) });
    var nameKey = creatorKey(row.creator_name);
    if (nameKey) keys.push({ map: byName, key: nameKey });
    keys.forEach(function(entry) {
      var stat = entry.map[entry.key] || { stream_count_30d: 0, peak_viewers: 0, current_viewers: 0, is_live: false, last_stream_at: '' };
      stat.stream_count_30d += 1;
      stat.peak_viewers = Math.max(stat.peak_viewers, viewers);
      if (row.is_live) {
        stat.is_live = true;
        stat.current_viewers = Math.max(stat.current_viewers, viewers);
      }
      if (!stat.last_stream_at || (date && date > stat.last_stream_at)) stat.last_stream_at = date;
      entry.map[entry.key] = stat;
    });
  });

  return (creators || []).map(function(row) {
    var idStat = row && row.id ? byId[String(row.id)] : null;
    var nameStat = byName[creatorKey(row && row.name)] || null;
    var stat = {
      stream_count_30d: Math.max(idStat && idStat.stream_count_30d || 0, nameStat && nameStat.stream_count_30d || 0),
      peak_viewers: Math.max(parseInt(row && row.peak_viewers, 10) || 0, idStat && idStat.peak_viewers || 0, nameStat && nameStat.peak_viewers || 0),
      current_viewers: Math.max(idStat && idStat.current_viewers || 0, nameStat && nameStat.current_viewers || 0),
      is_live: (idStat && idStat.is_live) || (nameStat && nameStat.is_live) || false,
      last_stream_at: (idStat && idStat.last_stream_at || '') > (nameStat && nameStat.last_stream_at || '') ? idStat.last_stream_at : (nameStat && nameStat.last_stream_at || '')
    };
    return Object.assign({}, row, stat);
  });
}

function q(v) {
  return encodeURIComponent(String(v || '').trim());
}

function ilike(v) {
  return encodeURIComponent('*' + String(v || '').trim() + '*');
}

function numberValue(value) {
  if (typeof value === 'number') return value;
  return parseFloat(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

function fallbackRows(qs, requestedSort, limit) {
  var platformCols = {
    youtube: 'youtube_url',
    twitch: 'twitch_url',
    tiktok: 'tiktok_url',
    instagram: 'instagram_url',
    kick: 'kick_url',
    twitter: 'twitter_url',
    x: 'twitter_url'
  };
  var rows = (FALLBACK.creators || []).filter(function(row) {
    if (qs.country && String(row.country || '').toLowerCase() !== String(qs.country).trim().toLowerCase()) return false;
    if (qs.category && String(row.categories || '').toLowerCase().indexOf(String(qs.category).trim().toLowerCase()) === -1) return false;
    if (qs.platform) {
      var platformCol = platformCols[String(qs.platform).toLowerCase()];
      if (!platformCol || !row[platformCol]) return false;
    }
    return true;
  }).map(function(row) {
    return Object.assign({}, row, {
      source_state: FALLBACK.source.state,
      source_snapshot_label: FALLBACK.source.snapshot_label,
      source_reviewed_at: FALLBACK.source.reviewed_at,
      source_metrics_freshness: FALLBACK.source.metrics_freshness
    });
  });

  rows.sort(function(a, b) {
    if (requestedSort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    if (requestedSort === 'gift_revenue' || requestedSort === 'gifts') return numberValue(b.gift_revenue) - numberValue(a.gift_revenue);
    if (requestedSort === 'growth_rate' || requestedSort === 'growth_pct' || requestedSort === 'growth') return numberValue(b.growth_pct || b.growth_rate) - numberValue(a.growth_pct || a.growth_rate);
    if (requestedSort === 'views' || requestedSort === 'total_views') return numberValue(b.total_views || b.yt_views) - numberValue(a.total_views || a.yt_views);
    if (requestedSort === 'newest') return String(b.created_at || '').localeCompare(String(a.created_at || '')) || String(a.name || '').localeCompare(String(b.name || ''));
    if (requestedSort === 'subscribers' || requestedSort === 'followers' || requestedSort === 'total_followers') {
      return numberValue(b.total_followers || b.subscribers) - numberValue(a.total_followers || a.subscribers);
    }
    return numberValue(b.afro_score) - numberValue(a.afro_score)
      || numberValue(b.total_followers || b.subscribers) - numberValue(a.total_followers || a.subscribers);
  });

  var total = rows.length;
  var offset = Math.max(0, parseInt(qs.offset, 10) || 0);
  return { rows: rows.slice(offset, offset + limit), total: total };
}

function fallbackResponse(headers, qs, requestedSort, limit, reason) {
  var result = fallbackRows(qs, requestedSort, limit);
  var fallbackHeaders = Object.assign({}, headers, {
    'Cache-Control': 'public, max-age=60, stale-if-error=86400'
  });
  return {
    statusCode: 200,
    headers: fallbackHeaders,
    body: JSON.stringify({
      success: true,
      degraded: true,
      data: result.rows,
      count: result.total,
      returned_count: result.rows.length,
      source: Object.assign({}, FALLBACK.source, { reason: reason || 'upstream_unavailable' })
    })
  };
}

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };

  var qs = event.queryStringParameters || {};
  var parts = ['is_published=eq.true'];

  if (qs.country) parts.push('country=eq.' + q(qs.country));
  if (qs.category) parts.push('categories=ilike.' + ilike(qs.category));
  if (qs.platform) {
    var platformCols = {
      youtube: 'youtube_url',
      twitch: 'twitch_url',
      tiktok: 'tiktok_url',
      instagram: 'instagram_url',
      kick: 'kick_url',
      twitter: 'twitter_url',
      x: 'twitter_url'
    };
    var col = platformCols[String(qs.platform).toLowerCase()];
    if (!col) {
      return { statusCode: 400, headers: h, body: '{"error":"Unsupported platform filter"}' };
    }
    parts.push(col + '=not.is.null');
    parts.push(col + '=neq.');
  }

  var sort = 'afro_score.desc.nullslast,subscribers.desc';
  var requestedSort = qs.sort || 'afro_score';
  if (requestedSort === 'subscribers' || requestedSort === 'followers') sort = 'total_followers.desc.nullslast,subscribers.desc';
  else if (requestedSort === 'total_followers') sort = 'total_followers.desc.nullslast,subscribers.desc';
  else if (requestedSort === 'afro_score' || requestedSort === 'score') sort = 'afro_score.desc.nullslast,subscribers.desc';
  else if (requestedSort === 'gift_revenue' || requestedSort === 'gifts') sort = 'gift_revenue.desc';
  else if (requestedSort === 'growth_rate' || requestedSort === 'growth_pct' || requestedSort === 'growth') sort = 'growth_pct.desc.nullslast,growth_rate.desc.nullslast';
  else if (requestedSort === 'views' || requestedSort === 'total_views') sort = 'total_views.desc.nullslast,yt_views.desc.nullslast';
  else if (requestedSort === 'name') sort = 'name.asc';
  else if (requestedSort === 'newest') sort = 'created_at.desc';
  else return { statusCode: 400, headers: h, body: '{"error":"Unsupported sort"}' };
  parts.push('order=' + sort);

  var limit = Math.min(parseInt(qs.limit, 10) || 50, 500);
  parts.push('limit=' + limit);
  if (qs.offset) parts.push('offset=' + (parseInt(qs.offset, 10) || 0));

  if (!SUPABASE_KEY) return fallbackResponse(h, qs, requestedSort, limit, 'service_configuration_unavailable');

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_creators?' + parts.join('&'), {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'count=exact' }
    });
    var data;
    try {
      data = await readJson(res);
    } catch (parseError) {
      if (parseError && parseError.code === 'UPSTREAM_NON_JSON') {
        return fallbackResponse(h, qs, requestedSort, limit, 'upstream_non_json');
      }
      throw parseError;
    }
    if (!res.ok) {
      if (res.status >= 500) return fallbackResponse(h, qs, requestedSort, limit, 'upstream_unavailable');
      return {
        statusCode: res.status >= 500 ? 502 : res.status,
        headers: h,
        body: JSON.stringify({ error: 'Supabase request failed', detail: data && data.message ? data.message : 'Unexpected upstream error' })
      };
    }

    var rows = Array.isArray(data) ? data : [];
    if (rows.length) {
      var streamCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      var streamRes = await fetch(SUPABASE_URL + '/rest/v1/as_streams?is_published=eq.true&stream_date=gte.' + encodeURIComponent(streamCutoff) + '&select=creator_id,creator_name,viewer_count,is_live,stream_date,updated_at,created_at&limit=1000', {
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
      });
      if (streamRes.ok) {
        var streamRows = await readJson(streamRes);
        rows = mergeStreamStats(rows, Array.isArray(streamRows) ? streamRows : []);
      }
    }
    var totalCount = readCount(res, rows.length);
    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({ success: true, data: rows, count: totalCount, returned_count: rows.length })
    };
  } catch (e) {
    return fallbackResponse(h, qs, requestedSort, limit, 'upstream_unavailable');
  }
};
