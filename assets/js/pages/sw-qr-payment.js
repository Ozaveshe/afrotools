(function (global) {
  'use strict';

  var STRINGS = {
    invalid: 'Weka thamani ya muamala na idadi ya miamala mikubwa kuliko sifuri, siku 1 hadi 31, na ada zisizo hasi.',
    on: 'Kwa',
    monthlyVolume: 'ya thamani ya mwezi',
    transactions: 'miamala',
    qr: 'Malipo ya QR',
    mobileMoney: 'Pesa za simu',
    card: 'POS / kadi',
    cash: 'Ushughulikiaji wa fedha taslimu',
    lowest: 'Gharama ndogo iliyoingizwa',
    perMonth: 'mwezi',
    ofVolume: 'ya thamani'
  };

  global.AfroToolsFintechI18n = {
    isFrench: function () { return false; },
    isSwahili: function () { return true; },
    text: function (toolId, key, fallback) {
      return toolId === 'qr-payment' && Object.prototype.hasOwnProperty.call(STRINGS, key)
        ? STRINGS[key]
        : fallback;
    }
  };

  var form = document.querySelector('[data-sw-qr-form]');
  if (!form) return;
  var result = form.querySelector('#qr-results');
  var error = form.querySelector('#qr-error');

  function clearStaleResult() {
    if (result) result.classList.remove('on');
    if (error) {
      error.textContent = '';
      error.classList.remove('on');
    }
  }

  form.addEventListener('input', clearStaleResult);
  form.addEventListener('change', clearStaleResult);
  form.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearStaleResult();
    if (!form.checkValidity()) {
      if (error) {
        error.textContent = STRINGS.invalid;
        error.classList.add('on');
      }
      form.reportValidity();
      return;
    }
    if (typeof global.calcQR === 'function') global.calcQR();
    if (result && result.classList.contains('on')) result.focus({ preventScroll: true });
  });
}(window));
