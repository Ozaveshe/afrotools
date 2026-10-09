'use strict';
const { client } = require('./marketing-delivery');
const { sendEmail } = require('./email-adapter');
const { buildEmailShell } = require('./lifecycle-email');
const { buildWeeklyMessage } = require('../send-weekly-newsletter');
const SOURCES = new Set(['newsletter', 'blog-newsletter', 'blog-newsletter-fr', 'newsletter-sw']);

function subscription(payload) {
  const data = payload?.data || {};
  const source = payload?.form_name || data['form-name'];
  const email = String(data.email || '').trim().toLowerCase();
  if (!SOURCES.has(source) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (source === 'newsletter' && data.source !== 'footer' &&
      !(data.source === 'homepage' && data.consent_version === 'weekly-2026-10-09')) return null;
  return { email, source };
}
function messageFor(subscriber, welcome, now) {
  const unsubscribeUrl = 'https://afrotools.com/api/email/unsubscribe?newsletter_token=' + encodeURIComponent(subscriber.unsubscribe_token);
  if (!welcome) {
    const message = buildWeeklyMessage({ email: subscriber.email, name: 'there' }, unsubscribeUrl, now);
    message.tags[0].value = 'newsletter_weekly';
    message.html = message.html.replace('You are receiving this because you created an AfroTools account or requested a report/download.', 'You subscribed to the AfroTools newsletter.');
    return message;
  }
  const subject = 'Welcome to the AfroTools newsletter';
  const url = 'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=newsletter_welcome';
  const body = '<h1 style="font-size:24px">Welcome to AfroTools</h1><p>Thanks for subscribing. Each week, we will share a practical tool or useful update for work and life across Africa.</p><p>Start with something you need today: a calculator, a document helper, or a country guide.</p>';
  return {
    to: subscriber.email, subject,
    html: buildEmailShell(subject, 'One practical update each week.', body, 'Find a useful tool', url, unsubscribeUrl)
      .replace('You are receiving this because you created an AfroTools account or requested a report/download.', 'You subscribed to the AfroTools newsletter.'),
    text: 'Thanks for subscribing to AfroTools. Expect one practical tool or useful update each week.\n\nFind a useful tool: ' + url + '\n\nUnsubscribe: ' + unsubscribeUrl,
    marketing: true, unsubscribeUrl,
    tags: [{ name: 'email_type', value: 'newsletter_welcome' }, { name: 'email_stream', value: 'newsletter' }],
  };
}
async function sendSubscriber(sb, subscriber, welcome, now = new Date()) {
  const result = await sendEmail(messageFor(subscriber, welcome, now));
  if (result.ok) {
    const { error } = await sb.from('newsletter_subscribers')
      .update(welcome ? { welcome_sent_at: now.toISOString() } : { last_weekly_at: now.toISOString() })
      .eq('email', subscriber.email);
    if (error) throw new Error('Newsletter send marker failed');
  }
  return result;
}
async function captureSubscription(payload) {
  const record = subscription(payload);
  if (!record) return { status: 'ignored' };
  const sb = client();
  // Repeated submissions never overwrite an opt-out or a sent marker.
  const { error } = await sb.from('newsletter_subscribers').upsert(record, { onConflict: 'email', ignoreDuplicates: true });
  if (error) throw new Error('Newsletter subscription storage failed');
  const { data, error: readError } = await sb.from('newsletter_subscribers').select('*').eq('email', record.email).single();
  if (readError) throw new Error('Newsletter subscription lookup failed');
  if (data.unsubscribed_at || data.welcome_sent_at || data.last_weekly_at) return { status: 'already_recorded' };
  const result = await sendSubscriber(sb, data, true);
  return { status: result.providerStatus };
}
module.exports = { subscription, messageFor, captureSubscription, sendSubscriber };
