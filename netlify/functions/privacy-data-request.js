// netlify/functions/privacy-data-request.js
// Self-service Privacy / GDPR data-request (DSAR) endpoint.
//
//   POST /api/privacy-data-request      -> lodge a request (access/export/correction/
//                                          deletion/opt-out/restrict/object). Sends a
//                                          verification email; nothing is actioned yet.
//   GET  /api/privacy-data-request?verify=<token>
//                                       -> confirm ownership of the email. Marks the
//                                          request verified and notifies the privacy team.
//
// Security posture:
//   - CORS locked to AfroTools origins (utils/cors).
//   - Rate limited per IP (shared _shared/rate-limit).
//   - Honeypot field to drop dumb bots.
//   - Double opt-in: a request is only actioned after the requester clicks the
//     verification link sent to their own inbox, so nobody can lodge an erasure
//     request against someone else's email.
//   - Raw IP is never stored; only a salted SHA-256 hash for abuse triage.
//   - Writes use the service-role key and fail closed (generic ok) when absent.
//   - Responses are intentionally generic — we never confirm whether an email
//     exists in any dataset (no account enumeration).

const crypto = require('crypto');
const { getAllowedOrigin } = require('./utils/cors');
const { checkRateLimit } = require('./_shared/rate-limit');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { sendEmail, isEmailConfigured } = require('./_shared/email-adapter');

const SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = SUPABASE.url;
const SUPABASE_SERVICE_KEY = SUPABASE.serviceKey;

const SITE_ORIGIN = 'https://afrotools.com';
const PRIVACY_INBOX = (process.env.PRIVACY_NOTIFY_EMAIL || 'privacy@afrotools.com').trim();
const IP_SALT = (process.env.PRIVACY_REQUEST_SALT || 'afrotools-dsar-v1').trim();

const REQUEST_TYPES = {
  access: 'Access a copy of my data',
  export: 'Export my data (portability)',
  correction: 'Correct my data',
  deletion: 'Delete / erase my data',
  opt_out: 'Opt out of marketing email',
  restrict: 'Restrict processing',
  object: 'Object to processing',
  other: 'Other privacy request',
};

function baseHeaders(event, extra) {
  const h = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
  return Object.assign(h, extra || {});
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

function hashIp(ip) {
  return crypto.createHash('sha256').update(IP_SALT + ':' + ip).digest('hex').slice(0, 32);
}

function cleanStr(val, maxLen) {
  if (maxLen === undefined) maxLen = 500;
  if (val == null) return null;
  const s = String(val).trim().slice(0, maxLen);
  return s || null;
}

function cleanUrl(val) {
  const s = cleanStr(val, 2000);
  if (!s) return null;
  try { new URL(s); return s; } catch (e) { return null; }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

async function sbRequest(path, options) {
  options = options || {};
  return fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers: Object.assign({
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
    }, options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

function htmlPage(title, message) {
  return (
    '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + ' | AfroTools</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"DM Sans",system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F8FAFD;color:#1e293b;padding:24px}' +
    '.card{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.08)}' +
    'h1{font-size:1.5rem;margin:0 0 12px;font-weight:700}' +
    'p{font-size:1rem;color:#475569;line-height:1.6;margin:0 0 8px}' +
    'a{color:#0062CC;text-decoration:none}a:hover{text-decoration:underline}' +
    '</style></head>' +
    '<body><div class="card"><h1>' + escapeHtml(title) + '</h1><p>' + message + '</p></div></body></html>'
  );
}

// ── Verification (GET ?verify=token) ─────────────────────────────────────────
async function handleVerify(event, token) {
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' };

  if (!/^[a-f0-9]{32,80}$/i.test(token)) {
    return { statusCode: 400, headers: htmlHeaders, body: htmlPage('Invalid link', 'This verification link is invalid or has expired.') };
  }
  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: htmlHeaders, body: htmlPage('Temporarily unavailable', 'We could not verify your request right now. Please try again later or email <a href="mailto:' + PRIVACY_INBOX + '">' + PRIVACY_INBOX + '</a>.') };
  }

  const lookup = await sbRequest('privacy_requests?verification_token=eq.' + encodeURIComponent(token) + '&status=eq.pending_verification&select=id,email,request_type,details,created_at&limit=1');
  if (!lookup.ok) {
    return { statusCode: 500, headers: htmlHeaders, body: htmlPage('Temporarily unavailable', 'We could not verify your request right now. Please try again later.') };
  }
  const rows = await lookup.json().catch(function () { return []; });
  const row = rows && rows[0];
  if (!row) {
    return { statusCode: 404, headers: htmlHeaders, body: htmlPage('Link already used', 'This link is invalid, expired, or has already been confirmed. If you did not lodge a request, no action is needed.') };
  }

  await sbRequest('privacy_requests?id=eq.' + encodeURIComponent(row.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    // Clear the token on verify so the link is single-use.
    body: { status: 'verified', verified_at: new Date().toISOString(), verification_token: null },
  }).catch(function () {});

  // Notify the privacy team so a human can fulfil the request.
  const label = REQUEST_TYPES[row.request_type] || row.request_type;
  await sendEmail({
    to: PRIVACY_INBOX,
    subject: '[DSAR] Verified privacy request: ' + label,
    text:
      'A privacy data-request has been verified and is ready to action.\n\n' +
      'Request ID: ' + row.id + '\n' +
      'Type: ' + label + ' (' + row.request_type + ')\n' +
      'Email: ' + row.email + '\n' +
      'Lodged: ' + row.created_at + '\n' +
      'Details: ' + (row.details || '(none)') + '\n\n' +
      'Fulfil per docs/privacy-data-request-workflow.md.',
  }).catch(function () {});

  return {
    statusCode: 200,
    headers: htmlHeaders,
    body: htmlPage(
      'Request confirmed',
      'Thanks — your privacy request has been verified. Our team will action it and reply to <strong>' + escapeHtml(row.email) + '</strong>, usually within 30 days.<br><br>' +
      '<a href="' + SITE_ORIGIN + '/privacy/">Back to the Privacy Policy</a>'
    ),
  };
}

// ── Submission (POST) ────────────────────────────────────────────────────────
async function handleSubmit(event) {
  const headers = baseHeaders(event);
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: 'Invalid request' }) };
  }

  // Honeypot — real users never fill this.
  if (cleanStr(body.website, 200)) {
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: 'Please enter a valid email address.' }) };
  }

  const requestType = String(body.requestType || body.request_type || '').trim();
  if (!REQUEST_TYPES[requestType]) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: 'Please choose a valid request type.' }) };
  }

  const ip = clientIp(event);
  // Two-layer limit: per IP (abuse) and a tighter per-email cap folded into the same store.
  if (!checkRateLimit('privacy-dsar-ip:' + ip, 20) || !checkRateLimit('privacy-dsar-email:' + email, 5)) {
    return { statusCode: 429, headers: headers, body: JSON.stringify({ ok: false, error: 'Too many requests. Please try again later or email ' + PRIVACY_INBOX + '.' }) };
  }

  // Fail closed but do not leak configuration state to the client.
  if (!SUPABASE_SERVICE_KEY || !isEmailConfigured()) {
    console.warn('[privacy-data-request] Missing service key or email config; request not recorded');
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, verificationSent: false }) };
  }

  const token = crypto.randomBytes(24).toString('hex'); // 48 hex chars
  const record = {
    email: email,
    request_type: requestType,
    details: cleanStr(body.details, 2000),
    status: 'pending_verification',
    verification_token: token,
    country_code: cleanStr(body.countryCode || body.country_code, 2),
    source_url: cleanUrl(body.sourceUrl || body.source_url),
    ip_hash: hashIp(ip),
  };

  const res = await sbRequest('privacy_requests', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: record,
  });
  if (!res.ok) {
    const errText = await res.text().catch(function () { return ''; });
    console.error('[privacy-data-request] insert failed:', res.status, errText);
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, verificationSent: false }) };
  }

  const verifyUrl = SITE_ORIGIN + '/api/privacy-data-request?verify=' + token;
  const label = REQUEST_TYPES[requestType];
  const emailResult = await sendEmail({
    to: email,
    subject: 'Confirm your AfroTools privacy request',
    text:
      'We received a privacy request (' + label + ') for this email address on AfroTools.\n\n' +
      'To protect your data, we only action requests after you confirm you own this inbox.\n' +
      'Confirm here: ' + verifyUrl + '\n\n' +
      'If you did not make this request, you can safely ignore this email — nothing will happen.\n\n' +
      '— AfroTools Privacy Team (' + PRIVACY_INBOX + ')',
    html:
      '<div style="font-family:-apple-system,BlinkMacSystemFont,\'DM Sans\',sans-serif;max-width:480px;margin:0 auto;color:#1e293b">' +
      '<h2 style="font-size:1.2rem">Confirm your privacy request</h2>' +
      '<p style="color:#475569;line-height:1.6">We received a request (<strong>' + escapeHtml(label) + '</strong>) for this email address on AfroTools. ' +
      'To protect your data, we only action requests after you confirm you own this inbox.</p>' +
      '<p><a href="' + verifyUrl + '" style="display:inline-block;background:#0062CC;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Confirm my request</a></p>' +
      '<p style="color:#94a3b8;font-size:0.85rem;line-height:1.6">If you did not make this request, ignore this email — nothing will happen. ' +
      'Questions? Email <a href="mailto:' + PRIVACY_INBOX + '" style="color:#0062CC">' + PRIVACY_INBOX + '</a>.</p>' +
      '</div>',
  });

  return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, verificationSent: !!emailResult.ok }) };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: baseHeaders(event), body: '' };
  }

  const verifyToken = event.queryStringParameters && event.queryStringParameters.verify;
  if (event.httpMethod === 'GET' && verifyToken) {
    try {
      return await handleVerify(event, String(verifyToken));
    } catch (err) {
      console.error('[privacy-data-request] verify error:', err);
      return { statusCode: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: htmlPage('Temporarily unavailable', 'Please try again later.') };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: baseHeaders(event), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  try {
    return await handleSubmit(event);
  } catch (err) {
    console.error('[privacy-data-request] submit error:', err);
    return { statusCode: 200, headers: baseHeaders(event), body: JSON.stringify({ ok: true, verificationSent: false }) };
  }
};
