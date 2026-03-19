// netlify/functions/capture-lead.js
// POST /api/capture-lead
// Body: { email, source: 'pdf-gate', toolSlug: 'ng-paye', optInDigest: true }
// Stores email leads in Supabase DATA instance

const SUPABASE_DATA_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_DATA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, source, toolSlug, optInDigest } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    if (!SUPABASE_DATA_KEY) {
      console.warn('No SUPABASE_SERVICE_KEY — skipping lead storage');
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
    }

    // Upsert into email_leads — on conflict update tool_slug
    const res = await fetch(`${SUPABASE_DATA_URL}/rest/v1/email_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_DATA_KEY,
        'Authorization': `Bearer ${SUPABASE_DATA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source: source || 'pdf-gate',
        tool_slug: toolSlug || null,
        opt_in_digest: optInDigest !== false
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase error:', res.status, errText);
      // Still return 200 — don't block the user's PDF download
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: true }) };
  } catch (err) {
    console.error('capture-lead error:', err);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
  }
};
