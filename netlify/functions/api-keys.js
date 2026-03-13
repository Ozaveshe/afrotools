import { getStore } from "@netlify/blobs";
import { createHmac, randomBytes } from "crypto";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  const expected = createHmac('sha256', secret).update(b64).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const secret = process.env.AUTH_SECRET;
  if (!secret) return json(200, { ok: false, error: 'Auth not configured' });

  // Require auth
  const token = (event.headers.authorization || '').replace('Bearer ', '');
  const payload = verifyToken(token, secret);
  if (!payload) return json(401, { error: 'Not authenticated. Log in first.' });

  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const store = getStore('apikeys');
  const { action } = body;

  if (action === 'create') {
    const key = 'afro_' + randomBytes(24).toString('hex');
    const keyData = {
      userId: payload.userId,
      email: payload.email,
      tier: 'free',
      createdAt: new Date().toISOString(),
      monthlyUsage: {}
    };
    await store.setJSON(key, keyData);
    return json(200, { ok: true, apiKey: key, tier: 'free' });
  }

  if (action === 'list') {
    // List keys is limited — just return a status
    return json(200, { ok: true, message: 'API key management available in dashboard.' });
  }

  if (action === 'revoke' && body.apiKey) {
    try { await store.delete(body.apiKey); } catch {}
    return json(200, { ok: true, message: 'API key revoked.' });
  }

  return json(400, { error: 'Unknown action' });
}
