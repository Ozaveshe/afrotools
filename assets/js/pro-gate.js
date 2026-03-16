(function(window) {
  'use strict';

  const PRO_TOOLS = ['japa-calculator', 'medical-report', 'japa-visa-predict'];

  // Cache duration: 5 minutes
  const CACHE_TTL = 5 * 60 * 1000;

  const AfroProGate = {

    /**
     * Check if current user has an active Pro subscription.
     * Checks Supabase subscriptions table with local caching.
     * @returns {Promise<boolean>}
     */
    async isPro() {
      // 1. Check local cache first
      try {
        const cached = localStorage.getItem('afro_pro_cache');
        if (cached) {
          const { isPro, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            return isPro;
          }
        }
      } catch (e) { /* ignore parse errors */ }

      // 2. Check via AfroAuth sync method (fast, no network)
      if (window.AfroAuth && typeof AfroAuth.isPro === 'function') {
        const result = AfroAuth.isPro();
        if (result === true) {
          this._cacheProStatus(true);
          return true;
        }
      }

      // 3. Check Supabase subscriptions table (async)
      try {
        const supabase = (window.AfroAuth && typeof window.AfroAuth.getSupabase === 'function' && window.AfroAuth.getSupabase()) || null;
        if (!supabase || !supabase.auth) return false;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData || !userData.user) return false;

        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, expires_at')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .single();

        if (error || !data) {
          this._cacheProStatus(false);
          return false;
        }

        // Check if subscription is still valid
        const isActive = new Date(data.expires_at) > new Date();
        this._cacheProStatus(isActive);
        return isActive;
      } catch (e) {
        console.warn('[ProGate] Subscription check failed:', e);
        return false;
      }
    },

    /**
     * Cache pro status locally
     * @param {boolean} isPro
     */
    _cacheProStatus(isPro) {
      try {
        localStorage.setItem('afro_pro_cache', JSON.stringify({
          isPro: isPro,
          timestamp: Date.now()
        }));
      } catch (e) { /* storage full, ignore */ }
    },

    isProFeature(toolId) {
      return PRO_TOOLS.includes(toolId);
    },

    /**
     * Show a tasteful inline upsell CTA for a specific feature.
     * Does NOT use popups — inserts inline content.
     * @param {string} feature - Feature name: 'pdf', 'ai-advisor', 'history', 'api', 'share', 'theme'
     * @param {HTMLElement} [container] - Optional container to insert upsell into
     */
    showProUpsell(feature, container) {
      const messages = {
        'pdf': {
          title: 'Clean PDF Exports',
          desc: 'Remove watermarks from your PDF exports with AfroTools Pro.',
          icon: '&#128196;'
        },
        'ai-advisor': {
          title: 'Unlimited AI Advisor',
          desc: 'You\'ve used your 3 free questions today. Go Pro for unlimited.',
          icon: '&#129302;'
        },
        'history': {
          title: 'Unlimited History',
          desc: 'Free accounts save your last 5 calculations. Go Pro for unlimited cloud history.',
          icon: '&#128202;'
        },
        'api': {
          title: 'API Access',
          desc: 'Get programmatic access to AfroTools data with 100 API calls/day.',
          icon: '&#128268;'
        },
        'share': {
          title: 'Branded Share Cards',
          desc: 'Share your results as custom branded cards instead of basic URLs.',
          icon: '&#127912;'
        },
        'theme': {
          title: 'Theme Toggle',
          desc: 'Switch between dark and light themes manually with AfroTools Pro.',
          icon: '&#127769;'
        }
      };

      const config = messages[feature] || {
        title: 'AfroTools Pro',
        desc: 'Unlock this feature with AfroTools Pro.',
        icon: '&#11088;'
      };

      const upsell = document.createElement('div');
      upsell.className = 'pro-inline-upsell';
      upsell.setAttribute('data-feature', feature);
      upsell.innerHTML =
        '<div style="display:flex;align-items:flex-start;gap:14px;max-width:480px;margin:16px auto;padding:20px;' +
        'background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid #F59E0B;border-radius:12px;">' +
          '<div style="font-size:24px;flex-shrink:0;margin-top:2px">' + config.icon + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-size:14px;font-weight:700;color:#92400E;margin-bottom:4px">' + config.title + '</div>' +
            '<div style="font-size:13px;color:#78350F;line-height:1.5;margin-bottom:10px">' + config.desc + '</div>' +
            '<a href="/pro/" style="display:inline-block;background:#F59E0B;color:#fff;padding:7px 16px;' +
            'border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;transition:opacity .15s">' +
            'Upgrade to Pro — $5/mo</a>' +
          '</div>' +
        '</div>';

      if (container) {
        container.appendChild(upsell);
      }

      return upsell;
    },

    /**
     * Gate PDF download: returns true if allowed clean download, false if watermarked
     * Shows inline upsell if not Pro
     * @param {HTMLElement} [container] - Where to show upsell
     * @returns {Promise<boolean>} true = clean export allowed
     */
    async gatePdfExport(container) {
      const pro = await this.isPro();
      if (!pro && container) {
        this.showProUpsell('pdf', container);
      }
      return pro; // true = no watermark, false = add watermark
    },

    /**
     * Gate AI Advisor: check daily usage limit for free users
     * Free users get 3 questions/day.
     * @param {HTMLElement} [container] - Where to show upsell
     * @returns {Promise<boolean>} true = allowed to ask
     */
    async gateAiAdvisor(container) {
      const pro = await this.isPro();
      if (pro) return true;

      // Check daily usage from localStorage
      const today = new Date().toISOString().slice(0, 10);
      const key = 'afro_ai_usage_' + today;
      const usage = parseInt(localStorage.getItem(key) || '0', 10);
      const FREE_LIMIT = 3;

      if (usage >= FREE_LIMIT) {
        if (container) {
          this.showProUpsell('ai-advisor', container);
        }
        return false;
      }

      // Increment usage
      localStorage.setItem(key, String(usage + 1));
      return true;
    },

    /**
     * Gate calculation history: free users limited to last 5
     * @param {Array} history - Full history array
     * @returns {Promise<Array>} Truncated if free, full if Pro
     */
    async gateHistory(history) {
      const pro = await this.isPro();
      if (pro) return history;

      const FREE_LIMIT = 5;
      return history.slice(0, FREE_LIMIT);
    },

    /**
     * Inject upsell banner before footer (for Pro-only tool pages)
     */
    injectUpsell() {
      const meta = document.querySelector('meta[name="tool-id"]');
      if (!meta) return;
      const toolId = meta.content;
      if (!this.isProFeature(toolId)) return;

      // Use async isPro
      this.isPro().then(function(pro) {
        if (pro) return;

        var footer = document.querySelector('afro-footer');
        if (!footer) return;

        var banner = document.createElement('div');
        banner.className = 'pro-upsell-banner';
        banner.innerHTML =
          '<div style="max-width:800px;margin:0 auto;padding:32px 24px;text-align:center;">' +
            '<span style="display:inline-block;background:linear-gradient(135deg,#F5A623,#e8960e);color:#fff;' +
            'font-size:.6rem;font-weight:800;padding:3px 10px;border-radius:100px;letter-spacing:.08em;margin-bottom:12px;">PRO</span>' +
            '<h3 style="font-size:1.2rem;font-weight:800;color:#111827;margin-bottom:8px;">Get more with AfroTools Pro</h3>' +
            '<p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin-bottom:16px;">' +
            'Unlimited AI advisor, clean PDF exports, cloud history, and more — just $5/month.</p>' +
            '<a href="/pro/" style="display:inline-block;background:var(--color-primary);color:#fff;' +
            'padding:10px 24px;border-radius:8px;font-weight:700;font-size:.85rem;text-decoration:none;">See Plans & Pricing</a>' +
          '</div>';
        banner.style.cssText = 'background:#F9FAFB;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;margin:24px 0;';
        footer.parentNode.insertBefore(banner, footer);
      });
    },

    // Toggle .pro-only elements visibility
    applyGating() {
      this.isPro().then(function(pro) {
        document.querySelectorAll('.pro-only').forEach(function(el) {
          el.style.display = pro ? '' : 'none';
        });
        document.querySelectorAll('.free-only').forEach(function(el) {
          el.style.display = pro ? 'none' : '';
        });
      });
    }
  };

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      AfroProGate.injectUpsell();
      AfroProGate.applyGating();
    });
  } else {
    AfroProGate.injectUpsell();
    AfroProGate.applyGating();
  }

  window.AfroProGate = AfroProGate;
})(window);
