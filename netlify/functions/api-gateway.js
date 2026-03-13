import { getStore } from "@netlify/blobs";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const apiKey = event.headers['x-api-key'];
  if (!apiKey) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing x-api-key header. Get your key at afrotools.com/developers' }) };
  }

  // Validate API key
  let keyData;
  try {
    const store = getStore('apikeys');
    keyData = await store.get(apiKey, { type: 'json' });
  } catch {}

  if (!keyData) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Invalid API key. Get your key at afrotools.com/developers' }) };
  }

  // Check rate limit
  const month = new Date().toISOString().slice(0, 7); // "2026-03"
  const usage = keyData.monthlyUsage?.[month] || 0;
  const limits = { free: 100, pro: 10000, enterprise: 999999 };
  const limit = limits[keyData.tier] || 100;

  if (usage >= limit) {
    return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Monthly rate limit exceeded', usage, limit, tier: keyData.tier }) };
  }

  // Parse request
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { tool, inputs } = body;
  if (!tool) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing "tool" field' }) };

  // Increment usage
  try {
    const store = getStore('apikeys');
    if (!keyData.monthlyUsage) keyData.monthlyUsage = {};
    keyData.monthlyUsage[month] = usage + 1;
    await store.setJSON(apiKey, keyData);
  } catch {}

  // Beta response — actual calculation engine to be integrated
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      result: {
        status: 'beta',
        message: `API calculation for ${tool} is in beta. Full calculation engine coming soon. Your request was logged.`,
        tool,
        inputs
      },
      meta: {
        tool,
        version: '0.1.0-beta',
        timestamp: new Date().toISOString(),
        usage: { current: usage + 1, limit, tier: keyData.tier }
      }
    })
  };
}
