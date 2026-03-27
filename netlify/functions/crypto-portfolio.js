/**
 * AfroTools — Crypto Portfolio Cloud Sync API
 *
 * GET  /api/crypto-portfolio           — fetch user's portfolio
 * POST /api/crypto-portfolio           — upsert holdings
 * POST /api/crypto-portfolio (action=snapshot) — save daily snapshot
 * GET  /api/crypto-portfolio?snapshots=true    — fetch recent snapshots
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
if (!SUPABASE_ANON_KEY) console.warn('[crypto-portfolio] Missing SUPABASE_ANON_KEY_AUTH env var');
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

function getServiceHeaders() {
  const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return null;
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);
  if (!user) return jsonResponse(401, { error: 'Unauthorized' });

  const headers = getServiceHeaders();
  if (!headers) return jsonResponse(500, { error: 'Server config error' });

  const params = event.queryStringParameters || {};

  // ── GET: Fetch portfolio or snapshots ──
  if (event.httpMethod === 'GET') {
    if (params.snapshots === 'true') {
      const limit = Math.min(parseInt(params.limit) || 30, 90);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/crypto_portfolio_snapshots?user_id=eq.${user.id}&order=snapshot_date.desc&limit=${limit}`,
        { headers }
      );
      const data = await res.json();
      return jsonResponse(200, { snapshots: Array.isArray(data) ? data : [] });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crypto_portfolios?user_id=eq.${user.id}&limit=1`,
      { headers }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return jsonResponse(200, { holdings: [], updated_at: null });
    }
    return jsonResponse(200, {
      holdings: data[0].holdings || [],
      updated_at: data[0].updated_at,
    });
  }

  // ── POST: Upsert portfolio or save snapshot ──
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    // Snapshot action
    if (body.action === 'snapshot') {
      const insert = {
        user_id: user.id,
        total_value_usd: parseFloat(body.totalValueUsd) || 0,
        holdings_summary: body.holdingsSummary || [],
        snapshot_date: new Date().toISOString().slice(0, 10),
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/crypto_portfolio_snapshots`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify(insert),
      });

      return jsonResponse(res.ok || res.status === 201 ? 200 : 500, {
        success: res.ok || res.status === 201,
      });
    }

    // Upsert holdings
    if (!body.holdings || !Array.isArray(body.holdings)) {
      return jsonResponse(400, { error: 'holdings array required' });
    }

    // Validate and sanitize holdings (max 50)
    const holdings = body.holdings.slice(0, 50).map(h => ({
      id: String(h.id || '').slice(0, 100),
      symbol: String(h.symbol || '').slice(0, 20),
      name: String(h.name || '').slice(0, 100),
      thumb: String(h.thumb || '').slice(0, 500),
      qty: parseFloat(h.qty) || 0,
      buyPrice: h.buyPrice != null ? parseFloat(h.buyPrice) : null,
      buyCurrency: h.buyCurrency ? String(h.buyCurrency).slice(0, 10) : null,
      buyDate: h.buyDate || null,
    }));

    const upsert = {
      user_id: user.id,
      holdings: JSON.stringify(holdings),
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/crypto_portfolios`, {
      method: 'POST',
      headers,
      body: JSON.stringify(upsert),
    });

    if (!res.ok && res.status !== 201) {
      const err = await res.text();
      console.error('[crypto-portfolio] Upsert failed:', err);
      return jsonResponse(500, { error: 'Failed to save portfolio' });
    }

    return jsonResponse(200, { success: true, holdings_count: holdings.length });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
