(function () {
  'use strict';
  function clearStale(event) {
    if (event && event.target && !event.target.matches('input,select')) return;
    document.querySelectorAll('.results').forEach(function (node) { node.classList.remove('on'); });
  }
  document.addEventListener('input', clearStale);
  document.addEventListener('change', clearStale);
}());
