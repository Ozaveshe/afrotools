'use strict';
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./email-marketing-config');

function client() {
  const config = getMarketingSupabaseConfig();
  if (config.url !== 'https://zpclagtgczsygrgztlts.supabase.co' || !config.serviceKey) throw new Error('Marketing storage unavailable');
  return createClient(config.url, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
function deliveryIdentity(message, now = new Date()) {
  const type = (message.tags || []).find(tag => tag.name === 'email_type')?.value;
  const email = typeof message.to === 'string' ? message.to.trim().toLowerCase() : '';
  if (!type || !email || !message.unsubscribeUrl) throw new Error('Marketing email requires recipient, type and unsubscribe link');
  let edition = 'once';
  if (type === 'monthly_activity_digest') edition = now.toISOString().slice(0, 7);
  if (type === 'weekly_brief' || type === 'newsletter_weekly') {
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    edition = monday.toISOString().slice(0, 10);
  }
  const key = crypto.createHash('sha256').update(email + ':' + type + ':' + edition).digest('hex');
  return { email, type, key };
}
async function reserve(message) {
  const identity = deliveryIdentity(message);
  const sb = client();
  const { data, error } = await sb.rpc('reserve_marketing_email', {
    p_email: identity.email, p_type: identity.type, p_key: identity.key,
  });
  if (error) throw new Error('Marketing reservation failed');
  return { ...identity, status: data, sb };
}
async function finish(reservation, status, providerId) {
  const { error } = await reservation.sb.from('marketing_email_deliveries')
    .update({ status, provider_id: providerId || null }).eq('delivery_key', reservation.key);
  if (error) throw new Error('Marketing delivery recording failed');
}
module.exports = { client, deliveryIdentity, reserve, finish };
