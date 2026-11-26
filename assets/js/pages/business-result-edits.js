(function () {
  'use strict';
  const settings = document.currentScript.dataset;
  const calculator = document.querySelector(settings.calculator);
  if (!calculator) return;
  const results = calculator.querySelectorAll('[data-business-result]');
  const exports = calculator.querySelectorAll('[data-business-export]');
  const status = calculator.querySelector(settings.status);
  let calculated = false;
  function invalidate() {
    if (!calculated) return;
    calculated = false;
    for (const result of results) result.classList.add('business-result-stale');
    for (const button of exports) button.disabled = true;
    if (status) status.textContent = 'Inputs changed. Calculate again to update the result and exports.';
  }
  function onEdit(event) {
    if (event.target.matches('input, select, textarea')) invalidate();
  }
  calculator.addEventListener('input', onEdit, true);
  calculator.addEventListener('change', onEdit, true);
  calculator.addEventListener('click', function (event) {
    if (event.target.closest('.remove-btn, [data-business-change]')) invalidate();
  }, true);
  document.addEventListener('business-result-ready', function () {
    calculated = true;
    for (const result of results) result.classList.remove('business-result-stale');
    for (const button of exports) button.disabled = false;
  });
}());
