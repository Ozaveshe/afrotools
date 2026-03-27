// netlify/functions/conflict-admin.js
// AfroConflict — Protected Admin CRUD API
// Requires: Authorization: Bearer ${ADMIN_SECRET}
//
// POST   /api/admin/conflicts            → create new conflict
// PUT    /api/admin/conflicts/:id        → update conflict
// DELETE /api/admin/conflicts/:id        → soft delete (is_published=false)
// POST   /api/admin/conflicts/:id/actors → add actor to conflict
// POST   /api/admin/timeline            → add timeline event
// POST   /api/admin/economy-actors      → add economy/profiteer actor
// POST   /api/admin/forecasts           → upsert forecast scenario
// POST   /api/admin/economic-impact     → add economic data point
// POST   /api/admin/displacement        → add displacement record
// POST   /api/admin/sync-trigger        → manually trigger sync

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
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
  return auth === `Bearer ${ADMIN_SECRET}`;
}

async function sbRequest(method, path, body, key) {
  var opts = {
    method: method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  var text = await res.text();
  var data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(JSON.stringify(data) || `Supabase ${res.status}`);
  return data;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.handler = async function (event) {
  var headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!isAuthorized(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };
  }

  var path = event.path
    .replace(/^\/api\/admin\//, '')
    .replace(/^\.netlify\/functions\/conflict-admin\/?/, '');
  var method = event.httpMethod;
  var body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch(e) {}

  console.log(`[conflict-admin] ${method} /${path}`);

  try {

    // ── GET /api/admin/conflicts (list all including unpublished) ──
    if (path === 'conflicts' && method === 'GET') {
      var all = await sbRequest('GET',
        'ac_conflicts?select=id,slug,name,status,primary_country,is_published,is_featured,updated_at,last_api_sync&order=updated_at.desc',
        null, SUPABASE_SERVICE_KEY);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: all }) };
    }

    // ── POST /api/admin/conflicts (create) ──────────────────────
    if (path === 'conflicts' && method === 'POST') {
      if (!body.name || !body.conflict_type || !body.primary_country || !body.start_date || !body.status) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: name, conflict_type, primary_country, start_date, status' }) };
      }
      if (!body.slug) body.slug = slugify(body.name);
      var created = await sbRequest('POST', 'ac_conflicts', body, SUPABASE_SERVICE_KEY);
      console.log(`[conflict-admin] Created conflict: ${body.slug}`);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: created }) };
    }

    // ── PUT /api/admin/conflicts/:id ─────────────────────────────
    var putMatch = path.match(/^conflicts\/([a-f0-9-]{36})$/);
    if (putMatch && method === 'PUT') {
      var id = putMatch[1];
      delete body.id; delete body.duration_days; delete body.created_at;
      var updated = await sbRequest('PATCH', `ac_conflicts?id=eq.${id}`, body, SUPABASE_SERVICE_KEY);
      console.log(`[conflict-admin] Updated conflict: ${id}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: updated }) };
    }

    // ── DELETE /api/admin/conflicts/:id (soft delete) ─────────────
    if (putMatch && method === 'DELETE') {
      var delId = putMatch[1];
      await sbRequest('PATCH', `ac_conflicts?id=eq.${delId}`, { is_published: false }, SUPABASE_SERVICE_KEY);
      console.log(`[conflict-admin] Soft-deleted conflict: ${delId}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Conflict unpublished' }) };
    }

    // ── POST /api/admin/conflicts/:id/actors ──────────────────────
    var actorMatch = path.match(/^conflicts\/([a-f0-9-]{36})\/actors$/);
    if (actorMatch && method === 'POST') {
      var conflictId = actorMatch[1];
      body.conflict_id = conflictId;
      // Create actor if not exists, then create junction
      if (!body.actor_id && body.actor_name) {
        var newActor = await sbRequest('POST', 'ac_actors', {
          name: body.actor_name,
          short_name: body.actor_short_name,
          actor_type: body.actor_type || 'other',
          country: body.actor_country,
          description: body.actor_description
        }, SUPABASE_SERVICE_KEY);
        body.actor_id = newActor[0]?.id;
      }
      delete body.actor_name; delete body.actor_short_name; delete body.actor_country; delete body.actor_description;
      var junction = await sbRequest('POST', 'ac_conflict_actors', body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: junction }) };
    }

    // ── POST /api/admin/timeline ─────────────────────────────────
    if (path === 'timeline' && method === 'POST') {
      if (!body.conflict_id || !body.event_date || !body.title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: conflict_id, event_date, title' }) };
      }
      var tl = await sbRequest('POST', 'ac_timeline', body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: tl }) };
    }

    // ── POST /api/admin/economy-actors ───────────────────────────
    if (path === 'economy-actors' && method === 'POST') {
      if (!body.conflict_id || !body.entity_name || !body.entity_type || !body.alleged_role) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: conflict_id, entity_name, entity_type, alleged_role' }) };
      }
      var ea = await sbRequest('POST', 'ac_economy_actors', body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: ea }) };
    }

    // ── POST /api/admin/forecasts ────────────────────────────────
    if (path === 'forecasts' && method === 'POST') {
      if (!body.conflict_id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required field: conflict_id' }) };
      }
      if (!body.forecast_date) body.forecast_date = new Date().toISOString().slice(0,10);
      // Upsert on (conflict_id, forecast_date)
      var fc = await sbRequest('POST',
        'ac_forecasts?on_conflict=conflict_id,forecast_date',
        body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: fc }) };
    }

    // ── POST /api/admin/economic-impact ──────────────────────────
    if (path === 'economic-impact' && method === 'POST') {
      if (!body.conflict_id || !body.year) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: conflict_id, year' }) };
      }
      var ei = await sbRequest('POST',
        'ac_economic_impact?on_conflict=conflict_id,year',
        body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: ei }) };
    }

    // ── POST /api/admin/displacement ─────────────────────────────
    if (path === 'displacement' && method === 'POST') {
      if (!body.conflict_id || !body.record_date) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: conflict_id, record_date' }) };
      }
      var disp = await sbRequest('POST', 'ac_displacement', body, SUPABASE_SERVICE_KEY);
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: disp }) };
    }

    // ── POST /api/admin/sync-trigger ─────────────────────────────
    if (path === 'sync-trigger' && method === 'POST') {
      var params = event.queryStringParameters || {};
      var source = params.source || body.source || 'all';
      console.log(`[conflict-admin] Manual sync triggered: ${source}`);

      // Call the sync function internally
      var syncUrl = `${process.env.URL || 'https://afrotools.com'}/.netlify/functions/conflict-sync?source=${source}`;
      try {
        var syncRes = await fetch(syncUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });
        var syncData = await syncRes.json();
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, source, result: syncData }) };
      } catch (syncErr) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: false, source, error: syncErr.message, message: 'Sync triggered but response unavailable' }) };
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Admin endpoint not found', path }) };

  } catch (err) {
    console.error(`[conflict-admin] Error on ${method} /${path}:`, err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: err.message }) };
  }
};
