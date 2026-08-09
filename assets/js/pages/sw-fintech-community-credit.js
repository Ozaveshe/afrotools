(function () {
  'use strict';

  var form = document.querySelector('[data-sw-community-credit-form]');
  if (!form) return;

  var result = form.querySelector('.results');
  var error = form.querySelector('.form-error');

  function clearStaleResult() {
    if (result) result.classList.remove('on');
    if (error) error.textContent = '';
  }

  form.addEventListener('input', clearStaleResult);
  form.addEventListener('change', clearStaleResult);
  form.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearStaleResult();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var calculate = window[form.getAttribute('data-calculate')];
    if (typeof calculate === 'function') calculate();
  });
}());
