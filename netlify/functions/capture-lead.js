// netlify/functions/capture-lead.js
// POST /api/capture-lead
// Accepts both legacy format (email+source) and enriched format with attribution data.
// Stores email leads in Supabase with full segmentation + attribution columns.

const SUPABASE_DATA_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_DATA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Allowed values for constrained fields
const VALID_DEVICE_TYPES = ['mobile', 'tablet', 'desktop'];
const VALID_INDUSTRIES = [
  'Technology', 'Finance/Banking', 'Construction', 'Agriculture',
  'Healthcare', 'Education', 'Government', 'Retail/Trade',
  'Manufacturing', 'Energy/Mining', 'Legal', 'Other'
];
const VALID_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const VALID_COUNTRY_CODES = [
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG',
  'GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML',
  'MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD',
  'TZ','TG','TN','UG','ZM','ZW'
];

/** Trim and cap string length. Returns null if empty after trim. */
function cleanStr(val, maxLen = 255) {
  if (val == null) return null;
  const s = String(val).trim().slice(0, maxLen);
  return s || null;
}

/** Validate enum value against allowed list. Returns null if invalid. */
function cleanEnum(val, allowed) {
  if (val == null) return null;
  const s = String(val).trim();
  return allowed.includes(s) ? s : null;
}

/** Validate URL format loosely. Returns null if invalid. */
function cleanUrl(val) {
  if (val == null) return null;
  const s = String(val).trim().slice(0, 2000);
  if (!s) return null;
  try { new URL(s); return s; } catch(e) { return null; }
}

/** Validate numeric value. Returns null if invalid. */
function cleanNumeric(val) {
  if (val == null) return null;
  const n = Number(val);
  return isFinite(n) && n >= 0 ? n : null;
}

exports.handler = async (event) => {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    if (!SUPABASE_DATA_KEY) {
      console.warn('No SUPABASE_SERVICE_KEY — skipping lead storage');
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
    }

    // Build enriched record — all new fields are optional and validated
    const record = {
      email: email.toLowerCase().trim(),
      source: cleanStr(body.source, 50) || 'pdf-gate',
      tool_slug: cleanStr(body.toolSlug, 100),
      opt_in_digest: body.optInDigest !== false,

      // Context
      country_code: cleanEnum(body.countryCode, VALID_COUNTRY_CODES),
      currency: cleanStr(body.currency, 3),

      // Attribution
      referrer_url: cleanUrl(body.referrerUrl),
      utm_source: cleanStr(body.utmSource, 100),
      utm_medium: cleanStr(body.utmMedium, 100),
      utm_campaign: cleanStr(body.utmCampaign, 200),
      utm_content: cleanStr(body.utmContent, 200),
      page_url: cleanUrl(body.pageUrl),

      // Device
      device_type: cleanEnum(body.deviceType, VALID_DEVICE_TYPES),

      // User profile (optional)
      name: cleanStr(body.name, 150),
      company: cleanStr(body.company, 200),
      role: cleanStr(body.role, 150),
      industry: cleanEnum(body.industry, VALID_INDUSTRIES),
      company_size: cleanEnum(body.companySize, VALID_COMPANY_SIZES),

      // Lead scoring
      conversion_value: cleanNumeric(body.conversionValue)
    };

    // Strip null values to keep payload clean
    const cleanRecord = {};
    for (const [key, val] of Object.entries(record)) {
      if (val != null) cleanRecord[key] = val;
    }

    // Upsert into email_leads — on conflict update enriched fields
    const res = await fetch(`${SUPABASE_DATA_URL}/rest/v1/email_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_DATA_KEY,
        'Authorization': `Bearer ${SUPABASE_DATA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(cleanRecord)
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
