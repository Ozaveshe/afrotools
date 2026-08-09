(function () {
  'use strict';

  var form = document.getElementById('rm-form');
  var error = document.getElementById('rm-error');
  if (!form || !document.querySelector('[data-remittance-parity][data-locale="fr"][data-tool="remittance-v2"]')) return;
  form.dataset.frA11yOwner = 'active';

  function clearInvalidState() {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
  }

  form.addEventListener('invalid', function (event) {
    event.target.setAttribute('aria-invalid', 'true');
    event.target.focus();
  }, true);
  form.addEventListener('submit', function () {
    var invalid = form.querySelectorAll(':invalid');
    invalid.forEach(function (field) { field.setAttribute('aria-invalid', 'true'); });
    if (invalid[0]) invalid[0].focus();
  });
  form.addEventListener('input', function (event) {
    clearInvalidState();
    if (!event.target.checkValidity()) event.target.setAttribute('aria-invalid', 'true');
  });
  form.addEventListener('reset', clearInvalidState);
  new MutationObserver(function () {
    if (!error || error.dataset.show !== 'true') return;
    var invalid = form.querySelectorAll(':invalid');
    invalid.forEach(function (field) { field.setAttribute('aria-invalid', 'true'); });
    if (invalid[0]) invalid[0].focus();
  }).observe(error, { attributes: true, childList: true });
}());
