/** One-click opt-out shared by account, lead and newsletter journeys. */
const { client } = require('./_shared/marketing-delivery');
exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const token = params.newsletter_token || params.lead_token || params.token;
  const table = params.newsletter_token ? 'newsletter_subscribers' : params.lead_token ? 'email_leads' : 'profiles';
  const column = params.newsletter_token ? 'unsubscribe_token' : 'email_unsubscribe_token';
  const response = (statusCode, title, body) => ({ statusCode, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, body: htmlPage(title, body) });
  if (!/^[a-f0-9-]{36}$/i.test(token || '')) return response(400, 'Invalid Link', 'This unsubscribe link is invalid.');
  try {
    const sb = client();
    const { data, error } = await sb.from(table).select('email').eq(column, token).maybeSingle();
    if (error) return response(503, 'Please try again', 'We could not update your email preferences. Please try again shortly.');
    if (!data) return response(404, 'Invalid Link', 'This unsubscribe link is invalid.');
    const result = await sb.rpc('suppress_marketing_email', { p_email: data.email, p_reason: 'unsubscribed' });
    if (result.error) throw new Error('Unsubscribe storage failed');
    return response(200, 'Unsubscribed', "You've been unsubscribed from AfroTools marketing, newsletter and follow-up emails.");
  } catch (_) {
    return response(503, 'Please try again', 'We could not update your email preferences. Please try again shortly.');
  }
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
    'a{color:#0062CC;text-decoration:none}a:hover{text-decoration:underline}' +
    '</style></head>' +
    '<body><div class="card"><h1>' + title + '</h1><p>' + message + '</p></div></body></html>'
  );
}
