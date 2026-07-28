/**
 * Resend delivery webhook.
 *
 * Register this endpoint for email.bounced, email.complained, and
 * email.suppressed events:
 * https://afrotools.com/.netlify/functions/resend-webhook
 *
 * Permanent bounces, complaints, and provider suppressions disable marketing
 * email in both recipient stores. Transient bounces remain eligible so a
 * temporary mailbox or server failure does not silently unsubscribe someone.
 */
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

function header(event, name) {
  var headers = (event && event.headers) || {};
  var wanted = String(name || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) return String(headers[keys[i]] || '');
  }
  return '';
}

function verifyWebhook(event, secret, nowSeconds) {
  var messageId = header(event, 'svix-id');
  var timestamp = header(event, 'svix-timestamp');
  var signatureHeader = header(event, 'svix-signature');
  var timestampNumber = Number(timestamp);
  var current = Number(nowSeconds || Math.floor(Date.now() / 1000));

  if (!secret || !messageId || !timestamp || !signatureHeader || !Number.isFinite(timestampNumber)) {
    return false;
  }
  if (Math.abs(current - timestampNumber) > MAX_SIGNATURE_AGE_SECONDS) return false;

  var encodedSecret = String(secret).replace(/^whsec_/, '');
  var secretBytes;
  try {
    secretBytes = Buffer.from(encodedSecret, 'base64');
  } catch (e) {
    return false;
  }

  var signedContent = messageId + '.' + timestamp + '.' + String(event.body || '');
  var expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest();
  var candidates = signatureHeader.split(/\s+/);
  for (var i = 0; i < candidates.length; i++) {
    var parts = candidates[i].split(',');
    if (parts[0] !== 'v1' || !parts[1]) continue;
    var actual;
    try {
      actual = Buffer.from(parts[1], 'base64');
    } catch (e) {
      continue;
    }
    if (actual.length === expected.length && crypto.timingSafeEqual(actual, expected)) return true;
  }
  return false;
}

function suppressionReason(payload) {
  if (!payload || !payload.type) return '';
  if (payload.type === 'email.complained') return 'complained';
  if (payload.type === 'email.suppressed') return 'provider_suppressed';
  if (payload.type !== 'email.bounced') return '';
  var bounceType = String(payload.data && payload.data.bounce && payload.data.bounce.type || '').toLowerCase();
  return bounceType === 'permanent' ? 'permanent_bounce' : '';
}

function recipientEmails(payload) {
  var values = payload && payload.data && payload.data.to;
  if (!Array.isArray(values)) values = values ? [values] : [];
  return values
    .map(function (value) { return String(value || '').trim().toLowerCase(); })
    .filter(function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); });
}

exports.handler = async function (event) {
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET is not configured');
    return { statusCode: 503, body: 'Webhook not configured' };
  }
  if (!verifyWebhook(event, process.env.RESEND_WEBHOOK_SECRET)) {
    return { statusCode: 400, body: 'Invalid webhook signature' };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  var reason = suppressionReason(payload);
  if (!reason) return { statusCode: 200, body: 'Ignored' };
  if (!MARKETING_SUPABASE.serviceKey) {
    console.error('[resend-webhook] Supabase service key is not configured');
    return { statusCode: 503, body: 'Storage not configured' };
  }

  var emails = recipientEmails(payload);
  if (!emails.length) return { statusCode: 200, body: 'No recipients' };

  var sb = createClient(MARKETING_SUPABASE.url, MARKETING_SUPABASE.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var leadPatch = {
    opt_in_digest: false,
    email_status: reason,
    email_error: String(payload.data && payload.data.bounce && payload.data.bounce.message || reason).slice(0, 500),
    updated_at: new Date().toISOString(),
  };

  var profileResult = await sb
    .from('profiles')
    .update({ email_digest_enabled: false, email_weekly_enabled: false })
    .in('email', emails);
  var leadResult = await sb
    .from('email_leads')
    .update(leadPatch)
    .in('email', emails);

  if (profileResult.error || leadResult.error) {
    console.error('[resend-webhook] suppression write failed', {
      profile: profileResult.error && profileResult.error.message,
      lead: leadResult.error && leadResult.error.message,
    });
    return { statusCode: 500, body: 'Suppression write failed' };
  }

  console.log('[resend-webhook] recipient suppressed', {
    eventId: header(event, 'svix-id'),
    reason: reason,
    recipientCount: emails.length,
  });
  return { statusCode: 200, body: 'Suppressed' };
};

module.exports.verifyWebhook = verifyWebhook;
module.exports.suppressionReason = suppressionReason;
module.exports.recipientEmails = recipientEmails;
