// Embedded in the generated page head so form safety has no network dependency.
(function () {
  'use strict';
  const ids = ['mm-form', 'mm-tariff-form'];
  function message(form, state) {
    const status = form.querySelector('[role="status"]');
    if (status) status.textContent = form.dataset[state + 'Message'] || '';
  }
  function fail(form) {
    if (!form || form.dataset.readiness === 'ready') return;
    form.dataset.readiness = 'failed';
    form.setAttribute('aria-busy', 'false');
    message(form, 'failed');
  }
  window.MobileMoneyReadiness = {
    ready: function (form) {
      form.dataset.readiness = 'ready';
      form.setAttribute('aria-busy', 'false');
      form.querySelectorAll('[data-readiness-action]').forEach(function (button) {
        button.disabled = false;
      });
      message(form, 'ready');
    },
    fail: fail
  };
  // Capturing before the controller exists also prevents implicit Enter submits.
  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!ids.includes(form.id) || form.dataset.readiness === 'ready') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    message(form, form.dataset.readiness === 'failed' ? 'failed' : 'loading');
  }, true);
  document.addEventListener('error', function (event) {
    const target = event.target;
    if (target.tagName === 'SCRIPT' && /\/mobile-money-(?:quote-engine|quote-parity)\.js(?:\?|$)/.test(target.src || '')) {
      ids.forEach(function (id) { fail(document.getElementById(id)); });
    }
  }, true);
  // Covers interrupted responses and initialization exceptions without deleting
  // drafts or preventing a slow dependency from completing successfully later.
  setTimeout(function () {
    ids.forEach(function (id) { fail(document.getElementById(id)); });
  }, 15000);
}());
