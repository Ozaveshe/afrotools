import { getStore } from "@netlify/blobs";
import { createHmac, randomBytes } from "crypto";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const LIMITS = {
  free: { day: 100, month: 3000 },
  starter: { day: 10000, month: 300000 },
  pro: { day: 100000, month: 3000000 },
  enterprise: { day: -1, month: -1 }
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

/**
 * Generate a live API key: afro_live_ + 32 hex chars (16 random bytes)
 */
function generateKey() {
  return 'afro_live_' + randomBytes(16).toString('hex');
}

/**
 * Mask a key for display: show prefix + first 8 hex chars, mask the rest.
 * e.g. afro_live_a1b2c3d4************************
 */
function maskKey(key) {
  if (!key || key.length < 18) return key;
  return key.slice(0, 18) + key.slice(18).replace(/./g, '\u2022');
}

/**
 * Summarise usage into today / this-month / all-time totals.
 */
function summariseUsage(usage) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  let allTime = 0;
  for (const [k, v] of Object.entries(usage)) {
    // Count daily buckets only (YYYY-MM-DD, length 10)
    if (k.length === 10 && typeof v === 'number') allTime += v;
  }

  return {
    today: usage[today] || 0,
    thisMonth: usage[month] || 0,
    allTime
  };
}

/**
 * List all keys belonging to a user by scanning the store.
 */
async function listUserKeys(store, userId) {
  const results = [];
  try {
    const { blobs } = await store.list();
    for (const entry of blobs) {
      const key = entry.key;
      if (!key.startsWith('afro_live_')) continue;
      try {
        const data = await store.get(key, { type: 'json' });
        if (data && data.userId === userId) {
          results.push({
            keyPrefix: maskKey(key),
            keyId: key.slice(0, 18),
            name: data.name || 'Unnamed key',
            tier: data.tier || 'free',
            createdAt: data.createdAt,
            lastUsed: data.lastUsed || null,
            usage: summariseUsage(data.usage || data.monthlyUsage || {})
          });
        }
      } catch { /* skip unreadable entries */ }
    }
  } catch (err) {
    console.error('listUserKeys error:', err.message);
  }
  return results;
}

/**
 * Find the full key string by its prefix (first 18 chars) for a given user.
 */
async function findKeyByPrefix(store, userId, keyPrefix) {
  try {
    const { blobs } = await store.list();
    for (const entry of blobs) {
      const key = entry.key;
      if (key.startsWith(keyPrefix)) {
        const data = await store.get(key, { type: 'json' });
        if (data && data.userId === userId) return { fullKey: key, data };
      }
    }
  } catch (err) {
    console.error('findKeyByPrefix error:', err.message);
  }
  return null;
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

  /* ----------------------------------------------------------------
     ACTION: create — generate a new API key
     ---------------------------------------------------------------- */
  if (action === 'create') {
    const key = generateKey();
    const keyData = {
      userId: payload.userId,
      email: payload.email,
      name: body.name || 'Unnamed key',
      tier: 'free',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usage: {}
    };
    await store.setJSON(key, keyData);
    return json(200, {
      ok: true,
      apiKey: key,
      name: keyData.name,
      tier: 'free',
      message: 'Store this key securely. It will not be shown again in full.'
    });
  }

  /* ----------------------------------------------------------------
     ACTION: list — return all keys for the authenticated user
     ---------------------------------------------------------------- */
  if (action === 'list') {
    const keys = await listUserKeys(store, payload.userId);
    return json(200, { ok: true, keys, total: keys.length });
  }

  /* ----------------------------------------------------------------
     ACTION: revoke — delete a key
     ---------------------------------------------------------------- */
  if (action === 'revoke') {
    const keyId = body.apiKey || body.keyId;
    if (!keyId) return json(400, { error: 'Provide apiKey or keyId to revoke.' });

    // Full key provided — verify ownership then delete
    if (keyId.startsWith('afro_live_') && keyId.length > 18) {
      try {
        const data = await store.get(keyId, { type: 'json' });
        if (!data || data.userId !== payload.userId) {
          return json(403, { error: 'Key not found or not owned by you.' });
        }
        await store.delete(keyId);
        return json(200, { ok: true, message: 'API key revoked successfully.' });
      } catch {
        return json(500, { error: 'Failed to revoke key.' });
      }
    }

    // Prefix provided — find the full key first
    const found = await findKeyByPrefix(store, payload.userId, keyId);
    if (!found) return json(404, { error: 'Key not found or not owned by you.' });

    try {
      await store.delete(found.fullKey);
      return json(200, { ok: true, message: 'API key revoked successfully.' });
    } catch {
      return json(500, { error: 'Failed to revoke key.' });
    }
  }

  /* ----------------------------------------------------------------
     ACTION: rename — rename a key
     ---------------------------------------------------------------- */
  if (action === 'rename') {
    const keyId = body.apiKey || body.keyId;
    const newName = body.name;
    if (!keyId) return json(400, { error: 'Provide apiKey or keyId to rename.' });
    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return json(400, { error: 'Provide a non-empty name.' });
    }

    let fullKey, data;

    if (keyId.startsWith('afro_live_') && keyId.length > 18) {
      fullKey = keyId;
      try { data = await store.get(fullKey, { type: 'json' }); } catch { data = null; }
    } else {
      const found = await findKeyByPrefix(store, payload.userId, keyId);
      if (found) { fullKey = found.fullKey; data = found.data; }
    }

    if (!data || data.userId !== payload.userId) {
      return json(404, { error: 'Key not found or not owned by you.' });
    }

    data.name = newName.trim().slice(0, 100);
    await store.setJSON(fullKey, data);
    return json(200, { ok: true, message: 'Key renamed successfully.', name: data.name });
  }

  /* ----------------------------------------------------------------
     ACTION: usage — detailed usage stats for a specific key
     ---------------------------------------------------------------- */
  if (action === 'usage') {
    const keyId = body.apiKey || body.keyId;
    if (!keyId) return json(400, { error: 'Provide apiKey or keyId.' });

    let data;

    if (keyId.startsWith('afro_live_') && keyId.length > 18) {
      try { data = await store.get(keyId, { type: 'json' }); } catch { data = null; }
    } else {
      const found = await findKeyByPrefix(store, payload.userId, keyId);
      if (found) data = found.data;
    }

    if (!data || data.userId !== payload.userId) {
      return json(404, { error: 'Key not found or not owned by you.' });
    }

    const usage = data.usage || data.monthlyUsage || {};
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);
    const tier = data.tier || 'free';
    const limits = LIMITS[tier];

    // Build daily breakdown for the current month
    const dailyBreakdown = {};
    for (const [k, v] of Object.entries(usage)) {
      if (k.length === 10 && k.startsWith(month) && typeof v === 'number') {
        dailyBreakdown[k] = v;
      }
    }

    // Build monthly breakdown
    const monthlyBreakdown = {};
    for (const [k, v] of Object.entries(usage)) {
      if (k.length === 7 && typeof v === 'number') {
        monthlyBreakdown[k] = v;
      }
    }

    return json(200, {
      ok: true,
      name: data.name || 'Unnamed key',
      tier,
      limits: {
        daily: limits.day === -1 ? 'unlimited' : limits.day,
        monthly: limits.month === -1 ? 'unlimited' : limits.month
      },
      today: {
        used: usage[today] || 0,
        remaining: limits.day === -1 ? 'unlimited' : Math.max(0, limits.day - (usage[today] || 0))
      },
      thisMonth: {
        used: usage[month] || 0,
        remaining: limits.month === -1 ? 'unlimited' : Math.max(0, limits.month - (usage[month] || 0))
      },
      dailyBreakdown,
      monthlyBreakdown,
      lastUsed: data.lastUsed || null,
      createdAt: data.createdAt
    });
  }

  return json(400, { error: 'Unknown action. Supported: create, list, revoke, rename, usage.' });
}
