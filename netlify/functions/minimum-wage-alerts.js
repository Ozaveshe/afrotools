// netlify/functions/minimum-wage-alerts.js
// POST /api/minimum-wage-alerts
// Handles:
//   - type: 'alert'     → email subscription for country wage changes
//   - type: 'violation' → anonymous violation report
const { getAllowedOrigin } = require('./utils/cors');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

const VALID_COUNTRY_CODES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ',
  'EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG',
  'MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO',
  'ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'
]);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) }; }

  const type    = body.type || 'alert';
  const country = (body.country_code || '').toUpperCase().trim();

  if (!VALID_COUNTRY_CODES.has(country)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid country code' }) };
  }

  // ── Alert subscription ──────────────────────────────────────────────────
  if (type === 'alert') {
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || email.length > 254) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid email address' }) };
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/mw_alert_subscriptions`, {
      method: 'POST',
      headers: {
        apikey:        SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify({ country_code: country, email }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('mw-alerts insert error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Subscription failed' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // ── Violation report ────────────────────────────────────────────────────
  if (type === 'violation') {
    const sector = (body.sector || '').trim().substring(0, 100);
    const city   = (body.city   || '').trim().substring(0, 100);
    const salary = parseFloat(body.salary);

    if (!sector || isNaN(salary) || salary < 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing required fields: sector, salary' }) };
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/mw_crowdsource_reports`, {
      method: 'POST',
      headers: {
        apikey:        SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify({ country_code: country, sector, city: city || null, reported_salary: salary }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('mw-violation insert error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Report submission failed' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Unknown request type' }) };
};
