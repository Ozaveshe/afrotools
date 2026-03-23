/**
 * AfroTools — Crypto Scam Reports API
 *
 * GET  /api/crypto-scam?q=address_or_platform  — search verified reports (public)
 * GET  /api/crypto-scam?stats=true              — aggregate stats (public)
 * GET  /api/crypto-scam?recent=5                — latest verified reports (public)
 * POST /api/crypto-scam                         — submit new report (public, optional auth)
 * PATCH /api/crypto-scam?id=uuid                — admin: update status (requires admin role)
 */

const SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
    Prefer: 'return=representation',
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const headers = getServiceHeaders();
  if (!headers) return jsonResponse(500, { error: 'Server config error' });

  // ── GET: Search or stats ──
  if (event.httpMethod === 'GET') {
    // Stats
    if (params.stats === 'true') {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/crypto_scam_reports?status=eq.verified&select=id,scam_type,country,amount_lost,currency`,
        { headers }
      );
      const data = await res.json();
      if (!Array.isArray(data)) return jsonResponse(200, { total: 0, byCountry: {}, byType: {} });

      const byCountry = {};
      const byType = {};
      let totalLostNGN = 0;
      data.forEach(r => {
        byCountry[r.country] = (byCountry[r.country] || 0) + 1;
        byType[r.scam_type] = (byType[r.scam_type] || 0) + 1;
        // Rough NGN conversion for display
        const multiplier = { NGN: 1, USD: 1600, ZAR: 90, KES: 12, GHS: 110, EGP: 33 }[r.currency] || 1;
        totalLostNGN += (r.amount_lost || 0) * multiplier;
      });

      return jsonResponse(200, {
        total: data.length,
        totalLostNGN,
        byCountry,
        byType,
      });
    }

    // Recent reports
    if (params.recent) {
      const limit = Math.min(parseInt(params.recent) || 5, 20);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/crypto_scam_reports?status=eq.verified&order=reported_at.desc&limit=${limit}&select=id,address,platform,scam_type,amount_lost,currency,country,date_occurred,story,reported_at`,
        { headers }
      );
      const data = await res.json();
      return jsonResponse(200, { reports: Array.isArray(data) ? data : [] });
    }

    // Search
    const q = (params.q || '').trim();
    if (!q || q.length < 2) {
      return jsonResponse(400, { error: 'Query must be at least 2 characters' });
    }

    // Search by address (exact or partial) and platform name
    const encoded = encodeURIComponent(q);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crypto_scam_reports?status=eq.verified&or=(address.ilike.*${encoded}*,platform.ilike.*${encoded}*)&order=reported_at.desc&limit=20&select=id,address,platform,scam_type,amount_lost,currency,country,date_occurred,story,reported_at`,
      { headers }
    );
    const data = await res.json();
    return jsonResponse(200, {
      query: q,
      found: Array.isArray(data) ? data.length : 0,
      reports: Array.isArray(data) ? data : [],
    });
  }

  // ── POST: Submit new report ──
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    const { address, platform, scam_type, amount_lost, currency, country, date_occurred, story } = body;
    if (!platform || !scam_type) {
      return jsonResponse(400, { error: 'platform and scam_type are required' });
    }

    // Optional auth
    const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);

    const insert = {
      address: (address || '').trim().slice(0, 200),
      platform: platform.trim().slice(0, 200),
      scam_type: scam_type.trim().slice(0, 50),
      amount_lost: parseFloat(amount_lost) || 0,
      currency: (currency || 'NGN').toUpperCase().slice(0, 5),
      country: (country || 'NG').toUpperCase().slice(0, 5),
      date_occurred: date_occurred || null,
      story: (story || '').trim().slice(0, 2000),
      status: 'pending',
      reported_by: user ? user.id : null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/crypto_scam_reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(insert),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[crypto-scam] Insert failed:', err);
      return jsonResponse(500, { error: 'Failed to save report' });
    }

    return jsonResponse(201, { success: true, message: 'Report submitted for review' });
  }

  // ── PATCH: Admin update status ──
  if (event.httpMethod === 'PATCH') {
    const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);
    if (!user) return jsonResponse(401, { error: 'Unauthorized' });

    // Check admin role
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      { headers }
    );
    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || !profiles[0] || profiles[0].role !== 'admin') {
      return jsonResponse(403, { error: 'Admin access required' });
    }

    const id = params.id;
    if (!id) return jsonResponse(400, { error: 'id parameter required' });

    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    const update = {};
    if (body.status && ['pending', 'verified', 'rejected'].includes(body.status)) {
      update.status = body.status;
      if (body.status === 'verified') update.verified_at = new Date().toISOString();
    }
    if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes;

    if (Object.keys(update).length === 0) {
      return jsonResponse(400, { error: 'Nothing to update' });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crypto_scam_reports?id=eq.${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(update) }
    );

    if (!res.ok) return jsonResponse(500, { error: 'Update failed' });
    return jsonResponse(200, { success: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
