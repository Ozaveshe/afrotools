(function () {
  'use strict';

  function init() {
    var results = document.getElementById('resultsCard');
    var askButton = document.getElementById('ugPayeAskBtn');
    var status = document.getElementById('ugPayeAskStatus');
    if (!results || !askButton || !status) return;

    var visible = new Set();
    var sections = [results].concat(Array.from(document.querySelectorAll('.tool-main-inner .bands-card')));
    var observedPanel = null;
    var panelObserver = new MutationObserver(updateDock);
    function updateDock() {
      var assistant = document.querySelector('afro-site-assistant');
      var panel = assistant && assistant.shadowRoot && assistant.shadowRoot.getElementById('panel');
      if (panel && panel !== observedPanel) {
        panelObserver.disconnect();
        observedPanel = panel;
        panelObserver.observe(panel, { attributes: true, attributeFilter: ['aria-hidden'] });
      }
      var panelOpen = panel && panel.getAttribute('aria-hidden') === 'false';
      document.body.classList.toggle('ug-paye-calculator-in-view', results.classList.contains('on') && visible.size > 0 && !panelOpen);
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      updateDock();
    }, { rootMargin: '-56px 0px -16px 0px' });
    sections.forEach(function (section) { observer.observe(section); });
    new MutationObserver(updateDock).observe(results, { attributes: true, attributeFilter: ['class'] });

    var closeObserver;
    askButton.addEventListener('click', function (event) {
      // The assistant closes on document clicks outside its shadow root.
      // Keep this inline launch click from immediately closing the panel.
      event.stopPropagation();
      var assistant = document.querySelector('afro-site-assistant');
      var shadow = assistant && assistant.shadowRoot;
      var fab = shadow && shadow.getElementById('fab');
      var panel = shadow && shadow.getElementById('panel');
      if (!fab || !panel) {
        status.textContent = 'The assistant is still loading. Try again in a moment.';
        return;
      }

      status.textContent = '';
      if (closeObserver) closeObserver.disconnect();
      document.body.classList.remove('ug-paye-calculator-in-view');
      if (panel.getAttribute('aria-hidden') !== 'false') fab.click();
      if (panel.getAttribute('aria-hidden') !== 'false') {
        updateDock();
        status.textContent = 'The assistant could not open. Try again in a moment.';
        return;
      }
      updateDock();

      closeObserver = new MutationObserver(function () {
        if (panel.getAttribute('aria-hidden') !== 'true') return;
        closeObserver.disconnect();
        closeObserver = null;
        updateDock();
        askButton.focus({ preventScroll: true });
      });
      closeObserver.observe(panel, { attributes: true, attributeFilter: ['aria-hidden'] });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
