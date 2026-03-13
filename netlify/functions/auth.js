/**
 * AFROTOOLS SERVER AUTH — Netlify Function
 * Handles: signup, login, verify, profile
 * Storage: Netlify Blobs
 * Hashing: PBKDF2 via Node.js crypto
 * Session: HMAC-signed tokens
 */
import { getStore } from "@netlify/blobs";
import { createHmac, randomBytes, pbkdf2 } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

/* ── Password hashing ── */
async function hashPassword(password, salt) {
  const derived = await pbkdf2Async(password, salt, 100000, 32, 'sha256');
  return derived.toString('hex');
}

/* ── Session tokens ── */
function createToken(userId, email, secret) {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }); // 30 day expiry
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', secret).update(b64).digest('base64url');
  return b64 + '.' + sig;
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

/* ── Handler ── */
export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const secret = process.env.AUTH_SECRET;
  if (!secret) return json(200, { ok: false, error: 'Auth not configured' });

  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const store = getStore('users');
  const { action } = body;

  /* ── SIGNUP ── */
  if (action === 'signup') {
    const { email, name, password, country } = body;
    if (!email || !password || password.length < 4) {
      return json(200, { ok: false, error: 'Email and password (min 4 chars) required' });
    }
    const emailKey = email.trim().toLowerCase();

    // Check if user exists
    const existing = await store.get(emailKey, { type: 'json' });
    if (existing) {
      return json(200, { ok: false, error: 'An account with this email already exists. Try logging in.' });
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(password, salt);
    const userId = 'u_' + Date.now().toString(36) + '_' + randomBytes(3).toString('hex');

    const user = {
      id: userId,
      email: emailKey,
      name: (name || '').trim() || emailKey.split('@')[0],
      passwordHash,
      salt,
      country: country || '',
      tier: 'free',
      createdAt: new Date().toISOString()
    };

    await store.setJSON(emailKey, user);
    const token = createToken(userId, emailKey, secret);

    return json(200, {
      ok: true,
      user: { id: userId, name: user.name, email: emailKey, country: user.country, tier: 'free', createdAt: user.createdAt },
      token
    });
  }

  /* ── LOGIN ── */
  if (action === 'login') {
    const { email, password } = body;
    if (!email || !password) return json(200, { ok: false, error: 'Email and password required' });

    const emailKey = email.trim().toLowerCase();
    const user = await store.get(emailKey, { type: 'json' });
    if (!user) return json(200, { ok: false, error: 'No account found. Please sign up first.' });

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return json(200, { ok: false, error: 'Incorrect password.' });

    const token = createToken(user.id, emailKey, secret);

    return json(200, {
      ok: true,
      user: { id: user.id, name: user.name, email: emailKey, country: user.country, tier: user.tier || 'free', createdAt: user.createdAt },
      token
    });
  }

  /* ── VERIFY ── */
  if (action === 'verify') {
    const token = body.token || (event.headers.authorization || '').replace('Bearer ', '');
    const payload = verifyToken(token, secret);
    if (!payload) return json(200, { ok: false, error: 'Invalid or expired session' });

    const user = await store.get(payload.email, { type: 'json' });
    if (!user) return json(200, { ok: false, error: 'User not found' });

    return json(200, {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, country: user.country, tier: user.tier || 'free', createdAt: user.createdAt }
    });
  }

  /* ── PROFILE UPDATE ── */
  if (action === 'profile') {
    const token = body.token || (event.headers.authorization || '').replace('Bearer ', '');
    const payload = verifyToken(token, secret);
    if (!payload) return json(200, { ok: false, error: 'Not authenticated' });

    const user = await store.get(payload.email, { type: 'json' });
    if (!user) return json(200, { ok: false, error: 'User not found' });

    if (body.name) user.name = body.name;
    if (body.country) user.country = body.country;

    await store.setJSON(payload.email, user);

    return json(200, {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, country: user.country, tier: user.tier || 'free', createdAt: user.createdAt }
    });
  }

  return json(400, { error: 'Unknown action' });
}
