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

function mentionFilter(name) {
  var term = encodeURIComponent(String(name || '').trim());
  if (!term) return '';
  return 'or=(title.ilike.*' + term + '*,excerpt.ilike.*' + term + '*,body.ilike.*' + term + '*)';
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
    var newsPath = 'as_news?is_published=eq.true&' + mentionFilter(creator.name) + '&order=published_at.desc&limit=10';
    var similarPath = 'as_creators?country=eq.' + encodeURIComponent(creator.country) + '&slug=neq.' + encodeURIComponent(slug) + '&is_published=eq.true&order=total_followers.desc&limit=5';

    var results = await Promise.all([
      safeSb(streamsPath, []),
      safeSb(snapshotsPath, []),
      safeSb(supportersPath, []),
      safeSb(newsPath, []),
      safeSb(similarPath, [])
    ]);

    var streams = results[0];
    if ((!streams || !streams.length) && creator.name) {
      streams = await safeSb('as_streams?creator_name=eq.' + encodedName + '&is_published=eq.true&order=stream_date.desc&limit=20', []);
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
          news: results[3] || [],
          similar: results[4] || []
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
