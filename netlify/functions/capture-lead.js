// netlify/functions/capture-lead.js
// POST /api/capture-lead
// Accepts both legacy format (email+source) and enriched format with attribution data.
// Stores email leads in Supabase with full segmentation and attribution columns.

const { getAllowedOrigin } = require('./utils/cors');
const { checkRateLimit } = require('./_shared/rate-limit');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_LEADS_URL = MARKETING_SUPABASE.url;
const SUPABASE_LEADS_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_DEVICE_TYPES = ['mobile', 'tablet', 'desktop'];
const VALID_INDUSTRIES = [
  'Technology', 'Finance/Banking', 'Construction', 'Agriculture',
  'Healthcare', 'Education', 'Government', 'Retail/Trade',
  'Manufacturing', 'Energy/Mining', 'Legal', 'Other',
];
const VALID_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const VALID_COUNTRY_CODES = [
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG',
  'GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML',
  'MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD',
  'TZ','TG','TN','UG','ZM','ZW',
];

function cleanStr(val, maxLen) {
  if (maxLen === undefined) maxLen = 255;
  if (val == null) return null;
  const s = String(val).trim().slice(0, maxLen);
  return s || null;
}

function cleanEnum(val, allowed) {
  if (val == null) return null;
  const s = String(val).trim();
  return allowed.includes(s) ? s : null;
}

function cleanUrl(val) {
  if (val == null) return null;
  const s = String(val).trim().slice(0, 2000);
  if (!s) return null;
  try { new URL(s); return s; } catch (e) { return null; }
}

function cleanNumeric(val) {
  if (val == null) return null;
  const n = Number(val);
  return isFinite(n) && n >= 0 ? n : null;
}

function clientIp(event) {
  const headers = event.headers || {};
  return String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
}

async function sbRequest(path, options) {
  options = options || {};
  return fetch(`${SUPABASE_LEADS_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: Object.assign({
      apikey: SUPABASE_LEADS_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_LEADS_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    }, options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    if (!checkRateLimit('capture-lead:' + clientIp(event), 60)) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false, rateLimited: true }) };
    }

    if (!SUPABASE_LEADS_SERVICE_KEY) {
      console.warn('No Supabase marketing service key, skipping lead storage');
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
    }

    const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution : {};
    const device = body.device && typeof body.device === 'object' ? body.device : {};
    const record = {
      email: email,
      source: cleanStr(body.source, 50) || 'pdf-gate',
      tool_slug: cleanStr(body.toolSlug || body.tool_slug, 100),
      opt_in_digest: body.optInDigest !== false && body.opt_in_digest !== false,

      country_code: cleanEnum(body.countryCode || body.country_code, VALID_COUNTRY_CODES),
      currency: cleanStr(body.currency, 3),

      referrer_url: cleanUrl(body.referrerUrl || body.referrer_url || attribution.referrerUrl),
      utm_source: cleanStr(body.utmSource || body.utm_source, 100),
      utm_medium: cleanStr(body.utmMedium || body.utm_medium, 100),
      utm_campaign: cleanStr(body.utmCampaign || body.utm_campaign, 200),
      utm_content: cleanStr(body.utmContent || body.utm_content, 200),
      page_url: cleanUrl(body.pageUrl || body.page_url || attribution.pageUrl),

      device_type: cleanEnum(body.deviceType || body.device_type || device.type, VALID_DEVICE_TYPES),

      name: cleanStr(body.name, 150),
      company: cleanStr(body.company, 200),
      role: cleanStr(body.role, 150),
      industry: cleanEnum(body.industry, VALID_INDUSTRIES),
      company_size: cleanEnum(body.companySize || body.company_size, VALID_COMPANY_SIZES),

      conversion_value: cleanNumeric(body.conversionValue || body.conversion_value),
      updated_at: new Date().toISOString(),
    };

    const cleanRecord = {};
    Object.keys(record).forEach(function (key) {
      if (record[key] != null) cleanRecord[key] = record[key];
    });

    let existingLead = null;
    try {
      const lookup = await sbRequest('email_leads?email=eq.' + encodeURIComponent(email) + '&select=id,email_unsubscribe_token,first_email_sent_at,opt_in_digest&limit=1');
      if (lookup.ok) {
        const rows = await lookup.json();
        existingLead = rows && rows[0] ? rows[0] : null;
      }
    } catch (lookupErr) {
      console.warn('Lead lookup failed:', lookupErr && lookupErr.message ? lookupErr.message : lookupErr);
    }

    const res = await sbRequest('email_leads?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: cleanRecord,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase lead capture error:', res.status, errText);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
    }

    const savedRows = await res.json().catch(function () { return []; });
    const savedLead = savedRows && savedRows[0] ? savedRows[0] : existingLead;
    const shouldSendWelcome = cleanRecord.opt_in_digest !== false && !(existingLead && existingLead.first_email_sent_at);
    let emailSent = false;

    if (shouldSendWelcome) {
      const token = savedLead && savedLead.email_unsubscribe_token ? savedLead.email_unsubscribe_token : '';
      const unsubscribeUrl = token ? 'https://afrotools.com/api/email/unsubscribe?lead_token=' + encodeURIComponent(token) : '';
      const emailResult = await sendLifecycleEmail('pdf_lead_welcome', {
        email: email,
        name: cleanRecord.name || '',
        toolSlug: cleanRecord.tool_slug || '',
        unsubscribeUrl: unsubscribeUrl,
      });
      emailSent = !!emailResult.ok;

      await sbRequest('email_leads?email=eq.' + encodeURIComponent(email), {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: {
          first_email_sent_at: emailResult.ok ? new Date().toISOString() : null,
          last_email_sent_at: emailResult.ok ? new Date().toISOString() : null,
          email_status: emailResult.ok ? 'welcome_sent' : emailResult.providerStatus || 'email_not_sent',
          email_error: emailResult.ok ? null : String(emailResult.error || '').slice(0, 500),
        },
      }).catch(function (updateErr) {
        console.warn('Lead email status update failed:', updateErr && updateErr.message ? updateErr.message : updateErr);
      });
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: true, emailSent: emailSent }) };
  } catch (err) {
    console.error('capture-lead error:', err);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, stored: false }) };
  }
};
