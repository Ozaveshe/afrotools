/**
 * AfroTools Payment Integration
 * Handles Paystack (African cards/mobile money) and Stripe (international cards)
 *
 * Dependencies:
 *   - Paystack inline JS: <script src="https://js.paystack.co/v2/inline.js"></script>
 *   - Supabase client: window.supabase (from afro-auth.js)
 */
(function(window) {
  'use strict';

  // TODO: Replace with live Paystack public key
  const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  // Plan configuration
  const PLANS = {
    monthly: {
      name: 'AfroTools Pro Monthly',
      amount_usd: 500,       // $5.00 in cents
      amount_ngn: 500000,    // NGN 5,000 in kobo (approx)
      interval: 'monthly',
      stripe_price_id: 'price_XXXXXXXXXXXXXXXX', // TODO: Replace with live Stripe price ID
      paystack_plan_code: 'PLN_XXXXXXXXXXXXXXXX'  // TODO: Replace with live Paystack plan code
    },
    annual: {
      name: 'AfroTools Pro Annual',
      amount_usd: 4900,      // $49.00 in cents
      amount_ngn: 4900000,   // NGN 49,000 in kobo (approx)
      interval: 'annually',
      stripe_price_id: 'price_YYYYYYYYYYYYYYYY', // TODO: Replace with live Stripe price ID
      paystack_plan_code: 'PLN_YYYYYYYYYYYYYYYY'  // TODO: Replace with live Paystack plan code
    }
  };

  const AfroPayment = {

    /**
     * Initialize Paystack payment for African cards and mobile money
     * @param {string} email - Customer email
     * @param {string} plan - 'monthly' or 'annual'
     * @returns {Promise<object>} Payment result
     */
    payWithPaystack(email, plan) {
      return new Promise((resolve, reject) => {
        const planConfig = PLANS[plan];
        if (!planConfig) {
          reject(new Error('Invalid plan: ' + plan));
          return;
        }

        if (typeof PaystackPop === 'undefined') {
          reject(new Error('Paystack SDK not loaded. Include https://js.paystack.co/v2/inline.js'));
          return;
        }

        const handler = PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: planConfig.amount_ngn,
          currency: 'NGN',
          plan: planConfig.paystack_plan_code,
          metadata: {
            plan: plan,
            source: 'afrotools-pro'
          },
          onClose: function() {
            reject(new Error('Payment cancelled by user'));
          },
          callback: function(response) {
            // response.reference contains the transaction reference
            AfroPayment.updateSubscription(email, plan, response.reference, 'paystack')
              .then(function() {
                resolve({
                  status: 'success',
                  reference: response.reference,
                  provider: 'paystack',
                  plan: plan
                });
              })
              .catch(reject);
          }
        });

        handler.openIframe();
      });
    },

    /**
     * Redirect to Stripe Checkout via Netlify Function
     * @param {string} email - Customer email
     * @param {string} plan - 'monthly' or 'annual'
     * @returns {Promise<void>} Redirects to Stripe
     */
    async payWithStripe(email, plan) {
      const planConfig = PLANS[plan];
      if (!planConfig) {
        throw new Error('Invalid plan: ' + plan);
      }

      try {
        const response = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            plan: plan,
            price_id: planConfig.stripe_price_id,
            success_url: window.location.origin + '/dashboard/?payment=success&plan=' + plan,
            cancel_url: window.location.origin + '/pro/?payment=cancelled'
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create checkout session');
        }

        const data = await response.json();

        // Redirect to Stripe-hosted checkout page
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('[AfroPayment] Stripe checkout error:', error);
        throw error;
      }
    },

    /**
     * Update subscription status in Supabase after successful payment
     * @param {string} email - Customer email
     * @param {string} plan - 'monthly' or 'annual'
     * @param {string} reference - Payment reference from provider
     * @param {string} provider - 'paystack' or 'stripe'
     * @returns {Promise<object>} Supabase response
     */
    async updateSubscription(email, plan, reference, provider) {
      // Get supabase client from AfroAuth
      const supabase = window.supabase || (window.AfroAuth && window.AfroAuth._supabase);
      if (!supabase) {
        console.warn('[AfroPayment] Supabase client not found. Subscription update deferred.');
        // Store locally for later sync
        localStorage.setItem('afro_pending_sub', JSON.stringify({
          email, plan, reference, provider, timestamp: Date.now()
        }));
        return { status: 'deferred' };
      }

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user || !user.user) {
          throw new Error('User not authenticated');
        }

        const now = new Date().toISOString();
        const expiresAt = plan === 'annual'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.user.id,
            email: email,
            plan: plan,
            status: 'active',
            provider: provider,
            payment_reference: reference,
            started_at: now,
            expires_at: expiresAt,
            updated_at: now
          }, { onConflict: 'user_id' });

        if (error) throw error;

        // Clear any cached pro status
        localStorage.removeItem('afro_pro_cache');

        return { status: 'success', data: data };
      } catch (error) {
        console.error('[AfroPayment] Subscription update error:', error);
        // Store locally for later sync
        localStorage.setItem('afro_pending_sub', JSON.stringify({
          email, plan, reference, provider, timestamp: Date.now()
        }));
        throw error;
      }
    },

    /**
     * Start checkout flow — auto-detects best provider based on user location
     * @param {string} plan - 'monthly' or 'annual'
     */
    async startCheckout(plan) {
      try {
        // Get current user email
        const supabase = window.supabase || (window.AfroAuth && window.AfroAuth._supabase);
        let email = '';

        if (supabase) {
          const { data } = await supabase.auth.getUser();
          email = data && data.user ? data.user.email : '';
        }

        if (!email) {
          // Redirect to login first
          window.location.href = '/dashboard/?redirect=pro&plan=' + plan;
          return;
        }

        // For African users, prefer Paystack; otherwise use Stripe
        // Simple heuristic: check timezone offset for African timezones (UTC-1 to UTC+4)
        const offset = new Date().getTimezoneOffset() / -60;
        const isLikelyAfrican = offset >= -1 && offset <= 4;

        if (isLikelyAfrican && typeof PaystackPop !== 'undefined') {
          await this.payWithPaystack(email, plan);
        } else {
          await this.payWithStripe(email, plan);
        }
      } catch (error) {
        console.error('[AfroPayment] Checkout error:', error);
        // Fallback: show error toast if available
        if (window.AfroToast) {
          AfroToast.show('Payment error. Please try again.', 'error');
        } else {
          alert('Payment error: ' + error.message);
        }
      }
    },

    /**
     * Get plan configuration
     * @param {string} plan - 'monthly' or 'annual'
     * @returns {object} Plan details
     */
    getPlan(plan) {
      return PLANS[plan] || null;
    }
  };

  window.AfroPayment = AfroPayment;
})(window);
