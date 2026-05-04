const { corsHeaders, corsResponse } = require('./utils/cors');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');
const { checkRateLimit } = require('./_shared/rate-limit');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function clientIp(event) {
  var headers = event.headers || {};
  return String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
}

function getHeader(headers, name) {
  headers = headers || {};
  var wanted = String(name || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) return headers[keys[i]];
  }
  return '';
}

function isAuthorized(event) {
  var token = process.env.LIFECYCLE_EMAIL_TOKEN || process.env.EMAIL_ADMIN_TOKEN || '';
  if (!token) return false;
  return String(getHeader(event.headers, 'authorization') || '') === 'Bearer ' + token;
}

async function sbRequest(path, options) {
  options = options || {};
  return fetch(MARKETING_SUPABASE.url + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers: Object.assign({
      apikey: MARKETING_SUPABASE.serviceKey,
      Authorization: 'Bearer ' + MARKETING_SUPABASE.serviceKey,
      'Content-Type': 'application/json',
    }, options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function loadRecipient(kind, email, body) {
  if (!MARKETING_SUPABASE.serviceKey) {
    return { skip: true, providerStatus: 'supabase_missing' };
  }

  if (kind === 'pdf_lead_welcome') {
    var leadRes = await sbRequest(
      'email_leads?email=eq.' + encodeURIComponent(email) +
      '&select=id,email,name,tool_slug,opt_in_digest,first_email_sent_at,email_unsubscribe_token&limit=1'
    );
    if (!leadRes.ok) return { skip: true, providerStatus: 'lead_lookup_failed' };
    var leads = await leadRes.json();
    var lead = leads && leads[0];
    if (!lead || lead.opt_in_digest === false || lead.first_email_sent_at) {
      return { skip: true, providerStatus: 'lead_not_eligible' };
    }
    return {
      table: 'email_leads',
      id: lead.id,
      recipient: {
        email: email,
        name: lead.name || body.name || '',
        toolSlug: lead.tool_slug || body.toolSlug || body.tool_slug || '',
        unsubscribeUrl: lead.email_unsubscribe_token
          ? 'https://afrotools.com/api/email/unsubscribe?lead_token=' + encodeURIComponent(lead.email_unsubscribe_token)
          : '',
      },
    };
  }

  var profileRes = await sbRequest(
    'profiles?email=eq.' + encodeURIComponent(email) +
    '&select=id,email,name,email_digest_enabled,email_welcome_sent_at,email_unsubscribe_token&limit=1'
  );
  if (!profileRes.ok) return { skip: true, providerStatus: 'profile_lookup_failed' };
  var profiles = await profileRes.json();
  var profile = profiles && profiles[0];
  if (!profile || profile.email_digest_enabled === false || profile.email_welcome_sent_at) {
    return { skip: true, providerStatus: 'profile_not_eligible' };
  }
  return {
    table: 'profiles',
    id: profile.id,
    recipient: {
      email: email,
      name: profile.name || body.name || '',
      unsubscribeUrl: profile.email_unsubscribe_token
        ? 'https://afrotools.com/api/email/unsubscribe?token=' + encodeURIComponent(profile.email_unsubscribe_token)
        : '',
    },
  };
}

async function markSent(kind, loaded, result) {
  if (!result.ok || !loaded || !loaded.id) return;
  var now = new Date().toISOString();
  if (kind === 'pdf_lead_welcome') {
    await sbRequest('email_leads?id=eq.' + encodeURIComponent(loaded.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: {
        first_email_sent_at: now,
        last_email_sent_at: now,
        email_status: 'welcome_sent',
        email_error: null,
      },
    });
    return;
  }
  await sbRequest('profiles?id=eq.' + encodeURIComponent(loaded.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { email_welcome_sent_at: now },
  });
}

exports.handler = async function (event) {
  var headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return corsResponse(event);
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isAuthorized(event)) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    var body = JSON.parse(event.body || '{}');
    var kind = body.kind === 'pdf_lead_welcome'
      ? 'pdf_lead_welcome'
      : (body.kind === 'founding_user_welcome' ? 'founding_user_welcome' : 'signup_welcome');
    var email = String(body.email || '').trim().toLowerCase();

    if (!validEmail(email)) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    if (!checkRateLimit('lifecycle-email:ip:' + clientIp(event), 20) ||
        !checkRateLimit('lifecycle-email:email:' + email, 2)) {
      return { statusCode: 202, headers: headers, body: JSON.stringify({ ok: true, emailSent: false, providerStatus: 'rate_limited' }) };
    }

    var loaded = await loadRecipient(kind, email, body);
    if (loaded.skip) {
      return { statusCode: 202, headers: headers, body: JSON.stringify({ ok: true, emailSent: false, providerStatus: loaded.providerStatus }) };
    }

    var result = await sendLifecycleEmail(kind, loaded.recipient);
    await markSent(kind, loaded, result);

    return {
      statusCode: result.ok ? 200 : 202,
      headers: headers,
      body: JSON.stringify({ ok: true, emailSent: !!result.ok, provider: result.provider, providerStatus: result.providerStatus }),
    };
  } catch (err) {
    console.error('[send-lifecycle-email] error:', err && err.message ? err.message : err);
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, emailSent: false }) };
  }
};
