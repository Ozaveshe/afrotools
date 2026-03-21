/**
 * Netlify Function: create-checkout
 * Creates a Stripe Checkout session for AfroTools Pro subscriptions.
 * Falls back to Paystack redirect when Stripe is not configured.
 *
 * Environment variables:
 *   STRIPE_SECRET_KEY - Stripe secret key (sk_live_... or sk_test_...)
 *                       If not set, redirects to Paystack flow.
 */

exports.handler = async function(event, context) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, plan, price_id, success_url, cancel_url } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Missing required field: email' })
      };
    }

    // --- Attempt Stripe checkout ---
    if (process.env.STRIPE_SECRET_KEY) {
      let stripe;
      try {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      } catch (e) {
        // stripe package not installed — fall through to Paystack
        console.warn('Stripe package not installed, falling back to Paystack:', e.message);
        return paystackFallback(email, plan);
      }

      if (!price_id) {
        return {
          statusCode: 400,
          headers: corsHeaders(),
          body: JSON.stringify({ error: 'Missing required field: price_id (needed for Stripe checkout)' })
        };
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price: price_id,
            quantity: 1
          }
        ],
        success_url: success_url || 'https://afrotools.com/dashboard/?payment=success',
        cancel_url: cancel_url || 'https://afrotools.com/pro/?payment=cancelled',
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            plan: plan || 'pro',
            source: 'afrotools-pro'
          }
        },
        metadata: {
          plan: plan || 'pro',
          email: email
        }
      });

      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ url: session.url, session_id: session.id })
      };
    }

    // --- No STRIPE_SECRET_KEY: redirect to Paystack flow ---
    return paystackFallback(email, plan);

  } catch (error) {
    console.error('Checkout error:', error);

    // If Stripe threw an error, provide a helpful message and offer Paystack fallback
    const isStripeError = error.type && error.type.startsWith('Stripe');
    return {
      statusCode: isStripeError ? 400 : 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: isStripeError
          ? error.message
          : 'Internal server error',
        fallback_url: 'https://afrotools.com/pro/?checkout=paystack'
      })
    };
  }
};

/**
 * Returns a response redirecting the client to the Paystack checkout flow.
 */
function paystackFallback(email, plan) {
  const params = new URLSearchParams({ checkout: 'paystack' });
  if (email) params.set('email', email);
  if (plan) params.set('plan', plan);

  const redirectUrl = `https://afrotools.com/pro/?${params.toString()}`;

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({
      provider: 'paystack',
      redirect: true,
      url: redirectUrl,
      message: 'Stripe is not available. Please use our Paystack checkout instead.'
    })
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
