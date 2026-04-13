// netlify/functions/afrostream-creator.js
// Public API: GET /api/afrostream/creator?slug=carter-efe
// Returns single creator profile with related streams and news mentions
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function cors(event) {
  var o = event.headers?.origin || '';
  var ok = o === 'https://afrotools.com' || o === 'https://www.afrotools.com' || o.endsWith('.netlify.app') || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? o : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Vary': 'Origin' };
}

async function sb(path) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  return res.json();
}

exports.handler = async function(event) {
  var h = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };

  var slug = (event.queryStringParameters || {}).slug;
  if (!slug) return { statusCode: 400, headers: h, body: '{"error":"slug parameter required"}' };

  try {
    // Fetch creator
    var creators = await sb('as_creators?slug=eq.' + encodeURIComponent(slug) + '&is_published=eq.true');
    if (!creators || !creators.length) {
      return { statusCode: 404, headers: h, body: JSON.stringify({ error: 'Creator not found' }) };
    }
    var creator = creators[0];

    // Fetch related data in parallel
    var [streams, similar] = await Promise.all([
      sb('as_streams?creator_name=eq.' + encodeURIComponent(creator.name) + '&is_published=eq.true&order=stream_date.desc&limit=10'),
      sb('as_creators?country=eq.' + encodeURIComponent(creator.country) + '&slug=neq.' + encodeURIComponent(slug) + '&is_published=eq.true&order=subscribers.desc&limit=5')
    ]);

    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({
        success: true,
        data: {
          creator: creator,
          streams: streams || [],
          similar: similar || []
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
