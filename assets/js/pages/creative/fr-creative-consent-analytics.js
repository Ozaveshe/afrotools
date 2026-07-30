(function initializeFrenchCreativeConsentAnalytics(window, document) {
  "use strict";

  var CONSENT_KEY = "afrotools_cookie_consent";
  var CONSENT_SCRIPT = "/assets/js/components/analytics-consent-v2.js";
  var ANALYTICS_SCRIPT = "/assets/js/lazy-analytics.js";
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
