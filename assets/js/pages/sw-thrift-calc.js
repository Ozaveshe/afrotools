(function () {
  'use strict';

  var form = document.querySelector('[data-sw-thrift-form]');
  if (!form) return;
  var result = form.querySelector('#tc-results');
  var error = form.querySelector('#tc-error');

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
    if (typeof window.calcThrift === 'function') window.calcThrift();
  });
}());
