(function (global) {
  'use strict';

  function hideState(form) {
    var results = form.querySelector('.results');
    var error = form.querySelector('.form-error');
    if (results) results.classList.remove('on');
    if (error) {
      error.textContent = '';
      error.classList.remove('on');
    }
  }

  function calculate(form) {
    hideState(form);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var calculateName = form.getAttribute('data-calculate');
    if (!calculateName || typeof global[calculateName] !== 'function') {
      throw new Error('Swahili Fintech calculator owner is unavailable: ' + calculateName);
    }
    global[calculateName]();
  }

  function start() {
    document.querySelectorAll('[data-sw-fintech-savings-form]').forEach(function (form) {
      form.addEventListener('input', function () { hideState(form); });
      form.addEventListener('change', function () { hideState(form); });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        calculate(form);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}(window));
