/**
 * Netlify Function: create-subscription
 * Initializes a Paystack transaction for AfroTools Pro subscriptions.
 *
 * Environment variables required:
 *   PAYSTACK_SECRET_KEY - Paystack secret key (sk_live_...)
 */

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { plan, callbackUrl } = JSON.parse(event.body);

    if (!plan) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Missing required field: plan' })
      };
    }

    // Verify auth token and extract email — prevents subscribing on behalf of others
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return {
        statusCode: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid or expired session' })
      };
    }
    const user = await userRes.json();
    const email = user.email;
    if (!email) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'No email associated with account' })
      };
    }

    // Plan amounts in smallest currency unit (kobo, cents, etc.)
    const plans = {
      'monthly':     { amount: 500,     currency: 'USD', interval: 'monthly' },    // $5
      'annual':      { amount: 3000,    currency: 'USD', interval: 'annually' },   // $30
      'monthly_ngn': { amount: 400000,  currency: 'NGN', interval: 'monthly' },    // NGN 4,000
      'annual_ngn':  { amount: 2200000, currency: 'NGN', interval: 'annually' },   // NGN 22,000
      'monthly_kes': { amount: 75000,   currency: 'KES', interval: 'monthly' },    // KES 750
      'annual_kes':  { amount: 420000,  currency: 'KES', interval: 'annually' },   // KES 4,200
      'monthly_zar': { amount: 8900,    currency: 'ZAR', interval: 'monthly' },    // ZAR 89
      'annual_zar':  { amount: 49900,   currency: 'ZAR', interval: 'annually' },   // ZAR 499
      'monthly_ghs': { amount: 5000,    currency: 'GHS', interval: 'monthly' },    // GHS 50
      'annual_ghs':  { amount: 28000,   currency: 'GHS', interval: 'annually' },   // GHS 280
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid plan' })
      };
    }

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        callback_url: callbackUrl || 'https://afrotools.com/pro/success/',
        metadata: {
          plan_type: plan,
          interval: selectedPlan.interval,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: plan }
          ]
        },
        channels: ['card', 'bank', 'ussd', 'mobile_money']
      })
    });

    const data = await response.json();

    if (!data.status) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: data.message })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference
      })
    };

  } catch (error) {
    console.error('Subscription error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to create subscription' })
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
