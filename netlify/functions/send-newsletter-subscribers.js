const { client } = require('./_shared/marketing-delivery');
const { sendSubscriber } = require('./_shared/newsletter');
const { isMarketingPaused } = require('./_shared/email-adapter');
const { withScheduledProof } = require('./_shared/scheduled-proof');

exports.handler = withScheduledProof('send-newsletter-subscribers', async function () {
  if (isMarketingPaused()) return { statusCode: 200, body: 'Marketing paused' };
  const sb = client();
  const now = new Date();
  const started = Date.now();
  // Hourly welcome retry; weekly sends only on Monday morning UTC.
  const weekly = now.getUTCDay() === 1 && now.getUTCHours() >= 8 && now.getUTCHours() < 12;
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  weekStart.setUTCHours(0, 0, 0, 0);
  let query = sb.from('newsletter_subscribers').select('*').is('unsubscribed_at', null);
  if (weekly) query = query.or('last_weekly_at.is.null,last_weekly_at.lt.' + weekStart.toISOString());
  else query = query.is('welcome_sent_at', null).is('last_weekly_at', null).gte('subscribed_at', new Date(now - 7 * 86400000).toISOString());
  const { data, error } = await query.order('last_weekly_at', { ascending: true, nullsFirst: true }).order('subscribed_at').limit(50);
  if (error) throw new Error('Newsletter audience lookup failed');
  let sent = 0, skipped = 0, failed = 0;
  for (const subscriber of data || []) {
    if (Date.now() - started > 22000) break;
    const welcome = !subscriber.welcome_sent_at && !subscriber.last_weekly_at;
    const result = await sendSubscriber(sb, subscriber, welcome, now);
    if (result.ok) sent++;
    else if (['frequency_capped','duplicate','suppressed','not_subscribed'].includes(result.providerStatus)) skipped++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 550));
  }
  return { statusCode: failed ? 500 : 200, body: JSON.stringify({ sent, skipped, failed }) };
});
