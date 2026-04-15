/**
 * AfroTools — Alerts API
 *
 * GET  /api/alerts              — all active alerts
 * GET  /api/alerts?country=NG   — alerts for a specific country
 * POST /api/alerts              — create alert (admin only)
 * PUT  /api/alerts?id=UUID      — update alert (admin only)
 * DELETE /api/alerts?id=UUID    — deactivate alert (admin only)
 */

const SUPABASE_DATA_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const { getAllowedOrigin } = require('./utils/cors');
const SEVERITY_LEVELS = ['low', 'medium', 'high'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function getHeader(event, headerName) {
  const headers = event.headers || {};
  const expected = headerName.toLowerCase();

  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) return headers[key];
  }

  return '';
}

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}

function isAdmin(event) {
  const key = getHeader(event, 'x-admin-key');
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_KEY;
  return secret && key === secret;
}

function normalizeCountryCodes(countryCodes) {
  if (!Array.isArray(countryCodes) || countryCodes.length === 0) return ['ALL'];

  const seen = new Set();
  const normalized = [];

  countryCodes.forEach((code) => {
    const value = String(code || '').trim().toUpperCase();
    if (!value) return;
    if (value === 'ALL') {
      normalized.length = 0;
      normalized.push('ALL');
      seen.clear();
      seen.add('ALL');
      return;
    }
    if (seen.has('ALL') || seen.has(value)) return;
    seen.add(value);
    normalized.push(value);
  });

  return normalized.length ? normalized : ['ALL'];
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeAlertPayload(body, { partial = false } = {}) {
  const payload = {};
  const errors = [];
  const input = body && typeof body === 'object' ? body : {};

  const hasField = (field) => Object.prototype.hasOwnProperty.call(input, field);

  if (!partial || hasField('country_codes')) {
    payload.country_codes = normalizeCountryCodes(input.country_codes);
  }

  if (!partial || hasField('title')) {
    const title = String(input.title || '').trim();
    if (!title) errors.push('title');
    else payload.title = title;
  }

  if (!partial || hasField('description')) {
    const description = String(input.description || '').trim();
    if (!description) errors.push('description');
    else payload.description = description;
  }

  if (!partial || hasField('severity')) {
    const severity = String(input.severity || '').trim().toLowerCase();
    if (!SEVERITY_LEVELS.includes(severity)) errors.push('severity');
    else payload.severity = severity;
  }

  if (!partial || hasField('effective_date')) {
    const effectiveDate = String(input.effective_date || '').trim();
    if (!isIsoDate(effectiveDate)) errors.push('effective_date');
    else payload.effective_date = effectiveDate;
  }

  if (!partial || hasField('expires_at')) {
    if (input.expires_at == null || String(input.expires_at).trim() === '') {
      payload.expires_at = null;
    } else {
      const expiresAt = String(input.expires_at).trim();
      if (!isIsoDate(expiresAt)) errors.push('expires_at');
      else payload.expires_at = expiresAt;
    }
  }

  if (payload.effective_date && payload.expires_at && payload.expires_at < payload.effective_date) {
    errors.push('expires_at_before_effective_date');
  }

  return { payload, errors };
}

function getAlertStatus(alert, today) {
  if (!alert || alert.active === false) return 'inactive';
  if (alert.expires_at && alert.expires_at < today) return 'expired';
  return 'active';
}

function buildSummary(alerts) {
  const today = new Date().toISOString().split('T')[0];
  const summary = {
    total: alerts.length,
    active: 0,
    expired: 0,
    inactive: 0,
  };

  alerts.forEach((alert) => {
    summary[getAlertStatus(alert, today)] += 1;
  });

  return summary;
}

async function supaFetch(path, options = {}) {
  const key = getServiceKey();
  if (!key) throw new Error('Missing service key');
  const res = await fetch(`${SUPABASE_DATA_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: options.method === 'POST' ? 'return=representation' : 'return=representation',
      ...options.headers,
    },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; } catch { return { status: res.status, data: text }; }
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const params = event.queryStringParameters || {};

  // --- GET: public, cached ---
  if (event.httpMethod === 'GET') {
    const adminView = params.view === 'admin';
    if (adminView && !isAdmin(event)) {
      return jsonResponse(401, { error: 'Unauthorized. Provide x-admin-key header.' });
    }

    let query = adminView
      ? 'alerts?select=*&order=active.desc,effective_date.desc,updated_at.desc.nullslast'
      : 'alerts?select=*&active=eq.true&order=effective_date.desc';

    // Filter by country
    if (params.country) {
      const code = params.country.toUpperCase();
      query += `&or=(country_codes.cs.{${code}},country_codes.cs.{ALL})`;
    }

    if (!adminView) {
      const today = new Date().toISOString().split('T')[0];
      query += `&or=(expires_at.is.null,expires_at.gte.${today})`;
    }

    const result = await supaFetch(query);
    if (result.status >= 400) {
      return jsonResponse(503, { error: 'Alerts unavailable' });
    }
    const alerts = Array.isArray(result.data) ? result.data : [];
    return jsonResponse(200, {
      alerts,
      summary: buildSummary(alerts),
      timestamp: new Date().toISOString(),
    }, { 'Cache-Control': adminView ? 'private, no-store' : 'public, max-age=300' });
  }

  // --- Admin-only mutations ---
  if (!isAdmin(event)) {
    return jsonResponse(401, { error: 'Unauthorized. Provide x-admin-key header.' });
  }

  // --- POST: create alert ---
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    const { payload, errors } = sanitizeAlertPayload(body);
    if (errors.length > 0) {
      return jsonResponse(400, { error: 'Invalid alert payload', fields: errors });
    }

    const result = await supaFetch('alerts', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        active: true,
      }),
    });
    return jsonResponse(result.status < 300 ? 201 : result.status, result.data);
  }

  // --- PUT: update alert ---
  if (event.httpMethod === 'PUT') {
    if (!params.id) return jsonResponse(400, { error: 'Missing ?id= parameter' });
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }
    const { payload, errors } = sanitizeAlertPayload(body, { partial: true });
    if (errors.length > 0) {
      return jsonResponse(400, { error: 'Invalid alert payload', fields: errors });
    }
    if (Object.keys(payload).length === 0) {
      return jsonResponse(400, { error: 'No fields provided for update' });
    }
    payload.updated_at = new Date().toISOString();
    const result = await supaFetch(`alerts?id=eq.${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return jsonResponse(result.status < 300 ? 200 : result.status, result.data);
  }

  // --- DELETE: soft-delete ---
  if (event.httpMethod === 'DELETE') {
    if (!params.id) return jsonResponse(400, { error: 'Missing ?id= parameter' });
    const result = await supaFetch(`alerts?id=eq.${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }),
    });
    return jsonResponse(result.status < 300 ? 200 : result.status, { ok: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
