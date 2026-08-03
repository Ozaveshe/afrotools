(function (window, document) {
  'use strict';

  if (window.__afroAnalyticsConfigured) return;
  if (document.querySelector('script[data-afro-analytics-runtime]')) return;

  var owner = document.currentScript;
  var runtimeVersion = owner && owner.getAttribute('data-loader-version');
  if (!runtimeVersion || !/^[a-f0-9]{8}$/.test(runtimeVersion)) return;

  var runtime = document.createElement('script');
  runtime.src = '/assets/js/lazy-analytics.js?v=' + runtimeVersion;
  runtime.async = true;
  runtime.setAttribute('data-afro-analytics-runtime', '');
  document.head.appendChild(runtime);
}(window, document));
