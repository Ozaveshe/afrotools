(function (window, document) {
  'use strict';

  var MEASUREMENT_ID = 'G-D859CGF391';
  var CONSENT_KEY = 'afrotools_cookie_consent';
  var MANAGER_SRC = '/assets/js/components/analytics-consent-v2.js';
  var configured = false;

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (_) {
      return null;
    }
  }

  function consentState(status) {
    return {
      analytics_storage: status === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    };
  }

  function filteredCampaignQuery(value) {
    if (!value) return '';
    var allowed = /^(?:utm_(?:source|medium|campaign|term|content|id)|gclid|gbraid|wbraid|dclid|msclkid|fbclid)$/i;
    var pairs = [];
    String(value).replace(/^\?/, '').split('&').forEach(function (part) {
      if (!part) return;
      var separator = part.indexOf('=');
      if (separator < 0) return;
      var key = part.slice(0, separator);
      var raw = part.slice(separator + 1);
      if (!allowed.test(key)) return;
      try {
        raw = decodeURIComponent(raw.replace(/\+/g, ' '));
      } catch (_) {
        return;
      }
      if (!raw || raw.length > 120 || raw.includes('@') || /^\+?\d[\d\s().-]{6,}$/.test(raw)) return;
      pairs.push(encodeURIComponent(key.toLowerCase()) + '=' + encodeURIComponent(raw));
    });
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  function safeUrl(value, originOnly) {
    if (!value) return '';
    try {
      var parsed = new URL(value, window.location.origin);
      return originOnly
        ? parsed.origin + '/'
        : parsed.origin + parsed.pathname + filteredCampaignQuery(parsed.search);
    } catch (_) {
      return '';
    }
  }

  function sanitizeParams(params) {
    if (!params || typeof params !== 'object') return params;
    var sanitized = {};
    var piiKey = /^(?:email|e_mail|phone|phone_number|full_name|first_name|last_name|address|cv|resume|document_content|prompt|message)$/i;
    var hasCampaign = false;
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (piiKey.test(key)) return;
      if (key === 'query') {
        sanitized.query_length = String(value || '').length;
      } else if (key === 'error_message') {
        sanitized.error_message_length = String(value || '').length;
      } else if (/^utm_/i.test(key)) {
        hasCampaign = hasCampaign || Boolean(value);
      } else if (key === 'page_location') {
        sanitized[key] = safeUrl(value, false);
      } else if (key === 'page_referrer') {
        sanitized[key] = safeUrl(value, true);
      } else {
        sanitized[key] = value;
      }
    });
    if (hasCampaign) sanitized.has_campaign_parameters = true;
    return sanitized;
  }

  function installGtagBoundary() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (command, name, params) {
      if (command === 'event' || command === 'config') {
        window.dataLayer.push([command, name, sanitizeParams(params)]);
      } else {
        window.dataLayer.push(Array.from(arguments));
      }
    };
  }

  function syncClarity(status) {
    if (typeof window.clarity !== 'function') return;
    var accepted = status === 'accepted';
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: accepted ? 'granted' : 'denied',
    });
    if (!accepted) window.clarity('consent', false);
  }

  function configureAnalytics() {
    if (configured || window.__afroAnalyticsConfigured) return;
    configured = true;
    window.__afroAnalyticsConfigured = true;
    window['ga-disable-' + MEASUREMENT_ID] = false;
    installGtagBoundary();
    window.gtag('consent', 'default', consentState('accepted'));

    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(tag);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: safeUrl(window.location.origin + window.location.pathname + filteredCampaignQuery(window.location.search), false),
      page_referrer: safeUrl(document.referrer, true),
    });
  }

  function applyConsent(status) {
    if (status === 'accepted') {
      configureAnalytics();
      window['ga-disable-' + MEASUREMENT_ID] = false;
      window.gtag('consent', 'update', consentState(status));
    } else if (status === 'declined' || status === 'rejected') {
      window['ga-disable-' + MEASUREMENT_ID] = true;
      if (configured && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', consentState(status));
      }
    } else {
      return;
    }
    syncClarity(status);
  }

  function loadConsentManager() {
    if (
      (window.AfroTools && window.AfroTools.analyticsConsent)
      || document.querySelector('script[src^="' + MANAGER_SRC + '"]')
    ) return;
    var script = document.createElement('script');
    script.src = MANAGER_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  window.addEventListener('afrotools:cookie-consent', function (event) {
    applyConsent(event && event.detail && event.detail.status);
  });
  window.addEventListener('storage', function (event) {
    if (event && event.key === CONSENT_KEY) applyConsent(event.newValue);
  });
  window.addEventListener('load', function () {
    window.setTimeout(function () { syncClarity(readConsent()); }, 1600);
  }, { once: true });

  loadConsentManager();
  if (readConsent() === 'accepted') configureAnalytics();
}(window, document));
