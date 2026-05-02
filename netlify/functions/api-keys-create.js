/**
 * Public API key creation — no auth required (email-gated)
 * POST /api/keys/create
 * Body: { email, name, useCase }
 * Returns: { apiKey, tier, message }
 */
var { getStore } = require('@netlify/blobs');
var { randomBytes } = require('crypto');
var { getAllowedOrigin } = require('./utils/cors');
var { checkRateLimit } = require('./_shared/rate-limit');

function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

var CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function parseBody(event) {
  var contentType = String((event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || '').toLowerCase();
  var raw = event.body || '';
  if (event.isBase64Encoded) {
    try { raw = Buffer.from(raw, 'base64').toString('utf8'); } catch (e) { raw = ''; }
  }
  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 || contentType.indexOf('multipart/form-data') !== -1) {
    var formBody = {};
    var params = new URLSearchParams(raw);
    params.forEach(function(value, key) { formBody[key] = value; });
    return formBody;
  }
  return JSON.parse(raw || '{}');
}

function clientIp(event) {
  var headers = event.headers || {};
  return String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
}

exports.handler = async function(event) {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!checkRateLimit('api-keys-create:' + clientIp(event), 12)) {
    return json(429, { error: 'Too many API key requests. Please try again later.' });
  }

  var body;
  try { body = parseBody(event); } catch(e) { return json(400, { error: 'Invalid request body' }); }

  var email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(400, { error: 'Valid email address is required.' });
  }

  // Rate limit: max 3 keys per email (check existing keys)
  var store = getStore('apikeys');
  var existingCount = 0;
  try {
    var listing = await store.list();
    for (var entry of listing.blobs) {
      if (!entry.key.startsWith('afro_live_')) continue;
      try {
        var kd = await store.get(entry.key, { type: 'json' });
        if (kd && kd.email === email) existingCount++;
        if (existingCount >= 3) break;
      } catch(e) { /* skip */ }
    }
  } catch(e) { /* store may be empty */ }

  if (existingCount >= 3) {
    return json(429, { error: 'Maximum 3 API keys per email. Manage keys from your dashboard.' });
  }

  // Generate key
  var apiKey = 'afro_live_' + randomBytes(16).toString('hex');
  var keyData = {
    email: email,
    name: (body.name || '').trim().slice(0, 100) || 'API User',
    useCase: (body.useCase || body.use_case || 'other').slice(0, 50),
    tier: 'free',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usage: {}
  };

  try {
    await store.setJSON(apiKey, keyData);
  } catch(e) {
    console.error('[api-keys-create] Store error:', e.message);
    return json(500, { error: 'Failed to create key. Try again.' });
  }

  // Also track in email_leads if the capture-lead function exists
  try {
    var SUPABASE_URL = cleanEnvValue(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL) || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
    var SUPABASE_KEY = cleanEnvValue(
      process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY
    );
    if (SUPABASE_KEY) {
      await fetch(SUPABASE_URL + '/rest/v1/email_leads?on_conflict=email', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=merge-duplicates'
        },
        body: JSON.stringify({
          email: email,
          source: 'api_key_signup',
          tool_slug: 'api',
          opt_in_digest: true,
          name: keyData.name
        })
      });
    }
  } catch(e) { /* non-critical */ }

  return json(200, {
    ok: true,
    apiKey: apiKey,
    tier: 'free',
    rateLimit: 100,
    message: 'Store this key securely. It will not be shown again in full.'
  });
};
