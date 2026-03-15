/**
 * Netlify Function: create-checkout
 * Creates a Stripe Checkout session for AfroTools Pro subscriptions.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY - Stripe secret key (sk_live_... or sk_test_...)
 *
 * TODO: Replace test key with live key in Netlify dashboard env vars
 * TODO: Set up Stripe webhook endpoint for subscription lifecycle events
 */

// TODO: Install stripe package: npm install stripe
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { email, plan, price_id, success_url, cancel_url } = JSON.parse(event.body);

    if (!email || !price_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: email, price_id' })
      };
    }

    // TODO: Uncomment when stripe is installed and STRIPE_SECRET_KEY is set
    /*
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
          plan: plan,
          source: 'afrotools-pro'
        }
      },
      metadata: {
        plan: plan,
        email: email
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, session_id: session.id })
    };
    */

    // Stub response until Stripe is configured
    return {
      statusCode: 501,
      headers,
      body: JSON.stringify({
        error: 'Stripe checkout not yet configured. Set STRIPE_SECRET_KEY environment variable.',
        plan: plan,
        email: email
      })
    };

  } catch (error) {
    console.error('Checkout error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
