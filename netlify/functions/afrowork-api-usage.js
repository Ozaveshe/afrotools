// netlify/functions/afrowork-api-usage.js
// Returns usage stats for a given API key (no auth required — key IS the credential)
// POST { apiKey }  →  { callsThisMonth, callsLimit, plan, resetsOn, prefix }

'use strict';

const { createHash } = require('crypto');
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

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  var body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

  var rawKey = (body.apiKey || '').trim();
  if (!rawKey.startsWith('afro_')) return json(400, { error: 'Invalid API key format' });

  try {
    var store = getStore('payroll-api-keys');
    var hash = createHash('sha256').update(rawKey).digest('hex');
    var data = await store.get(hash, { type: 'json' });

    if (!data || !data.active) return json(404, { error: 'API key not found or revoked' });

    var now = new Date();
    var thisMonth = now.toISOString().slice(0, 7);
    var callsThisMonth = data.usageMonth === thisMonth ? (data.callsThisMonth || 0) : 0;

    // Calculate reset date (1st of next month)
    var resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var resetsOn = resetDate.toISOString().slice(0, 10);

    return json(200, {
      prefix: data.prefix,
      plan: data.plan || 'free',
      callsThisMonth,
      callsLimit: data.callsLimit || 100,
      callsRemaining: Math.max(0, (data.callsLimit || 100) - callsThisMonth),
      resetsOn,
      lastUsedAt: data.lastUsedAt,
      createdAt: data.createdAt,
    });

  } catch (err) {
    console.error('[afrowork-api-usage] Error:', err.message);
    return json(500, { error: 'Could not retrieve usage. Please try again.' });
  }
};
