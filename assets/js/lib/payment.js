/**
 * AfroTools Payment Integration
 * Handles Paystack (African cards/mobile money) and Stripe (international cards)
 *
 * All payment logic is server-side. This client simply calls:
 *   - /.netlify/functions/create-subscription  (Paystack)
 *   - /.netlify/functions/create-checkout       (Stripe)
 */
(function(window) {
  'use strict';

  // Plan configuration (display purposes only — pricing enforced server-side)
  const PLANS = {
    monthly: {
      name: 'AfroTools Pro Monthly',
      amount_usd: 500,       // $5.00 in cents
      amount_ngn: 400000,    // NGN 4,000 in kobo
      interval: 'monthly'
    },
    annual: {
      name: 'AfroTools Pro Annual',
      amount_usd: 3000,      // $30.00 in cents
      amount_ngn: 2200000,   // NGN 22,000 in kobo
      interval: 'annually'
    }
  };

  const AfroPayment = {

    /**
     * Pay via Paystack by calling the server-side create-subscription endpoint.
     * The server initializes a Paystack transaction and returns an authorization URL.
     * @param {string} email - Customer email
     * @param {string} plan - Plan key (e.g. 'monthly', 'annual', 'monthly_ngn', 'annual_ngn')
     * @returns {Promise<object>} Payment result with redirect
     */
    async payWithPaystack(email, plan) {
      try {
        const response = await fetch('/.netlify/functions/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            plan: plan,
            callbackUrl: window.location.origin + '/dashboard/?payment=success&plan=' + plan
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to initialize Paystack transaction');
        }

        const data = await response.json();

        if (data.authorization_url) {
          // Store reference locally so we can verify after redirect
          localStorage.setItem('afro_payment_ref', JSON.stringify({
            reference: data.reference,
            plan: plan,
            provider: 'paystack',
            timestamp: Date.now()
          }));
          window.location.href = data.authorization_url;
          return { status: 'redirecting', reference: data.reference, provider: 'paystack' };
        } else {
          throw new Error('No authorization URL returned from Paystack');
        }
      } catch (error) {
        console.error('[AfroPayment] Paystack error:', error);
        throw error;
      }
    },

    /**
     * Redirect to Stripe Checkout via Netlify Function
     * @param {string} email - Customer email
     * @param {string} plan - 'monthly' or 'annual'
     * @returns {Promise<void>} Redirects to Stripe
     */
    async payWithStripe(email, plan) {
      try {
        const response = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            plan: plan,
            success_url: window.location.origin + '/dashboard/?payment=success&plan=' + plan,
            cancel_url: window.location.origin + '/pro/?payment=cancelled'
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create checkout session');
        }

        const data = await response.json();

        // Server may redirect to Paystack if Stripe isn't configured
        if (data.redirect && data.url) {
          window.location.href = data.url;
          return;
        }

        // Redirect to Stripe-hosted checkout page
        if (data.url) {
          window.location.href = data.url;
        } else if (data.fallback_url) {
          window.location.href = data.fallback_url;
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
        const expiresAt = plan.startsWith('annual')
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
     * Start checkout flow — auto-detects best provider based on user location.
     * African users get Paystack (with local currency when detectable),
     * international users get Stripe.
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
        var offset = new Date().getTimezoneOffset() / -60;
        var isLikelyAfrican = offset >= -1 && offset <= 4;

        if (isLikelyAfrican) {
          // Detect NGN currency for Nigerian users (WAT = UTC+1)
          var paystackPlan = plan;
          if (offset === 1) {
            // Likely Nigeria/West Africa — use NGN pricing
            paystackPlan = plan + '_ngn';
          }
          await this.payWithPaystack(email, paystackPlan);
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
     * Get plan configuration for display purposes
     * @param {string} plan - 'monthly' or 'annual'
     * @returns {object|null} Plan details
     */
    getPlan(plan) {
      return PLANS[plan] || null;
    }
  };

  window.AfroPayment = AfroPayment;
})(window);
