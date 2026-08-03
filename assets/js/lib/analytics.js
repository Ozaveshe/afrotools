/**
 * Consent-aware GA4 product-event wrapper.
 * Product events are opt-in; the lightweight loader owns denied-state page
 * measurement and the final privacy boundary for every gtag call.
 */
(function (window) {
  'use strict';

  var CONSENT_KEY = 'afrotools_cookie_consent';
  var QUEUE_MAX_AGE_MS = 300000;
  var queue = [];
  var flushing = false;

  function hasAnalyticsConsent() {
    try {
      return window.localStorage && window.localStorage.getItem(CONSENT_KEY) === 'accepted';
    } catch (_) {
      return false;
    }
  }

  function safeString(value, fallback, maxLength) {
    var text = value === undefined || value === null ? '' : String(value).trim();
    return (text || fallback || 'unknown').slice(0, maxLength || 100);
  }

  function validEventName(value) {
    var name = safeString(value, '', 40).toLowerCase();
    return /^[a-z][a-z0-9_]{0,39}$/.test(name) ? name : '';
  }

  function scheduleFlush() {
    if (flushing) return;
    flushing = true;
    var check = window.setInterval(function () {
      if (typeof window.gtag !== 'function') return;
      window.clearInterval(check);
      flushing = false;
      while (queue.length) {
        var queued = queue.shift();
        if (Date.now() - queued.timestamp < QUEUE_MAX_AGE_MS && hasAnalyticsConsent()) {
          window.gtag('event', queued.eventName, queued.params);
        }
      }
    }, 1000);
    window.setTimeout(function () {
      window.clearInterval(check);
      flushing = false;
      queue.length = 0;
    }, 30000);
  }

  function send(eventName, params) {
    var name = validEventName(eventName);
    if (!name || !hasAnalyticsConsent()) return false;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
      return true;
    }
    queue.push({ eventName: name, params: params || {}, timestamp: Date.now() });
    scheduleFlush();
    return true;
  }

  function valueBucket(value, currency) {
    var amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return 'unknown';
    var highValueCurrencies = new Set(['NGN', 'TZS', 'UGX', 'KES', 'XOF', 'XAF', 'GNF', 'MGA', 'RWF', 'BIF', 'CDF']);
    if (highValueCurrencies.has(safeString(currency, 'USD', 3).toUpperCase())) {
      if (amount < 500000) return '0-500k';
      if (amount < 2000000) return '500k-2M';
      if (amount < 10000000) return '2M-10M';
      if (amount < 50000000) return '10M-50M';
      return '50M+';
    }
    if (amount < 50000) return '0-50k';
    if (amount < 200000) return '50k-200k';
    if (amount < 1000000) return '200k-1M';
    return '1M+';
  }

  function idle(callback) {
    if (window.requestIdleCallback) window.requestIdleCallback(callback);
    else window.setTimeout(callback, 0);
  }

  var calculationStarted = false;
  var calculationStartTime = 0;
  var calculationTool = '';
  var calculationCountry = '';
  var calculationCompleted = false;
  var fieldsFilled = 0;
  var lastField = '';
  var toolOpenedAt = 0;
  var timeEventSent = false;
  var abandonEventSent = false;
  var scrollDepths = {};

  var analytics = {
    trackCalculation: function (toolId, country, value, currency) {
      calculationCompleted = true;
      send('calculation_complete', {
        tool_name: safeString(toolId),
        country: safeString(country),
        value_bucket: valueBucket(value, currency || 'USD'),
        currency: safeString(currency, 'USD', 3).toUpperCase()
      });
    },
    trackPDFDownload: function (toolId, country) {
      send('pdf_download', { tool_name: safeString(toolId), country: safeString(country) });
    },
    trackAIQuery: function (toolId, question, turnNumber) {
      send('ai_advisor_query', {
        tool_name: safeString(toolId),
        question_length: String(question || '').length,
        turn_number: Math.max(1, Math.round(Number(turnNumber) || 1))
      });
    },
    trackAITriggered: function (toolId) { send('ai_advisor_triggered', { tool_id: safeString(toolId) }); },
    trackToolView: function (toolId, country) { send('tool_view', { tool_name: safeString(toolId), country: safeString(country) }); },
    trackShare: function (toolId, method) { send('share_result', { tool_name: safeString(toolId), method: safeString(method) }); },
    trackFeature: function (feature, toolId) { send('feature_used', { feature: safeString(feature), tool_name: safeString(toolId) }); },
    trackError: function (toolId, errorType, errorMessage) {
      send('tool_error', {
        tool_name: safeString(toolId),
        error_type: safeString(errorType),
        error_message_length: String(errorMessage || '').length
      });
    },
    trackNewsletter: function (source) { send('newsletter_signup', { source: safeString(source) }); },
    trackRateLimit: function (toolId) { send('ai_rate_limited', { tool_id: safeString(toolId) }); },
    trackArticleRead: function (slug, category) {
      send('article_read', { article_slug: safeString(slug), article_category: safeString(category, 'uncategorized') });
    },
    trackProUpsell: function (trigger, toolId) { send('pro_upsell', { trigger: safeString(trigger), tool_name: safeString(toolId) }); },
    trackProPricing: function (source) { send('pro_view_pricing', { source: safeString(source) }); },
    trackProUpgrade: function (planId, source) { send('pro_click_upgrade', { plan_id: safeString(planId), source: safeString(source) }); },
    trackProCheckoutSuccess: function (provider) { send('pro_checkout_success', { provider: safeString(provider) }); },
    trackProAppOpen: function (appId, source) { send('pro_app_open', { app_id: safeString(appId), source: safeString(source) }); },
    trackAffiliateClick: function (partner, toolId) { send('affiliate_click', { partner: safeString(partner), tool_name: safeString(toolId) }); },
    trackCalculationStart: function (toolSlug, countryCode, entryMethod) {
      if (calculationStarted) return;
      calculationStarted = true;
      calculationStartTime = Date.now();
      calculationTool = safeString(toolSlug);
      calculationCountry = safeString(countryCode);
      calculationCompleted = false;
      send('calculation_started', {
        tool_slug: calculationTool,
        country_code: calculationCountry,
        entry_method: safeString(entryMethod, 'typed')
      });
    },
    trackCalculationAbandon: function (toolSlug, countryCode, details) {
      details = details || {};
      send('calculation_abandoned', {
        tool_slug: safeString(toolSlug),
        country_code: safeString(countryCode),
        time_spent_seconds: Math.max(0, Math.round(Number(details.time_spent_seconds) || 0)),
        fields_filled_count: Math.max(0, Math.round(Number(details.fields_filled_count) || 0)),
        last_field_touched: safeString(details.last_field_touched)
      });
    },
    trackSearch: function (query, resultsCount, source) {
      idle(function () {
        send('search_query', {
          query_length: String(query || '').length,
          results_count: Math.max(0, Math.round(Number(resultsCount) || 0)),
          source: safeString(source, 'navbar')
        });
      });
    },
    trackSearchNoResults: function (query, source) {
      idle(function () {
        send('search_no_results', { query_length: String(query || '').length, source: safeString(source, 'navbar') });
      });
    },
    trackScrollDepth: function (toolSlug, depth) {
      var key = safeString(toolSlug) + '_' + depth;
      if (scrollDepths[key]) return;
      scrollDepths[key] = true;
      idle(function () {
        send('scroll_depth', {
          tool_slug: safeString(toolSlug),
          depth_percent: depth,
          time_to_reach_seconds: Math.max(0, Math.round((Date.now() - toolOpenedAt) / 1000))
        });
      });
    },
    trackTimeOnTool: function (toolSlug, countryCode, duration, didCalculate) {
      send('time_on_tool', {
        tool_slug: safeString(toolSlug),
        country_code: safeString(countryCode),
        duration_seconds: Math.max(0, Math.round(Number(duration) || 0)),
        did_calculate: Boolean(didCalculate)
      });
    },
    trackResultInteraction: function (toolSlug, action) {
      idle(function () { send('result_interaction', { tool_slug: safeString(toolSlug), action: safeString(action) }); });
    },
    trackCtaImpression: function (type, toolSlug, position) {
      idle(function () { send('cta_impression', { cta_type: safeString(type), tool_slug: safeString(toolSlug), position: safeString(position, 'inline') }); });
    },
    trackCtaDismiss: function (type, toolSlug, seconds) {
      send('cta_dismissed', {
        cta_type: safeString(type), tool_slug: safeString(toolSlug),
        time_visible_seconds: Math.max(0, Math.round(Number(seconds) || 0))
      });
    },
    trackReferralSource: function () {
      try {
        if (window.sessionStorage.getItem('_afro_ref_tracked')) return;
        window.sessionStorage.setItem('_afro_ref_tracked', '1');
      } catch (_) {}
      var params = new URLSearchParams(window.location.search || '');
      var hasCampaign = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'gbraid', 'wbraid']
        .some(function (key) { return Boolean(params.get(key)); });
      var referrerDomain = '';
      try { if (document.referrer) referrerDomain = new URL(document.referrer).hostname; } catch (_) {}
      if (hasCampaign || referrerDomain) {
        idle(function () {
          send('referral_source', { has_campaign_parameters: hasCampaign, referrer_domain: safeString(referrerDomain, 'direct') });
        });
      }
    },
    track: function (eventName, params) { return send(eventName, params || {}); },
    _getCalcState: function () {
      return {
        started: calculationStarted, completed: calculationCompleted, startTime: calculationStartTime,
        toolSlug: calculationTool, countryCode: calculationCountry,
        fieldsFilledCount: fieldsFilled, lastFieldTouched: lastField
      };
    },
    _setFieldInfo: function (count, field) { fieldsFilled = count; lastField = safeString(field); }
  };

  var countrySlugs = {
    algeria: 'DZ', angola: 'AO', benin: 'BJ', botswana: 'BW', 'burkina-faso': 'BF', burundi: 'BI',
    'cabo-verde': 'CV', 'cape-verde': 'CV', cameroon: 'CM', 'central-african-republic': 'CF', chad: 'TD',
    comoros: 'KM', 'congo-brazzaville': 'CG', 'republic-of-congo': 'CG', 'cote-divoire': 'CI', 'cote-d-ivoire': 'CI',
    djibouti: 'DJ', 'dr-congo': 'CD', egypt: 'EG', 'equatorial-guinea': 'GQ', eritrea: 'ER', eswatini: 'SZ',
    ethiopia: 'ET', gabon: 'GA', gambia: 'GM', ghana: 'GH', guinea: 'GN', 'guinea-bissau': 'GW',
    kenya: 'KE', lesotho: 'LS', liberia: 'LR', libya: 'LY', madagascar: 'MG', malawi: 'MW', mali: 'ML',
    mauritania: 'MR', mauritius: 'MU', morocco: 'MA', mozambique: 'MZ', namibia: 'NA', niger: 'NE',
    nigeria: 'NG', rwanda: 'RW', 'sao-tome': 'ST', 'sao-tome-and-principe': 'ST', senegal: 'SN',
    seychelles: 'SC', 'sierra-leone': 'SL', somalia: 'SO', 'south-africa': 'ZA', 'south-sudan': 'SS',
    sudan: 'SD', tanzania: 'TZ', togo: 'TG', tunisia: 'TN', uganda: 'UG', zambia: 'ZM', zimbabwe: 'ZW'
  };

  function routeContext() {
    var parts = (window.location.pathname || '').split('/').filter(Boolean);
    if (['fr', 'sw', 'ha', 'yo'].includes(parts[0])) parts.shift();
    var toolMeta = document.querySelector('meta[name="tool-id"]');
    var countryMeta = document.querySelector('meta[name="country-code"]');
    var toolSlug = toolMeta && toolMeta.getAttribute('content');
    if (!toolSlug) toolSlug = parts[0] === 'tools' ? parts[1] : parts[parts.length - 1];
    var countryCode = countryMeta && countryMeta.getAttribute('content');
    if (!countryCode) {
      for (var index = 0; index < parts.length; index += 1) {
        if (countrySlugs[parts[index]]) { countryCode = countrySlugs[parts[index]]; break; }
      }
    }
    return { toolSlug: safeString(toolSlug), countryCode: safeString(countryCode) };
  }

  function initializePageTracking() {
    analytics.trackReferralSource();
    if (!document.body || !document.body.classList.contains('tool-page')) return;
    var context = routeContext();
    toolOpenedAt = Date.now();

    function sendExitEvents() {
      if (!timeEventSent) {
        timeEventSent = true;
        var duration = (Date.now() - toolOpenedAt) / 1000;
        if (duration > 1) analytics.trackTimeOnTool(context.toolSlug, context.countryCode, duration, calculationCompleted);
      }
      if (!abandonEventSent && calculationStarted && !calculationCompleted) {
        abandonEventSent = true;
        analytics.trackCalculationAbandon(context.toolSlug, context.countryCode, {
          time_spent_seconds: Math.round((Date.now() - calculationStartTime) / 1000),
          fields_filled_count: fieldsFilled,
          last_field_touched: lastField
        });
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') sendExitEvents();
    });
    window.addEventListener('pagehide', sendExitEvents, { once: true });

    function measureScroll() {
      var root = document.documentElement;
      var available = Math.max(root.scrollHeight - window.innerHeight, 1);
      var percent = Math.min(100, Math.round((window.scrollY / available) * 100));
      [25, 50, 75, 100].forEach(function (depth) {
        if (percent >= depth) analytics.trackScrollDepth(context.toolSlug, depth);
      });
    }
    window.addEventListener('scroll', measureScroll, { passive: true });

    var inputCard = document.getElementById('inputCard') || document.querySelector('.calc-card') || document.querySelector('.card');
    if (!inputCard || !inputCard.querySelector('input, select, textarea')) return;
    function markStart(event) {
      if (calculationStarted || !event.target) return;
      var tag = event.target.tagName;
      if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') return;
      var method = event.target.type === 'range' ? 'slider' : (event.target.value ? 'prefilled' : 'typed');
      analytics.trackCalculationStart(context.toolSlug, context.countryCode, method);
    }
    inputCard.addEventListener('focus', markStart, true);
    inputCard.addEventListener('input', function (event) {
      if (!event.target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      var count = 0;
      Array.prototype.forEach.call(inputCard.querySelectorAll('input:not([type=hidden]), select, textarea'), function (field) {
        if (String(field.value || '').trim()) count += 1;
      });
      analytics._setFieldInfo(count, event.target.name || event.target.id || 'unknown');
      markStart(event);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePageTracking);
  else initializePageTracking();
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.analytics = analytics;
}(window));
