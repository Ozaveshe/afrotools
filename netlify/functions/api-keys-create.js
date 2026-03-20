/**
 * Public API key creation — no auth required (email-gated)
 * POST /api/keys/create
 * Body: { email, name, useCase }
 * Returns: { apiKey, tier, message }
 */
var { getStore } = require('@netlify/blobs');
var { randomBytes } = require('crypto');

var CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  var body;
  try { body = JSON.parse(event.body); } catch(e) { return json(400, { error: 'Invalid JSON' }); }

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
    var SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
    var SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (SUPABASE_KEY) {
      await fetch(SUPABASE_URL + '/rest/v1/email_leads', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          email: email,
          source: 'api_key_signup',
          tool_slug: 'api',
          metadata: { name: keyData.name, useCase: keyData.useCase, apiKey: apiKey.slice(0, 18) + '...' }
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
