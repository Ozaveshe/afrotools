// netlify/functions/afrostream-admin.js
// AfroStream — Protected Admin CRUD API
// Requires: Authorization: Bearer ${ADMIN_SECRET}
//
// GET    /api/admin/afrostream/creators     → list all creators
// POST   /api/admin/afrostream/creators     → create creator
// PUT    /api/admin/afrostream/creators/:id → update creator
// DELETE /api/admin/afrostream/creators/:id → soft delete
//
// GET    /api/admin/afrostream/streams      → list all streams
// POST   /api/admin/afrostream/streams      → create stream
// PUT    /api/admin/afrostream/streams/:id  → update stream
// DELETE /api/admin/afrostream/streams/:id  → delete stream
//
// GET    /api/admin/afrostream/news         → list all articles
// POST   /api/admin/afrostream/news         → create article
// PUT    /api/admin/afrostream/news/:id     → update article
// DELETE /api/admin/afrostream/news/:id     → soft delete
//
// GET    /api/admin/afrostream/featured     → list featured
// POST   /api/admin/afrostream/featured     → add featured
// PUT    /api/admin/afrostream/featured/:id → reorder
// DELETE /api/admin/afrostream/featured/:id → remove
//
// GET    /api/admin/afrostream/settings     → get settings
// PUT    /api/admin/afrostream/settings     → update setting
//
// GET    /api/admin/afrostream/stats        → dashboard stats

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var ADMIN_SECRET = process.env.ADMIN_SECRET;

function getCorsHeaders(event) {
  var origin = event.headers?.origin || '';
  var isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function isAuthorized(event) {
  if (!ADMIN_SECRET) return false;
  var auth = event.headers?.authorization || event.headers?.Authorization || '';
  return auth === 'Bearer ' + ADMIN_SECRET;
}

async function sb(method, path, body) {
  var opts = {
    method: method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  var text = await res.text();
  var data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(JSON.stringify(data) || 'Supabase ' + res.status);
  return data;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function ok(headers, data, code) {
  return { statusCode: code || 200, headers: headers, body: JSON.stringify({ success: true, data: data }) };
}

function err(headers, msg, code) {
  return { statusCode: code || 400, headers: headers, body: JSON.stringify({ error: msg }) };
}

exports.handler = async function(event) {
  var headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };

  // Public GET endpoints (no auth needed for read)
  var path = event.path
    .replace(/^\/api\/admin\/afrostream\/?/, '')
    .replace(/^\.netlify\/functions\/afrostream-admin\/?/, '');
  var method = event.httpMethod;

  // Public reads — allow anonymous SELECT (RLS handles is_published filter)
  if (method === 'GET' && path === 'public/creators') {
    var creators = await sb('GET', 'as_creators?is_published=eq.true&order=subscribers.desc', null);
    return ok(headers, creators);
  }
  if (method === 'GET' && path === 'public/streams') {
    var now = new Date().toISOString();
    var upcoming = sb('GET', 'as_streams?is_published=eq.true&stream_date=gte.' + now + '&order=stream_date.asc', null);
    var recent  = sb('GET', 'as_streams?is_published=eq.true&stream_date=lt.' + now + '&order=stream_date.desc&limit=50', null);
    var results = await Promise.all([upcoming, recent]);
    var streams = (results[0] || []).concat(results[1] || []);
    return ok(headers, streams);
  }
  if (method === 'GET' && path === 'public/news') {
    var news = await sb('GET', 'as_news?is_published=eq.true&order=published_at.desc&limit=50', null);
    return ok(headers, news);
  }
  if (method === 'GET' && path === 'public/featured') {
    var feat = await sb('GET', 'as_featured?select=*,as_creators(*)&order=sort_order.asc', null);
    return ok(headers, feat);
  }
  if (method === 'GET' && path === 'public/settings') {
    var sets = await sb('GET', 'as_settings?select=key,value', null);
    return ok(headers, sets);
  }
  if (method === 'GET' && path.match(/^public\/creators\/[\w-]+$/)) {
    var cSlug = path.replace('public/creators/', '');
    var cp = await sb('GET', 'as_creators?slug=eq.' + cSlug + '&is_published=eq.true', null);
    return ok(headers, cp && cp[0] ? cp[0] : null);
  }
  if (method === 'GET' && path.match(/^public\/news\/[\w-]+$/)) {
    var nSlug = path.replace('public/news/', '');
    var np = await sb('GET', 'as_news?slug=eq.' + nSlug + '&is_published=eq.true', null);
    return ok(headers, np && np[0] ? np[0] : null);
  }

  // ── ADMIN ROUTES (auth required) ──────────────────────────────
  if (!isAuthorized(event)) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };
  }

  var body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch(e) {}

  console.log('[afrostream-admin] ' + method + ' /' + path);

  try {

    // ══════════════════════════════════════════════════════════════
    // CREATORS
    // ══════════════════════════════════════════════════════════════

    if (path === 'creators' && method === 'GET') {
      var all = await sb('GET', 'as_creators?order=created_at.desc', null);
      return ok(headers, all);
    }

    if (path === 'creators' && method === 'POST') {
      if (!body.name || !body.country) return err(headers, 'Missing: name, country');
      if (!body.slug) body.slug = slugify(body.name);
      var created = await sb('POST', 'as_creators', body);
      console.log('[afrostream-admin] Created creator: ' + body.slug);
      return ok(headers, created, 201);
    }

    var creatorMatch = path.match(/^creators\/(\d+)$/);
    if (creatorMatch && method === 'PUT') {
      var cid = creatorMatch[1];
      delete body.id; delete body.created_at;
      body.updated_at = new Date().toISOString();
      var updated = await sb('PATCH', 'as_creators?id=eq.' + cid, body);
      return ok(headers, updated);
    }
    if (creatorMatch && method === 'DELETE') {
      await sb('PATCH', 'as_creators?id=eq.' + creatorMatch[1], { is_published: false });
      return ok(headers, { message: 'Creator unpublished' });
    }

    // ══════════════════════════════════════════════════════════════
    // STREAMS
    // ══════════════════════════════════════════════════════════════

    if (path === 'streams' && method === 'GET') {
      var allS = await sb('GET', 'as_streams?order=stream_date.desc', null);
      return ok(headers, allS);
    }

    if (path === 'streams' && method === 'POST') {
      if (!body.creator_name || !body.title || !body.stream_date) return err(headers, 'Missing: creator_name, title, stream_date');
      var createdS = await sb('POST', 'as_streams', body);
      console.log('[afrostream-admin] Created stream: ' + body.title);
      return ok(headers, createdS, 201);
    }

    var streamMatch = path.match(/^streams\/(\d+)$/);
    if (streamMatch && method === 'PUT') {
      var sid = streamMatch[1];
      delete body.id; delete body.created_at;
      body.updated_at = new Date().toISOString();
      var updatedS = await sb('PATCH', 'as_streams?id=eq.' + sid, body);
      return ok(headers, updatedS);
    }
    if (streamMatch && method === 'DELETE') {
      await sb('DELETE', 'as_streams?id=eq.' + streamMatch[1], null);
      return ok(headers, { message: 'Stream deleted' });
    }

    // ══════════════════════════════════════════════════════════════
    // NEWS
    // ══════════════════════════════════════════════════════════════

    if (path === 'news' && method === 'GET') {
      var allN = await sb('GET', 'as_news?order=published_at.desc', null);
      return ok(headers, allN);
    }

    if (path === 'news' && method === 'POST') {
      if (!body.title || !body.excerpt || !body.body) return err(headers, 'Missing: title, excerpt, body');
      if (!body.slug) body.slug = slugify(body.title);
      if (!body.published_at) body.published_at = new Date().toISOString();
      var createdN = await sb('POST', 'as_news', body);
      console.log('[afrostream-admin] Published article: ' + body.slug);
      return ok(headers, createdN, 201);
    }

    var newsMatch = path.match(/^news\/(\d+)$/);
    if (newsMatch && method === 'PUT') {
      var nid = newsMatch[1];
      delete body.id; delete body.created_at;
      body.updated_at = new Date().toISOString();
      var updatedN = await sb('PATCH', 'as_news?id=eq.' + nid, body);
      return ok(headers, updatedN);
    }
    if (newsMatch && method === 'DELETE') {
      await sb('PATCH', 'as_news?id=eq.' + newsMatch[1], { is_published: false });
      return ok(headers, { message: 'Article unpublished' });
    }

    // ══════════════════════════════════════════════════════════════
    // FEATURED
    // ══════════════════════════════════════════════════════════════

    if (path === 'featured' && method === 'GET') {
      var allF = await sb('GET', 'as_featured?order=sort_order.asc', null);
      return ok(headers, allF);
    }

    if (path === 'featured' && method === 'POST') {
      if (!body.creator_id) return err(headers, 'Missing: creator_id');
      if (body.sort_order === undefined) body.sort_order = 99;
      var createdF = await sb('POST', 'as_featured', body);
      return ok(headers, createdF, 201);
    }

    var featMatch = path.match(/^featured\/(\d+)$/);
    if (featMatch && method === 'PUT') {
      var fid = featMatch[1];
      delete body.id;
      var updatedF = await sb('PATCH', 'as_featured?id=eq.' + fid, body);
      return ok(headers, updatedF);
    }
    if (featMatch && method === 'DELETE') {
      await sb('DELETE', 'as_featured?id=eq.' + featMatch[1], null);
      return ok(headers, { message: 'Removed from featured' });
    }

    // ══════════════════════════════════════════════════════════════
    // SETTINGS
    // ══════════════════════════════════════════════════════════════

    if (path === 'settings' && method === 'GET') {
      var allSet = await sb('GET', 'as_settings?select=key,value', null);
      return ok(headers, allSet);
    }

    if (path === 'settings' && method === 'PUT') {
      if (!body.key) return err(headers, 'Missing: key');
      var upserted = await sb('POST', 'as_settings?on_conflict=key', {
        key: body.key, value: body.value, updated_at: new Date().toISOString()
      });
      return ok(headers, upserted);
    }

    // ══════════════════════════════════════════════════════════════
    // STATS
    // ══════════════════════════════════════════════════════════════

    if (path === 'stats' && method === 'GET') {
      var counts = await Promise.all([
        sb('GET', 'as_creators?select=id&is_published=eq.true', null),
        sb('GET', 'as_streams?select=id', null),
        sb('GET', 'as_news?select=id&is_published=eq.true', null),
        sb('GET', 'as_featured?select=id', null)
      ]);
      return ok(headers, {
        creators: counts[0] ? counts[0].length : 0,
        streams: counts[1] ? counts[1].length : 0,
        news: counts[2] ? counts[2].length : 0,
        featured: counts[3] ? counts[3].length : 0
      });
    }

    return { statusCode: 404, headers: headers, body: JSON.stringify({ error: 'Endpoint not found', path: path }) };

  } catch(e) {
    console.error('[afrostream-admin] Error on ' + method + ' /' + path + ':', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Internal server error', detail: e.message }) };
  }
};
