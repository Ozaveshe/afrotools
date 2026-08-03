(function (window, document) {
  'use strict';

  var MEASUREMENT_ID = 'G-D859CGF391';
  var CONSENT_KEY = 'afrotools_cookie_consent';
  var MANAGER_SRC = '/assets/js/components/analytics-consent-v2.js';

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (_) {
      return null;
    }
  }

  function consentState(status, waitForChoice) {
    var state = {
      analytics_storage: status === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    };
    if (waitForChoice) state.wait_for_update = 500;
    return state;
  }

  function keepConsentModeActive() {
    // Consent Mode, rather than the legacy ga-disable switch, controls whether
    // GA can use storage. Keeping this false allows denied-state cookieless pings.
    window['ga-disable-' + MEASUREMENT_ID] = false;
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
      if (key === 'query' || key === 'search_term') {
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

  function configureAnalytics(status) {
    if (window.__afroAnalyticsConfigured) return;
    window.__afroAnalyticsConfigured = true;
    keepConsentModeActive();
    installGtagBoundary();
    window.gtag('consent', 'default', consentState(status, !status));

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

  function syncClarity(status) {
    if (typeof window.clarity !== 'function') return;
    var accepted = status === 'accepted';
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: accepted ? 'granted' : 'denied',
    });
    if (!accepted) window.clarity('consent', false);
  }

  function applyConsent(status) {
    if (status !== 'accepted' && status !== 'declined' && status !== 'rejected') return;
    window.gtag('consent', 'update', consentState(status, false));
    keepConsentModeActive();
    window.setTimeout(keepConsentModeActive, 0);
    syncClarity(status);
    window.setTimeout(function () { syncClarity(status); }, 0);
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

  var status = readConsent();
  configureAnalytics(status);
  loadConsentManager();

  window.addEventListener('afrotools:cookie-consent', function (event) {
    applyConsent(event && event.detail && event.detail.status);
  });
  window.addEventListener('storage', function (event) {
    if (event && event.key === CONSENT_KEY) applyConsent(event.newValue);
  });
  window.addEventListener('load', function () {
    window.setTimeout(function () { syncClarity(readConsent()); }, 1600);
  }, { once: true });
}(window, document));
