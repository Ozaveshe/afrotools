/**
 * AfroTools — Gazette Review API
 * Admin endpoint to view and action gazette changes.
 *
 * GET /api/gazette-review                    — list pending changes
 * POST /api/gazette-review                   — approve/reject a change
 *   { action: 'approve'|'reject', id: uuid, notes: '...' }
 *
 * When approved, flags the affected PAYE data and adds a banner to the tool page.
 * Protected: requires x-admin-key header.
 */

const { getAllowedOrigin } = require('./utils/cors');

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  var adminKey = event.headers['x-admin-key'];
  if (!adminKey || adminKey !== (process.env.ADMIN_KEY || process.env.ADMIN_SECRET)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Service key not configured' }) };
  }

  // GET: List pending gazette changes + review queue items
  if (event.httpMethod === 'GET') {
    var [gazetteRes, reviewRes] = await Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/gazette_changes?applied_to_tools=eq.false&order=detected_at.desc&limit=50', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      }),
      fetch(SUPABASE_URL + '/rest/v1/review_queue?status=eq.pending&order=created_at.desc&limit=50', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      }),
    ]);

    var gazette = gazetteRes.ok ? await gazetteRes.json() : [];
    var review = reviewRes.ok ? await reviewRes.json() : [];

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        pending_gazette_changes: gazette,
        pending_reviews: review,
        gazette_count: gazette.length,
        review_count: review.length,
      }),
    };
  }

  // POST: Approve or reject a change
  if (event.httpMethod === 'POST') {
    var body;
    try { body = JSON.parse(event.body); } catch (e) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    if (!body.id || !body.action) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing id or action' }) };
    }

    var now = new Date().toISOString();

    if (body.action === 'approve') {
      // Mark gazette change as verified
      await fetch(SUPABASE_URL + '/rest/v1/gazette_changes?id=eq.' + body.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({
          verified: true,
          verified_at: now,
          applied_to_tools: false, // Still needs manual data update
        }),
      });

      // Update review queue
      await fetch(SUPABASE_URL + '/rest/v1/review_queue?notes=cs.gazette&metric=eq.' + encodeURIComponent(body.change_type || '') + '&status=eq.pending', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({
          status: 'approved',
          reviewed_by: 'admin',
          reviewed_at: now,
          notes: (body.notes || '') + ' [gazette change verified]',
        }),
      });

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          message: 'Change verified. Update the PAYE data file for ' + (body.country_code || 'affected country') + ', then mark applied_to_tools=true.',
        }),
      };

    } else if (body.action === 'reject') {
      await fetch(SUPABASE_URL + '/rest/v1/gazette_changes?id=eq.' + body.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({
          verified: false,
          verified_at: now,
          applied_to_tools: true, // No action needed
        }),
      });

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, message: 'Change rejected and dismissed.' }) };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Action must be approve or reject' }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
