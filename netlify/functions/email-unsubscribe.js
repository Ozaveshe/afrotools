/**
 * Email Unsubscribe — one-click unsubscribe endpoint
 *
 * GET /api/email/unsubscribe?token=xxx
 *
 * Looks up profile by unsubscribe token, sets email_digest_enabled = false,
 * returns a simple confirmation HTML page.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;

exports.handler = async function (event) {
  const token = event.queryStringParameters && event.queryStringParameters.token;
  const leadToken = event.queryStringParameters && event.queryStringParameters.lead_token;

  if (!token && !leadToken) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Invalid Link', 'This unsubscribe link is invalid or has expired.'),
    };
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('[email-unsubscribe] SUPABASE_SERVICE_ROLE_KEY not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Error', 'Server configuration error. Please try again later.'),
    };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  if (leadToken) {
    const { data, error } = await sb
      .from('email_leads')
      .update({ opt_in_digest: false, email_status: 'unsubscribed', updated_at: new Date().toISOString() })
      .eq('email_unsubscribe_token', leadToken)
      .select('id')
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: htmlPage('Not Found', 'This unsubscribe link is invalid or has already been used.'),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage(
        'Unsubscribed',
        "You've been unsubscribed from AfroTools digest and follow-up emails."
      ),
    };
  }

  // Look up profile by unsubscribe token
  const { data, error } = await sb
    .from('profiles')
    .update({ email_digest_enabled: false, email_weekly_enabled: false })
    .eq('email_unsubscribe_token', token)
    .select('id')
    .single();

  if (error || !data) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Not Found', 'This unsubscribe link is invalid or has already been used.'),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: htmlPage(
      'Unsubscribed',
      "You've been unsubscribed from AfroTools monthly digest emails.<br><br>" +
        'You can re-enable them anytime from your <a href="https://afrotools.com/dashboard/" style="color:#007AFF;">Dashboard</a>.'
    ),
  };
};

function htmlPage(title, message) {
  return (
    '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + title + ' | AfroTools</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"DM Sans",system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F8FAFD;color:#1e293b}' +
    '.card{background:#fff;border-radius:16px;padding:40px;max-width:460px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.08)}' +
    'h1{font-size:1.5rem;margin:0 0 12px;font-weight:700}' +
    'p{font-size:1rem;color:#475569;line-height:1.6;margin:0}' +
    'a{color:#007AFF;text-decoration:none}a:hover{text-decoration:underline}' +
    '</style></head>' +
    '<body><div class="card"><h1>' + title + '</h1><p>' + message + '</p></div></body></html>'
  );
}
