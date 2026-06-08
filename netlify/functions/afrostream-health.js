// Public API: GET /api/afrostream/health
// Aggregates public AfroStream freshness without exposing account or private admin data.
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers && event.headers.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=120',
    'Vary': 'Origin'
  };
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

async function sb(path, count) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Prefer: count ? 'count=exact' : ''
    }
  });
  var data = await readJson(res);
  if (!res.ok) {
    var detail = data && data.message ? data.message : 'Unexpected upstream error';
    throw new Error('Supabase request failed: ' + detail);
  }
  return { data: Array.isArray(data) ? data : [], count: readCount(res, Array.isArray(data) ? data.length : 0) };
}

function hoursBetween(now, value) {
  if (!value) return null;
  var date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 36e5 * 10) / 10);
}

function daysBetweenDates(now, value) {
  if (!value) return null;
  var date = new Date(value + 'T00:00:00Z');
  if (isNaN(date.getTime())) return null;
  var nowDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  var valueDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.max(0, Math.round((nowDate - valueDate) / 864e5));
}

function latestRun(rows, scraperId) {
  return rows.filter(function(row) {
    return row.scraper_id === scraperId;
  }).sort(function(a, b) {
    return String(b.fetched_at || '').localeCompare(String(a.fetched_at || ''));
  })[0] || null;
}

exports.handler = async function(event) {
  var h = cors(event || {});
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers: h, body: '{"error":"SUPABASE service key not configured"}' };

  try {
    var now = new Date();
    var results = await Promise.all([
      sb('as_creators?is_published=eq.true&select=id&limit=1', true),
      sb('as_creator_snapshots?select=snapshot_date,created_at&order=snapshot_date.desc,created_at.desc&limit=1', true),
      sb('as_streams?is_published=eq.true&select=id&limit=1', true),
      sb('as_streams?is_published=eq.true&is_live=eq.true&stream_date=gte.' + encodeURIComponent(new Date(now.getTime() - 864e5).toISOString()) + '&select=id&limit=1', true),
      sb('as_streams?is_published=eq.true&stream_date=gte.' + encodeURIComponent(new Date(now.getTime() - 864e5).toISOString()) + '&select=id&limit=1', true),
      sb('as_streams?is_published=eq.true&select=stream_date,updated_at&order=updated_at.desc&limit=1', false),
      sb('as_news?is_published=eq.true&select=id&limit=1', true),
      sb('as_news?is_published=eq.true&published_at=gte.' + encodeURIComponent(new Date(now.getTime() - 7 * 864e5).toISOString()) + '&select=id&limit=1', true),
      sb('as_news?is_published=eq.true&select=published_at,updated_at&order=published_at.desc&limit=1', false),
      sb('as_news_sources?is_active=eq.true&select=name,last_checked_at,last_success_at,last_error,last_status_code,last_item_count&limit=200', false),
      sb('as_creator_supporters?is_published=eq.true&select=id,is_verified,event_date,updated_at&limit=200', true),
      sb('scraper_runs?scraper_id=eq.afrostream-sync&select=scraper_id,status,source,records_count,error_message,duration_ms,fetched_at&order=fetched_at.desc&limit=1', false),
      sb('scraper_runs?scraper_id=eq.afrostream-livecheck&select=scraper_id,status,source,records_count,error_message,duration_ms,fetched_at&order=fetched_at.desc&limit=1', false),
      sb('scraper_runs?scraper_id=eq.afrostream-news-monitor&select=scraper_id,status,source,records_count,error_message,duration_ms,fetched_at&order=fetched_at.desc&limit=1', false)
    ]);

    var creatorCount = results[0].count;
    var latestSnapshot = results[1].data[0] || null;
    var snapshotDate = latestSnapshot && latestSnapshot.snapshot_date || null;
    var snapshotRows = snapshotDate
      ? await sb('as_creator_snapshots?snapshot_date=eq.' + encodeURIComponent(snapshotDate) + '&select=id&limit=1', true)
      : { count: 0 };
    var sources = results[9].data;
    var supporters = results[10].data;
    var runs = []
      .concat(results[11].data || [])
      .concat(results[12].data || [])
      .concat(results[13].data || []);
    var latestLiveRun = latestRun(runs, 'afrostream-livecheck');
    var latestSyncRun = latestRun(runs, 'afrostream-sync');
    var latestNewsRun = latestRun(runs, 'afrostream-news-monitor');
    var latestStream = results[5].data[0] || null;
    var latestNews = results[8].data[0] || null;

    var activeSourceErrors = sources.filter(function(row) {
      return row.last_error && String(row.last_error).trim();
    });
    var staleSources = sources.filter(function(row) {
      return !row.last_success_at || hoursBetween(now, row.last_success_at) > 168;
    });
    var recentSourceSuccess = sources.filter(function(row) {
      return row.last_success_at && hoursBetween(now, row.last_success_at) <= 24;
    });
    var verifiedSupporters = supporters.filter(function(row) { return row.is_verified; });
    var latestSupporter = supporters.sort(function(a, b) {
      return String(b.event_date || b.updated_at || '').localeCompare(String(a.event_date || a.updated_at || ''));
    })[0] || null;

    var body = {
      success: true,
      data: {
        generated_at: now.toISOString(),
        creators: {
          published: creatorCount
        },
        snapshots: {
          latest_snapshot_date: snapshotDate,
          latest_created_at: latestSnapshot && latestSnapshot.created_at || null,
          age_days: daysBetweenDates(now, snapshotDate),
          latest_row_count: snapshotRows.count,
          expected_creator_count: creatorCount
        },
        streams: {
          total_published: results[2].count,
          live_now: results[3].count,
          last_24h: results[4].count,
          latest_stream_date: latestStream && latestStream.stream_date || null,
          latest_updated_at: latestStream && latestStream.updated_at || null,
          latest_updated_age_hours: hoursBetween(now, latestStream && latestStream.updated_at)
        },
        news: {
          total_published: results[6].count,
          last_7d: results[7].count,
          latest_published_at: latestNews && latestNews.published_at || null,
          latest_age_hours: hoursBetween(now, latestNews && latestNews.published_at)
        },
        sources: {
          active: sources.length,
          latest_checked_at: sources.reduce(function(max, row) { return !max || row.last_checked_at > max ? row.last_checked_at : max; }, null),
          latest_success_at: sources.reduce(function(max, row) { return !max || row.last_success_at > max ? row.last_success_at : max; }, null),
          success_last_24h: recentSourceSuccess.length,
          stale_over_7d: staleSources.length,
          with_error: activeSourceErrors.length
        },
        supporters: {
          published: supporters.length,
          verified: verifiedSupporters.length,
          latest_event_date: latestSupporter && latestSupporter.event_date || null,
          latest_updated_at: latestSupporter && latestSupporter.updated_at || null
        },
        automation: {
          livecheck: latestLiveRun,
          sync: latestSyncRun,
          news_monitor: latestNewsRun
        }
      }
    };

    return { statusCode: 200, headers: h, body: JSON.stringify(body) };
  } catch (e) {
    return { statusCode: 502, headers: h, body: JSON.stringify({ success: false, error: e.message }) };
  }
};
