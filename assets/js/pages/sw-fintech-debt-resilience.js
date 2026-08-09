(function () {
  'use strict';

  var results = document.querySelectorAll('.results');
  function clearStale(event) {
    if (event && event.target && !event.target.matches('input, select')) return;
    results.forEach(function (node) {
      node.classList.remove('on');
    });
  }

  document.addEventListener('input', clearStale);
  document.addEventListener('change', clearStale);
}());
