/**
 * AFROTOOLS — Analytics Library
 * ===================================================================
 * GA4 custom event tracking wrapper. All events are queued if gtag
 * hasn't loaded yet, then flushed when it becomes available.
 *
 * Usage:
 *   AfroTools.analytics.trackCalculation('ng-paye', 'Nigeria', 3600000)
 *   AfroTools.analytics.trackPDFDownload('ng-paye', 'Nigeria')
 *   AfroTools.analytics.trackAIQuery('ng-paye', 'What is CRA?')
 *   AfroTools.analytics.trackToolView('ng-paye', 'Nigeria')
 *   AfroTools.analytics.trackShare('ng-paye', 'copy_link')
 *   AfroTools.analytics.trackError('ng-paye', 'calc_error', 'Invalid input')
 *   AfroTools.analytics.track('custom_event', { key: 'value' })
 * ===================================================================
 */

(function (window) {
  'use strict';

  const QUEUE = [];
  let flushing = false;

  /**
   * Send an event to GA4 or queue it
   */
  function send(eventName, params) {
    if (window.gtag) {
      window.gtag('event', eventName, params);
    } else {
      QUEUE.push({ eventName, params, timestamp: Date.now() });
      scheduleFlush();
    }
  }

  /**
   * Flush queued events once gtag becomes available
   */
  function scheduleFlush() {
    if (flushing) return;
    flushing = true;
    const check = setInterval(() => {
      if (window.gtag) {
        clearInterval(check);
        flushing = false;
        while (QUEUE.length > 0) {
          const e = QUEUE.shift();
          // Only send events less than 5 minutes old
          if (Date.now() - e.timestamp < 300000) {
            window.gtag('event', e.eventName, e.params);
          }
        }
      }
    }, 1000);
    // Give up after 30 seconds
    setTimeout(() => {
      clearInterval(check);
      flushing = false;
      QUEUE.length = 0;
    }, 30000);
  }

  /**
   * Get salary bucket for event segmentation
   */
  function salaryBucket(value, currency) {
    // Normalize to USD-equivalent ranges for consistent bucketing
    const highValueCurrencies = new Set(['NGN', 'TZS', 'UGX', 'KES', 'XOF', 'XAF', 'GNF', 'MGA', 'RWF', 'BIF', 'CDF']);
    if (highValueCurrencies.has(currency)) {
      if (value < 500000)      return '0-500k';
      if (value < 2000000)     return '500k-2M';
      if (value < 10000000)    return '2M-10M';
      if (value < 50000000)    return '10M-50M';
      return '50M+';
    }
    // Standard currencies (ZAR, GHS, EGP, USD, etc.)
    if (value < 50000)   return '0-50k';
    if (value < 200000)  return '50k-200k';
    if (value < 1000000) return '200k-1M';
    return '1M+';
  }

  const analytics = {
    /**
     * Track a calculation event
     * @param {string} toolId - e.g., 'ng-paye'
     * @param {string} country
     * @param {number} value - Input value (salary, etc.)
     * @param {string} [currency]
     */
    trackCalculation(toolId, country, value, currency) {
      send('calculation_complete', {
        tool_name: toolId,
        country: country,
        salary_bucket: salaryBucket(value, currency || 'USD'),
        value: Math.round(value),
      });
    },

    /**
     * Track a PDF download
     * @param {string} toolId
     * @param {string} country
     */
    trackPDFDownload(toolId, country) {
      send('pdf_download', {
        tool_name: toolId,
        country: country || 'unknown',
      });
    },

    /**
     * Track an AI advisor query
     * @param {string} toolId
     * @param {string} question
     * @param {number} [turnNumber]
     */
    trackAIQuery(toolId, question, turnNumber) {
      send('ai_advisor_query', {
        tool_name: toolId,
        question_length: (question || '').length,
        turn_number: turnNumber || 1,
      });
    },

    /**
     * Track AI advisor triggered (initial analysis)
     * @param {string} toolId
     */
    trackAITriggered(toolId) {
      send('ai_advisor_triggered', { tool_id: toolId });
    },

    /**
     * Track tool page view
     * @param {string} toolId
     * @param {string} country
     */
    trackToolView(toolId, country) {
      send('tool_view', {
        tool_name: toolId,
        country: country || 'unknown',
      });
    },

    /**
     * Track share action
     * @param {string} toolId
     * @param {string} method - 'native', 'copy_link', 'clipboard'
     */
    trackShare(toolId, method) {
      send('share_result', {
        tool_name: toolId,
        method: method,
      });
    },

    /**
     * Track a feature usage
     * @param {string} feature - e.g., 'net_to_gross', 'dark_mode', 'regime_toggle'
     * @param {string} toolId
     */
    trackFeature(feature, toolId) {
      send('feature_used', {
        feature: feature,
        tool_name: toolId || 'unknown',
      });
    },

    /**
     * Track an error
     * @param {string} toolId
     * @param {string} errorType - e.g., 'calc_error', 'api_error', 'load_error'
     * @param {string} errorMessage
     */
    trackError(toolId, errorType, errorMessage) {
      send('tool_error', {
        tool_name: toolId || 'unknown',
        error_type: errorType,
        error_message: (errorMessage || '').substring(0, 100),
      });
    },

    /**
     * Track newsletter signup
     * @param {string} [source]
     */
    trackNewsletter(source) {
      send('newsletter_signup', { source: source || 'unknown' });
    },

    /**
     * Track rate limit hit
     * @param {string} toolId
     */
    trackRateLimit(toolId) {
      send('ai_rate_limited', { tool_id: toolId || 'unknown' });
    },

    /**
     * Track an article read
     * @param {string} slug - e.g., 'how-to-calculate-paye-nigeria-2026'
     * @param {string} category - e.g., 'tax', 'finance', 'guide'
     */
    trackArticleRead(slug, category) {
      send('article_read', {
        article_slug: slug || 'unknown',
        article_category: category || 'uncategorized',
      });
    },

    /**
     * Track a Pro upsell impression or click
     * @param {string} trigger - e.g., 'save_limit', 'ai_limit', 'pdf_watermark'
     * @param {string} tool - tool where the upsell was shown
     */
    trackProUpsell(trigger, tool) {
      send('pro_upsell', {
        trigger: trigger || 'unknown',
        tool_name: tool || 'unknown',
      });
    },

    /**
     * Track an affiliate link click
     * @param {string} partner - e.g., 'paystack', 'cowrywise', 'piggyvest'
     * @param {string} tool - tool where the affiliate link appeared
     */
    trackAffiliateClick(partner, tool) {
      send('affiliate_click', {
        partner: partner || 'unknown',
        tool_name: tool || 'unknown',
      });
    },

    /**
     * Generic event tracking
     * @param {string} eventName
     * @param {Object} params
     */
    track(eventName, params = {}) {
      send(eventName, params);
    },
  };

  // ── EXPOSE ─────────────────────────────────────
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.analytics = analytics;

})(window);
