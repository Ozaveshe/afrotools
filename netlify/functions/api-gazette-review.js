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

var DEFAULT_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

function getHeader(event, headerName) {
  var headers = event.headers || {};
  var expected = headerName.toLowerCase();

  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === expected) {
      return headers[key];
    }
  }

  return '';
}

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  var adminKey = getHeader(event, 'x-admin-key');
  var adminSecret = cleanEnvValue(process.env.ADMIN_KEY || process.env.ADMIN_SECRET);
  if (!adminKey || adminKey !== adminSecret) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  var SUPABASE_URL = getSupabaseUrl();
  var SUPABASE_KEY = cleanEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Service key not configured' }) };
  }

  // GET: List pending gazette changes + review queue items
  if (event.httpMethod === 'GET') {
    var gazetteRes;
    var reviewRes;
    try {
      await reconcileRejectedGazetteChanges(SUPABASE_URL, SUPABASE_KEY);
      [gazetteRes, reviewRes] = await Promise.all([
        fetch(SUPABASE_URL + '/rest/v1/gazette_changes?applied_to_tools=eq.false&order=detected_at.desc&limit=50', {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
        }),
        fetch(SUPABASE_URL + '/rest/v1/review_queue?status=eq.pending&order=created_at.desc&limit=50', {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
        }),
      ]);
    } catch (err) {
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Review queue unavailable', detail: err.message }) };
    }

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

    var gazetteLookup = await fetch(
      SUPABASE_URL + '/rest/v1/gazette_changes?id=eq.' + body.id + '&select=id,country_code,change_type',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    var gazetteRows = gazetteLookup.ok ? await gazetteLookup.json() : [];
    if (!gazetteRows.length) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Gazette change not found' }) };
    }

    var gazetteChange = gazetteRows[0];
    var reviewFilter = SUPABASE_URL + '/rest/v1/review_queue?category=eq.gazette' +
      '&country_code=eq.' + encodeURIComponent(gazetteChange.country_code) +
      '&metric=eq.' + encodeURIComponent(gazetteChange.change_type) +
      '&reason=eq.gazette_detected&status=eq.pending';

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
      await fetch(reviewFilter, {
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
          message: 'Change verified. Update the PAYE data file for ' + (gazetteChange.country_code || 'affected country') + ', then mark applied_to_tools=true.',
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

      await fetch(reviewFilter, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({
          status: 'rejected',
          reviewed_by: 'admin',
          reviewed_at: now,
          notes: (body.notes || '') + ' [gazette change dismissed]',
        }),
      });

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, message: 'Change rejected and dismissed.' }) };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Action must be approve or reject' }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
};

function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function getSupabaseUrl() {
  var candidate = cleanEnvValue(
    process.env.SUPABASE_AUTH_URL ||
    process.env.SUPABASE_DATA_URL ||
    process.env.SUPABASE_URL
  );

  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(candidate)
    ? candidate
    : DEFAULT_SUPABASE_URL;
}

async function reconcileRejectedGazetteChanges(supabaseUrl, supabaseKey) {
  var reviewRes = await fetch(
    supabaseUrl + '/rest/v1/review_queue?category=eq.gazette&reason=eq.gazette_detected&status=eq.rejected&select=country_code,metric,reviewed_at',
    { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } }
  );
  if (!reviewRes.ok) return;

  var rows = await reviewRes.json();
  if (!Array.isArray(rows) || !rows.length) return;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row || !row.country_code || !row.metric) continue;

    await fetch(
      supabaseUrl + '/rest/v1/gazette_changes?country_code=eq.' + encodeURIComponent(row.country_code) +
        '&change_type=eq.' + encodeURIComponent(row.metric) +
        '&applied_to_tools=eq.false',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
        },
        body: JSON.stringify({
          verified: false,
          verified_at: row.reviewed_at || new Date().toISOString(),
          applied_to_tools: true,
        }),
      }
    );
  }
}
