(function initializeFrenchCreativeConsentAnalytics(window, document) {
  "use strict";

  var CONSENT_KEY = "afrotools_cookie_consent";
  function versionedSource(source, attribute) {
    var version = document.documentElement && typeof document.documentElement.getAttribute === "function"
      ? document.documentElement.getAttribute(attribute) : null;
    return source + (/^[a-f0-9]{8}$/.test(version || "") ? "?v=" + version : "");
  }
  var CONSENT_SCRIPT = versionedSource("/assets/js/components/analytics-consent-v2.js", "data-afro-consent-version");
  var ANALYTICS_SCRIPT = versionedSource("/assets/js/lazy-analytics.js", "data-afro-analytics-version");
  var analyticsLoaded = false;

  function status() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (error) {
      return null;
    }
  }

  function appendOnce(source) {
    if (document.querySelector('script[src="' + source + '"]')) return;
    var script = document.createElement("script");
    script.src = source;
    script.async = true;
    document.head.appendChild(script);
  }

  function loadAnalyticsAfterConsent() {
    if (analyticsLoaded || status() !== "accepted") return;
    analyticsLoaded = true;
    appendOnce(ANALYTICS_SCRIPT);
  }

  appendOnce(CONSENT_SCRIPT);
  loadAnalyticsAfterConsent();
  window.addEventListener("afrotools:cookie-consent", function (event) {
    if (event && event.detail && event.detail.status === "accepted") {
      loadAnalyticsAfterConsent();
    }
  });
})(window, document);
