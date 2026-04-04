// netlify/functions/afrowork-api-keygen.js
// Generates a new Payroll API key (email-gated, free tier)
// POST { email, label? }  →  { apiKey, plan, callsLimit, message }

'use strict';

const { createHash, randomBytes } = require('crypto');
const { getStore } = require('@netlify/blobs');

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

function generateKey() {
  return 'afro_' + randomBytes(24).toString('hex');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  var body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

  var email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return json(400, { error: 'Valid email required' });

  var label = (body.label || 'My API Key').slice(0, 64);

  try {
    var store = getStore('payroll-api-keys');

    // Check if this email already has a key (index by email)
    var emailIndex = await store.get('email:' + email, { type: 'json' });
    if (emailIndex && emailIndex.keyHash) {
      var existing = await store.get(emailIndex.keyHash, { type: 'json' });
      if (existing && existing.active) {
        return json(200, {
          message: 'A key already exists for this email. Check your records or contact api@afrotools.com to rotate.',
          plan: existing.plan,
          callsLimit: existing.callsLimit,
          prefix: existing.prefix,
        });
      }
    }

    // Generate new key
    var rawKey = generateKey();
    var hash = hashKey(rawKey);
    var prefix = rawKey.slice(0, 12) + '…';

    var keyData = {
      email,
      label,
      prefix,
      plan: 'free',
      callsLimit: 100,
      callsThisMonth: 0,
      usageMonth: new Date().toISOString().slice(0, 7),
      active: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    await store.set(hash, JSON.stringify(keyData));
    // Email index (so we can look up by email later)
    await store.set('email:' + email, JSON.stringify({ keyHash: hash, prefix, createdAt: keyData.createdAt }));

    return json(200, {
      apiKey: rawKey,
      plan: 'free',
      callsLimit: 100,
      message: 'Your API key has been generated. Store it securely — it will not be shown again.',
    });

  } catch (err) {
    console.error('[afrowork-api-keygen] Error:', err.message);
    return json(500, { error: 'Could not generate key. Please try again.' });
  }
};
