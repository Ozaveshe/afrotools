// netlify/functions/afrostream-creator.js
// Public API: GET /api/afrostream/creator?slug=carter-efe
// Returns a single creator profile with streams, snapshots, supporters, and news mentions.
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers?.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=180', 'Vary': 'Origin' };
}

async function sb(path) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  var text = await res.text();
  var data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    var message = data && data.message ? data.message : text;
    throw new Error('Supabase request failed: ' + res.status + (message ? ' ' + message : ''));
  }
  return data;
}

async function safeSb(path, fallback) {
  try {
    var data = await sb(path);
    return Array.isArray(data) ? data : (data || fallback);
  } catch (e) {
    return fallback;
  }
}

async function sbCount(path) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Prefer: 'count=exact',
      Range: '0-0'
    }
  });
  if (!res.ok) {
    throw new Error('Supabase count failed: ' + res.status);
  }
  var contentRange = res.headers.get('content-range') || '';
  var match = /\/(\d+)$/.exec(contentRange);
  return match ? Number(match[1]) : 0;
}

async function safeSbCount(path, fallback) {
  try {
    return await sbCount(path);
  } catch (e) {
    return fallback;
  }
}

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers: h, body: '{"error":"SUPABASE service key not configured"}' };

  var slug = (event.queryStringParameters || {}).slug;
  if (!slug) return { statusCode: 400, headers: h, body: '{"error":"slug parameter required"}' };

  try {
    var creators = await sb('as_creators?slug=eq.' + encodeURIComponent(slug) + '&is_published=eq.true&limit=1');
    if (!creators || !creators.length) {
      return { statusCode: 404, headers: h, body: JSON.stringify({ error: 'Creator not found' }) };
    }
    var creator = creators[0];
    var id = creator.id;
    var encodedName = encodeURIComponent(creator.name || '');

    var streamsPath = 'as_streams?creator_id=eq.' + id + '&is_published=eq.true&order=stream_date.desc&limit=20';
    var snapshotsPath = 'as_creator_snapshots?creator_id=eq.' + id + '&order=snapshot_date.desc&limit=30';
    var supportersPath = 'as_creator_supporters?creator_id=eq.' + id + '&is_published=eq.true&order=amount.desc,event_date.desc&limit=10';
    var similarPath = 'as_creators?country=eq.' + encodeURIComponent(creator.country) + '&slug=neq.' + encodeURIComponent(slug) + '&is_published=eq.true&order=total_followers.desc&limit=5';
    var mentionPath = 'as_news_creator_mentions?creator_id=eq.' + id + '&order=detected_at.desc&limit=10';
    var supportersCoveragePath = 'as_creator_supporters?select=id&is_published=eq.true';
    var mentionCoveragePath = 'as_news_creator_mentions?select=id';
    var publishedNewsCoveragePath = 'as_news?select=id&is_published=eq.true';

    var results = await Promise.all([
      safeSb(streamsPath, []),
      safeSb(snapshotsPath, []),
      safeSb(supportersPath, []),
      safeSb(mentionPath, []),
      safeSb(similarPath, []),
      safeSbCount(supportersCoveragePath, null),
      safeSbCount(mentionCoveragePath, null),
      safeSbCount(publishedNewsCoveragePath, null)
    ]);

    var streams = results[0];
    if ((!streams || !streams.length) && creator.name) {
      streams = await safeSb('as_streams?creator_name=eq.' + encodedName + '&is_published=eq.true&order=stream_date.desc&limit=20', []);
    }

    var mentionRows = Array.isArray(results[3]) ? results[3] : [];
    var newsRows = [];
    if (mentionRows.length) {
      var newsIds = mentionRows.map(function(row) { return row.news_id; }).filter(Boolean);
      if (newsIds.length) {
        var newsPath = 'as_news?id=in.(' + newsIds.join(',') + ')&is_published=eq.true&order=published_at.desc';
        newsRows = await safeSb(newsPath, []);
      }
    }

    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({
        success: true,
        data: {
          creator: creator,
          streams: streams || [],
          snapshots: results[1] || [],
          supporters: results[2] || [],
          news: newsRows || [],
          similar: results[4] || [],
          coverage: {
            supportersPublishedCount: results[5],
            newsMentionLinkCount: results[6],
            publishedNewsCount: results[7]
          }
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
