(function (window, document) {
  'use strict';

  var paper = document.querySelector('.jamb-reviewed-paper[data-jamb-subject]');
  if (!paper) return;

  var subject = paper.getAttribute('data-jamb-subject');
  var subjects = ['english', 'mathematics', 'physics', 'chemistry', 'biology',
    'government', 'economics', 'literature', 'crk', 'commerce', 'accounts'];
  if (subjects.indexOf(subject) === -1) return;

  var attempted = false;
  function hasConsent() {
    try {
      return window.localStorage.getItem('afrotools_cookie_consent') === 'accepted';
    } catch (_) {
      return false;
    }
  }

  paper.addEventListener('click', function (event) {
    var summary = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('.qcard details > summary') : null;
    if (!summary) return;
    var details = summary.parentElement;
    // Count an intentional answer reveal once per page visit, never page views or closing.
    if (attempted || details.open || details.hidden || !hasConsent()) return;
    var analytics = window.AfroTools && window.AfroTools.analytics;
    if (!analytics || typeof analytics.trackEducationPractice !== 'function') return;
    attempted = true;
    analytics.trackEducationPractice('jamb', subject, 'start');
  });
}(window, document));
