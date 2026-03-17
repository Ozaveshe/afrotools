/**
 * Netlify Function: paystack-webhook
 * Handles Paystack webhook events for subscription lifecycle.
 *
 * Environment variables required:
 *   PAYSTACK_SECRET_KEY    - Paystack secret key (for signature verification)
 *   SUPABASE_URL           - Supabase project URL
 *   SUPABASE_SERVICE_KEY   - Supabase service role key
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verify Paystack signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(event.body)
    .digest('hex');

  if (hash !== event.headers['x-paystack-signature']) {
    console.error('Invalid Paystack signature');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const payload = JSON.parse(event.body);
  const eventType = payload.event;
  const data = payload.data;

  console.log(`Paystack webhook: ${eventType}`, data.reference);

  try {
    switch (eventType) {
      case 'charge.success': {
        const email = data.customer.email;
        const planType = data.metadata?.plan_type || 'monthly';
        const isAnnual = planType.includes('annual');

        // Calculate expiry
        const now = new Date();
        const expiresAt = new Date(now);
        if (isAnnual) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // Upsert user profile with Pro status
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            email: email,
            plan: isAnnual ? 'pro_annual' : 'pro_monthly',
            plan_status: 'active',
            plan_started_at: now.toISOString(),
            plan_expires_at: expiresAt.toISOString(),
            payment_provider: 'paystack',
            payment_customer_id: data.customer.customer_code,
            payment_reference: data.reference,
            updated_at: now.toISOString()
          }, {
            onConflict: 'email'
          });

        if (error) {
          console.error('Supabase error:', error);
          return { statusCode: 500, body: 'Database error' };
        }

        console.log(`Pro activated for ${email} until ${expiresAt.toISOString()}`);
        break;
      }

      case 'subscription.disable':
      case 'subscription.expiring_cards': {
        const email = data.customer?.email;
        if (email) {
          await supabase
            .from('user_profiles')
            .update({ plan_status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('email', email);
          console.log(`Pro cancelled for ${email}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const email = data.customer?.email;
        if (email) {
          await supabase
            .from('user_profiles')
            .update({ plan_status: 'past_due', updated_at: new Date().toISOString() })
            .eq('email', email);
          console.log(`Payment failed for ${email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${eventType}`);
    }

    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return { statusCode: 500, body: 'Internal error' };
  }
};
