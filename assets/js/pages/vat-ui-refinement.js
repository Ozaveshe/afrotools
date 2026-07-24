(function () {
  'use strict';

  function initSourceDisclosure() {
    var button = document.querySelector('.vat-source-toggle[aria-controls]');
    if (!button) return;

    var details = document.getElementById(button.getAttribute('aria-controls'));
    if (!details) return;

    function setExpanded(expanded) {
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.textContent = expanded ? 'Hide source details' : 'Show source details';
      details.hidden = !expanded;
    }

    button.hidden = false;
    setExpanded(!window.matchMedia('(max-width: 720px)').matches);
    button.addEventListener('click', function () {
      setExpanded(button.getAttribute('aria-expanded') !== 'true');
    });
  }

  initSourceDisclosure();
})();
