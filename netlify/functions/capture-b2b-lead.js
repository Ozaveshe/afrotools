const crypto = require('crypto');
const { getAllowedOrigin } = require('./utils/cors');
const { checkRateLimit } = require('./_shared/rate-limit');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');

const SUPABASE = getMarketingSupabaseConfig();
const B2B_TABLE = 'data_buyer_leads';

const OFFER_LABELS = {
  widget_demo: 'Widget demo request',
  widget_pro: 'Widget Pro enquiry',
  sponsored_tool: 'Sponsored tool enquiry',
  custom_calculator: 'Custom calculator request',
  api_pilot: 'API pilot request',
  media_kit: 'Media kit request',
  white_label: 'White-label request',
  business_subscription: 'Business subscription enquiry',
  other: 'Other B2B enquiry'
};

const OFFER_ALIASES = {
  'widget-demo': 'widget_demo',
  'demo-widget': 'widget_demo',
  widget: 'widget_demo',
  widgets: 'widget_demo',
  'widget-pro': 'widget_pro',
  'sponsored-tool': 'sponsored_tool',
  'sponsored-tools': 'sponsored_tool',
  sponsorship: 'sponsored_tool',
  'custom-calculator': 'custom_calculator',
  'custom-calculators': 'custom_calculator',
  calculator: 'custom_calculator',
  'api-growth-pilot': 'api_pilot',
  'api-pro-pilot': 'api_pilot',
  'api-pilot': 'api_pilot',
  api: 'api_pilot',
  'media-kit': 'media_kit',
  media: 'media_kit',
  'white-label': 'white_label',
  whitelabel: 'white_label',
  'business-subscription': 'business_subscription'
};

const PROSPECT_LABELS = {
  accounting_firm: 'Accounting firm',
  hr_payroll: 'HR or payroll company',
  fintech: 'Fintech',
  school_edtech: 'School or edtech',
  business_media: 'Business media or publisher',
  immigration: 'Immigration or relocation advisor',
  association_blog: 'Association, community, or blog',
  developer_api: 'Developer or API buyer',
  other: 'Other business buyer'
};

const PROSPECT_ALIASES = {
  accounting: 'accounting_firm',
  accountant: 'accounting_firm',
  'accounting-firm': 'accounting_firm',
  'hr-payroll': 'hr_payroll',
  payroll: 'hr_payroll',
  hr: 'hr_payroll',
  fintech: 'fintech',
  school: 'school_edtech',
  schools: 'school_edtech',
  edtech: 'school_edtech',
  'school-edtech': 'school_edtech',
  media: 'business_media',
  publisher: 'business_media',
  'business-media': 'business_media',
  immigration: 'immigration',
  relocation: 'immigration',
  blog: 'association_blog',
  blogger: 'association_blog',
  association: 'association_blog',
  community: 'association_blog',
  'developer-api': 'developer_api',
  developer: 'developer_api',
  api: 'developer_api'
};

function headers(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, responseHeaders) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

function cleanField(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.slice(0, maxLength || 255);
}

function cleanLongText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\r\n/g, '\n');
  if (!text) return null;
  return text.slice(0, maxLength || 3000);
}

function cleanEmail(value) {
  const email = cleanField(value, 254);
  if (!email) return null;
  const normalized = email.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized) ? normalized : null;
}

function cleanUrl(value) {
  const raw = cleanField(value, 2000);
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

function cleanPath(value) {
  const raw = cleanField(value, 500);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search.slice(0, 180);
    } catch (error) {
      return null;
    }
  }
  return raw.replace(/[^\w\-./?=&%:]/g, '').slice(0, 500);
}

function normalizeChoice(value, aliases, labels, fallback) {
  const raw = cleanField(value, 80);
  if (!raw) return fallback;
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const mapped = aliases[key] || raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return labels[mapped] ? mapped : fallback;
}

function clientIp(event) {
  const eventHeaders = event.headers || {};
  return String(
    eventHeaders['x-nf-client-connection-ip'] ||
    eventHeaders['client-ip'] ||
    eventHeaders['x-forwarded-for'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
}

function hashIp(ip) {
  const salt = process.env.AUTH_SECRET || process.env.SITE_SECRET || process.env.NETLIFY_SITE_ID || 'afrotools-b2b-lead';
  return crypto.createHash('sha256').update(String(ip) + ':' + salt).digest('hex');
}

function parseBody(event) {
  if ((event.body || '').length > 12000) {
    return { error: 'Request is too large' };
  }
  const contentType = String((event.headers || {})['content-type'] || (event.headers || {})['Content-Type'] || '');
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(event.body || '');
    const body = {};
    params.forEach((value, key) => {
      body[key] = value;
    });
    return { body };
  }
  try {
    return { body: JSON.parse(event.body || '{}') };
  } catch (error) {
    return { error: 'Invalid JSON' };
  }
}

function normalizeLead(body, event) {
  if (cleanField(body.website_confirm || body.websiteConfirm, 20)) {
    return { bot: true };
  }

  const email = cleanEmail(body.email);
  const company = cleanField(body.company, 180);
  const name = cleanField(body.name, 150);
  const country = cleanField(body.country, 120);
  const website = cleanUrl(body.website);
  const prospectType = normalizeChoice(body.prospect_type || body.prospectType, PROSPECT_ALIASES, PROSPECT_LABELS, 'other');
  const requestedOffer = normalizeChoice(body.requested_offer || body.requestedOffer || body.offer, OFFER_ALIASES, OFFER_LABELS, 'other');
  const relevantTool = cleanField(body.relevant_tool || body.relevantTool || body.use_case || body.useCase, 220);
  const message = cleanLongText(body.message, 2500);
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on';

  const missing = [];
  if (!company) missing.push('company');
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!relevantTool) missing.push('relevant tool or use case');
  if (!message) missing.push('message');
  if (!consent) missing.push('consent');

  if (missing.length) {
    return { error: 'Missing required fields: ' + missing.join(', ') };
  }

  const sourcePath = cleanPath(body.source_path || body.sourcePath);
  const sourceRoute = cleanPath(body.source_route || body.sourceRoute || sourcePath);
  const ctaType = cleanField(body.cta_type || body.ctaType, 80);
  const prospectSegment = cleanField(body.prospect_segment || body.prospectSegment, 120);
  const pageUrl = cleanUrl(body.page_url || body.pageUrl);
  const referrerUrl = cleanUrl(body.referrer_url || body.referrerUrl);
  const userAgent = cleanField((event.headers || {})['user-agent'] || (event.headers || {})['User-Agent'], 500);
  const ipHash = hashIp(clientIp(event));
  const utm = {
    source: cleanField(body.utm_source || body.utmSource, 100),
    medium: cleanField(body.utm_medium || body.utmMedium, 100),
    campaign: cleanField(body.utm_campaign || body.utmCampaign, 200),
    content: cleanField(body.utm_content || body.utmContent, 200)
  };

  const useCaseLines = [
    'Requested offer: ' + OFFER_LABELS[requestedOffer],
    'Prospect type: ' + PROSPECT_LABELS[prospectType],
    website ? 'Website: ' + website : null,
    country ? 'Country: ' + country : null,
    'Relevant tool/use case: ' + relevantTool,
    sourceRoute ? 'Source route: ' + sourceRoute : null,
    ctaType ? 'CTA type: ' + ctaType : null,
    pageUrl || sourcePath ? 'Source page: ' + (pageUrl || sourcePath) : null,
    '',
    'Message:',
    message
  ].filter(function (line) { return line !== null; });

  const baseRecord = {
    submitted_by: null,
    company: company,
    contact_name: name,
    contact_email: email,
    contact_phone: null,
    use_case: useCaseLines.join('\n'),
    verticals: [prospectType],
    countries: country ? [country] : [],
    cities: [],
    cadence: null,
    delivery_format: requestedOffer,
    budget_band: null,
    consent: true,
    review_status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const enrichedRecord = Object.assign({}, baseRecord, {
    website: website,
    country: country,
    prospect_type: prospectType,
    requested_offer: requestedOffer,
    relevant_tool: relevantTool,
    message: message,
    source_path: sourcePath,
    source_route: sourceRoute,
    cta_type: ctaType,
    prospect_segment: prospectSegment,
    page_url: pageUrl,
    referrer_url: referrerUrl,
    user_agent: userAgent,
    ip_hash: ipHash,
    metadata: {
      utm: utm,
      offer_label: OFFER_LABELS[requestedOffer],
      prospect_label: PROSPECT_LABELS[prospectType],
      source_route: sourceRoute,
      cta_type: ctaType,
      prospect_segment: prospectSegment
    }
  });

  Object.keys(enrichedRecord).forEach(function (key) {
    if (enrichedRecord[key] === null || enrichedRecord[key] === undefined) delete enrichedRecord[key];
  });

  return { baseRecord, enrichedRecord, requestedOffer };
}

async function insertLead(record) {
  const response = await fetch(SUPABASE.url + '/rest/v1/' + B2B_TABLE, {
    method: 'POST',
    headers: {
      apikey: SUPABASE.serviceKey,
      Authorization: 'Bearer ' + SUPABASE.serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(record)
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || 'Supabase insert failed');
    error.status = response.status;
    error.body = text;
    throw error;
  }
}

function canRetryWithBaseSchema(error) {
  const text = String(error && error.body || error && error.message || '').toLowerCase();
  return error && error.status === 400 && (
    text.includes('schema cache') ||
    text.includes('could not find') ||
    text.includes('column') ||
    text.includes('pgrst204')
  );
}

exports.handler = async function (event) {
  const responseHeaders = headers(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return reply(405, { error: 'Method not allowed' }, responseHeaders);
  }

  const ip = clientIp(event);
  if (!checkRateLimit('b2b-lead:' + ip, 20)) {
    return reply(429, { error: 'Too many enquiries from this connection. Please try again later.' }, responseHeaders);
  }

  if (!SUPABASE.serviceKey) {
    console.warn('B2B lead capture skipped: missing Supabase service key');
    return reply(503, { error: 'Lead capture is not configured yet. Please email hello@afrotools.com.' }, responseHeaders);
  }

  const parsed = parseBody(event);
  if (parsed.error) return reply(400, { error: parsed.error }, responseHeaders);

  const normalized = normalizeLead(parsed.body, event);
  if (normalized.bot) return reply(200, { success: true, stored: false }, responseHeaders);
  if (normalized.error) return reply(400, { error: normalized.error }, responseHeaders);

  try {
    await insertLead(normalized.enrichedRecord);
    return reply(201, {
      success: true,
      stored: true,
      enriched: true,
      offer: normalized.requestedOffer
    }, responseHeaders);
  } catch (error) {
    if (canRetryWithBaseSchema(error)) {
      try {
        await insertLead(normalized.baseRecord);
        return reply(201, {
          success: true,
          stored: true,
          enriched: false,
          offer: normalized.requestedOffer
        }, responseHeaders);
      } catch (retryError) {
        console.error('B2B lead base insert failed:', retryError);
      }
    } else {
      console.error('B2B lead insert failed:', error);
    }
    return reply(500, { error: 'Could not save enquiry. Please email hello@afrotools.com.' }, responseHeaders);
  }
};
