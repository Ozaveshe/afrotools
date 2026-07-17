/**
 * One-time welcome backfill for existing AfroTools users.
 *
 * POST /api/email/welcome-backfill
 * Body: { "dryRun": true, "limit": 39 }
 *
 * Live sends require:
 *   Authorization: Bearer $WELCOME_BACKFILL_TOKEN
 * or
 *   Authorization: Bearer $EMAIL_ADMIN_TOKEN
 */
const { createClient } = require('@supabase/supabase-js');
const { corsHeaders, corsResponse } = require('./utils/cors');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;

function getHeader(headers, name) {
  headers = headers || {};
  var wanted = String(name || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) return headers[keys[i]];
  }
  return '';
}

function isAuthorized(event) {
  var token = process.env.WELCOME_BACKFILL_TOKEN || process.env.EMAIL_ADMIN_TOKEN || '';
  if (!token) return false;
  var auth = String(getHeader(event.headers, 'authorization') || '');
  return auth === 'Bearer ' + token;
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

exports.handler = async function (event) {
  var headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return corsResponse(event);
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var body = parseBody(event);
  var dryRun = body.dryRun !== false && body.dry_run !== false;
  var authorized = isAuthorized(event);

  if (!dryRun && !authorized) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ ok: false, error: 'Missing Supabase service key' }) };
  }

  var limit = Number(body.limit || 39);
  if (!isFinite(limit) || limit < 1) limit = 39;
  limit = Math.min(Math.floor(limit), 100);

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,email_unsubscribe_token')
    .eq('email_digest_enabled', true)
    .is('email_welcome_sent_at', null)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[welcome-backfill] profile fetch failed:', error.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ ok: false, error: 'Profile fetch failed' }) };
  }

  if (dryRun) {
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ ok: true, dryRun: true, eligible: profiles ? profiles.length : 0 }),
    };
  }

  var sent = 0;
  var marked = 0;
  var errors = 0;
  var now = new Date().toISOString();

  for (var i = 0; i < (profiles || []).length; i++) {
    var profile = profiles[i];
    try {
      var token = profile.email_unsubscribe_token || '';
      var result = await sendLifecycleEmail('founding_user_welcome', {
        email: profile.email,
        name: profile.name || '',
        unsubscribeUrl: token ? 'https://afrotools.com/api/email/unsubscribe?token=' + encodeURIComponent(token) : '',
      });

      if (!result.ok) {
        errors++;
        console.error('[welcome-backfill] send failed for profile ' + profile.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      sent++;
      var { error: updateErr } = await sb
        .from('profiles')
        .update({ email_welcome_sent_at: now })
        .eq('id', profile.id)
        .is('email_welcome_sent_at', null);
      if (updateErr) {
        errors++;
        console.error('[welcome-backfill] sent but status update failed for profile ' + profile.id + ':', updateErr.message);
      } else {
        marked++;
      }
      await wait(150);
    } catch (err) {
      errors++;
      console.error('[welcome-backfill] send error for profile ' + profile.id + ':', err && err.message ? err.message : err);
    }
  }

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ ok: true, dryRun: false, eligible: profiles ? profiles.length : 0, sent: sent, marked: marked, errors: errors }),
  };
};
