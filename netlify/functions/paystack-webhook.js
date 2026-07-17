/**
 * Netlify Function: paystack-webhook
 * Handles Paystack webhook events for subscription lifecycle.
 *
 * Environment variables required:
 *   PAYSTACK_SECRET_KEY    - Paystack secret key (for signature verification)
 *   SUPABASE_AUTH_URL      - Supabase auth/profile project URL
 *   SUPABASE_AUTH_SERVICE_KEY - Supabase service role key
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const ACTIVE_TIER = 'pro';
const FREE_TIER = 'free';
const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getPlanType(data) {
  const metadata = data && data.metadata ? data.metadata : {};
  return String(metadata.plan_type || metadata.plan || 'monthly');
}

function isAnnualPlan(planType) {
  return String(planType || '').toLowerCase().includes('annual');
}

function calculateExpiry(now, planType) {
  const expiresAt = new Date(now);
  if (isAnnualPlan(planType)) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

function paystackSubscriptionCode(data) {
  if (data && data.subscription && data.subscription.subscription_code) {
    return data.subscription.subscription_code;
  }
  if (data && data.subscription_code) return data.subscription_code;
  return null;
}

function profilePayloadForStatus(status, data, now) {
  const customer = data && data.customer ? data.customer : {};
  const base = {
    updated_at: now.toISOString(),
    paystack_customer_id: customer.customer_code || customer.id || null,
    paystack_subscription_code: paystackSubscriptionCode(data)
  };

  if (status === 'active') {
    const planType = getPlanType(data);
    return Object.assign(base, {
      tier: ACTIVE_TIER,
      subscription_tier: ACTIVE_TIER,
      subscription_expires_at: calculateExpiry(now, planType).toISOString()
    });
  }

  return Object.assign(base, {
    tier: FREE_TIER,
    subscription_tier: FREE_TIER,
    subscription_expires_at: null
  });
}

async function findProfileByEmail(supabase, email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email')
    .eq('email', email)
    .limit(2);

  if (error) throw error;
  if (Array.isArray(data) && data.length === 1) return data[0];
  if (Array.isArray(data) && data.length > 1) {
    throw new Error(`Multiple profiles found for email ${email}; refusing ambiguous subscription update`);
  }
  return null;
}

async function updateProfileStatus(supabase, data, status, now) {
  const customer = data && data.customer ? data.customer : {};
  const metadata = data && data.metadata ? data.metadata : {};
  const email = normalizeEmail(customer.email);
  const userId = metadata.user_id || metadata.userId || null;
  const payload = profilePayloadForStatus(status, data, now);
  if (email) payload.email = email;

  if (userId) {
    const { error } = await supabase
      .from('profiles')
      .upsert(Object.assign({ id: userId }, payload), { onConflict: 'id' });
    if (error) throw error;
    return { email, userId, mode: 'id' };
  }

  const profile = await findProfileByEmail(supabase, email);
  if (!profile || !profile.id) {
    throw new Error(`No profile found for Paystack customer email ${email || '(missing)'}`);
  }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profile.id);
  if (error) throw error;
  return { email, userId: profile.id, mode: 'email' };
}

async function handlePaystackEvent(payload, supabase, now = new Date()) {
  const eventType = payload.event;
  const data = payload.data || {};

  console.log(`Paystack webhook: ${eventType}`, data.reference);

  switch (eventType) {
    case 'charge.success': {
      const result = await updateProfileStatus(supabase, data, 'active', now);
      console.log(`Pro activated for ${result.email} via ${result.mode}`);
      return { handled: true, action: 'activated', result };
    }

    case 'subscription.disable':
    case 'subscription.expiring_cards': {
      const result = await updateProfileStatus(supabase, data, 'cancelled', now);
      console.log(`Pro cancelled for ${result.email}`);
      return { handled: true, action: 'cancelled', result };
    }

    case 'invoice.payment_failed': {
      const result = await updateProfileStatus(supabase, data, 'past_due', now);
      console.log(`Payment failed for ${result.email}`);
      return { handled: true, action: 'past_due', result };
    }

    case 'charge.dispute.create':
    case 'charge.dispute.remind': {
      const result = await updateProfileStatus(supabase, data, 'disputed', now);
      console.log(`Pro disputed for ${result.email}`);
      return { handled: true, action: 'disputed', result };
    }

    case 'charge.dispute.resolve': {
      const resolution = data.resolution && data.resolution.merchant;
      if (resolution === 'accepted') {
        const result = await updateProfileStatus(supabase, data, 'refunded', now);
        console.log(`Pro revoked (dispute resolved) for ${result.email}`);
        return { handled: true, action: 'refunded', result };
      }
      return { handled: false, action: 'ignored-dispute-resolution' };
    }

    case 'refund.processed': {
      const result = await updateProfileStatus(supabase, data, 'refunded', now);
      console.log(`Pro revoked (refund) for ${result.email}`);
      return { handled: true, action: 'refunded', result };
    }

    default:
      console.log(`Unhandled event: ${eventType}`);
      return { handled: false, action: 'ignored' };
  }
}

async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_AUTH_URL or SUPABASE_AUTH_SERVICE_KEY');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('Missing PAYSTACK_SECRET_KEY env var');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
  );

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(event.body)
    .digest('hex');

  if (hash !== event.headers['x-paystack-signature']) {
    console.error('Invalid Paystack signature');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  try {
    await handlePaystackEvent(payload, supabase);
    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { statusCode: 500, body: 'Internal error' };
  }
}

exports.handler = handler;
exports._private = {
  calculateExpiry,
  getPlanType,
  handlePaystackEvent,
  isAnnualPlan,
  profilePayloadForStatus,
  updateProfileStatus
};
